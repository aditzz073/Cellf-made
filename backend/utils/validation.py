"""
utils/validation.py
-------------------
Input validation for gene expression DataFrames parsed from uploaded CSV files.
"""

import logging

import pandas as pd

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS: set[str] = {"Gene", "Expression"}

REQUIRED_GENES: list[str] = [
    "IL6", "TLR4", "HLA-DRA", "STAT3", "TNF",
    "CXCL8", "CD14", "MMP8", "LBP", "PCSK9",
]

# Log₂ expression values outside this range are flagged as suspicious
EXPRESSION_RANGE: tuple[float, float] = (0.0, 20.0)


def validate_dataframe(df: pd.DataFrame) -> list[str]:
    """
    Validate a gene expression DataFrame parsed from user-uploaded CSV.

    Checks (in order):
      1. Required columns  (Gene, Expression)  are present.
      2. No duplicate gene entries.
      3. Expression column contains only numeric values.
      4. Expression values fall within the expected log₂ range [0, 20].
      5. All required panel genes are present.

    Args:
        df: Parsed CSV as a Pandas DataFrame.

    Returns:
        List of human-readable error strings.  Empty list means the data
        is valid and can proceed to prediction.
    """
    errors: list[str] = []

    # ── 1. Column presence ──────────────────────────────────────────────────
    normalised_cols = {c.strip() for c in df.columns}
    missing_cols = REQUIRED_COLUMNS - normalised_cols
    if missing_cols:
        errors.append(
            f"Missing required column(s): {', '.join(sorted(missing_cols))}. "
            f"The CSV must contain exactly two columns: 'Gene' and 'Expression'."
        )
        return errors  # cannot proceed without column structure

    # Normalise column names in place for subsequent checks
    df.columns = df.columns.str.strip()
    df["Gene"] = df["Gene"].astype(str).str.strip()

    # ── 2. Duplicate gene entries ───────────────────────────────────────────
    dupes = df["Gene"][df["Gene"].duplicated(keep=False)].unique().tolist()
    if dupes:
        errors.append(
            f"Duplicate gene entries detected: {', '.join(dupes)}. "
            "Each gene symbol must appear exactly once."
        )

    # ── 3. Numeric expression values ────────────────────────────────────────
    numeric_series = pd.to_numeric(df["Expression"], errors="coerce")
    non_numeric_mask = numeric_series.isna()
    if non_numeric_mask.any():
        bad_genes = df.loc[non_numeric_mask, "Gene"].tolist()
        bad_rows = [str(r + 2) for r in df.index[non_numeric_mask].tolist()]
        errors.append(
            f"Non-numeric Expression value(s) for gene(s): {', '.join(bad_genes)} "
            f"(CSV rows: {', '.join(bad_rows)}). "
            "All expression values must be numeric (e.g. log₂-transformed floats)."
        )
        return errors  # range check would fail without numeric values

    df["Expression"] = numeric_series

    # ── 4. Range check ──────────────────────────────────────────────────────
    lo, hi = EXPRESSION_RANGE
    out_of_range = df[(df["Expression"] < lo) | (df["Expression"] > hi)]
    if not out_of_range.empty:
        genes_oob = out_of_range["Gene"].tolist()
        errors.append(
            f"Expression value(s) outside expected log₂ range [{lo}, {hi}] "
            f"for: {', '.join(genes_oob)}. "
            "Ensure your data is log₂-transformed before upload."
        )

    # ── 5. Required genes ───────────────────────────────────────────────────
    provided = {g.upper() for g in df["Gene"]}
    missing_genes = [g for g in REQUIRED_GENES if g.upper() not in provided]
    if missing_genes:
        errors.append(
            f"Missing required gene(s): {', '.join(missing_genes)}. "
            "Download the CSV template to see the complete required gene panel."
        )

    return errors
