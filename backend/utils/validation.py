"""Validation helpers for GEO expression input.

Input format (long CSV):
  - Column "ProbeID" with Affymetrix probe IDs (one per row)
  - One or more sample expression columns
  - Only the first sample column is used for inference
  - Only the top-100 biomarker probes are required / extracted
"""

import logging

import pandas as pd

from services.model_loader import get_top100_probes, is_model_ready

logger = logging.getLogger(__name__)


def validate_dataframe(df: pd.DataFrame) -> list[str]:
    """
    Validate a long-format GEO CSV DataFrame.

    Expected shape:
        - A "ProbeID" column containing Affymetrix probe IDs
        - At least one numeric expression column (first is used)
        - Must cover all top-100 biomarker probe IDs

    Args:
        df: Parsed CSV as a Pandas DataFrame.

    Returns:
        List of human-readable validation errors (empty = OK).
    """
    errors: list[str] = []
    top100 = get_top100_probes()

    if not is_model_ready() or not top100:
        errors.append(
            "Model artifacts are not loaded. Ensure sepsis_rf_model.pkl, "
            "sepsis_scaler.pkl, and top100_biomarkers.json are in backend/models/."
        )
        return errors

    if df is None or df.empty:
        errors.append("CSV is empty. Provide a long-format GEO expression file.")
        return errors

    # Normalise column names
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    if "ProbeID" not in df.columns:
        errors.append(
            'Missing required column "ProbeID". '
            "The CSV must have a ProbeID column containing Affymetrix probe IDs."
        )
        return errors

    present_probes = set(df["ProbeID"].astype(str).str.strip())
    missing = [p for p in top100 if p not in present_probes]
    if missing:
        preview = ", ".join(missing[:6])
        errors.append(
            f"CSV is missing {len(missing)} of the top-100 required biomarker probes. "
            f"Example missing: {preview}"
        )

    # Check there is at least one numeric expression column besides ProbeID
    expr_cols = [c for c in df.columns if c != "ProbeID"]
    if not expr_cols:
        errors.append(
            'No expression columns found. '
            'The CSV must contain at least one sample column beside "ProbeID".'
        )
        return errors

    # Check the first sample column has numeric values for top-100 probes
    sample_col = expr_cols[0]
    top100_rows = df[df["ProbeID"].astype(str).str.strip().isin(top100)]
    numeric_check = pd.to_numeric(top100_rows[sample_col], errors="coerce")
    bad = int(numeric_check.isna().sum())
    if bad:
        errors.append(
            f"{bad} top-100 probe rows have non-numeric or missing expression values "
            f"in column '{sample_col}'."
        )

    return errors


def extract_feature_values(df: pd.DataFrame, sample_col: str | None = None) -> dict[str, float]:
    """
    Extract the top-100 biomarker expression values from a long-format DataFrame.

    Replicates the training-time logic:
        patient = patient.set_index("ProbeID")
        patient = patient.loc[top100_genes]

    Args:
        df:         Long-format GEO DataFrame with a "ProbeID" column.
        sample_col: Which sample (expression) column to use.
                    Defaults to the first non-ProbeID column.

    Returns:
        Dict mapping probe ID → float expression value (100 entries, ordered
        to match the scaler's feature_names_in_).
    """
    top100 = get_top100_probes()
    if not top100:
        raise RuntimeError("Top-100 biomarker list is unavailable.")

    working = df.copy()
    working.columns = [str(c).strip() for c in working.columns]

    # Set ProbeID as index
    working = working.set_index("ProbeID")
    working.index = working.index.astype(str).str.strip()

    # Pick the first sample column if not specified
    if sample_col is None:
        sample_col = working.columns[0]

    # Filter to top-100 probes (same order as training)
    filtered = working.loc[top100, sample_col]
    numeric  = pd.to_numeric(filtered, errors="coerce").fillna(0.0)

    return {probe: float(numeric[probe]) for probe in top100}
