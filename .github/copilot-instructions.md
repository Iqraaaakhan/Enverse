# Enverse AI - Copilot Instructions

## Project Overview
**Enverse** is a full-stack energy intelligence platform combining ML/NILM (Non-Intrusive Load Monitoring) for appliance-level energy tracking with LLM-powered natural language chat for user insights.

### Architecture
- **Backend**: FastAPI server (`backend/app/main.py`) serving ML predictions, anomaly detection, and LLM chat
- **Frontend**: React + TypeScript + Vite dashboard (`frontend/enverse-ui/src/`) displaying energy analytics
- **Data Pipeline**: Reads CSV energy logs → AI models infer appliance usage → Returns structured insights

### Tech Stack
- **Backend**: Python (FastAPI, Pydantic, Pandas, scikit-learn, XGBoost, Google Generative AI)
- **Frontend**: React, TypeScript, TailwindCSS, Lucide icons, Framer Motion
- **ML**: SHAP explainability, sentence-transformers for NLP, XGBoost for anomaly detection

---

## Critical Architecture Patterns

### 1. **Service Layer Architecture**
All business logic is in `backend/app/services/`. Each service is stateless and functional:
- `energy_calculator.py` - Metrics computation from raw data
- `predictor.py` - Energy estimation using **duty cycles** (heuristic for appliance efficiency)
- `anomaly_detector.py` - Rule + ML-based anomaly detection
- `nlp_engine.py` - Intent classification + entity extraction (pre-LLM routing)
- `llm_service.py` - **Hybrid model**: Local deterministic responses first, LLM for complex queries
- `knowledge_base.py` - Centralizes live metrics computation

**Key Pattern**: Local logic first → LLM fallback. This saves API quota and ensures speed.

### 2. **Data Flow - Dashboard as Single Source of Truth**
```
CSV Data (backend/data/) 
→ load_energy_data() [data_loader.py] 
→ compute_dashboard_metrics() [energy_calculator.py]
→ /dashboard endpoint [main.py]
→ React components [frontend/]
```

The `/dashboard` endpoint is the primary API contract. All insights (forecasts, anomalies, device breakdown) derive from this single call.

### 3. **Physics-Based Prediction**
Energy predictions use **duty cycles** (% of rated power actually consumed):
```python
energy_kwh = (watts × duty_cycle / 1000) × (minutes / 60)
```
Duty cycles are hardcoded in `predictor.py` for known appliances (AC: 0.75, Fridge: 0.35, etc.). This makes predictions **explainable** and **verifiable**.

### 4. **LLM Service - Per-Session Isolation**
`llm_service.py` maintains `CHAT_SESSIONS` dict keyed by `session_id` to handle multi-user scenarios. Each session has its own Gemini chat history. Responses include explicit `session_id` for traceability.

### 5. **Anomaly Detection - Hybrid Approach**
`anomaly_detector.py` combines:
- **Rule-based**: High wattage thresholds, unusual time-of-day usage
- **ML-based**: XGBoost model trained on historical patterns
Falls back to rule-based if ML model unavailable.

---

## Key Workflows

### Running the Backend
```bash
cd backend
pip install -r requirements.txt
export GOOGLE_API_KEY="your_key_here"  # For LLM chat
python -m uvicorn app.main:app --reload
```
Backend runs on `http://127.0.0.1:8000`.

### Running the Frontend
```bash
cd frontend/enverse-ui
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` (Vite default), proxies API calls to localhost:8000.

### Key Endpoints
- `GET /dashboard` - All metrics in one call (KPIs, device breakdown, anomalies)
- `GET /health` - System + AI model status
- `POST /chat` - LLM chat with per-session isolation
- `GET /energy/ai-insights` - AI-generated insight objects (dominant load, consumption status, night usage)
- `GET /energy/ai-timeline` - 30-day delta analysis with cost impact
- `POST /api/estimate-energy` - What-if analysis using duty cycle physics

### Data Flow Examples
1. **Chat Query "How much does AC use?"**
   - Frontend: POST `/chat` with message
   - Backend: `nlp_engine.py` classifies intent → entity extract "AC"
   - If not matched locally, `llm_service.py` sends to Gemini with `get_device_specific_usage()` tool
   - Response cached per session in `CHAT_SESSIONS`

2. **Dashboard Load**
   - Frontend: GET `/dashboard`
   - Backend: `compute_dashboard_metrics()` reads CSV → aggregates by device + time
   - Returns: KPIs, device_breakdown, anomalies, night_usage_percent
   - Frontend renders 5+ components from single response

---

## Project-Specific Conventions

### Naming
- Device names must match enum in `energy_calculator.py`: "Air Conditioner", "Refrigerator", "Washing Machine", "Lighting", "Electronics"
- Device aliases in `nlp_engine.py` map user input ("ac", "fridge") to official names
- Python files use `snake_case`; React components use `PascalCase`

### Data Assumptions
- CSV files assumed to have columns: `timestamp`, `device_name`, `energy_kwh`, `power_watts`
- Energy values in **kWh** (not Wh or J), timestamps in ISO format
- Missing data handled gracefully with sums defaulting to 0

### Error Handling
- `json_safe()` function in `main.py` sanitizes NaN/Inf values (common in ML outputs)
- All services return typed dicts; frontend expects exact contract
- LLM failures trigger `generate_fallback_summary()` with precomputed metrics

### Frontend API Contract
Backend responses must include:
- `total_energy_kwh` (float)
- `device_wise_energy_kwh` (dict of {device_name: kwh})
- `anomalies` (list of alert objects)
- `night_usage_percent` (float 0-100)
- Timestamps in ISO format (parsed as Date in React)

### Testing
- `backend/test_real_data.py` - Validates energy calculations against sample CSV
- `backend/test_data_verification.py` - Confirms device aggregation logic
- Run: `python -m pytest backend/` (if pytest installed)

---

## Common Modifications

### Adding a New Service Endpoint
1. Create function in appropriate `services/*.py`
2. Import in `main.py`
3. Add route: `@app.get("/path")` or `@app.post("/path")`
4. Return typed dict (Pydantic or plain dict)
5. Test with: `curl http://127.0.0.1:8000/path`

### Adding Device Type
1. Add to `DUTY_CYCLES` dict in `predictor.py`
2. Add alias mapping in `nlp_engine.py` DEVICE_ALIASES
3. Update device enum validation in `energy_calculator.py` if needed

### Updating LLM Behavior
- Modify `SYSTEM_INSTRUCTION` in `llm_service.py` to change tone/rules
- Add/remove local logic cases in `get_local_response()` for common queries
- Change model in `genai.GenerativeModel()` (currently "gemini-2.0-flash")

### Extending Frontend Dashboard
1. All data comes from `/dashboard` endpoint → add to response in `main.py`
2. Create new component in `frontend/enverse-ui/src/components/dashboard/`
3. Import + render in `App.tsx`
4. Type data in `src/types/dashboard.ts`

---

## Critical Files Reference
| File | Purpose |
|------|---------|
| [backend/app/main.py](backend/app/main.py) | FastAPI routes & contracts |
| [backend/app/services/energy_calculator.py](backend/app/services/energy_calculator.py) | Metrics computation logic |
| [backend/app/services/predictor.py](backend/app/services/predictor.py) | Duty cycle physics |
| [backend/app/services/llm_service.py](backend/app/services/llm_service.py) | Hybrid LLM + local logic |
| [frontend/enverse-ui/src/App.tsx](frontend/enverse-ui/src/App.tsx) | Main React component |
| [frontend/enverse-ui/src/nilmApi.ts](frontend/enverse-ui/src/nilmApi.ts) | API client |

---

## Known Quirks & Gotchas
1. **NaN Sanitization**: ML outputs can have NaN/Inf. Always use `json_safe()` before returning JSON.
2. **CORS**: Backend allows `"*"` origin in development. Restrict before production.
3. **Session State**: Chat sessions stored in memory. Restart backend clears chat history.
4. **Duty Cycle Lookup**: Predictor matches appliance string **substring**. "AC" matches "Residential Cooling (AC)".
5. **CSV Encoding**: Ensure CSVs are UTF-8. Data loader may fail on latin-1 without conversion.
