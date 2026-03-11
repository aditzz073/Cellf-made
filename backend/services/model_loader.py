"""
services/model_loader.py
------------------------
Loads the trained scikit-learn model from  models/sepsis_model.pkl.
Falls back to a biology-informed PlaceholderModel when no file is present.

Integration guide
-----------------
1. Train your model (e.g. RandomForestClassifier or GradientBoostingClassifier)
   on a gene expression dataset labelled for sepsis.
2. Save it:  pickle.dump(model, open("backend/models/sepsis_model.pkl", "wb"))
3. The model must implement:
     model.predict_proba(X: np.ndarray) -> np.ndarray  (shape n × 2)
     model.predict(X: np.ndarray)       -> np.ndarray  (shape n,)
4. Restart the API — model_loader.load_model() will detect the file automatically.
"""

import logging
import pickle
from pathlib import Path
from typing import Protocol, runtime_checkable

import numpy as np

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent.parent / "models" / "sepsis_model.pkl"

# Feature order the trained model expects (must match training-time column order)
FEATURE_ORDER: list[str] = [
    "IL6", "TLR4", "HLA-DRA", "STAT3", "TNF",
    "CXCL8", "CD14", "MMP8", "LBP", "PCSK9",
]


# ---------------------------------------------------------------------------
# Model protocol — any real model must satisfy this interface
# ---------------------------------------------------------------------------

@runtime_checkable
class SepsisModelProtocol(Protocol):
    """Interface that a trained sepsis prediction model must implement."""

    def predict_proba(self, X: np.ndarray) -> np.ndarray: ...
    def predict(self, X: np.ndarray) -> np.ndarray: ...


# ---------------------------------------------------------------------------
# Deterministic placeholder (used when no .pkl file is found)
# ---------------------------------------------------------------------------

class PlaceholderModel:
    """
    Biology-informed placeholder model for development and evaluation.

    Computes a plausible risk score from a weighted linear combination of
    pro-inflammatory (risk-increasing) and immune-regulation (protective)
    gene expression values.  The weights are loosely inspired by sepsis
    literature but are NOT clinically validated.

    Replace this by dropping a real trained model at  models/sepsis_model.pkl.
    """

    # Pro-inflammatory / risk-increasing markers
    _RISK_WEIGHTS: dict[str, float] = {
        "IL6":   0.22,  # master pro-inflammatory cytokine
        "TNF":   0.20,  # tumour necrosis factor — early sepsis signal
        "TLR4":  0.18,  # LPS pattern recognition receptor
        "CXCL8": 0.15,  # neutrophil chemotaxis signal
        "MMP8":  0.12,  # extracellular matrix remodelling in sepsis
        "LBP":   0.10,  # LPS-binding protein — innate immune activation
        "PCSK9": 0.08,  # associated with poor sepsis outcomes
    }

    # Immune-regulation / protective markers (down-regulated in severe sepsis)
    _PROTECTIVE_WEIGHTS: dict[str, float] = {
        "HLA-DRA": -0.25,  # MHC-II expression — reduced in immunosuppression
        "STAT3":    -0.10,  # anti-inflammatory transcription factor
        "CD14":     -0.05,  # monocyte differentiation marker
    }

    def __init__(self) -> None:
        logger.warning(
            "PlaceholderModel is active — predictions are illustrative only. "
            "To enable real inference, add a trained model at: %s",
            MODEL_PATH,
        )

    def score_from_genes(self, gene_values: dict[str, float]) -> float:
        """Compute a [0, 1] risk score from gene expression values."""
        score = 0.0
        all_weights = {**self._RISK_WEIGHTS, **self._PROTECTIVE_WEIGHTS}
        for gene, weight in all_weights.items():
            value = gene_values.get(gene, 0.0)
            # Normalise log₂ expression to ~[0, 1] (typical range 0–12)
            normalised = min(max(value / 12.0, 0.0), 1.0)
            score += weight * normalised
        # Shift to [0, 1] via soft calibration
        calibrated = (score + 0.30) / 0.65
        return float(min(max(calibrated, 0.01), 0.99))

    # Implement protocol so isinstance checks pass
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        raise NotImplementedError("Use score_from_genes() for PlaceholderModel.")

    def predict(self, X: np.ndarray) -> np.ndarray:
        raise NotImplementedError("Use score_from_genes() for PlaceholderModel.")


# ---------------------------------------------------------------------------
# Public loader
# ---------------------------------------------------------------------------

def load_model() -> tuple[SepsisModelProtocol | PlaceholderModel, bool]:
    """
    Attempt to load the trained model from disk.

    Returns:
        (model, is_real_model) — where `is_real_model` is False when the
        PlaceholderModel is in use.
    """
    if MODEL_PATH.exists():
        try:
            with open(MODEL_PATH, "rb") as fh:
                model = pickle.load(fh)  # noqa: S301 — intentional model load
            logger.info("Loaded trained model from %s", MODEL_PATH)
            return model, True
        except Exception as exc:
            logger.error(
                "Failed to deserialise model at %s: %s  →  using PlaceholderModel.",
                MODEL_PATH,
                exc,
            )

    logger.info("No model file found at %s  →  using PlaceholderModel.", MODEL_PATH)
    return PlaceholderModel(), False
