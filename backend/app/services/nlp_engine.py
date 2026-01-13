from sentence_transformers import SentenceTransformer, util
from app.services.knowledge_base import get_system_knowledge
import torch

# Load the Transformer Model (Downloads on first run ~80MB)
# This model understands that "cost" and "bill" are semantically similar.
model = SentenceTransformer('all-MiniLM-L6-v2')

def process_user_query(query: str):
    """
    Uses Vector Similarity to find the most relevant fact for the user query.
    """
    knowledge_base = get_system_knowledge()
    fact_texts = [f["text"] for f in knowledge_base]
    
    # Encode facts and query into vectors
    knowledge_embeddings = model.encode(fact_texts, convert_to_tensor=True)
    query_embedding = model.encode(query, convert_to_tensor=True)
    
    # Calculate Cosine Similarity
    cosine_scores = util.cos_sim(query_embedding, knowledge_embeddings)[0]
    
    # Find best match
    best_match_idx = int(torch.argmax(cosine_scores))
    confidence = float(cosine_scores[best_match_idx])
    
    # Industry standard: Only answer if confidence is high
    if confidence > 0.35:
        return {
            "answer": fact_texts[best_match_idx],
            "confidence": round(confidence, 2),
            "status": "success"
        }
    
    # Fallback for greetings
    if any(word in query.lower() for word in ["hi", "hello", "who are you"]):
        return {
            "answer": "Greetings. I am EnverseBot v2, a Semantic AI assistant. I analyze your energy grid using vector-based retrieval. How can I help?",
            "status": "greeting"
        }

    return {
        "answer": "I couldn't find a high-confidence data match. Try asking about your 'bill', 'anomalies', or 'device usage'.",
        "status": "low_confidence"
    }