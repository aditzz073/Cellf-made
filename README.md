# Cellf-made - SepsisAI

AI-powered sepsis risk prediction from transcriptomic data with a FastAPI backend and a React dashboard.

Research use only. Not validated for clinical diagnosis or treatment decisions.

---

## What This Repository Contains

1. FastAPI backend for prediction, explainability, heatmap generation, PDF reporting, and JWT auth.
2. React frontend with an end-to-end analysis flow:
   landing -> input -> validation -> loading -> results.
3. Trained model artifacts loaded from backend/models.
4. Local training script main.py for generating RF and scaler artifacts.

---

## Current Runtime Architecture

Frontend:
- React 18 + Vite 5
- Axios for API communication
- Plotly.js for interactive heatmaps

Backend:
- FastAPI + Uvicorn
- scikit-learn RandomForest + StandardScaler inference path
- Pandas/Numpy validation and feature extraction
- ReportLab PDF generation
- SQLAlchemy + SQLite (default) for auth user data

Key backend modules:
- backend/routes/predict.py: template download + prediction API
- backend/utils/validation.py: long and wide CSV validation/extraction
- backend/services/predictor.py: scaler + model inference
- backend/services/explainability.py: ranked feature impacts
- backend/services/heatmap_generator.py: heatmap image generation
- backend/utils/pdf_generator.py: clinical-style PDF report
- backend/routes/auth.py: signup/login/profile endpoints

---

## Repository Structure

```text
Cellf-made/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.py
│   │   ├── explain.py
│   │   ├── predict.py
│   │   └── report.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── jwt_service.py
│   │   ├── model_loader.py
│   │   ├── predictor.py
│   │   ├── explainability.py
│   │   └── heatmap_generator.py
│   ├── utils/
│   │   ├── validation.py
│   │   └── pdf_generator.py
│   └── models/
│       ├── user.py
│       ├── sepsis_rf_model.pkl
│       ├── sepsis_scaler.pkl
│       └── top100_biomarkers.json
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── src/
│       ├── App.jsx
│       ├── context/AuthContext.jsx
│       ├── services/
│       │   ├── api.js
│       │   └── authApi.js
│       ├── utils/scoreTransform.js
│       ├── pages/
│       └── components/
├── inputs/
├── main.py
└── README.md
```

---

## Active Frontend Flow

The currently routed app flow is:

1. LandingPage
2. DataInput
3. ValidationStatus
4. LoadingScreen
5. ResultsDashboard

Auth pages:
- LoginPage
- SignupPage
- ProfilePage

Legacy components exist in the repo but are not the primary routed path.

---

## API Endpoints

### Health

| Method | Path | Description |
|---|---|---|
| GET | / | API root metadata |
| GET | /health | Health check |
| GET | /docs | Swagger UI |

### Prediction and Explainability

| Method | Path | Description |
|---|---|---|
| GET | /template | Download top-100 biomarker template CSV (long format) |
| POST | /predict | Predict sepsis risk from CSV or JSON features |
| GET | /explain | Demo feature impacts |
| POST | /explain | Feature impacts for supplied genes/features |
| GET | /heatmap | Demo heatmap image (base64 PNG) |
| POST | /heatmap | Heatmap image for supplied genes/features |
| POST | /generate-report | Generate downloadable PDF report |

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | /auth/signup | Create account |
| POST | /auth/login | Get JWT token |
| GET | /auth/me | Current authenticated user |
| PUT | /auth/update-profile | Update profile and optional password change |

---

## Supported Input Formats for Prediction

The backend accepts both CSV and JSON.

### 1) Long-format CSV (template format)

Returned by GET /template:

```csv
ProbeID,Sample_001
226879_at,0.0
205844_at,0.0
...
```

### 2) Wide-format CSV (single sample row)

```csv
SampleID,226879_at,205844_at,227867_at,...
SAMPLE_001,7.231,-1.031,0.448,...
```

### 3) JSON features

```json
{
  "features": {
    "226879_at": 7.231,
    "205844_at": -1.031,
    "227867_at": 0.448
  }
}
```

Validation requires the top-100 biomarker probe set from backend/models/top100_biomarkers.json.

---

## Risk Score Display Behavior

Model inference stays unchanged in backend/services/predictor.py.

The displayed risk score in dashboard/report layers is transformed by frontend/src/utils/scoreTransform.js and mirrored in backend/utils/pdf_generator.py:

- If raw score < 0.73: display_score = max(raw_score - 0.30, 0)
- Else: display_score = raw_score

Confidence remains the original model confidence.

---

## Local Development Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### 1) Clone repository

```bash
git clone <your-repo-url>
cd Cellf-made
```

### 2) Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --reload
```

Backend runs on http://localhost:8000

### 3) Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on http://localhost:5173

Vite proxy forwards /api requests to http://localhost:8000 in development.

---

## Model Artifacts and Loading

Backend startup expects model artifacts in backend/models:

Required:
- sepsis_scaler.pkl
- top100_biomarkers.json

Model file candidates (first found):
- sepsis_rf_model.pkl
- sepsis_model.pkl

Model loader logic is in backend/services/model_loader.py.

---

## Training Script Notes

Run main.py from the repository root:

```bash
python main.py
```

main.py writes:
- sepsis_rf_model.pkl
- sepsis_scaler.pkl
- feature_importance.png

If generated outside backend/models, move artifact files into backend/models before running the API.

---

## Verification Checklist

1. GET http://localhost:8000/health returns status healthy.
2. Frontend opens at http://localhost:5173.
3. Run prediction from upload or paste flow.
4. Results dashboard shows risk score, confidence, feature impacts, and heatmap.
5. Download PDF report successfully.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Axios, Plotly.js |
| Backend | FastAPI, Uvicorn, SQLAlchemy |
| ML runtime | scikit-learn, Pandas, NumPy |
| Explainability visuals | Matplotlib, Seaborn |
| Report generation | ReportLab, Pillow |
| Auth | python-jose, passlib bcrypt |

---

## Status

Active development.

Current codebase supports:
- trained model inference with scaler alignment
- long and wide top-100 biomarker input formats
- JWT-based user auth and profile updates
- clinical-style PDF report generation
