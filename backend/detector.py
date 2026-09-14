from pathlib import Path
import base64

import cv2
import numpy as np
from ultralytics import YOLO

from inspection_logic import (
    calculate_inspection_area,
    determine_quality_decision,
)


# ============================================================
# VisionGuard V4 Configuration
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "model" / "VisionGuard_V4_best.pt"

CONFIDENCE_THRESHOLD = 0.090
SEVERITY_THRESHOLD = 5.0
IMAGE_SIZE = 640
IOU_THRESHOLD = 0.70


# ============================================================
# Load Model Once
# ============================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"VisionGuard model was not found at:\n{MODEL_PATH}"
    )

print("=" * 60)
print("VISIONGUARD AI ENGINE")
print("=" * 60)
print(f"Loading model: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))

print("VisionGuard V4 loaded successfully.")
print(f"Classes: {model.names}")
print(f"Confidence threshold: {CONFIDENCE_THRESHOLD}")
print(f"Severity threshold: {SEVERITY_THRESHOLD}%")
print("=" * 60)


# ============================================================
# Image Helper
# ============================================================

def image_to_base64(image: np.ndarray) -> str:
    """
    Convert an OpenCV BGR image into a base64 JPEG string.
    """

    success, buffer = cv2.imencode(
        ".jpg",
        image,
    )

    if not success:
        raise RuntimeError(
            "Failed to encode image."
        )

    return base64.b64encode(
        buffer
    ).decode("utf-8")


# ============================================================
# Raw Defect Mask Area
# ============================================================

def calculate_raw_mask_area(result) -> int:
    """
    Calculate the union area of all predicted segmentation
    masks without applying the product-specific ROI.

    This value is retained for diagnostics only.
    """

    if result.masks is None:
        return 0

    masks = (
        result.masks.data
        .detach()
        .cpu()
        .numpy()
    )

    if len(masks) == 0:
        return 0

    union_mask = np.any(
        masks > 0.5,
        axis=0,
    )

    return int(
        union_mask.sum()
    )


# ============================================================
# ROI Visualization
# ============================================================

def create_roi_visualization(
    image: np.ndarray,
    roi_mask: np.ndarray,
    defect_inside_roi: np.ndarray,
) -> np.ndarray:
    """
    Create a diagnostic visualization showing:

    Green transparent area = inspection ROI
    Red area               = detected defect inside ROI

    This image can later be exposed in the frontend if needed.
    """

    visualization = image.copy()

    roi_mask = (
        roi_mask > 0
    ).astype(np.uint8)

    defect_inside_roi = (
        defect_inside_roi > 0
    ).astype(np.uint8)

    # --------------------------------------------------------
    # Green ROI overlay
    # --------------------------------------------------------

    roi_overlay = visualization.copy()

    roi_overlay[
        roi_mask > 0
    ] = (
        80,
        180,
        80,
    )

    visualization = cv2.addWeighted(
        visualization,
        0.82,
        roi_overlay,
        0.18,
        0,
    )

    # --------------------------------------------------------
    # Red defect overlay
    # --------------------------------------------------------

    defect_overlay = visualization.copy()

    defect_overlay[
        defect_inside_roi > 0
    ] = (
        30,
        30,
        230,
    )

    visualization = cv2.addWeighted(
        visualization,
        0.65,
        defect_overlay,
        0.35,
        0,
    )

    return visualization


# ============================================================
# Main VisionGuard Prediction Function
# ============================================================

def inspect_image(
    image_bytes: bytes,
    category: str,
) -> dict:
    """
    Run the complete VisionGuard V4 defect inspection pipeline.

    Pipeline:

        Uploaded Image
              ↓
        VisionGuard V4
              ↓
        Defect Segmentation
              ↓
        Product-Specific Inspection ROI
              ↓
        Defect ∩ ROI
              ↓
        Affected Area
              ↓
        Severity
              ↓
        PASS / REJECT

    Product classification validation is handled before this
    function is called by the API layer.
    """

    # ========================================================
    # 1. Decode Uploaded Image
    # ========================================================

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8,
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR,
    )

    if image is None:
        raise ValueError(
            "The uploaded file could not be decoded as an image."
        )

    height, width = image.shape[:2]

    total_image_pixels = (
        height * width
    )

    # ========================================================
    # 2. Run VisionGuard V4 Segmentation
    # ========================================================

    results = model.predict(
        source=image,
        imgsz=IMAGE_SIZE,
        conf=CONFIDENCE_THRESHOLD,
        iou=IOU_THRESHOLD,
        device="cpu",
        retina_masks=True,
        verbose=False,
    )

    if not results:
        raise RuntimeError(
            "VisionGuard returned no inference result."
        )

    result = results[0]

    # ========================================================
    # 3. Detection Information
    # ========================================================

    if result.boxes is not None:
        defect_regions = len(
            result.boxes
        )
    else:
        defect_regions = 0

    defect_detected = (
        defect_regions > 0
    )

    # ========================================================
    # 4. Detection Confidence
    # ========================================================

    confidences = []

    if (
        defect_detected
        and result.boxes is not None
        and result.boxes.conf is not None
    ):
        confidences = (
            result.boxes.conf
            .detach()
            .cpu()
            .numpy()
            .tolist()
        )

    max_confidence = (
        max(confidences)
        if confidences
        else 0.0
    )

    average_confidence = (
        float(
            np.mean(confidences)
        )
        if confidences
        else 0.0
    )

    # ========================================================
    # 5. Raw Defect Area
    #
    # Diagnostic value only.
    # This is NOT the final affected-area calculation.
    # ========================================================

    raw_defect_pixels = (
        calculate_raw_mask_area(
            result
        )
    )

    raw_affected_area = (
        (
            raw_defect_pixels
            / total_image_pixels
        )
        * 100
        if total_image_pixels > 0
        else 0.0
    )

    # ========================================================
    # 6. Product-Specific Inspection ROI
    # ========================================================

    inspection = (
        calculate_inspection_area(
            image=image,
            result=result,
            category=category,
        )
    )

    inspection_pixels = (
        inspection[
            "inspection_pixels"
        ]
    )

    defect_pixels = (
        inspection[
            "defect_pixels"
        ]
    )

    inspection_area_percentage = (
        inspection[
            "inspection_area_percentage"
        ]
    )

    affected_area = (
        inspection[
            "affected_area_percentage"
        ]
    )

    roi_mask = (
        inspection[
            "roi_mask"
        ]
    )

    defect_inside_roi = (
        inspection[
            "defect_inside_roi"
        ]
    )

    # ========================================================
    # 7. Final Severity + Decision
    # ========================================================

    quality = (
        determine_quality_decision(
            defect_detected=defect_detected,
            affected_area=affected_area,
            severity_threshold=SEVERITY_THRESHOLD,
        )
    )

    severity = quality[
        "severity"
    ]

    decision = quality[
        "decision"
    ]

    # ========================================================
    # 8. Standard YOLO Visualization
    # ========================================================

    plotted_image = (
        result.plot()
    )

    # ========================================================
    # 9. ROI Diagnostic Visualization
    # ========================================================

    roi_visualization = (
        create_roi_visualization(
            image=image,
            roi_mask=roi_mask,
            defect_inside_roi=defect_inside_roi,
        )
    )

    # ========================================================
    # 10. Convert Images to Base64
    # ========================================================

    original_image_base64 = (
        image_to_base64(
            image
        )
    )

    result_image_base64 = (
        image_to_base64(
            plotted_image
        )
    )

    roi_image_base64 = (
        image_to_base64(
            roi_visualization
        )
    )

    # ========================================================
    # 11. API Response
    # ========================================================

    return {
        # ----------------------------------------------------
        # General
        # ----------------------------------------------------

        "success": True,

        "inspection_status": (
            "COMPLETED"
        ),

        "product_category": (
            category
        ),

        # ----------------------------------------------------
        # Model
        # ----------------------------------------------------

        "model": (
            "VisionGuard V4"
        ),

        "architecture": (
            "YOLOv8s-seg"
        ),

        "threshold": (
            CONFIDENCE_THRESHOLD
        ),

        "severity_threshold": (
            SEVERITY_THRESHOLD
        ),

        # ----------------------------------------------------
        # Image
        # ----------------------------------------------------

        "image_width": (
            width
        ),

        "image_height": (
            height
        ),

        "total_image_pixels": (
            total_image_pixels
        ),

        # ----------------------------------------------------
        # Defect Detection
        # ----------------------------------------------------

        "defect_detected": (
            defect_detected
        ),

        "defect_regions": (
            defect_regions
        ),

        "max_confidence": round(
            max_confidence * 100,
            2,
        ),

        "average_confidence": round(
            average_confidence * 100,
            2,
        ),

        # ----------------------------------------------------
        # Raw Area
        #
        # Diagnostic only.
        # ----------------------------------------------------

        "raw_defect_pixels": (
            raw_defect_pixels
        ),

        "raw_affected_area": round(
            raw_affected_area,
            3,
        ),

        # ----------------------------------------------------
        # Product-Specific ROI
        # ----------------------------------------------------

        "inspection_pixels": (
            inspection_pixels
        ),

        "inspection_area_percentage": (
            inspection_area_percentage
        ),

        "defect_pixels": (
            defect_pixels
        ),

        "affected_area": (
            affected_area
        ),

        # Backward / descriptive alias
        "affected_area_percentage": (
            affected_area
        ),

        # ----------------------------------------------------
        # Quality
        # ----------------------------------------------------

        "severity": (
            severity
        ),

        "decision": (
            decision
        ),

        # ----------------------------------------------------
        # Images
        # ----------------------------------------------------

        "original_image": (
            original_image_base64
        ),

        "result_image": (
            result_image_base64
        ),

        "roi_image": (
            roi_image_base64
        ),
    }