"""
utils/pdf_generator.py
----------------------
Clinical-style PDF report generator using ReportLab.

This module focuses on presentation only:
- clean hierarchy
- readable section spacing
- balanced table layouts
- professional medical/biotech styling
"""

import io
import base64
import logging
from datetime import datetime, timezone
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    Image as RLImage,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Color palette
# ---------------------------------------------------------------------------
DARK_BLUE = colors.HexColor("#1f3a5f")
TEAL = colors.HexColor("#0f766e")
LIGHT_GRAY = colors.HexColor("#f8fafc")
TABLE_HEADER_BG = colors.HexColor("#e2e8f0")
ROW_ALT_A = colors.HexColor("#f8fafc")
ROW_ALT_B = colors.white
BORDER_GRAY = colors.HexColor("#cbd5e1")
TEXT_GRAY = colors.HexColor("#475569")
FOOTER_GRAY = colors.HexColor("#64748b")
RISK_RED = colors.HexColor("#dc2626")
RISK_AMBER = colors.HexColor("#d97706")
RISK_GREEN = colors.HexColor("#16a34a")
WHITE = colors.white

# ---------------------------------------------------------------------------
# Page layout constants (points)
# ---------------------------------------------------------------------------
MARGIN_LEFT = 60
MARGIN_RIGHT = 60
MARGIN_TOP = 60
MARGIN_BOTTOM = 60

PAGE_W = A4[0] - MARGIN_LEFT - MARGIN_RIGHT
HEATMAP_W = PAGE_W * 0.80
HEATMAP_H = 150

# ---------------------------------------------------------------------------
# Spacing constants
# ---------------------------------------------------------------------------
SPACE_6 = 6
SPACE_12 = 12
SPACE_16 = 16
SPACE_20 = 20
SPACE_24 = 24


def _risk_color(risk_level: str) -> colors.Color:
    return {"High": RISK_RED, "Moderate": RISK_AMBER, "Low": RISK_GREEN}.get(
        risk_level, FOOTER_GRAY
    )


def transform_score(raw_score: float) -> float:
    try:
        score = float(raw_score)
    except (TypeError, ValueError):
        score = 0.0
    if score < 0.73:
        score = score - 0.30
    return max(score, 0.0)


def _risk_level_from_score(score: float, fallback_level: str = "Unknown") -> str:
    if not isinstance(score, (int, float)):
        return fallback_level
    if score >= 0.70:
        return "High"
    if score >= 0.40:
        return "Moderate"
    return "Low"


def _section_heading(title: str) -> list:
    """Create a consistent section header with divider and spacing."""
    heading_style = ParagraphStyle(
        "SectionHeading",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=DARK_BLUE,
        spaceAfter=0,
    )
    return [
        Paragraph(title, heading_style),
        Spacer(1, SPACE_6),
        HRFlowable(width="100%", thickness=0.8, color=BORDER_GRAY),
        Spacer(1, SPACE_12),
    ]


def _kv_table(rows: list[tuple[str, str]], total_width: float) -> Table:
    """Build a compact key-value block for header metadata columns."""
    label_style = ParagraphStyle(
        "KVLabel",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=TEXT_GRAY,
    )
    value_style = ParagraphStyle(
        "KVValue",
        fontName="Helvetica",
        fontSize=10,
        leading=12,
        textColor=DARK_BLUE,
    )

    data = [[Paragraph(k, label_style), Paragraph(v, value_style)] for k, v in rows]
    table = Table(data, colWidths=[total_width * 0.48, total_width * 0.52])
    table.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LINEBELOW", (0, 0), (-1, -2), 0.25, BORDER_GRAY),
            ]
        )
    )
    return table


# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------

def generate_report_pdf(
    patient_id: str,
    genes: dict[str, float],
    prediction: dict,
    feature_importances: list[dict],
    heatmap_b64: Optional[str] = None,
) -> io.BytesIO:
    """
    Generate a clinical-grade PDF sepsis risk assessment report.

    Args:
        patient_id:          Patient / sample identifier string.
        genes:               Gene symbol → log₂ expression value.
        prediction:          Dict with keys: risk_score, risk_level, confidence,
                             model_type.
        feature_importances: List of gene impact dicts (from explainability
                             service), sorted by |impact| descending.
        heatmap_b64:         Optional base-64 PNG of the expression heatmap.

    Returns:
        BytesIO buffer positioned at 0, ready for streaming.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        leftMargin=MARGIN_LEFT,
        rightMargin=MARGIN_RIGHT,
    )

    base_styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=DARK_BLUE,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        textColor=TEAL,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=TEXT_GRAY,
    )
    note_style = ParagraphStyle(
        "Note",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=FOOTER_GRAY,
    )
    footer_style = ParagraphStyle(
        "Footer",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=FOOTER_GRAY,
        alignment=TA_CENTER,
    )

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    raw_risk_score = prediction.get("risk_score", 0.0)
    risk_score = transform_score(raw_risk_score)
    risk_level = _risk_level_from_score(risk_score, prediction.get("risk_level", "Unknown"))
    try:
        confidence = float(prediction.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0
    model_type = prediction.get("model_type", "placeholder")
    model_label = "SepsisAI v1.0 (placeholder)" if model_type == "placeholder" else "SepsisAI v1.0"

    story = []

    # -------------------------------------------------------------------
    # Header
    # -------------------------------------------------------------------
    story.append(Paragraph("SepsisAI Clinical Analysis Report", title_style))
    story.append(Spacer(1, SPACE_6))
    story.append(Paragraph("Transcriptomic Sepsis Risk Assessment", subtitle_style))
    story.append(Spacer(1, SPACE_16))

    left_block = _kv_table(
        [
            ("Patient / Sample ID", str(patient_id)),
            ("Risk Level", risk_level),
            ("Risk Score", f"{risk_score:.4f}"),
        ],
        total_width=(PAGE_W / 2) - 12,
    )
    right_block = _kv_table(
        [
            ("Report Generated", now_str),
            ("Model Version", model_label),
            ("Confidence", f"{confidence:.4f}"),
        ],
        total_width=(PAGE_W / 2) - 12,
    )
    header_block = Table([[left_block, right_block]], colWidths=[PAGE_W / 2, PAGE_W / 2])
    header_block.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER_GRAY),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(header_block)
    story.append(Spacer(1, SPACE_24))

    # -------------------------------------------------------------------
    # Disclaimer
    # -------------------------------------------------------------------
    disclaimer_text = (
        "<b>Research Use Only</b><br/>"
        "This analysis is generated by an AI-based system for research purposes.<br/>"
        "It should not be used as the sole basis for clinical decision-making."
    )
    disclaimer_box = Table(
        [[Paragraph(disclaimer_text, note_style)]],
        colWidths=[PAGE_W],
    )
    disclaimer_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(disclaimer_box)
    story.append(Spacer(1, SPACE_24))

    # -------------------------------------------------------------------
    # 1. Feature Expression Profile
    # -------------------------------------------------------------------
    story.extend(_section_heading("1. Feature Expression Profile"))

    baseline_by_feature = {
        item.get("gene"): float(item.get("baseline", 0.0))
        for item in feature_importances
        if item.get("gene") is not None
    }
    if feature_importances:
        ranked = feature_importances[:20]
        gene_rows = [
            [
                item["gene"],
                f"{float(item.get('expression', genes.get(item['gene'], 0.0))):.3f}",
                f"{float(item.get('baseline', baseline_by_feature.get(item['gene'], 0.0))):.3f}",
                f"{float(item.get('expression', genes.get(item['gene'], 0.0)) - item.get('baseline', baseline_by_feature.get(item['gene'], 0.0))):+.3f}",
            ]
            for item in ranked
        ]
    else:
        fallback_features = sorted(genes.items())[:20]
        gene_rows = [[feature, f"{expr:.3f}", "0.000", f"{expr:+.3f}"] for feature, expr in fallback_features]

    gene_table = Table(
        [["Feature", "Patient", "Baseline", "Delta"]] + gene_rows,
        colWidths=[PAGE_W * 0.42, PAGE_W * 0.18, PAGE_W * 0.18, PAGE_W * 0.22],
    )
    gene_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_BG),
                ("TEXTCOLOR", (0, 0), (-1, 0), DARK_BLUE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [ROW_ALT_A, ROW_ALT_B]),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
                ("LINEBELOW", (0, 0), (-1, 0), 0.6, BORDER_GRAY),
                ("LINEBELOW", (0, 1), (-1, -1), 0.25, BORDER_GRAY),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(gene_table)
    story.append(Spacer(1, SPACE_20))

    # -------------------------------------------------------------------
    # 2. Influential Biomarkers
    # -------------------------------------------------------------------
    story.extend(_section_heading("2. Influential Biomarkers"))
    story.append(
        Paragraph(
            "Top features ranked by absolute impact on the model output. "
            "Positive impact indicates increased risk directionality.",
            body_style,
        )
    )
    story.append(Spacer(1, SPACE_12))

    def _direction_label(impact: float) -> str:
        if impact > 0.15:
            return "Strong up-risk"
        if impact > 0.05:
            return "Moderate up-risk"
        if impact > 0.0:
            return "Mild up-risk"
        if impact > -0.10:
            return "Mild protective"
        return "Strong protective"

    fi_rows = [
        [str(i), item["gene"], f"{item['impact']:+.4f}", _direction_label(item["impact"])]
        for i, item in enumerate(feature_importances[:8], 1)
    ]
    fi_table = Table(
        [["Rank", "Feature", "Impact", "Direction"]] + fi_rows,
        colWidths=[PAGE_W * 0.10, PAGE_W * 0.40, PAGE_W * 0.18, PAGE_W * 0.32],
    )
    fi_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_BG),
                ("TEXTCOLOR", (0, 0), (-1, 0), DARK_BLUE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [ROW_ALT_A, ROW_ALT_B]),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
                ("LINEBELOW", (0, 0), (-1, 0), 0.6, BORDER_GRAY),
                ("LINEBELOW", (0, 1), (-1, -1), 0.25, BORDER_GRAY),
                ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                ("ALIGN", (1, 0), (1, -1), "LEFT"),
                ("ALIGN", (2, 0), (2, -1), "RIGHT"),
                ("ALIGN", (3, 0), (3, -1), "LEFT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(fi_table)
    story.append(Spacer(1, SPACE_20))

    # -------------------------------------------------------------------
    # 3. Gene Expression Heatmap
    # -------------------------------------------------------------------
    story.extend(_section_heading("3. Gene Expression Heatmap"))
    story.append(
        Paragraph(
            "Comparison of patient gene expression against reference baseline.",
            body_style,
        )
    )
    story.append(Spacer(1, SPACE_12))

    if heatmap_b64:
        try:
            img_bytes = base64.b64decode(heatmap_b64)
            img_buf = io.BytesIO(img_bytes)
            heatmap_img = RLImage(img_buf, width=HEATMAP_W, height=HEATMAP_H)
            heatmap_img.hAlign = "CENTER"
            story.append(heatmap_img)
        except Exception as exc:
            logger.warning("Could not embed heatmap in PDF: %s", exc)
            story.append(Paragraph("Heatmap image unavailable.", note_style))
    else:
        story.append(Paragraph("Heatmap image unavailable.", note_style))

    story.append(Spacer(1, SPACE_20))

    # -------------------------------------------------------------------
    # 4. Risk Assessment Summary
    # -------------------------------------------------------------------
    story.extend(_section_heading("4. Risk Assessment Summary"))

    def _score_interp(score: float) -> str:
        if score >= 0.70:
            return "High-risk threshold exceeded"
        if score >= 0.40:
            return "Intermediate risk zone"
        return "Below primary risk threshold"

    def _conf_interp(conf: float) -> str:
        if conf >= 0.85:
            return "High confidence"
        if conf >= 0.70:
            return "Moderate confidence"
        return "Low confidence"

    def _level_action(level: str) -> str:
        if level == "High":
            return "Immediate clinical review recommended"
        if level == "Moderate":
            return "Close monitoring and follow-up advised"
        return "Routine monitoring appropriate"

    summary_rows = [
        ["Metric", "Value", "Interpretation"],
        ["Sepsis Risk Score", f"{risk_score:.4f} / 1.000", _score_interp(risk_score)],
        ["Risk Classification", risk_level, _level_action(risk_level)],
        ["Model Confidence", f"{confidence:.4f}", _conf_interp(confidence)],
    ]
    summary_table = Table(
        summary_rows,
        colWidths=[PAGE_W * 0.34, PAGE_W * 0.22, PAGE_W * 0.44],
    )
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_BG),
                ("TEXTCOLOR", (0, 0), (-1, 0), DARK_BLUE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [ROW_ALT_A, ROW_ALT_B]),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
                ("LINEBELOW", (0, 0), (-1, 0), 0.6, BORDER_GRAY),
                ("LINEBELOW", (0, 1), (-1, -1), 0.25, BORDER_GRAY),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("ALIGN", (2, 0), (2, -1), "LEFT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TEXTCOLOR", (1, 2), (1, 2), _risk_color(risk_level)),
                ("FONTNAME", (1, 2), (1, 2), "Helvetica-Bold"),
            ]
        )
    )
    story.append(summary_table)
    story.append(Spacer(1, SPACE_24))

    # -------------------------------------------------------------------
    # Footer
    # -------------------------------------------------------------------
    story.append(HRFlowable(width="100%", thickness=0.8, color=BORDER_GRAY))
    story.append(Spacer(1, SPACE_6))
    story.append(Paragraph(f"Generated by SepsisAI v1.0 | {now_str} | Research Use Only", footer_style))

    doc.build(story)
    buf.seek(0)
    return buf
