from pathlib import Path
import sqlite3
from datetime import datetime


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATABASE_DIR = BASE_DIR / "data"
DATABASE_DIR.mkdir(exist_ok=True)

DATABASE_PATH = DATABASE_DIR / "visionguard.db"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)

    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def initialize_database():
    with get_connection() as connection:

        connection.execute("""
            CREATE TABLE IF NOT EXISTS inspections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                inspection_code TEXT UNIQUE NOT NULL,

                product_category TEXT NOT NULL,
                predicted_product TEXT,
                product_confidence REAL,

                defect_detected INTEGER NOT NULL,
                defect_regions INTEGER NOT NULL,

                max_confidence REAL,
                average_confidence REAL,

                inspection_area REAL,
                inspection_pixels INTEGER,

                affected_area REAL,
                defect_pixels INTEGER,

                severity TEXT NOT NULL,
                decision TEXT NOT NULL,

                image_width INTEGER,
                image_height INTEGER,

                original_image TEXT,
                result_image TEXT,
                roi_image TEXT,

                created_at TEXT NOT NULL
            )
        """)

        connection.commit()


# ============================================================
# SAVE INSPECTION
# ============================================================

def save_inspection(result: dict):

    created_at = datetime.now().isoformat(
        sep=" ",
        timespec="seconds",
    )

    with get_connection() as connection:

        cursor = connection.execute(
            """
            INSERT INTO inspections (
                inspection_code,

                product_category,
                predicted_product,
                product_confidence,

                defect_detected,
                defect_regions,

                max_confidence,
                average_confidence,

                inspection_area,
                inspection_pixels,

                affected_area,
                defect_pixels,

                severity,
                decision,

                image_width,
                image_height,

                original_image,
                result_image,
                roi_image,

                created_at
            )

            VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?
            )
            """,
            (
                "TEMP",

                result.get("product_category"),
                result.get("predicted_product"),
                result.get("product_confidence"),

                int(
                    bool(
                        result.get(
                            "defect_detected",
                            False,
                        )
                    )
                ),

                result.get(
                    "defect_regions",
                    0,
                ),

                result.get(
                    "max_confidence",
                    0,
                ),

                result.get(
                    "average_confidence",
                    0,
                ),

                result.get(
                    "inspection_area_percentage",
                    0,
                ),

                result.get(
                    "inspection_pixels",
                    0,
                ),

                result.get(
                    "affected_area",
                    0,
                ),

                result.get(
                    "defect_pixels",
                    0,
                ),

                result.get(
                    "severity",
                    "NONE",
                ),

                result.get(
                    "decision",
                    "UNKNOWN",
                ),

                result.get(
                    "image_width",
                    0,
                ),

                result.get(
                    "image_height",
                    0,
                ),

                result.get(
                    "original_image"
                ),

                result.get(
                    "result_image"
                ),

                result.get(
                    "roi_image"
                ),

                created_at,
            ),
        )

        inspection_id = cursor.lastrowid

        inspection_code = (
            f"VG-{inspection_id:06d}"
        )

        connection.execute(
            """
            UPDATE inspections

            SET inspection_code = ?

            WHERE id = ?
            """,
            (
                inspection_code,
                inspection_id,
            ),
        )

        connection.commit()

    return {
        "id": inspection_id,
        "inspection_code": inspection_code,
        "created_at": created_at,
    }


# ============================================================
# GET INSPECTION HISTORY
# ============================================================

def get_inspections(limit=100):

    with get_connection() as connection:

        rows = connection.execute(
            """
            SELECT
                id,
                inspection_code,

                product_category,
                predicted_product,
                product_confidence,

                defect_detected,
                defect_regions,

                max_confidence,
                average_confidence,

                inspection_area,
                inspection_pixels,

                affected_area,
                defect_pixels,

                severity,
                decision,

                image_width,
                image_height,

                created_at

            FROM inspections

            ORDER BY id DESC

            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [
        dict(row)
        for row in rows
    ]


# ============================================================
# GET SINGLE INSPECTION
# ============================================================

def get_inspection(inspection_id: int):

    with get_connection() as connection:

        row = connection.execute(
            """
            SELECT *

            FROM inspections

            WHERE id = ?
            """,
            (inspection_id,),
        ).fetchone()

    if row is None:
        return None

    return dict(row)


# ============================================================
# DASHBOARD STATISTICS
# ============================================================

def get_dashboard_statistics():

    with get_connection() as connection:

        # ====================================================
        # MAIN TOTALS
        # ====================================================

        totals = connection.execute(
            """
            SELECT

                COUNT(*) AS total,

                SUM(
                    CASE
                        WHEN decision = 'PASS'
                        THEN 1
                        ELSE 0
                    END
                ) AS passed,

                SUM(
                    CASE
                        WHEN decision = 'REJECT'
                        THEN 1
                        ELSE 0
                    END
                ) AS rejected,

                SUM(
                    CASE
                        WHEN severity = 'NONE'
                        THEN 1
                        ELSE 0
                    END
                ) AS none_count,

                SUM(
                    CASE
                        WHEN severity = 'MINOR'
                        THEN 1
                        ELSE 0
                    END
                ) AS minor,

                SUM(
                    CASE
                        WHEN severity = 'SEVERE'
                        THEN 1
                        ELSE 0
                    END
                ) AS severe,

                SUM(
                    defect_regions
                ) AS total_defect_regions,

                AVG(
                    affected_area
                ) AS average_affected_area,

                AVG(
                    product_confidence
                ) AS average_product_confidence

            FROM inspections
            """
        ).fetchone()


        # ====================================================
        # BASIC VALUES
        # ====================================================

        total = (
            totals["total"]
            or 0
        )

        passed = (
            totals["passed"]
            or 0
        )

        rejected = (
            totals["rejected"]
            or 0
        )

        none_count = (
            totals["none_count"]
            or 0
        )

        minor = (
            totals["minor"]
            or 0
        )

        severe = (
            totals["severe"]
            or 0
        )

        total_defect_regions = (
            totals["total_defect_regions"]
            or 0
        )

        average_affected_area = (
            totals["average_affected_area"]
            or 0
        )

        average_product_confidence = (
            totals["average_product_confidence"]
            or 0
        )


        # ====================================================
        # PASS / REJECT RATE
        # ====================================================

        if total > 0:

            pass_rate = (
                passed / total
            ) * 100

            reject_rate = (
                rejected / total
            ) * 100

        else:

            pass_rate = 0
            reject_rate = 0


        # ====================================================
        # PRODUCT STATISTICS
        # ====================================================

        product_rows = connection.execute(
            """
            SELECT

                product_category,

                COUNT(*) AS total,

                SUM(
                    CASE
                        WHEN decision = 'PASS'
                        THEN 1
                        ELSE 0
                    END
                ) AS passed,

                SUM(
                    CASE
                        WHEN decision = 'REJECT'
                        THEN 1
                        ELSE 0
                    END
                ) AS rejected,

                SUM(
                    defect_regions
                ) AS defect_regions,

                AVG(
                    affected_area
                ) AS average_affected_area,

                AVG(
                    product_confidence
                ) AS average_confidence

            FROM inspections

            GROUP BY product_category

            ORDER BY total DESC
            """
        ).fetchall()


        product_statistics = []

        for row in product_rows:

            row_dict = dict(row)

            product_total = (
                row_dict["total"]
                or 0
            )

            product_passed = (
                row_dict["passed"]
                or 0
            )

            product_rejected = (
                row_dict["rejected"]
                or 0
            )

            if product_total > 0:

                product_reject_rate = (
                    product_rejected
                    / product_total
                ) * 100

                product_pass_rate = (
                    product_passed
                    / product_total
                ) * 100

            else:

                product_reject_rate = 0
                product_pass_rate = 0


            product_statistics.append(
                {
                    "product_category":
                        row_dict[
                            "product_category"
                        ],

                    "total":
                        product_total,

                    "passed":
                        product_passed,

                    "rejected":
                        product_rejected,

                    "pass_rate":
                        round(
                            product_pass_rate,
                            2,
                        ),

                    "reject_rate":
                        round(
                            product_reject_rate,
                            2,
                        ),

                    "defect_regions":
                        row_dict[
                            "defect_regions"
                        ]
                        or 0,

                    "average_affected_area":
                        round(
                            row_dict[
                                "average_affected_area"
                            ]
                            or 0,
                            3,
                        ),

                    "average_confidence":
                        round(
                            row_dict[
                                "average_confidence"
                            ]
                            or 0,
                            2,
                        ),
                }
            )


        # ====================================================
        # DAILY STATISTICS
        # LAST 14 ACTIVE DAYS
        # ====================================================

        daily_rows = connection.execute(
            """
            SELECT

                DATE(
                    created_at
                ) AS date,

                COUNT(*) AS inspections,

                SUM(
                    CASE
                        WHEN decision = 'PASS'
                        THEN 1
                        ELSE 0
                    END
                ) AS passed,

                SUM(
                    CASE
                        WHEN decision = 'REJECT'
                        THEN 1
                        ELSE 0
                    END
                ) AS rejected,

                SUM(
                    defect_regions
                ) AS defect_regions,

                AVG(
                    affected_area
                ) AS average_affected_area

            FROM inspections

            GROUP BY
                DATE(created_at)

            ORDER BY
                DATE(created_at) DESC

            LIMIT 14
            """
        ).fetchall()


        daily_statistics = []

        for row in reversed(
            daily_rows
        ):

            daily_statistics.append(
                {
                    "date":
                        row["date"],

                    "inspections":
                        row[
                            "inspections"
                        ]
                        or 0,

                    "passed":
                        row["passed"]
                        or 0,

                    "rejected":
                        row["rejected"]
                        or 0,

                    "defect_regions":
                        row[
                            "defect_regions"
                        ]
                        or 0,

                    "average_affected_area":
                        round(
                            row[
                                "average_affected_area"
                            ]
                            or 0,
                            3,
                        ),
                }
            )


        # ====================================================
        # SEVERITY DISTRIBUTION
        # ====================================================

        severity_statistics = [
            {
                "severity": "NONE",
                "count": none_count,
            },
            {
                "severity": "MINOR",
                "count": minor,
            },
            {
                "severity": "SEVERE",
                "count": severe,
            },
        ]


        # ====================================================
        # WORST PERFORMING PRODUCT
        # ====================================================

        worst_product = None

        products_with_rejections = [
            product

            for product
            in product_statistics

            if product[
                "rejected"
            ] > 0
        ]

        if products_with_rejections:

            worst_product = max(
                products_with_rejections,

                key=lambda product: (
                    product[
                        "reject_rate"
                    ],
                    product[
                        "rejected"
                    ],
                ),
            )


        # ====================================================
        # MOST INSPECTED PRODUCT
        # ====================================================

        most_inspected_product = None

        if product_statistics:

            most_inspected_product = max(
                product_statistics,

                key=lambda product:
                    product["total"],
            )


        # ====================================================
        # BEST PERFORMING PRODUCT
        # Only products with inspections
        # ====================================================

        best_product = None

        if product_statistics:

            best_product = max(
                product_statistics,

                key=lambda product: (
                    product[
                        "pass_rate"
                    ],
                    product[
                        "total"
                    ],
                ),
            )


        # ====================================================
        # DEFECTIVE INSPECTION COUNT
        # ====================================================

        defective_inspections = (
            connection.execute(
                """
                SELECT COUNT(*) AS count

                FROM inspections

                WHERE defect_detected = 1
                """
            ).fetchone()["count"]
            or 0
        )


        # ====================================================
        # DEFECT DETECTION RATE
        # ====================================================

        if total > 0:

            defect_detection_rate = (
                defective_inspections
                / total
            ) * 100

        else:

            defect_detection_rate = 0


        # ====================================================
        # FINAL DASHBOARD RESPONSE
        # ====================================================

        return {

            # Main KPI values

            "total_inspections":
                total,

            "passed":
                passed,

            "rejected":
                rejected,

            "pass_rate":
                round(
                    pass_rate,
                    2,
                ),

            "reject_rate":
                round(
                    reject_rate,
                    2,
                ),


            # Severity

            "none":
                none_count,

            "minor":
                minor,

            "severe":
                severe,


            # Defect information

            "defective_inspections":
                defective_inspections,

            "defect_detection_rate":
                round(
                    defect_detection_rate,
                    2,
                ),

            "total_defect_regions":
                total_defect_regions,


            # Average metrics

            "average_affected_area":
                round(
                    average_affected_area,
                    3,
                ),

            "average_product_confidence":
                round(
                    average_product_confidence,
                    2,
                ),


            # Charts / analytics

            "product_statistics":
                product_statistics,

            "daily_statistics":
                daily_statistics,

            "severity_statistics":
                severity_statistics,


            # Product insights

            "worst_product":
                worst_product,

            "best_product":
                best_product,

            "most_inspected_product":
                most_inspected_product,
        }