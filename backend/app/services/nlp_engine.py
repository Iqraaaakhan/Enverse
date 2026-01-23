from sentence_transformers import SentenceTransformer, util
from app.services.knowledge_base import get_live_metrics
import torch

# Load Model
model = SentenceTransformer('all-MiniLM-L6-v2')

# --- REFINED INTENTS ---
INTENT_MAP = {
    "BILLING": [
        "What is my bill?", "How much do I owe?", "Electricity cost", "Current charges", "Price", "Rupees", "Monthly bill"
    ],
    "USAGE_TOTAL": [
        "How much energy did I use?", "Total consumption", "Power usage", "Total load", "Overall usage"
    ],
    "DEVICE_SPECIFIC": [
        "How much does the AC use?", "Fridge consumption", "Washing machine power", "Lighting usage", "Specific device", "ac?", "fridge?"
    ],
    "HIGHEST_CONSUMER": [
        "What uses the most power?", "Which device is expensive?", "Highest load", "Main consumer", "Top device", "Dominant load"
    ],
    "LOWEST_CONSUMER": [
        "What uses the least power?", "Lowest consuming appliance", "Smallest load", "Minimum usage", "lowest", "least"
    ],
    "ANOMALIES": [
        "Any alerts?", "Is the system safe?", "Anomalies detected", "Security breaches", "Unusual activity", "Why is it high?"
    ],
    "SAVINGS_REPORT": [
        "Did I save money?", "Savings this month", "Comparison to last month", "Net change", "savings"
    ],
    "EFFICIENCY_TIPS": [
        "How can I save more?", "Tips to reduce bill", "Future savings", "Reduce wastage"
    ],
    "GREETING": [
        "Hi", "Hello", "Hey", "Who are you", "Start"
    ]
}

INTENT_EMBEDDINGS = {}
for intent, phrases in INTENT_MAP.items():
    INTENT_EMBEDDINGS[intent] = model.encode(phrases, convert_to_tensor=True)

# --- ENTITY MAPPING (Matches UI) ---
DEVICE_ALIASES = {
    "ac": "Air Conditioner",
    "air conditioner": "Air Conditioner",
    "cooling": "Air Conditioner",
    "fridge": "Refrigerator",
    "refrigerator": "Refrigerator",
    "washing machine": "Washing Machine",
    "washer": "Washing Machine",
    "laundry": "Washing Machine",
    "light": "Lighting",
    "lights": "Lighting",
    "lighting": "Lighting",
    "tv": "Electronics",
    "computer": "Electronics",
    "electronics": "Electronics"
}

LAST_INTENT = None

def extract_entity(query: str):
    query_lower = query.lower()
    for alias, official_name in DEVICE_ALIASES.items():
        if alias in query_lower:
            return official_name
    return None

def classify_intent(query: str):
    query_emb = model.encode(query, convert_to_tensor=True)
    best_intent = None
    highest_score = -1
    
    for intent, proto_embs in INTENT_EMBEDDINGS.items():
        scores = util.cos_sim(query_emb, proto_embs)[0]
        max_score = torch.max(scores).item()
        if max_score > highest_score:
            highest_score = max_score
            best_intent = intent
            
    return best_intent, highest_score

def generate_response(intent: str, data: dict, entity: str = None):
    if not data:
        return "System is syncing with the grid. Please try again in a moment."

    # --- BILLING ---
    if intent == "BILLING":
        return f"Based on your current consumption of {data['total_kwh']} kWh, your estimated bill for this month is ₹{data['bill']:,}. This aligns with the analytics dashboard."
    
    # --- TOTAL USAGE ---
    if intent == "USAGE_TOTAL":
        return f"Your total load for the last 30 days is {data['total_kwh']} kWh."
    
    # --- DEVICE SPECIFIC ---
    if intent == "DEVICE_SPECIFIC":
        if entity and entity in data['device_breakdown']:
            val = data['device_breakdown'][entity]
            pct = (val / data['total_kwh']) * 100
            return f"The {entity} consumed {val:.2f} kWh this month, which is about {pct:.1f}% of your total usage."
        elif entity:
            return f"I recognized '{entity}', but I don't see active data for it in the current 30-day cycle."
        else:
            return "Which device would you like to know about? (e.g., 'How much does the AC use?')"

    # --- HIGHEST CONSUMER ---
    if intent == "HIGHEST_CONSUMER":
        val = data['top_device_kwh']
        pct = (val / data['total_kwh']) * 100
        return f"The {data['top_device']} is your highest consumer, using {val} kWh ({pct:.1f}% of total)."

    # --- LOWEST CONSUMER (New) ---
    if intent == "LOWEST_CONSUMER":
        val = data['bottom_device_kwh']
        pct = (val / data['total_kwh']) * 100
        return f"The {data['bottom_device']} is your lowest consumer, using only {val} kWh ({pct:.1f}% of total)."

    # --- SAVINGS REPORT (New) ---
    if intent == "SAVINGS_REPORT":
        if data['savings_amount'] > 0:
            return f"Good news! You saved approximately ₹{data['savings_amount']:,} this month compared to the previous period (Consumption dropped by {abs(data['delta_kwh']):.2f} kWh)."
        else:
            return f"Your consumption increased by {data['delta_kwh']:.2f} kWh compared to last month. No monetary savings recorded this cycle."

    # --- EFFICIENCY TIPS ---
    if intent == "EFFICIENCY_TIPS":
        return f"Your night-time usage is {data['night_ratio']}%. Lowering this below 20% could save you roughly ₹{(data['bill'] * 0.15):.0f} next month."

    # --- ANOMALIES ---
    if intent == "ANOMALIES":
        count = data['anomaly_count']
        if count == 0:
            return "System Secure. No anomalies detected in the current cycle."
        return f"⚠️ Alert: {count} anomalies detected. Check the Security tab for details."
        
    if intent == "GREETING":
        return "Enverse AI Online. I have access to your real-time 30-day energy metrics. Ask me about your bill, savings, or specific devices."

    return "I'm not sure about that. Try asking about 'Bill', 'Savings', 'Highest load', or specific devices like 'AC'."

def process_user_query(query: str):
    global LAST_INTENT
    data = get_live_metrics()
    entity = extract_entity(query)
    intent, confidence = classify_intent(query)
    
    # Logic Refinement
    if entity:
        intent = "DEVICE_SPECIFIC"
        confidence = 1.0 
    elif confidence < 0.40 and LAST_INTENT:
        # Context carry over for short queries
        if len(query.split()) <= 3:
            intent = LAST_INTENT
            confidence = 0.85

    LAST_INTENT = intent
    
    # Debug print for server logs
    print(f"NLP: '{query}' -> {intent} ({confidence:.2f}) | Entity: {entity}")
    
    if confidence < 0.35:
        return {
            "answer": "I couldn't confidently map that query to your energy data. Try asking 'What is my bill?' or 'Did I save money?'.",
            "intent": "UNKNOWN",
            "confidence": confidence
        }
        
    response = generate_response(intent, data, entity)
    
    return {
        "answer": response,
        "intent": intent,
        "confidence": confidence
    }