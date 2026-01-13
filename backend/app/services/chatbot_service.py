from sentence_transformers import SentenceTransformer, util
import torch
from app.services.knowledge_base import generate_knowledge_base

class EnverseSemanticBot:
    def __init__(self):
        # Load a real pre-trained Transformer model (Industry Standard)
        # This model understands that 'bill' and 'cost' are semantically similar.
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.greetings = ["hi", "hello", "sup", "hey", "who are you"]

    def handle_query(self, query: str):
        query_lower = query.lower().strip()
        
        # Simple Greeting Handling
        if any(greet in query_lower for greet in self.greetings):
            return "Hello! I am EnverseBot. I'm monitoring your energy grid. You can ask me about usage, bills, or system health."

        # 1. Generate fresh facts from real data
        knowledge_base = generate_knowledge_base()
        
        # 2. Encode the knowledge base and the query into semantic vectors
        knowledge_embeddings = self.model.encode(knowledge_base, convert_to_tensor=True)
        query_embedding = self.model.encode(query, convert_to_tensor=True)

        # 3. Calculate Cosine Similarity (The math behind AI)
        cosine_scores = util.cos_sim(query_embedding, knowledge_embeddings)[0]
        
        # 4. Find the best matching fact
        best_idx = torch.argmax(cosine_scores).item()
        confidence = cosine_scores[best_idx].item()

        # Threshold: If confidence is too low, the AI admits it doesn't know
        if confidence < 0.35:
            return "I couldn't confidently infer that from current energy data. Try asking about system health, billing, or device usage."

        return knowledge_base[best_idx]