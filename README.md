# Cellf-made - SepsisAI

> **AI-Powered Sepsis Risk Prediction from Immune Transcriptomic Data**

A research-grade full-stack web application for early sepsis detection using gene expression profiling and machine learning. Combines a FastAPI backend with a React clinical dashboard to deliver risk scores, per-gene explainability, interactive heatmaps, and downloadable PDF reports.

> ⚠️ **Research Use Only.** Not validated for clinical diagnosis or treatment decisions.

---

## Problem Statement

Sepsis is a life-threatening medical emergency caused by a dysregulated immune response to infection. Despite being one of the leading causes of ICU mortality worldwide, it is typically diagnosed only after observable signs of organ dysfunction emerge - by which point the intervention window has often narrowed.

**Cellf-made** moves detection upstream by targeting the molecular changes that *drive* that cascade, not the symptoms it produces.

---

## System Architecture

```
React Frontend  (Vite · Axios · Plotly.js)
      │
      │  REST API  (localhost:8000)
      ▼
FastAPI Backend
      │
      ├── Data Validation          utils/validation.py
      ├── Gene Expression Parser   routes/predict.py
      ├── Preprocessing Layer      services/predictor.py
      ├── ML Prediction Service    services/model_loader.py  ← swap here
      ├── Explainability Service   services/explainability.py
      ├── Heatmap Generator        services/heatmap_generator.py
      └── PDF Report Generator     utils/pdf_generator.py
```

---

## Project Structure

```
Cellf-made/
├── backend/
│   ├── app.py                     # FastAPI entry point, CORS, router registration
│   ├── requirements.txt
│   ├── models/
│   │   └── sepsis_model.pkl       # ← drop your trained model here
│   ├── routes/
│   │   ├── predict.py             # GET /template · POST /predict
│   │   ├── explain.py             # GET|POST /explain · GET|POST /heatmap
│   │   └── report.py              # POST /generate-report
│   ├── services/
│   │   ├── model_loader.py        # loads RF model + scaler artifacts
│   │   ├── predictor.py           # scaler -> model inference pipeline
│   │   ├── explainability.py      # ranked feature impacts from model importances
│   │   └── heatmap_generator.py   # top-feature heatmap -> base-64 PNG
│   └── utils/
│       ├── validation.py          # CSV DataFrame validation
│       └── pdf_generator.py       # ReportLab clinical PDF
└── frontend/
    ├── vite.config.js             # dev proxy: /api → localhost:8000
    └── src/
        ├── App.jsx                # view state machine
        ├── services/api.js        # Axios API layer
        └── components/
            ├── LandingPage.jsx
                  ├── DataInput.jsx      # 2-tab: Upload GEO CSV / Paste GEO CSV
            ├── ValidationStatus.jsx
            ├── LoadingScreen.jsx
            ├── ResultsDashboard.jsx
            ├── RiskCard.jsx
            ├── GeneTable.jsx
            ├── HeatmapViewer.jsx  # Plotly.js interactive heatmap
            ├── ManualInputForm.jsx
            ├── PasteCSV.jsx
            ├── CSVUpload.jsx
            └── ReportDownload.jsx
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/template` | Download GEO wide-format CSV template |
| `POST` | `/predict` | Sepsis risk prediction (CSV upload or JSON) |
| `GET` | `/explain` | Gene feature importances (demo data) |
| `POST` | `/explain` | Gene feature importances (patient data) |
| `GET` | `/heatmap` | Expression heatmap image (demo data) |
| `POST` | `/heatmap` | Expression heatmap image (patient data) |
| `POST` | `/generate-report` | Generate downloadable PDF clinical report |
| `GET` | `/health` | Service health check |
| `GET` | `/docs` | Interactive Swagger UI |

---

## Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

---

### 1 - Clone & enter the repo

```bash
git clone <your-repo-url>
cd Cellf-made
```

### 2 - Backend setup

```bash
cd backend

# Create and activate a virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate.bat     # Windows

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### 3 - Frontend setup

In a second terminal:

```bash
cd frontend

npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

> The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`, so CORS is transparent during development.

---

### 4 - Verify the stack

1. Backend running → visit `http://localhost:8000/health` → should return `{"status": "healthy"}`
2. Frontend running → visit `http://localhost:5173` → landing page loads
3. Upload or paste one-sample GEO expression data → results dashboard appears with risk score, top-feature table, heatmap
4. Click **Download Clinical Report** → PDF downloads

---

## CSV Template Format

```csv
SampleID,V1,V2,V3,...,V24840
SAMPLE_001,0,0,0,...,0
```

- Input must contain exactly **one sample row** per prediction request.
- Header should include the full V-feature space expected by the trained scaler/model.
- Download the template directly from the app: **Upload GEO CSV -> Download Template**

---

## How It Works

1. **Sample Collection** - A blood sample is drawn from the patient.
2. **Transcriptomic Profiling** - Immune expression matrix is prepared as a full GEO-style feature vector (V1...Vn).
3. **AI-Driven Analysis** - `StandardScaler` preprocessing is applied, then a trained Random Forest predicts sepsis probability.
4. **Risk Stratification** - Quantitative risk score (0–100%) with ranked feature impact analysis.
5. **Clinical Report** - Structured PDF report for research documentation.

---

## Generating the Model

Run `main.py` from the root of the repository to train the model and generate the `.pkl` files:

```bash
python main.py
```

This will produce `sepsis_rf_model.pkl` and `sepsis_scaler.pkl` which the backend loads automatically on startup.

---

## Impact

| Outcome | Effect |
|---|---|
| Earlier intervention | Antibiotics and fluids administered before organ stress begins |
| Reduced organ failure | Catching the immune response early limits downstream damage |
| Lower mortality | Faster, more targeted treatment improves survival rates |
| Shorter ICU stays | Early management reduces disease severity and length of admission |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Axios, Plotly.js |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| ML | scikit-learn (Random Forest + StandardScaler artifacts) |
| Visualisation | Plotly.js (frontend), Seaborn/Matplotlib (backend PDF) |
| PDF | ReportLab |
| Validation | Pydantic v2 |

---

## Status

Active development. Real trained model pipeline is integrated for GEO wide-format inference.
