from io import BytesIO
import base64

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
)


# ============================================================
# REPORT CONFIGURATION
# ============================================================

PAGE_WIDTH, PAGE_HEIGHT = A4

VISIONGUARD_BLUE = colors.HexColor("#2563EB")
VISIONGUARD_DARK = colors.HexColor("#0F172A")
VISIONGUARD_TEXT = colors.HexColor("#334155")
VISIONGUARD_MUTED = colors.HexColor("#64748B")
VISIONGUARD_BORDER = colors.HexColor("#E2E8F0")
VISIONGUARD_LIGHT = colors.HexColor("#F8FAFC")

PASS_COLOR = colors.HexColor("#16A34A")
REJECT_COLOR = colors.HexColor("#DC2626")
MINOR_COLOR = colors.HexColor("#F59E0B")
SEVERE_COLOR = colors.HexColor("#DC2626")
NONE_COLOR = colors.HexColor("#16A34A")


# ============================================================
# SAFE VALUE HELPERS
# ============================================================

def safe_number(value, decimals=2):
    try:
        return f"{float(value):.{decimals}f}"
    except (TypeError, ValueError):
        return f"{0:.{decimals}f}"


def safe_integer(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def safe_text(value, default="-"):
    if value is None:
        return default

    text = str(value).strip()

    return text if text else default


# ============================================================
# BASE64 IMAGE DECODER
# ============================================================

def decode_base64_image(image_data):
    if not image_data:
        return None

    try:
        encoded_data = image_data

        if "," in encoded_data:
            encoded_data = encoded_data.split(",", 1)[1]

        image_bytes = base64.b64decode(encoded_data)

        return BytesIO(image_bytes)

    except Exception as error:
        print("PDF image decode error:", error)
        return None


# ============================================================
# IMAGE FLOWABLE
# ============================================================

def build_report_image(image_data, width=75 * mm, height=55 * mm):
    image_buffer = decode_base64_image(image_data)

    if image_buffer is None:
        return None

    try:
        image = Image(image_buffer)

        original_width = image.imageWidth
        original_height = image.imageHeight

        if not original_width or not original_height:
            return None

        scale = min(
            width / original_width,
            height / original_height,
        )

        image.drawWidth = original_width * scale
        image.drawHeight = original_height * scale

        return image

    except Exception as error:
        print("PDF image creation error:", error)
        return None


# ============================================================
# REPORT STYLES
# ============================================================

def create_styles():
    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="VGTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            textColor=VISIONGUARD_DARK,
            alignment=TA_LEFT,
            spaceAfter=4,
        )
    )

    styles.add(
        ParagraphStyle(
            name="VGSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=VISIONGUARD_MUTED,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="VGSection",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=VISIONGUARD_DARK,
            spaceBefore=8,
            spaceAfter=8,
        )
    )

    styles.add(
        ParagraphStyle(
            name="VGBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=VISIONGUARD_TEXT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="VGSmall",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=VISIONGUARD_MUTED,
        )
    )

    styles.add(
        ParagraphStyle(
            name="VGImageLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=VISIONGUARD_DARK,
            alignment=TA_CENTER,
            spaceAfter=5,
        )
    )

    styles.add(
        ParagraphStyle(
            name="VGFooter",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=VISIONGUARD_MUTED,
            alignment=TA_CENTER,
        )
    )

    return styles


# ============================================================
# PAGE HEADER / FOOTER
# ============================================================

def draw_page_decoration(canvas, doc):
    canvas.saveState()

    canvas.setFillColor(VISIONGUARD_BLUE)
    canvas.rect(
        0,
        PAGE_HEIGHT - 5 * mm,
        PAGE_WIDTH,
        5 * mm,
        fill=1,
        stroke=0,
    )

    canvas.setStrokeColor(VISIONGUARD_BORDER)
    canvas.setLineWidth(0.5)

    canvas.line(
        20 * mm,
        14 * mm,
        PAGE_WIDTH - 20 * mm,
        14 * mm,
    )

    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(VISIONGUARD_MUTED)

    canvas.drawString(
        20 * mm,
        9 * mm,
        "VisionGuard AI Industrial Quality Inspection System",
    )

    canvas.drawRightString(
        PAGE_WIDTH - 20 * mm,
        9 * mm,
        f"Page {doc.page}",
    )

    canvas.restoreState()


# ============================================================
# STANDARD DATA TABLE
# ============================================================

def build_information_table(rows, styles):
    formatted_rows = []

    for label, value in rows:
        formatted_rows.append(
            [
                Paragraph(
                    f"<b>{safe_text(label)}</b>",
                    styles["VGBody"],
                ),
                Paragraph(
                    safe_text(value),
                    styles["VGBody"],
                ),
            ]
        )

    table = Table(
        formatted_rows,
        colWidths=[
            55 * mm,
            105 * mm,
        ],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    VISIONGUARD_LIGHT,
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, -1),
                    VISIONGUARD_TEXT,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    VISIONGUARD_BORDER,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    return table


# ============================================================
# RESULT SUMMARY
# ============================================================

def build_result_summary(inspection, styles):
    decision = safe_text(
        inspection.get("decision"),
        "UNKNOWN",
    ).upper()

    severity = safe_text(
        inspection.get("severity"),
        "NONE",
    ).upper()

    if decision == "PASS":
        decision_color = PASS_COLOR
    else:
        decision_color = REJECT_COLOR

    if severity == "SEVERE":
        severity_color = SEVERE_COLOR
    elif severity == "MINOR":
        severity_color = MINOR_COLOR
    else:
        severity_color = NONE_COLOR

    decision_box = Table(
        [
            [
                Paragraph(
                    "FINAL DECISION",
                    styles["VGSmall"],
                )
            ],
            [
                Paragraph(
                    f"<b>{decision}</b>",
                    ParagraphStyle(
                        name="DecisionValue",
                        parent=styles["VGBody"],
                        fontName="Helvetica-Bold",
                        fontSize=18,
                        leading=22,
                        textColor=decision_color,
                        alignment=TA_CENTER,
                    ),
                )
            ],
        ],
        colWidths=[76 * mm],
    )

    severity_box = Table(
        [
            [
                Paragraph(
                    "DEFECT SEVERITY",
                    styles["VGSmall"],
                )
            ],
            [
                Paragraph(
                    f"<b>{severity}</b>",
                    ParagraphStyle(
                        name="SeverityValue",
                        parent=styles["VGBody"],
                        fontName="Helvetica-Bold",
                        fontSize=18,
                        leading=22,
                        textColor=severity_color,
                        alignment=TA_CENTER,
                    ),
                )
            ],
        ],
        colWidths=[76 * mm],
    )

    for box in [decision_box, severity_box]:
        box.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        VISIONGUARD_LIGHT,
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.75,
                        VISIONGUARD_BORDER,
                    ),
                    (
                        "ALIGN",
                        (0, 0),
                        (-1, -1),
                        "CENTER",
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                ]
            )
        )

    summary = Table(
        [[decision_box, severity_box]],
        colWidths=[
            80 * mm,
            80 * mm,
        ],
    )

    summary.setStyle(
        TableStyle(
            [
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    0,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
            ]
        )
    )

    return summary


# ============================================================
# INSPECTION IMAGE SECTION
# ============================================================

def build_image_section(inspection, styles):
    image_definitions = [
        (
            "Original Product Image",
            inspection.get("original_image"),
        ),
        (
            "AI Defect Segmentation",
            inspection.get("result_image"),
        ),
        (
            "Inspection ROI",
            inspection.get("roi_image"),
        ),
    ]

    elements = []

    for title, image_data in image_definitions:
        report_image = build_report_image(
            image_data,
            width=145 * mm,
            height=85 * mm,
        )

        if report_image is None:
            continue

        image_container = Table(
            [
                [
                    Paragraph(
                        title,
                        styles["VGImageLabel"],
                    )
                ],
                [report_image],
            ],
            colWidths=[160 * mm],
        )

        image_container.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.white,
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.6,
                        VISIONGUARD_BORDER,
                    ),
                    (
                        "ALIGN",
                        (0, 0),
                        (-1, -1),
                        "CENTER",
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                ]
            )
        )

        elements.append(
            KeepTogether(
                [
                    image_container,
                    Spacer(1, 5 * mm),
                ]
            )
        )

    return elements


# ============================================================
# GENERATE PDF REPORT
# ============================================================

def generate_inspection_report(inspection: dict):
    pdf_buffer = BytesIO()

    styles = create_styles()

    document = SimpleDocTemplate(
        pdf_buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title=(
            f"VisionGuard Inspection Report - "
            f"{safe_text(inspection.get('inspection_code'))}"
        ),
        author="VisionGuard",
        subject="AI Industrial Quality Inspection Report",
    )

    story = []

    # ========================================================
    # REPORT HEADER
    # ========================================================

    story.append(
        Paragraph(
            "VisionGuard",
            styles["VGTitle"],
        )
    )

    story.append(
        Paragraph(
            "AI Industrial Quality Inspection Report",
            styles["VGSubtitle"],
        )
    )

    story.append(
        Spacer(
            1,
            7 * mm,
        )
    )

    # ========================================================
    # REPORT IDENTITY
    # ========================================================

    identity_data = [
        (
            "Inspection ID",
            safe_text(
                inspection.get(
                    "inspection_code"
                )
            ),
        ),
        (
            "Inspection Date",
            safe_text(
                inspection.get(
                    "created_at"
                )
            ),
        ),
        (
            "Selected Product",
            safe_text(
                inspection.get(
                    "product_category"
                )
            ),
        ),
        (
            "AI Predicted Product",
            safe_text(
                inspection.get(
                    "predicted_product"
                )
            ),
        ),
        (
            "Product Classification Confidence",
            (
                f"{safe_number(inspection.get('product_confidence'))}%"
            ),
        ),
    ]

    story.append(
        Paragraph(
            "Inspection Information",
            styles["VGSection"],
        )
    )

    story.append(
        build_information_table(
            identity_data,
            styles,
        )
    )

    story.append(
        Spacer(
            1,
            6 * mm,
        )
    )

    # ========================================================
    # FINAL RESULT
    # ========================================================

    story.append(
        Paragraph(
            "Inspection Result",
            styles["VGSection"],
        )
    )

    story.append(
        build_result_summary(
            inspection,
            styles,
        )
    )

    story.append(
        Spacer(
            1,
            6 * mm,
        )
    )

    # ========================================================
    # DEFECT ANALYSIS
    # ========================================================

    defect_detected = bool(
        inspection.get(
            "defect_detected",
            0,
        )
    )

    defect_data = [
        (
            "Defect Detected",
            "Yes"
            if defect_detected
            else "No",
        ),
        (
            "Detected Defect Regions",
            safe_integer(
                inspection.get(
                    "defect_regions"
                )
            ),
        ),
        (
            "Affected Product Area",
            (
                f"{safe_number(inspection.get('affected_area'), 3)}%"
            ),
        ),
        (
            "Inspection ROI Area",
            (
                f"{safe_number(inspection.get('inspection_area'), 3)}%"
            ),
        ),
        (
            "Defect Pixels",
            f"{safe_integer(inspection.get('defect_pixels')):,}",
        ),
        (
            "Inspection Pixels",
            f"{safe_integer(inspection.get('inspection_pixels')):,}",
        ),
        (
            "Maximum Defect Confidence",
            (
                f"{safe_number(inspection.get('max_confidence'))}%"
            ),
        ),
        (
            "Average Defect Confidence",
            (
                f"{safe_number(inspection.get('average_confidence'))}%"
            ),
        ),
    ]

    story.append(
        Paragraph(
            "Defect Analysis",
            styles["VGSection"],
        )
    )

    story.append(
        build_information_table(
            defect_data,
            styles,
        )
    )

    story.append(
        Spacer(
            1,
            6 * mm,
        )
    )

    # ========================================================
    # IMAGE INFORMATION
    # ========================================================

    image_information = [
        (
            "Image Width",
            f"{safe_integer(inspection.get('image_width'))} px",
        ),
        (
            "Image Height",
            f"{safe_integer(inspection.get('image_height'))} px",
        ),
    ]

    story.append(
        Paragraph(
            "Image Information",
            styles["VGSection"],
        )
    )

    story.append(
        build_information_table(
            image_information,
            styles,
        )
    )

    story.append(
        Spacer(
            1,
            6 * mm,
        )
    )

    # ========================================================
    # AI SYSTEM INFORMATION
    # ========================================================

    model_information = [
        (
            "Inspection System",
            "VisionGuard",
        ),
        (
            "Defect Segmentation Model",
            "VisionGuard V4 - YOLOv8s-seg",
        ),
        (
            "Product Classification Model",
            "YOLO11s-cls",
        ),
        (
            "Defect Confidence Threshold",
            "0.090",
        ),
        (
            "Severity Threshold",
            "5.0% affected area",
        ),
    ]

    story.append(
        Paragraph(
            "AI System Information",
            styles["VGSection"],
        )
    )

    story.append(
        build_information_table(
            model_information,
            styles,
        )
    )

    story.append(
        Spacer(
            1,
            7 * mm,
        )
    )

    # ========================================================
    # VISUAL EVIDENCE
    # ========================================================

    image_elements = build_image_section(
        inspection,
        styles,
    )

    if image_elements:
        story.append(
            Paragraph(
                "Visual Inspection Evidence",
                styles["VGSection"],
            )
        )

        story.extend(
            image_elements
        )

    # ========================================================
    # DISCLAIMER
    # ========================================================

    story.append(
        Spacer(
            1,
            3 * mm,
        )
    )

    disclaimer = (
        "This report was automatically generated by the VisionGuard "
        "AI Industrial Quality Inspection System. The reported severity "
        "threshold is a configurable project threshold and should not be "
        "interpreted as a universal industrial standard."
    )

    story.append(
        Table(
            [
                [
                    Paragraph(
                        disclaimer,
                        styles["VGSmall"],
                    )
                ]
            ],
            colWidths=[
                160 * mm
            ],
            style=TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        VISIONGUARD_LIGHT,
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        VISIONGUARD_BORDER,
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        9,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        9,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                ]
            ),
        )
    )

    # ========================================================
    # BUILD DOCUMENT
    # ========================================================

    document.build(
        story,
        onFirstPage=draw_page_decoration,
        onLaterPages=draw_page_decoration,
    )

    pdf_buffer.seek(0)

    return pdf_buffer