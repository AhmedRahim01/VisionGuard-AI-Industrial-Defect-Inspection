from pathlib import Path
import cv2
import numpy as np
from ultralytics import YOLO


# ============================================================
# VisionGuard Product Classifier Configuration
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR
    / "model"
    / "VisionGuard_ProductClassifier_best.pt"
)

IMAGE_SIZE = 224


# ============================================================
# Product Name Mapping
# ============================================================

DISPLAY_NAMES = {
    "bottle": "Bottle",
    "cable": "Cable",
    "capsule": "Capsule",
    "carpet": "Carpet",
    "grid": "Grid",
    "hazelnut": "Hazelnut",
    "leather": "Leather",
    "metal_nut": "Metal Nut",
    "pill": "Pill",
    "screw": "Screw",
    "tile": "Tile",
    "toothbrush": "Toothbrush",
    "transistor": "Transistor",
    "wood": "Wood",
    "zipper": "Zipper",
}


# ============================================================
# Load Product Classification Model Once
# ============================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"VisionGuard Product Classifier was not found at:\n"
        f"{MODEL_PATH}"
    )


print("=" * 60)
print("VISIONGUARD PRODUCT CLASSIFIER")
print("=" * 60)
print(f"Loading model: {MODEL_PATH}")


product_model = YOLO(str(MODEL_PATH))


print("Product classifier loaded successfully.")
print(f"Classes: {product_model.names}")
print("=" * 60)


# ============================================================
# Helpers
# ============================================================

def normalize_category_name(category: str) -> str:
    """
    Convert display category names to the classifier format.

    Example:
        Metal Nut -> metal_nut
        Bottle    -> bottle
    """

    return (
        category
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
    )


def get_display_name(category: str) -> str:
    """
    Convert internal classifier category to display name.
    """

    normalized = normalize_category_name(category)

    return DISPLAY_NAMES.get(
        normalized,
        normalized.replace("_", " ").title()
    )


# ============================================================
# Product Classification
# ============================================================

def classify_product(image_bytes: bytes) -> dict:
    """
    Predict which of the 15 MVTec product categories
    appears in the uploaded image.
    """

    # --------------------------------------------------------
    # Decode image
    # --------------------------------------------------------

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise ValueError(
            "The uploaded file could not be decoded as an image."
        )

    # --------------------------------------------------------
    # Run Product Classifier
    # --------------------------------------------------------

    results = product_model.predict(
        source=image,
        imgsz=IMAGE_SIZE,
        device="cpu",
        verbose=False,
    )

    result = results[0]

    if result.probs is None:
        raise RuntimeError(
            "Product classifier returned no probabilities."
        )

    # --------------------------------------------------------
    # Top-1 prediction
    # --------------------------------------------------------

    predicted_index = int(result.probs.top1)

    predicted_internal = str(
        product_model.names[predicted_index]
    )

    predicted_display = get_display_name(
        predicted_internal
    )

    confidence = float(
        result.probs.top1conf
        .detach()
        .cpu()
        .item()
    )

    # --------------------------------------------------------
    # Top-3 predictions
    # --------------------------------------------------------

    top3 = []

    top_indices = result.probs.top5[:3]

    probabilities = (
        result.probs.data
        .detach()
        .cpu()
        .numpy()
    )

    for index in top_indices:

        index = int(index)

        internal_name = str(
            product_model.names[index]
        )

        top3.append(
            {
                "product": get_display_name(
                    internal_name
                ),
                "internal_name": internal_name,
                "confidence": round(
                    float(probabilities[index]) * 100,
                    2
                ),
            }
        )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "predicted_product": predicted_display,

        "predicted_product_internal": (
            predicted_internal
        ),

        "product_confidence": round(
            confidence * 100,
            2
        ),

        "top3_products": top3,
    }


# ============================================================
# Product Validation
# ============================================================

def validate_product(
    image_bytes: bytes,
    selected_category: str,
) -> dict:
    """
    Compare the product selected by the user
    with the product predicted by the AI classifier.
    """

    classification = classify_product(
        image_bytes=image_bytes
    )

    selected_internal = normalize_category_name(
        selected_category
    )

    predicted_internal = normalize_category_name(
        classification[
            "predicted_product_internal"
        ]
    )

    product_match = (
        selected_internal == predicted_internal
    )

    return {
        "selected_product": selected_category,

        "selected_product_internal": (
            selected_internal
        ),

        **classification,

        "product_match": product_match,
    }