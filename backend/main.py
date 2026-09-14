from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from detector import (
    inspect_image,
    CONFIDENCE_THRESHOLD,
    SEVERITY_THRESHOLD,
)

from product_classifier import validate_product


# ============================================================
# VisionGuard API
# ============================================================

app = FastAPI(
    title="VisionGuard API",
    description="AI-powered industrial quality inspection API",
    version="2.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Supported Categories
# ============================================================

SUPPORTED_CATEGORIES = [
    "Bottle",
    "Cable",
    "Capsule",
    "Carpet",
    "Grid",
    "Hazelnut",
    "Leather",
    "Metal Nut",
    "Pill",
    "Screw",
    "Tile",
    "Toothbrush",
    "Transistor",
    "Wood",
    "Zipper",
]


# ============================================================
# Health Check
# ============================================================

@app.get("/")
def root():
    return {
        "service": "VisionGuard API",
        "status": "online",

        "defect_model": "VisionGuard V4",
        "defect_architecture": "YOLOv8s-seg",

        "product_classifier": "VisionGuard Product Classifier",
        "product_classifier_architecture": "YOLO11s-cls",

        "threshold": CONFIDENCE_THRESHOLD,
        "severity_threshold": SEVERITY_THRESHOLD,

        "supported_products": len(SUPPORTED_CATEGORIES),

        "product_verification": True,
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "ai_engine": "ready",

        "defect_model": "VisionGuard V4",
        "product_classifier": "ready",

        "product_verification": "enabled",
    }


# ============================================================
# Inspection Endpoint
# ============================================================

@app.post("/api/inspect")
async def inspect_product(
    image: UploadFile = File(...),
    category: str = Form(...),
):

    try:

        # ----------------------------------------------------
        # Validate category
        # ----------------------------------------------------

        if category not in SUPPORTED_CATEGORIES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported product category: {category}",
            )

        # ----------------------------------------------------
        # Validate image MIME type
        # ----------------------------------------------------

        allowed_types = [
            "image/jpeg",
            "image/jpg",
            "image/png",
        ]

        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Only JPG, JPEG and PNG images are supported.",
            )

        # ----------------------------------------------------
        # Read image
        # ----------------------------------------------------

        image_bytes = await image.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty.",
            )

        # ====================================================
        # STAGE 1 — PRODUCT VERIFICATION
        # ====================================================

        product_validation = validate_product(
            image_bytes=image_bytes,
            selected_category=category,
        )

        # ----------------------------------------------------
        # Product mismatch
        # ----------------------------------------------------

        if not product_validation["product_match"]:

            return {
                "success": False,

                "inspection_status": "PRODUCT_MISMATCH",

                "message": (
                    "The uploaded image does not match "
                    "the selected product category."
                ),

                "selected_product": (
                    product_validation["selected_product"]
                ),

                "selected_product_internal": (
                    product_validation[
                        "selected_product_internal"
                    ]
                ),

                "predicted_product": (
                    product_validation["predicted_product"]
                ),

                "predicted_product_internal": (
                    product_validation[
                        "predicted_product_internal"
                    ]
                ),

                "product_confidence": (
                    product_validation[
                        "product_confidence"
                    ]
                ),

                "product_match": False,

                "top3_products": (
                    product_validation[
                        "top3_products"
                    ]
                ),

                "defect_inspection_performed": False,
            }

        # ====================================================
        # STAGE 2 — DEFECT INSPECTION
        # ====================================================

        inspection_result = inspect_image(
            image_bytes=image_bytes,
            category=category,
        )

        # ====================================================
        # MERGE PRODUCT + DEFECT RESULTS
        # ====================================================

        inspection_result.update(
            {
                "inspection_status": "COMPLETED",

                "selected_product": (
                    product_validation[
                        "selected_product"
                    ]
                ),

                "predicted_product": (
                    product_validation[
                        "predicted_product"
                    ]
                ),

                "predicted_product_internal": (
                    product_validation[
                        "predicted_product_internal"
                    ]
                ),

                "product_confidence": (
                    product_validation[
                        "product_confidence"
                    ]
                ),

                "product_match": True,

                "top3_products": (
                    product_validation[
                        "top3_products"
                    ]
                ),

                "defect_inspection_performed": True,
            }
        )

        return inspection_result

    except HTTPException:
        raise

    except Exception as error:

        print("Inspection error:", error)

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )