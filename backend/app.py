"""
SepsisAI — FastAPI Application Entry Point
Research-grade sepsis risk prediction from gene expression data.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import engine, Base
from routes.predict import router as predict_router
from routes.report import router as report_router
from routes.explain import router as explain_router
from routes.auth import router as auth_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler — runs startup / shutdown logic."""
    logger.info("SepsisAI API starting up …")
    # Create all DB tables (no-op if they already exist)
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("SepsisAI API shutting down.")


app = FastAPI(
    title="SepsisAI — Sepsis Risk Prediction API",
    description=(
        "Research-grade REST API for predicting sepsis risk from patient gene "
        "expression data.  Endpoints support CSV upload, manual JSON input, "
        "SHAP-based explainability, heatmap visualisation, and automated PDF "
        "report generation."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "Data Input",
            "description": "CSV template download and gene data upload.",
        },
        {
            "name": "Prediction",
            "description": "Sepsis risk prediction endpoints.",
        },
        {
            "name": "Explainability",
            "description": "Gene feature importance and heatmap visualisation.",
        },
        {
            "name": "Reports",
            "description": "PDF clinical report generation.",
        },
        {
            "name": "Health",
            "description": "Service health and readiness checks.",
        },
    ],
)

# ---------------------------------------------------------------------------
# CORS — allow both Vite dev-server (5173) and Create-React-App (3000)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)
app.include_router(report_router)
app.include_router(explain_router)
app.include_router(auth_router)


# ---------------------------------------------------------------------------
# Health routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"], summary="API Root")
async def root():
    """Returns basic API metadata."""
    return {
        "service": "SepsisAI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"], summary="Health Check")
async def health_check():
    """Returns service health status."""
    return {"status": "healthy"}
