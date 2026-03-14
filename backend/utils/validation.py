"""Validation helpers for GEO expression input.

Supported input formats:
    1) Long format (ProbeID rows):
         - Column "ProbeID" with one probe per row
         - One or more sample expression columns
    2) Wide format (single sample row):
         - Probe IDs are columns
         - One row contains expression values

Only top-100 biomarker probes are required for inference.
"""

import logging

import pandas as pd

from services.model_loader import get_top100_probes, is_model_ready

logger = logging.getLogger(__name__)

_PROBE_ID_ALIASES = {
    "probeid",
    "probe_id",
    "id_ref",
    "idref",
    "probe",
    "probeset",
    "gene",
    "geneid",
    "gene_id",
}

_NON_PROBE_ID_COLUMNS = {
    "sampleid",
    "sample_id",
    "patient_id",
    "subject_id",
}


def _norm(value) -> str:
    return str(value).strip().lower()


def _detect_probe_id_column(df: pd.DataFrame) -> str | None:
    """Detect probe-id column in long-format GEO files."""
    for col in df.columns:
        if _norm(col) in _PROBE_ID_ALIASES:
            return col

    # Heuristic fallback for unknown long-format files.
    # Guardrails avoid misclassifying wide one-row templates.
    if len(df.columns) >= 2:
        first_col = df.columns[0]
        first_norm = _norm(first_col)
        if first_norm in _NON_PROBE_ID_COLUMNS:
            return None

        # Wide templates are typically one row and should not hit this fallback.
        if len(df.index) < 10:
            return None

        probe_like = pd.to_numeric(df[first_col], errors="coerce").isna().mean()
        has_numeric_sample_col = any(
            float(pd.to_numeric(df[c], errors="coerce").notna().mean()) >= 0.8
            for c in df.columns[1:]
        )

        if float(probe_like) >= 0.8 and has_numeric_sample_col:
            return first_col

    return None


def validate_dataframe(df: pd.DataFrame) -> list[str]:
    """
    Validate a GEO CSV DataFrame in long or wide form.

    Expected shape:
        - Long: "ProbeID" column + at least one sample column
        - Wide: probe IDs as columns + at least one data row
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
        errors.append("CSV is empty. Provide a GEO expression file.")
        return errors

    # Normalise column names
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    top100_norm = {_norm(p): p for p in top100}

    # Long format: probe-id is a dedicated column
    probe_id_col = _detect_probe_id_column(df)
    if probe_id_col is not None:
        present_probes = set(df[probe_id_col].astype(str).map(_norm))
        missing = [canonical for normed, canonical in top100_norm.items() if normed not in present_probes]
        if missing:
            preview = ", ".join(missing[:6])
            errors.append(
                f"CSV is missing {len(missing)} of the top-100 required biomarker probes. "
                f"Example missing: {preview}"
            )

        expr_cols = [c for c in df.columns if c != probe_id_col]
        if not expr_cols:
            errors.append(
                'No expression columns found. '
                f'The CSV must contain at least one sample column beside "{probe_id_col}".'
            )
            return errors

        sample_col = expr_cols[0]
        top100_rows = df[df[probe_id_col].astype(str).map(_norm).isin(set(top100_norm.keys()))]
        numeric_check = pd.to_numeric(top100_rows[sample_col], errors="coerce")
        bad = int(numeric_check.isna().sum())
        if bad:
            errors.append(
                f"{bad} top-100 probe rows have non-numeric or missing expression values "
                f"in column '{sample_col}'."
            )

        return errors

    # Wide format: probe IDs are columns, first row is sample values
    if len(df.index) < 1:
        errors.append("Wide-format CSV must include at least one sample row.")
        return errors

    present_cols = {_norm(c): str(c).strip() for c in df.columns}
    missing = [canonical for normed, canonical in top100_norm.items() if normed not in present_cols]
    if missing:
        preview = ", ".join(missing[:6])
        errors.append(
            f"CSV is missing {len(missing)} of the top-100 required biomarker probe columns. "
            f"Example missing: {preview}"
        )
        return errors

    first_row = df.iloc[0]
    actual_cols = [present_cols[_norm(p)] for p in top100]
    numeric_check = pd.to_numeric(first_row[actual_cols], errors="coerce")
    bad = int(numeric_check.isna().sum())
    if bad:
        errors.append(
            f"{bad} top-100 probe columns have non-numeric or missing values in the first sample row."
        )

    return errors


def extract_feature_values(df: pd.DataFrame, sample_col: str | None = None) -> dict[str, float]:
    """
    Extract top-100 biomarker expression values from long or wide DataFrame.

    Replicates the training-time logic:
        patient = patient.set_index("ProbeID")
        patient = patient.loc[top100_genes]

    Args:
        df:         GEO DataFrame in long or wide format.
        sample_col: For long format, which sample column to use.
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

    top100_norm = {_norm(p): p for p in top100}
    probe_id_col = _detect_probe_id_column(working)

    # Long format path
    if probe_id_col is not None:
        working = working.set_index(probe_id_col)
        working.index = working.index.astype(str).str.strip()

        if sample_col is None:
            sample_col = working.columns[0]

        series = pd.to_numeric(working[sample_col], errors="coerce")
        lookup = {}
        for idx, val in series.items():
            key = _norm(idx)
            if key in top100_norm and key not in lookup:
                lookup[key] = float(0.0 if pd.isna(val) else val)

        return {probe: float(lookup.get(_norm(probe), 0.0)) for probe in top100}

    # Wide format path (first sample row)
    first_row = working.iloc[0]
    col_lookup = {_norm(c): c for c in working.columns}
    values = {}
    for probe in top100:
        col = col_lookup.get(_norm(probe))
        raw = first_row[col] if col is not None else 0.0
        num = pd.to_numeric(pd.Series([raw]), errors="coerce").iloc[0]
        values[probe] = float(0.0 if pd.isna(num) else num)
    return values
