import cv2
import numpy as np


# ============================================================
# VisionGuard Inspection ROI Engine
# ============================================================

SEVERITY_THRESHOLD = 5.0


# ============================================================
# Product Groups
# ============================================================

FULL_SURFACE_CATEGORIES = {
    "carpet",
    "grid",
    "leather",
    "tile",
    "wood",
    "zipper",
}


FOREGROUND_CATEGORIES = {
    "bottle",
    "capsule",
    "hazelnut",
    "metal_nut",
    "pill",
    "toothbrush",
}


# ============================================================
# Category Normalization
# ============================================================

def normalize_category(category: str) -> str:

    return (
        category
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
    )


# ============================================================
# Utility Functions
# ============================================================

def keep_largest_component(mask: np.ndarray) -> np.ndarray:

    binary = (mask > 0).astype(np.uint8)

    num_labels, labels, stats, _ = (
        cv2.connectedComponentsWithStats(
            binary,
            connectivity=8,
        )
    )

    if num_labels <= 1:
        return binary

    largest_label = 1 + np.argmax(
        stats[1:, cv2.CC_STAT_AREA]
    )

    output = np.zeros_like(binary)

    output[
        labels == largest_label
    ] = 1

    return output


def keep_components_by_area(
    mask: np.ndarray,
    min_area_ratio: float = 0.002,
) -> np.ndarray:

    binary = (mask > 0).astype(np.uint8)

    height, width = binary.shape

    total_pixels = height * width

    minimum_area = max(
        20,
        int(
            total_pixels
            * min_area_ratio
        ),
    )

    num_labels, labels, stats, _ = (
        cv2.connectedComponentsWithStats(
            binary,
            connectivity=8,
        )
    )

    output = np.zeros_like(binary)

    for label in range(
        1,
        num_labels,
    ):

        area = stats[
            label,
            cv2.CC_STAT_AREA,
        ]

        if area >= minimum_area:

            output[
                labels == label
            ] = 1

    return output


def fill_external_contours(
    mask: np.ndarray,
) -> np.ndarray:

    binary = (
        (mask > 0)
        .astype(np.uint8)
        * 255
    )

    contours, _ = cv2.findContours(
        binary,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    filled = np.zeros_like(
        binary
    )

    if contours:

        cv2.drawContours(
            filled,
            contours,
            -1,
            255,
            thickness=cv2.FILLED,
        )

    return (
        filled > 0
    ).astype(np.uint8)


# ============================================================
# Full Surface ROI
# ============================================================

def full_surface_roi(
    image: np.ndarray,
) -> np.ndarray:

    height, width = (
        image.shape[:2]
    )

    return np.ones(
        (height, width),
        dtype=np.uint8,
    )


# ============================================================
# Generic Foreground ROI
# ============================================================

def generic_foreground_roi(
    image: np.ndarray,
) -> np.ndarray:

    height, width = (
        image.shape[:2]
    )

    border_size = max(
        2,
        int(
            min(height, width)
            * 0.04
        ),
    )

    top = image[
        :border_size,
        :,
        :
    ].reshape(-1, 3)

    bottom = image[
        height - border_size:,
        :,
        :
    ].reshape(-1, 3)

    left = image[
        :,
        :border_size,
        :
    ].reshape(-1, 3)

    right = image[
        :,
        width - border_size:,
        :
    ].reshape(-1, 3)

    border_pixels = np.concatenate(
        [
            top,
            bottom,
            left,
            right,
        ],
        axis=0,
    ).astype(np.float32)

    background_color = np.median(
        border_pixels,
        axis=0,
    )

    image_float = (
        image.astype(
            np.float32
        )
    )

    difference = (
        image_float
        - background_color
    )

    distance = np.linalg.norm(
        difference,
        axis=2,
    )

    if distance.max() <= 0:

        return full_surface_roi(
            image
        )

    normalized = cv2.normalize(
        distance,
        None,
        0,
        255,
        cv2.NORM_MINMAX,
    ).astype(np.uint8)

    _, foreground = (
        cv2.threshold(
            normalized,
            0,
            255,
            cv2.THRESH_BINARY
            + cv2.THRESH_OTSU,
        )
    )

    kernel = (
        cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (11, 11),
        )
    )

    foreground = (
        cv2.morphologyEx(
            foreground,
            cv2.MORPH_CLOSE,
            kernel,
            iterations=2,
        )
    )

    foreground = (
        cv2.morphologyEx(
            foreground,
            cv2.MORPH_OPEN,
            kernel,
            iterations=1,
        )
    )

    foreground = (
        foreground > 0
    ).astype(np.uint8)

    foreground = (
        keep_largest_component(
            foreground
        )
    )

    foreground = (
        fill_external_contours(
            foreground
        )
    )

    area = int(
        foreground.sum()
    )

    total = (
        height * width
    )

    ratio = (
        area / total
        if total
        else 0
    )

    if ratio < 0.01:

        return full_surface_roi(
            image
        )

    return foreground


# ============================================================
# Cable ROI
# ============================================================

def cable_roi(
    image: np.ndarray,
) -> np.ndarray:

    height, width = (
        image.shape[:2]
    )

    mask = np.zeros(
        (height, width),
        dtype=np.uint8,
    )

    center_x = width // 2
    center_y = height // 2

    radius = int(
        0.39
        * min(height, width)
    )

    cv2.circle(
        mask,
        (center_x, center_y),
        radius,
        1,
        thickness=-1,
    )

    return mask


# ============================================================
# Screw ROI
# ============================================================

def screw_roi(
    image: np.ndarray,
) -> np.ndarray:

    mask = (
        generic_foreground_roi(
            image
        )
    )

    kernel = (
        cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (7, 7),
        )
    )

    mask = cv2.dilate(
        mask.astype(
            np.uint8
        ),
        kernel,
        iterations=1,
    )

    return (
        mask > 0
    ).astype(np.uint8)


# ============================================================
# Dynamic Transistor ROI
# ============================================================

def transistor_roi(
    image: np.ndarray,
) -> np.ndarray:
    """
    Dynamic ROI for MVTec transistor images.

    Unlike the old fixed rectangular ROI, this function
    estimates the actual transistor foreground from the image.

    The goal is to include:
        - transistor body
        - visible metal leads

    while excluding as much of the perforated background
    board as possible.
    """

    height, width = (
        image.shape[:2]
    )

    # --------------------------------------------------------
    # Convert to LAB
    #
    # LAB is useful because the transistor body / metallic
    # leads differ from the orange background in both
    # luminance and chromatic channels.
    # --------------------------------------------------------

    lab = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2LAB,
    )

    lab_float = (
        lab.astype(
            np.float32
        )
    )

    # --------------------------------------------------------
    # Estimate background from border pixels
    # --------------------------------------------------------

    border_size = max(
        3,
        int(
            min(height, width)
            * 0.04
        ),
    )

    top = lab_float[
        :border_size,
        :,
        :
    ].reshape(-1, 3)

    bottom = lab_float[
        height - border_size:,
        :,
        :
    ].reshape(-1, 3)

    left = lab_float[
        :,
        :border_size,
        :
    ].reshape(-1, 3)

    right = lab_float[
        :,
        width - border_size:,
        :
    ].reshape(-1, 3)

    border_pixels = (
        np.concatenate(
            [
                top,
                bottom,
                left,
                right,
            ],
            axis=0,
        )
    )

    background_color = (
        np.median(
            border_pixels,
            axis=0,
        )
    )

    # --------------------------------------------------------
    # LAB distance from estimated background
    # --------------------------------------------------------

    difference = (
        lab_float
        - background_color
    )

    distance = np.linalg.norm(
        difference,
        axis=2,
    )

    distance_norm = (
        cv2.normalize(
            distance,
            None,
            0,
            255,
            cv2.NORM_MINMAX,
        )
        .astype(np.uint8)
    )

    # --------------------------------------------------------
    # Otsu foreground segmentation
    # --------------------------------------------------------

    _, foreground = (
        cv2.threshold(
            distance_norm,
            0,
            255,
            cv2.THRESH_BINARY
            + cv2.THRESH_OTSU,
        )
    )

    # --------------------------------------------------------
    # Dark transistor body candidate
    # --------------------------------------------------------

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    # Dark pixels are useful for capturing the black
    # transistor package.
    dark_threshold = np.percentile(
        gray,
        30,
    )

    dark_mask = (
        gray <= dark_threshold
    ).astype(np.uint8)

    # --------------------------------------------------------
    # Bright / low saturation metallic leads
    # --------------------------------------------------------

    hsv = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2HSV,
    )

    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]

    metal_mask = (
        (
            saturation < 100
        )
        &
        (
            value > 90
        )
    ).astype(np.uint8)

    # --------------------------------------------------------
    # Combine candidates
    # --------------------------------------------------------

    foreground = (
        foreground > 0
    ).astype(np.uint8)

    combined = (
        foreground
        | dark_mask
        | metal_mask
    ).astype(np.uint8)

    # --------------------------------------------------------
    # Remove outer border.
    #
    # The transistor is expected around the central inspection
    # region and not directly on the extreme image boundary.
    # --------------------------------------------------------

    margin_x = int(
        width * 0.015
    )

    margin_y = int(
        height * 0.015
    )

    combined[
        :margin_y,
        :
    ] = 0

    combined[
        height - margin_y:,
        :
    ] = 0

    combined[
        :,
        :margin_x
    ] = 0

    combined[
        :,
        width - margin_x:
    ] = 0

    # --------------------------------------------------------
    # Morphological cleanup
    # --------------------------------------------------------

    small_kernel = (
        cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (5, 5),
        )
    )

    combined = (
        cv2.morphologyEx(
            combined,
            cv2.MORPH_OPEN,
            small_kernel,
            iterations=1,
        )
    )

    close_kernel = (
        cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (9, 9),
        )
    )

    combined = (
        cv2.morphologyEx(
            combined,
            cv2.MORPH_CLOSE,
            close_kernel,
            iterations=2,
        )
    )

    combined = (
        combined > 0
    ).astype(np.uint8)

    # --------------------------------------------------------
    # Keep meaningful components
    # --------------------------------------------------------

    combined = (
        keep_components_by_area(
            combined,
            min_area_ratio=0.001,
        )
    )

    # --------------------------------------------------------
    # Find the main transistor body.
    #
    # The largest meaningful component should normally
    # correspond to the black transistor package.
    # --------------------------------------------------------

    body = (
        keep_largest_component(
            combined
        )
    )

    # --------------------------------------------------------
    # Expand body slightly to connect nearby leads
    # --------------------------------------------------------

    connection_kernel = (
        cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (13, 13),
        )
    )

    expanded_body = cv2.dilate(
        body,
        connection_kernel,
        iterations=2,
    )

    # Components touching the expanded body are considered
    # possible transistor parts / leads.

    num_labels, labels, stats, _ = (
        cv2.connectedComponentsWithStats(
            combined,
            connectivity=8,
        )
    )

    final_mask = (
        body.copy()
    )

    for label in range(
        1,
        num_labels,
    ):

        component = (
            labels == label
        ).astype(np.uint8)

        overlap = np.any(
            (
                component > 0
            )
            &
            (
                expanded_body > 0
            )
        )

        if overlap:

            final_mask = np.maximum(
                final_mask,
                component,
            )

    # --------------------------------------------------------
    # Final small dilation.
    #
    # This gives a small tolerance around the actual product
    # boundary without returning to a large fixed rectangle.
    # --------------------------------------------------------

    final_kernel = (
        cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (5, 5),
        )
    )

    final_mask = cv2.dilate(
        final_mask,
        final_kernel,
        iterations=1,
    )

    final_mask = (
        final_mask > 0
    ).astype(np.uint8)

    # --------------------------------------------------------
    # Safety validation
    # --------------------------------------------------------

    roi_ratio = (
        final_mask.sum()
        / (height * width)
    )

    # If extraction completely fails, use generic foreground
    # rather than silently treating the whole image as ROI.
    if (
        roi_ratio < 0.02
        or roi_ratio > 0.80
    ):

        fallback = (
            generic_foreground_roi(
                image
            )
        )

        return (
            fallback > 0
        ).astype(np.uint8)

    return final_mask


# ============================================================
# Main ROI Dispatcher
# ============================================================

def get_inspection_roi(
    image: np.ndarray,
    category: str,
) -> np.ndarray:

    category = (
        normalize_category(
            category
        )
    )

    if category in FULL_SURFACE_CATEGORIES:

        return full_surface_roi(
            image
        )

    if category in FOREGROUND_CATEGORIES:

        return generic_foreground_roi(
            image
        )

    if category == "cable":

        return cable_roi(
            image
        )

    if category == "screw":

        return screw_roi(
            image
        )

    if category == "transistor":

        return transistor_roi(
            image
        )

    raise ValueError(
        "No inspection ROI is configured "
        f"for category: {category}"
    )


# ============================================================
# Defect Mask
# ============================================================

def build_defect_mask(
    result,
    image_shape,
) -> np.ndarray:

    height, width = (
        image_shape[:2]
    )

    defect_mask = np.zeros(
        (height, width),
        dtype=np.uint8,
    )

    if result.masks is None:

        return defect_mask

    masks = (
        result.masks.data
        .detach()
        .cpu()
        .numpy()
    )

    if len(masks) == 0:

        return defect_mask

    for predicted_mask in masks:

        predicted_mask = (
            predicted_mask > 0.5
        ).astype(np.uint8)

        if predicted_mask.shape != (
            height,
            width,
        ):

            predicted_mask = cv2.resize(
                predicted_mask,
                (width, height),
                interpolation=cv2.INTER_NEAREST,
            )

        defect_mask = np.maximum(
            defect_mask,
            predicted_mask,
        )

    return defect_mask


# ============================================================
# Affected Area Calculation
# ============================================================

def calculate_inspection_area(
    image: np.ndarray,
    result,
    category: str,
) -> dict:

    roi = get_inspection_roi(
        image=image,
        category=category,
    )

    defect_mask = build_defect_mask(
        result=result,
        image_shape=image.shape,
    )

    roi = (
        roi > 0
    ).astype(np.uint8)

    defect_mask = (
        defect_mask > 0
    ).astype(np.uint8)

    defect_inside_roi = (
        defect_mask
        & roi
    )

    inspection_pixels = int(
        roi.sum()
    )

    defect_pixels = int(
        defect_inside_roi.sum()
    )

    total_pixels = (
        image.shape[0]
        * image.shape[1]
    )

    inspection_area_percentage = (
        inspection_pixels
        / total_pixels
        * 100
        if total_pixels > 0
        else 0.0
    )

    affected_area_percentage = (
        defect_pixels
        / inspection_pixels
        * 100
        if inspection_pixels > 0
        else 0.0
    )

    return {
        "roi_mask": roi,

        "defect_mask": defect_mask,

        "defect_inside_roi": (
            defect_inside_roi
        ),

        "inspection_pixels": (
            inspection_pixels
        ),

        "defect_pixels": (
            defect_pixels
        ),

        "inspection_area_percentage": round(
            inspection_area_percentage,
            3,
        ),

        "affected_area_percentage": round(
            affected_area_percentage,
            3,
        ),
    }


# ============================================================
# Severity + Quality Decision
# ============================================================

def determine_quality_decision(
    defect_detected: bool,
    affected_area: float,
    severity_threshold: float = SEVERITY_THRESHOLD,
) -> dict:

    if not defect_detected:

        return {
            "severity": "NONE",
            "decision": "PASS",
        }

    if affected_area < severity_threshold:

        return {
            "severity": "MINOR",
            "decision": "REJECT",
        }

    return {
        "severity": "SEVERE",
        "decision": "REJECT",
    }