import os
from groq import Groq
from dotenv import load_dotenv
from app.services.knowledge_base import get_live_metrics

# --- CONFIGURATION ---
load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq client
client = Groq(api_key=API_KEY) if API_KEY else None

CHAT_SESSIONS = {}

# --- 1. LOCAL LOGIC (Enhanced for Quota Exhaustion) ---

def get_local_response(query: str, data: dict):
    """
    Handles common queries locally when LLM is unavailable.
    Expanded to cover: bill, savings, last month, devices.
    """
    q = query.lower().strip()
    
    # BILL QUERIES (Check first - more specific than greetings)
    if ("bill" in q or "cost" in q or "price" in q or "total" in q or "how much" in q):
        if "last" in q or "previous" in q:
            return f"Your bill for the previous 30-day period was ₹{data['prev_bill']:,}."
        elif "next" in q or "forecast" in q or "estimated" in q:
            return "For forecasted bills, please check the Predictor page (AI Forecast section). That shows ML-based projections for the next 30 days."
        elif "month" in q or "current" in q or "this" in q:
            return f"Your actual bill for the last 30 days is ₹{data['bill']:,} (slab-based tariff)."
    
    # SAVINGS
    if "sav" in q:  # matches "save", "saving", "savings"
        if data['savings_amount'] > 0:
            return f"You saved ₹{data['savings_amount']:,} compared to the previous 30-day period. Great job!"
        else:
            return f"Your bill increased by ₹{abs(data['savings_amount']):,} compared to the previous period. Check the Analytics page to see which devices drove this increase."
    
    # DEVICE-SPECIFIC QUERIES (Check before greeting)
    device_keywords = {
        "ac": "Air Conditioner",
        "air conditioner": "Air Conditioner", 
        "cooling": "Air Conditioner",
        "fridge": "Refrigerator",
        "refrigerator": "Refrigerator",
        "washing": "Washing Machine",
        "washer": "Washing Machine",
        "laundry": "Washing Machine",
        "light": "Lighting",
        "bulb": "Lighting",
        "tv": "Electronics",
        "laptop": "Electronics",
        "computer": "Electronics",
        "phone": "Electronics",
        "electronics": "Electronics"
    }
    
    for keyword, device_name in device_keywords.items():
        if keyword in q and ("use" in q or "consumption" in q or "power" in q or "much" in q or "kwh" in q):
            if device_name in data['device_breakdown']:
                kwh = data['device_breakdown'][device_name]
                pct = round((kwh / data['total_kwh']) * 100, 1)
                # Proportional cost from slab-based bill
                cost = round((kwh / data['total_kwh']) * data['bill'], 2)
                return f"The {device_name} consumed {kwh:.2f} kWh this month ({pct}% of total), costing approximately ₹{cost:,}."
            else:
                return f"I don't see active usage data for {device_name} in the current period."
    
    # TOP CONSUMER
    if "top" in q or "most" in q or "highest" in q or "dominant" in q:
        return f"The {data['top_device']} is your highest consumer at {data['top_device_kwh']:.2f} kWh ({round((data['top_device_kwh']/data['total_kwh'])*100, 1)}% of total)."
    
    # BOTTOM CONSUMER  
    if "least" in q or "lowest" in q or "bottom" in q:
        return f"The {data['bottom_device']} is your lowest consumer at {data['bottom_device_kwh']:.2f} kWh."

    # GREETING (Last - lowest priority)
    if any(x == q or q.startswith(x) for x in ["hi", "hello", "hey", "start"]):
        return (
            f"Hello! I'm Enverse Assistant. \n"
            f"Your actual bill for the last 30 days is ₹{data['bill']:,}. \n"
            f"Your top consumer is the {data['top_device']} ({data['top_device_kwh']} kWh). \n"
            f"How can I help?"
        )
    
    return None  # Pass to LLM if available

# --- 3. SYSTEM PROMPT ---

SYSTEM_INSTRUCTION = """You are Enverse Assistant, a smart energy advisor.

YOUR JOB: Help users understand their energy usage using REAL DATA.

RULES:
1. When asked about bills, devices, or usage, request data by saying "Let me check your energy data..."
2. Use exact numbers from data. Never estimate.
3. Be concise and friendly.
4. "Bill" = actual last 30 days. "Forecast" = predicted future (different page).
5. Use bullet points for lists. Keep paragraphs short (2-3 sentences max).

EXAMPLES:
User: "Why is my bill high?"
You: "Let me check your energy data... [analyze] Your Washing Machine consumed 560 kWh (31% of total), which is the primary driver."

User: "How much does AC cost?"
You: "Let me check... Your AC consumed 299 kWh this month, costing approximately ₹2,261."
"""

# --- 4. MAIN PROCESSOR ---

def process_chat_message(user_message: str, session_id: str = "default"):
    try:
        data = get_live_metrics()
        if not data: return "System initializing..."

        # 1. Try Local Logic (Fast path for common queries)
        local_reply = get_local_response(user_message, data)
        if local_reply:
            return local_reply

        # 2. Try LLM (Groq)
        if not client:
            return generate_fallback_summary(data)

        # Initialize session history
        if session_id not in CHAT_SESSIONS:
            CHAT_SESSIONS[session_id] = []
        
        # Inject live data into context
        data_context = f"""LIVE ENERGY DATA (Last 30 Days):
- Total Bill: ₹{data['bill']:,}
- Previous Bill: ₹{data['prev_bill']:,}
- Savings: ₹{data['savings_amount']:,}
- Total Consumption: {data['total_kwh']:.2f} kWh
- Top Device: {data['top_device']} ({data['top_device_kwh']:.2f} kWh)
- Device Breakdown: {', '.join([f"{k}: {v:.2f} kWh" for k, v in data['device_breakdown'].items()])}
"""
        
        # Build messages
        messages = [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "system", "content": data_context}
        ]
        messages.extend(CHAT_SESSIONS[session_id])
        messages.append({"role": "user", "content": user_message})
        
        # Call Groq
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Updated to current model
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        assistant_reply = response.choices[0].message.content
        
        # Update session history (keep last 10 messages)
        CHAT_SESSIONS[session_id].append({"role": "user", "content": user_message})
        CHAT_SESSIONS[session_id].append({"role": "assistant", "content": assistant_reply})
        if len(CHAT_SESSIONS[session_id]) > 20:
            CHAT_SESSIONS[session_id] = CHAT_SESSIONS[session_id][-20:]
        
        return assistant_reply

    except Exception as e:
        print(f"⚠️ LLM Error: {e}")
        return generate_fallback_summary(data)

def generate_fallback_summary(data):
    return (
        f"I'm currently answering using system data.\n"
        f"• Actual Bill (30 Days): ₹{data['bill']:,}\n"
        f"• Top Device: {data['top_device']}\n"
        f"• Savings: ₹{data['savings_amount']:,}\n"
    )