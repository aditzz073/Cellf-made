"""
utils/pdf_generator.py
----------------------
Clinical-grade PDF report generator using ReportLab.

Layout sections:
  1. Header / branding + metadata table
  2. Research-use disclaimer banner
  3. Gene Expression Profile table
  4. Feature Importances table
  5. Heatmap image
  6. Risk Assessment Summary
  7. Footer
"""

import io
import base64
import logging
from datetime import datetime, timezone
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
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
# Colour palette
# ---------------------------------------------------------------------------
DARK_BLUE   = colors.HexColor("#1a3a5c")
TEAL        = colors.HexColor("#0e7c7b")
LIGHT_TEAL  = colors.HexColor("#d4f1f0")
LIGHT_GRAY  = colors.HexColor("#f0f4f8")
MID_GRAY    = colors.HexColor("#64748b")
RISK_RED    = colors.HexColor("#c1121f")
RISK_AMBER  = colors.HexColor("#d97706")
RISK_GREEN  = colors.HexColor("#2d6a4f")
WHITE       = colors.white
PURPLE_LIGHT = colors.HexColor("#f5f3ff")
PURPLE      = colors.HexColor("#6d28d9")

PAGE_W = A4[0] - 4.4 * cm   # usable width given 2.2 cm margins each side


def _risk_color(risk_level: str) -> colors.Color:
    return {"High": RISK_RED, "Moderate": RISK_AMBER, "Low": RISK_GREEN}.get(
        risk_level, MID_GRAY
    )


def _section_header(title: str) -> Table:
    """Renders a full-width dark-blue section header band."""
    style = ParagraphStyle(
        "SH",
        fontSize=10,
        textColor=WHITE,
        fontName="Helvetica-Bold",
        leading=14,
    )
    t = Table([[Paragraph(title, style)]], colWidths=[PAGE_W])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), DARK_BLUE),
                ("TOPPADDING",    (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING",   (0, 0), (-1, -1), 10),
            ]
        )
    )
    return t


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
        topMargin=2.0 * cm,
        bottomMargin=2.0 * cm,
        leftMargin=2.2 * cm,
        rightMargin=2.2 * cm,
    )

    base_styles = getSampleStyleSheet()
    body_style = ParagraphStyle(
        "BodyText",
        parent=base_styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#1a202c"),
        fontName="Helvetica",
        leading=13,
        spaceAfter=4,
    )

    story = []

    # ── 1. Branding header ────────────────────────────────────────────────
    story.append(
        Paragraph(
            "SepsisAI Clinical Report",
            ParagraphStyle(
                "Title",
                fontSize=20,
                textColor=DARK_BLUE,
                fontName="Helvetica-Bold",
                spaceAfter=3,
            ),
        )
    )
    story.append(
        Paragraph(
            "Sepsis Risk Assessment from Gene Expression Data",
            ParagraphStyle(
                "SubTitle",
                fontSize=11,
                textColor=TEAL,
                fontName="Helvetica",
                spaceAfter=4,
            ),
        )
    )
    story.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceAfter=10))

    # ── 2. Metadata table ─────────────────────────────────────────────────
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d  %H:%M UTC")
    risk_score  = prediction.get("risk_score", 0.0)
    risk_level  = prediction.get("risk_level", "Unknown")
    confidence  = prediction.get("confidence", 0.0)
    model_type  = prediction.get("model_type", "placeholder")
    model_label = "SepsisAI v1.0 (placeholder)" if model_type == "placeholder" else "SepsisAI v1.0"

    meta_rows = [
        ["Patient / Sample ID:", patient_id,           "Report Generated:", now_str],
        ["Risk Level:",          risk_level,            "Model:",            model_label],
        ["Risk Score:",          f"{risk_score:.4f}",   "Confidence:",       f"{confidence:.4f}"],
    ]
    col_w = [4.5 * cm, 5.5 * cm, 4.5 * cm, 5.0 * cm]
    meta_table = Table(meta_rows, colWidths=col_w)
    meta_ts = TableStyle(
        [
            ("FONTNAME",      (0, 0), (-1, -1), "Helvetica"),
            ("FONTNAME",      (0, 0), (0, -1),  "Helvetica-Bold"),
            ("FONTNAME",      (2, 0), (2, -1),  "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, -1), 9),
            ("TEXTCOLOR",     (0, 0), (-1, -1), colors.HexColor("#1a202c")),
            # Highlight risk level value
            ("TEXTCOLOR",     (1, 1), (1, 1),   _risk_color(risk_level)),
            ("FONTNAME",      (1, 1), (1, 1),   "Helvetica-Bold"),
            ("FONTSIZE",      (1, 1), (1, 1),   10),
            ("ROWBACKGROUNDS",(0, 0), (-1, -1), [LIGHT_GRAY, WHITE, LIGHT_GRAY]),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
            ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
        ]
    )
    meta_table.setStyle(meta_ts)
    story.append(meta_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Disclaimer banner ─────────────────────────────────────────────────
    story.append(
        Paragraph(
            "⚠  RESEARCH USE ONLY — This report is generated by an AI system "
            "intended for research and investigational purposes only.  It must "
            "NOT be used as the sole basis for clinical decisions.  Always "
            "consult a qualified healthcare professional.",
            ParagraphStyle(
                "Disclaimer",
                parent=base_styles["Normal"],
                fontSize=8,
                textColor=PURPLE,
                fontName="Helvetica-Oblique",
                borderColor=PURPLE,
                borderWidth=0.5,
                borderPad=6,
                backColor=PURPLE_LIGHT,
                leading=12,
            ),
        )
    )
    story.append(Spacer(1, 0.6 * cm))

    # ── 3. Top feature expression profile table ──────────────────────────
    story.append(_section_header("1.  Top Feature Expression Profile"))
    story.append(Spacer(1, 0.3 * cm))

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
        gene_rows = [
            [
                feature,
                f"{expr:.3f}",
                "0.000",
                f"{expr:+.3f}",
            ]
            for feature, expr in fallback_features
        ]

    gene_header = [["Feature", "Patient", "Baseline", "Delta vs Baseline"]]
    gene_table = Table(
        gene_header + gene_rows,
        colWidths=[5 * cm, 5 * cm, 5 * cm, 4.5 * cm],
    )
    row_bgs = [LIGHT_TEAL] + [LIGHT_GRAY if i % 2 == 0 else WHITE for i in range(len(gene_rows))]
    gene_table.setStyle(
        TableStyle(
            [
                ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
                ("FONTSIZE",      (0, 0), (-1, -1), 9),
                ("TEXTCOLOR",     (0, 0), (-1, 0),  DARK_BLUE),
                ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
                ("ROWBACKGROUNDS",(0, 0), (-1, -1), row_bgs),
                ("ALIGN",         (1, 0), (-1, -1), "CENTER"),
                ("ALIGN",         (0, 0), (0, -1),  "LEFT"),
                ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING",    (0, 0), (-1, -1), 5),
                ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(gene_table)
    story.append(Spacer(1, 0.6 * cm))

    # ── 4. Feature importances table ─────────────────────────────────────
    story.append(_section_header("2.  Top Influencing Features"))
    story.append(Spacer(1, 0.3 * cm))
    story.append(
        Paragraph(
            "Features ranked by absolute impact on the risk prediction. "
            "Positive scores indicate patterns associated with higher predicted "
            "sepsis risk; negative scores indicate lower-risk directionality.",
            body_style,
        )
    )
    story.append(Spacer(1, 0.2 * cm))

    def _direction_label(impact: float) -> str:
        if impact > 0.15:  return "Strong ↑ risk"
        if impact > 0.05:  return "Moderate ↑ risk"
        if impact > 0.0:   return "Mild ↑ risk"
        if impact > -0.10: return "Mild ↓ protective"
        return "Strong ↓ protective"

    fi_header = [["Rank", "Feature", "Impact", "Direction"]]
    fi_rows = [
        [
            str(i),
            item["gene"],
            f"{item['impact']:+.4f}",
            _direction_label(item["impact"]),
        ]
        for i, item in enumerate(feature_importances[:8], 1)
    ]
    fi_table = Table(
        fi_header + fi_rows,
        colWidths=[1.5 * cm, 3.0 * cm, 3.5 * cm, PAGE_W - 8.0 * cm],
    )
    fi_bgs = [LIGHT_TEAL] + [LIGHT_GRAY if i % 2 == 0 else WHITE for i in range(len(fi_rows))]
    fi_table.setStyle(
        TableStyle(
            [
                ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
                ("FONTSIZE",      (0, 0), (-1, -1), 9),
                ("TEXTCOLOR",     (0, 0), (-1, 0),  DARK_BLUE),
                ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
                ("ROWBACKGROUNDS",(0, 0), (-1, -1), fi_bgs),
                ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
                ("ALIGN",         (0, 0), (2, -1),  "CENTER"),
                ("ALIGN",         (3, 0), (3, -1),  "LEFT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING",    (0, 0), (-1, -1), 5),
                ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(fi_table)
    story.append(Spacer(1, 0.6 * cm))

    # ── 5. Heatmap ────────────────────────────────────────────────────────
    if heatmap_b64:
        story.append(_section_header("3.  Gene Expression Heatmap"))
        story.append(Spacer(1, 0.3 * cm))
        story.append(
            Paragraph(
                "Side-by-side comparison of patient gene expression against the "
                "healthy reference baseline.  Warm colours (red) indicate elevated "
                "expression; cool colours (blue) indicate suppression.",
                body_style,
            )
        )
        story.append(Spacer(1, 0.2 * cm))
        try:
            img_bytes = base64.b64decode(heatmap_b64)
            img_buf = io.BytesIO(img_bytes)
            story.append(RLImage(img_buf, width=PAGE_W, height=5.2 * cm))
        except Exception as exc:
            logger.warning("Could not embed heatmap in PDF: %s", exc)
            story.append(Paragraph("[Heatmap image unavailable]", body_style))
        story.append(Spacer(1, 0.6 * cm))

    # ── 6. Risk assessment summary ────────────────────────────────────────
    story.append(_section_header("4.  Risk Assessment Summary"))
    story.append(Spacer(1, 0.3 * cm))

    def _score_interp(score: float) -> str:
        if score >= 0.70: return "≥ 0.70 → High risk threshold exceeded"
        if score >= 0.40: return "0.40 – 0.69 → Intermediate risk zone"
        return "< 0.40 → Below risk threshold"

    def _conf_interp(conf: float) -> str:
        if conf >= 0.85: return "High confidence in prediction"
        if conf >= 0.70: return "Moderate confidence — consider repeat sampling"
        return "Low confidence — clinical correlation strongly advised"

    def _level_action(level: str) -> str:
        if level == "High":     return "Immediate clinical review recommended"
        if level == "Moderate": return "Close monitoring and follow-up advised"
        return "Routine monitoring appropriate"

    summary_rows = [
        ["Metric",              "Value",                         "Interpretation"],
        ["Sepsis Risk Score",   f"{risk_score:.4f} / 1.000",     _score_interp(risk_score)],
        ["Risk Classification", risk_level,                       _level_action(risk_level)],
        ["Model Confidence",    f"{confidence:.4f}",              _conf_interp(confidence)],
    ]
    sum_table = Table(
        summary_rows,
        colWidths=[5.0 * cm, 4.5 * cm, PAGE_W - 9.5 * cm],
    )
    sum_table.setStyle(
        TableStyle(
            [
                ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
                ("FONTSIZE",      (0, 0), (-1, -1), 9),
                ("TEXTCOLOR",     (0, 0), (-1, 0),  DARK_BLUE),
                ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
                # Colour-code the risk level cell
                ("TEXTCOLOR",     (1, 2), (1, 2),   _risk_color(risk_level)),
                ("FONTNAME",      (1, 2), (1, 2),   "Helvetica-Bold"),
                ("FONTSIZE",      (1, 2), (1, 2),   10),
                ("ROWBACKGROUNDS",(0, 0), (-1, -1), [LIGHT_TEAL, LIGHT_GRAY, WHITE, LIGHT_GRAY]),
                ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING",    (0, 0), (-1, -1), 6),
                ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(sum_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Footer ────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=MID_GRAY, spaceAfter=6))
    story.append(
        Paragraph(
            f"Generated by SepsisAI v1.0  ·  {now_str}  ·  Research Use Only  ·  "
            "Not validated for clinical diagnostic use",
            ParagraphStyle(
                "Footer",
                parent=base_styles["Normal"],
                fontSize=7,
                textColor=MID_GRAY,
                fontName="Helvetica-Oblique",
                alignment=TA_CENTER,
            ),
        )
    )

    doc.build(story)
    buf.seek(0)
    return buf
