"""
backend/config.py
-----------------
Shared constants for the SepsisAI backend.
Import from here instead of re-defining in each module.
"""

import os

# ---------------------------------------------------------------------------
# Gene panel — ordered list expected by the model / shown in the template
# ---------------------------------------------------------------------------
GENE_PANEL: list[str] = [
    "IL6", "TLR4", "HLA-DRA", "STAT3", "TNF",
    "CXCL8", "CD14", "MMP8", "LBP", "PCSK9",
]

# ---------------------------------------------------------------------------
# Reference baseline
# Healthy control median log₂ expression values (literature-derived estimates)
# ---------------------------------------------------------------------------
REFERENCE_BASELINE: dict[str, float] = {
    "IL6":     2.1,
    "TLR4":    4.5,
    "HLA-DRA": 6.8,
    "STAT3":   5.0,
    "TNF":     2.4,
    "CXCL8":   2.8,
    "CD14":    5.9,
    "MMP8":    1.8,
    "LBP":     4.1,
    "PCSK9":   3.6,
}

# ---------------------------------------------------------------------------
# CORS
# Override at runtime by setting CORS_ORIGINS=http://myapp.com,http://other.com
# ---------------------------------------------------------------------------
_cors_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
CORS_ORIGINS: list[str] = [o.strip() for o in _cors_env.split(",") if o.strip()]
