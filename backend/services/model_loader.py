"""Load and cache trained model artifacts (RF model + scaler + top-100 biomarkers)."""

import json
import logging
import pickle
from pathlib import Path
from typing import Protocol, runtime_checkable

import numpy as np

try:
    import joblib
except Exception:  # pragma: no cover
    joblib = None

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent / "models"
MODEL_CANDIDATES  = ("sepsis_rf_model.pkl", "sepsis_model.pkl")
SCALER_CANDIDATES = ("sepsis_scaler.pkl",)
TOP100_PATH       = MODELS_DIR / "top100_biomarkers.json"


@runtime_checkable
class SepsisModelProtocol(Protocol):
    """Interface required by prediction code."""

    def predict_proba(self, X: np.ndarray) -> np.ndarray: ...
    def predict(self, X: np.ndarray) -> np.ndarray: ...


@runtime_checkable
class FeatureScalerProtocol(Protocol):
    """Interface required by preprocessing code."""

    def transform(self, X): ...


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _first_existing(candidates: tuple[str, ...]) -> Path | None:
    for filename in candidates:
        candidate = MODELS_DIR / filename
        if candidate.exists():
            return candidate
    return None


def _load_artifact(path: Path):
    """Prefer joblib for sklearn objects; fall back to pickle."""
    if joblib is not None:
        return joblib.load(path)
    with open(path, "rb") as fh:
        return pickle.load(fh)  # noqa: S301


def _load_top100(model, scaler) -> list[str]:
    """
    Load the top-100 biomarker probe IDs.

    Priority:
      1. top100_biomarkers.json (pre-computed, fastest)
      2. Derive at runtime from model.feature_importances_ + scaler.feature_names_in_
    """
    if TOP100_PATH.exists():
        try:
            probes = json.loads(TOP100_PATH.read_text())
            if isinstance(probes, list) and probes:
                logger.info("Loaded %d top biomarkers from %s", len(probes), TOP100_PATH)
                return [str(p) for p in probes]
        except Exception as exc:
            logger.warning("Failed to read %s: %s — deriving from model.", TOP100_PATH, exc)

    # Derive from model importances
    if hasattr(model, "feature_importances_") and hasattr(scaler, "feature_names_in_"):
        feature_names = list(scaler.feature_names_in_)
        importances   = model.feature_importances_
        ranked = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        top100 = [name for name, _ in ranked[:100]]
        logger.info("Derived top 100 biomarkers from RF feature importances.")
        return top100

    logger.error("Cannot determine top-100 biomarkers — no JSON file and no feature_importances_.")
    return []


# ---------------------------------------------------------------------------
# Public loader
# ---------------------------------------------------------------------------

def load_model_bundle() -> tuple[
    SepsisModelProtocol | None,
    FeatureScalerProtocol | None,
    list[str],   # top-100 probe IDs (the model's actual input features)
    bool,
]:
    """
    Load RF model, scaler, and the top-100 biomarker list.

    Returns:
        (model, scaler, top100_probes, is_ready)
    """
    model_path  = _first_existing(MODEL_CANDIDATES)
    scaler_path = _first_existing(SCALER_CANDIDATES)

    if model_path is None or scaler_path is None:
        logger.error(
            "Missing required model artifacts in %s. Expected %s and %s.",
            MODELS_DIR, MODEL_CANDIDATES, SCALER_CANDIDATES,
        )
        return None, None, [], False

    try:
        model  = _load_artifact(model_path)
        scaler = _load_artifact(scaler_path)
    except Exception as exc:
        logger.error("Failed to load model artifacts: %s", exc)
        return None, None, [], False

    top100 = _load_top100(model, scaler)
    if not top100:
        return None, None, [], False

    logger.info(
        "Ready: model=%s  scaler=%s  top_biomarkers=%d",
        model_path.name, scaler_path.name, len(top100),
    )
    return model, scaler, top100, True


# Module-level singleton — loaded once at startup
_MODEL_BUNDLE = load_model_bundle()


# ---------------------------------------------------------------------------
# Public accessors (used by predictor, explainability, validation, routes)
# ---------------------------------------------------------------------------

def get_model_bundle() -> tuple[
    SepsisModelProtocol | None,
    FeatureScalerProtocol | None,
    list[str],
    bool,
]:
    return _MODEL_BUNDLE


def get_top100_probes() -> list[str]:
    """Return the ordered list of top-100 biomarker probe IDs."""
    return _MODEL_BUNDLE[2]


def is_model_ready() -> bool:
    return _MODEL_BUNDLE[3]
