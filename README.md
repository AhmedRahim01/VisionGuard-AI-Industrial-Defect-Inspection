# 🏭 VisionGuard AI

### AI-Powered Industrial Quality Inspection & Defect Detection System

VisionGuard is an end-to-end Computer Vision system designed to automate industrial product quality inspection.

The system combines **product classification, defect segmentation, product-specific inspection regions, defect severity analysis, and automated quality decisions** in a web-based inspection platform.

Instead of only predicting whether a product is defective, VisionGuard attempts to answer:

- What product is being inspected?
- Does the uploaded product match the selected category?
- Is a defect present?
- Where is the defect located?
- How much of the inspection area is affected?
- How severe is the defect?
- Should the product PASS or be REJECTED?

---

## 🚀 System Pipeline

```text
Product Image
      │
      ▼
┌──────────────────────────────┐
│ Product Classification Model │
│       15 Categories          │
└──────────────┬───────────────┘
               │
               ▼
      Category Validation
          │           │
       Match       Mismatch
          │           │
          │           └──► Stop Inspection
          ▼
┌──────────────────────────────┐
│ VisionGuard V4 Segmentation  │
│        YOLOv8s-seg           │
└──────────────┬───────────────┘
               │
               ▼
        Defect Mask
               │
               ▼
┌──────────────────────────────┐
│ Product-Specific ROI Engine  │
└──────────────┬───────────────┘
               │
               ▼
       Defect ∩ Inspection ROI
               │
               ▼
       Affected Area (%)
               │
               ▼
       Severity Estimation
               │
               ▼
         PASS / REJECT
```

---

## ✨ Core Features

### 🔎 Product Verification

Before defect inspection starts, VisionGuard verifies that the uploaded image matches the product category selected by the user.

If the selected category does not match the AI prediction, the defect segmentation stage is blocked.

This prevents an incorrect inspection configuration from being passed directly to the defect detection model.

---

### 🎯 Defect Segmentation

VisionGuard V4 uses **YOLOv8s-seg** to localize defects at pixel level.

The segmentation model uses a single segmentation class:

```text
0 = defect
```

Product identity is handled independently by the product classification model.

---

### 📐 Inspection ROI Engine

Defect coverage is not calculated blindly against the complete image.

VisionGuard generates an inspection Region of Interest (ROI) depending on the product category.

The system currently uses multiple ROI strategies:

- Full-surface inspection
- Foreground extraction
- Circular inspection zones
- Product-specific ROI logic

The final affected area is calculated as:

```text
Affected Area (%) =
Defect Pixels Inside ROI
──────────────────────── × 100
Inspection ROI Pixels
```

---

### ⚠️ Severity Analysis

VisionGuard uses a configurable severity threshold:

```text
Severity Threshold = 5%
```

Current quality rules:

```text
No detected defect
→ Severity: NONE
→ Decision: PASS

Detected defect + affected area < 5%
→ Severity: MINOR
→ Decision: REJECT

Detected defect + affected area >= 5%
→ Severity: SEVERE
→ Decision: REJECT
```

The 5% value is a configurable project threshold and is not presented as a universal industrial standard.

---

## 🧠 AI Models

### 1. Product Classification Model

**Architecture:** YOLO11s-cls

**Task:** 15-class product classification

The classifier verifies the product identity before the defect segmentation stage.

Held-out MVTec test results:

| Metric | Result |
|---|---:|
| Test Images | 817 |
| Accuracy | 100% |
| Macro Precision | 100% |
| Macro Recall | 100% |
| Macro F1 | 100% |

> The classification results are measured on a held-out split from the MVTec domain. The product categories are visually distinct, and these results should not be interpreted as guaranteed performance on arbitrary real-world imagery.

---

### 2. VisionGuard V4 Defect Segmentation

**Architecture:** YOLOv8s-seg  
**Task:** Pixel-level defect segmentation  
**Classes:** 1 (`defect`)

VisionGuard V4 was fine-tuned with additional lighting and image augmentation.

Locked operating confidence threshold:

```text
0.090
```

Validation image-level quality-control performance at the selected threshold:

| Metric | Result |
|---|---:|
| Accuracy | 95.50% |
| Precision | 95.74% |
| Recall | 95.24% |
| Specificity | 95.77% |
| F1 Score | 95.49% |

Segmentation validation metrics:

| Metric | Box | Mask |
|---|---:|---:|
| Precision | 0.838 | 0.846 |
| Recall | 0.711 | 0.717 |
| mAP@50 | 0.765 | 0.788 |
| mAP@50-95 | 0.488 | 0.436 |

---

## 📊 ROI Coverage Validation

The ROI-based defect coverage pipeline was evaluated against MVTec ground-truth defect masks.

For detected test defects:

| Metric | Result |
|---|---:|
| MAE | 0.864 percentage points |
| Median Absolute Error | 0.282 percentage points |
| RMSE | 1.895 percentage points |
| Correlation | 0.9952 |
| Error ≤ 1 percentage point | 82.32% |
| Error ≤ 5 percentage points | 94.48% |

The correlation value represents agreement between predicted and ground-truth coverage measurements and should **not** be interpreted as classification accuracy.

---

## 🏷️ Supported Product Categories

VisionGuard currently supports all 15 MVTec AD product categories:

| # | Product |
|---:|---|
| 1 | Bottle |
| 2 | Cable |
| 3 | Capsule |
| 4 | Carpet |
| 5 | Grid |
| 6 | Hazelnut |
| 7 | Leather |
| 8 | Metal Nut |
| 9 | Pill |
| 10 | Screw |
| 11 | Tile |
| 12 | Toothbrush |
| 13 | Transistor |
| 14 | Wood |
| 15 | Zipper |

---

## 📐 ROI Strategies

### Full Surface

The complete image is used as the inspection surface for:

```text
Carpet
Grid
Leather
Tile
Wood
Zipper
```

### Foreground Extraction

Background-aware foreground extraction is used for:

```text
Bottle
Capsule
Hazelnut
Metal Nut
Pill
Toothbrush
```

### Specialized Inspection

Special ROI logic is currently used for:

```text
Cable
Screw
Transistor
```

---

## 🗂️ Dataset

The project uses the **MVTec Anomaly Detection (MVTec AD)** dataset.

It contains industrial product images with normal and anomalous samples and pixel-level ground-truth masks for defective test samples.

VisionGuard currently uses all 15 product categories.

### Important Methodology Note

The standard MVTec AD benchmark is designed primarily for **unsupervised anomaly detection**, where models are normally trained using defect-free training samples.

VisionGuard repurposes MVTec defect images and masks into a **supervised segmentation workflow** with train, validation, and test splits.

Therefore, VisionGuard's segmentation results should **not be directly compared with standard MVTec AD benchmark results** without accounting for this methodological difference.

---

## 🧪 Segmentation Dataset Preparation

The supervised segmentation dataset contains:

```text
2,516 images
```

Balanced composition:

```text
1,258 defective
1,258 good
```

Split:

| Split | Images |
|---|---:|
| Train | 1,760 |
| Validation | 378 |
| Test | 378 |

Ground-truth binary masks were converted into YOLO segmentation polygons.

All defect types are represented through the single segmentation class:

```text
defect
```

---

## 🖥️ Web Application

VisionGuard includes a web-based inspection interface.

### Frontend

Built with:

- React
- Vite
- JavaScript
- Lucide React

The interface provides:

- Product image upload
- Product category selection
- AI product verification
- Product mismatch protection
- Defect segmentation visualization
- Inspection ROI visualization
- Confidence information
- Defect region count
- Inspection area
- Defect pixel count
- Affected area
- Severity classification
- Final PASS / REJECT decision

### Backend

Built with:

- Python
- FastAPI
- Ultralytics
- OpenCV
- NumPy

The backend performs:

```text
Image Validation
      ↓
Product Classification
      ↓
Category Verification
      ↓
YOLO Defect Segmentation
      ↓
Inspection ROI Generation
      ↓
Defect / ROI Intersection
      ↓
Affected Area Calculation
      ↓
Severity Estimation
      ↓
Quality Decision
```

---

## 📁 Project Structure

```text
VisionGuard/
│
├── backend/
│   │
│   ├── model/
│   │   ├── VisionGuard_V4_best.pt
│   │   └── VisionGuard_ProductClassifier_best.pt
│   │
│   ├── detector.py
│   ├── inspection_logic.py
│   ├── main.py
│   ├── product_classifier.py
│   └── requirements.txt
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   │   └── NewInspection.jsx
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## ⚙️ Running VisionGuard Locally

### 1. Clone the repository

```bash
git clone https://github.com/AhmedRahim01/VisionGuard-AI-Industrial-Defect-Inspection.git
cd VisionGuard-AI-Industrial-Defect-Inspection
```

---

### 2. Backend Setup

Move to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

The frontend is normally available at:

```text
http://localhost:5173
```

---

## ⚠️ Current Limitations

VisionGuard is currently a research/prototype inspection system rather than a production-certified industrial quality-control platform.

Current limitations include:

- Performance is primarily evaluated within the MVTec image domain.
- Significant changes in camera position, lighting, background, or product appearance may cause domain shift.
- ROI extraction quality varies between product categories.
- The Transistor category currently requires further improvement in ROI extraction and segmentation behavior.
- The current 5% severity threshold is project-defined and would need to be calibrated to actual manufacturing requirements before production deployment.

---

## 🛣️ Development Roadmap

Planned features include:

- [x] Product classification
- [x] Product-category verification
- [x] Defect segmentation
- [x] Product-specific ROI engine
- [x] Defect coverage calculation
- [x] Severity estimation
- [x] Automated PASS / REJECT decision
- [x] Web inspection interface
- [ ] Inspection database
- [ ] Inspection history
- [ ] Analytics dashboard
- [ ] PDF inspection reports
- [ ] Email report delivery
- [ ] Production statistics and loss analysis
- [ ] Additional model and ROI optimization

---

## 🎯 Project Objective

VisionGuard demonstrates how multiple Computer Vision components can be combined into a complete industrial inspection workflow rather than using a single isolated model.

The project integrates:

**Classification + Segmentation + Image Processing + ROI Analysis + Decision Logic + Web Application**

into one end-to-end quality inspection system.

---

## 📄 License & Dataset Notice

The MVTec AD dataset is subject to its own licensing terms.

The dataset is commonly distributed under **CC BY-NC-SA 4.0** terms. Users of this project should review and comply with the original dataset license before using the dataset or derived work, particularly for commercial applications.

---

## 👨‍💻 Development Status

**VisionGuard is actively under development.**

Current stage:

```text
AI Pipeline       ✅
Product Validation ✅
Defect Segmentation ✅
ROI Analysis       ✅
Web Interface      ✅
Inspection History 🚧
Dashboard          🚧
Reporting          🚧
```