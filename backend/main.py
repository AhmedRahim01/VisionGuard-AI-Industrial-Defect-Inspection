from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from detector import (
    inspect_image,
    CONFIDENCE_THRESHOLD,
    SEVERITY_THRESHOLD,
)

from product_classifier import validate_product

from database import (
    initialize_database,
    save_inspection,
    get_inspections,
    get_inspection,
    get_dashboard_statistics,
)


# ============================================================
# VisionGuard API
# ============================================================

app = FastAPI(
    title="VisionGuard API",
    description="AI-powered industrial quality inspection API",
    version="3.0.0",
)


# ============================================================
# Initialize Database
# ============================================================

initialize_database()


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

        "database": "SQLite",
        "inspection_history": True,
        "dashboard_analytics": True,
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "ai_engine": "ready",

        "defect_model": "VisionGuard V4",
        "product_classifier": "ready",

        "product_verification": "enabled",
        "database": "ready",
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
        # STAGE 3 — MERGE PRODUCT + DEFECT RESULTS
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

        # ====================================================
        # STAGE 4 — SAVE INSPECTION TO DATABASE
        # ====================================================

        database_record = save_inspection(
            inspection_result
        )

        # ----------------------------------------------------
        # Add database information to API response
        # ----------------------------------------------------

        inspection_result.update(
            {
                "inspection_id": (
                    database_record["id"]
                ),

                "inspection_code": (
                    database_record[
                        "inspection_code"
                    ]
                ),

                "created_at": (
                    database_record[
                        "created_at"
                    ]
                ),
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


# ============================================================
# Inspection History
# ============================================================

@app.get("/api/inspections")
def inspection_history(
    limit: int = 100,
):
    """
    Return saved VisionGuard inspections.

    Newest inspections are returned first.
    """

    try:

        inspections = get_inspections(
            limit=limit
        )

        return {
            "success": True,
            "count": len(inspections),
            "inspections": inspections,
        }

    except Exception as error:

        print(
            "Inspection history error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# Single Inspection Details
# ============================================================

@app.get("/api/inspections/{inspection_id}")
def inspection_details(
    inspection_id: int,
):
    """
    Return complete information for one saved inspection.
    """

    try:

        inspection = get_inspection(
            inspection_id
        )

        if inspection is None:
            raise HTTPException(
                status_code=404,
                detail="Inspection not found.",
            )

        return {
            "success": True,
            "inspection": inspection,
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Inspection details error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# Dashboard Statistics
# ============================================================

@app.get("/api/dashboard")
def dashboard():
    """
    Return real VisionGuard quality-control statistics
    calculated from saved inspections.
    """

    try:

        statistics = (
            get_dashboard_statistics()
        )

        return {
            "success": True,
            **statistics,
        }

    except Exception as error:

        print(
            "Dashboard statistics error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )