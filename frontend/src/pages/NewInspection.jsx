import { useRef, useState } from "react";

import {
  UploadCloud,
  Camera,
  ImagePlus,
  ScanLine,
  Cpu,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  X,
  FileImage,
  ChevronDown,
  LoaderCircle,
  AlertTriangle,
  RotateCcw,
  Maximize2,
  Layers3,
  Gauge,
  Activity,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/inspect";

const PRODUCT_CATEGORIES = [
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
];

function NewInspection() {
  const inputRef = useRef(null);

  const [selectedCategory, setSelectedCategory] =
    useState("Metal Nut");

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [loading, setLoading] = useState(false);

  // Normal defect inspection result
  const [result, setResult] = useState(null);

  // Product classifier mismatch result
  const [productMismatch, setProductMismatch] = useState(null);

  const [error, setError] = useState(null);

  // ============================================================
  // IMAGE UPLOAD
  // ============================================================

  const loadFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Image size must be less than 10 MB.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));

    setResult(null);
    setProductMismatch(null);
    setError(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    loadFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    loadFile(file);
  };

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setSelectedFile(null);
    setPreview(null);

    setResult(null);
    setProductMismatch(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // ============================================================
  // RUN REAL AI INSPECTION
  // ============================================================

  const handleRunInspection = async () => {
    if (!selectedFile) {
      setError("Please upload a product image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProductMismatch(null);

    try {
      const formData = new FormData();

      formData.append("image", selectedFile);
      formData.append("category", selectedCategory);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // ========================================================
      // HTTP ERROR
      // ========================================================

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || "AI inspection failed."
        );
      }

      // ========================================================
      // PRODUCT CLASSIFIER MISMATCH
      // ========================================================

      if (
        data.inspection_status === "PRODUCT_MISMATCH" ||
        data.product_match === false
      ) {
        setProductMismatch(data);
        setResult(null);
        return;
      }

      // ========================================================
      // NORMAL INSPECTION RESULT
      // ========================================================

      if (data.success === true) {
        setResult(data);
        setProductMismatch(null);
        return;
      }

      throw new Error(
        data.message ||
          "VisionGuard returned an unexpected response."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not connect to the VisionGuard AI backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // USE AI-DETECTED PRODUCT
  // ============================================================

  const useDetectedProduct = () => {
    if (!productMismatch?.predicted_product) return;

    setSelectedCategory(productMismatch.predicted_product);

    setProductMismatch(null);
    setResult(null);
    setError(null);
  };

  // ============================================================
  // RESET
  // ============================================================

  const resetInspection = () => {
    setResult(null);
    setProductMismatch(null);
    setError(null);
  };

  // ============================================================
  // RESULT IMAGES
  // ============================================================

  const resultImage = result?.result_image
    ? `data:image/jpeg;base64,${result.result_image}`
    : null;

  const roiImage = result?.roi_image
    ? `data:image/jpeg;base64,${result.roi_image}`
    : null;

  // ============================================================
  // UI
  // ============================================================

  return (
    <section className="page inspection-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-heading inspection-heading">
        <div>
          <p className="eyebrow">
            AI INSPECTION STATION
          </p>

          <h1>New Product Inspection</h1>

          <p>
            Upload a product image and run real-time AI defect
            segmentation using VisionGuard V4.
          </p>
        </div>

        <div className="inspection-ready">
          <span className="pulse-dot"></span>

          <div>
            <strong>Inspection Engine Ready</strong>

            <span>
              Product Classifier + VisionGuard V4 + ROI Engine
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="inspection-error">
          <AlertTriangle size={18} />

          <div>
            <strong>Inspection Error</strong>
            <span>{error}</span>
          </div>

          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ======================================================
          CONFIGURATION VIEW
      ====================================================== */}

      {!result && !productMismatch && (
        <>
          <div className="inspection-workspace">

            {/* LEFT SIDE */}

            <div className="upload-section">
              <div className="section-title">
                <div className="section-number">
                  01
                </div>

                <div>
                  <h3>Product Image</h3>

                  <p>
                    Upload the image that will be inspected.
                  </p>
                </div>
              </div>

              {!preview ? (
                <div
                  className={`upload-zone ${
                    dragging ? "dragging" : ""
                  }`}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <div className="upload-visual">
                    <UploadCloud size={34} />
                  </div>

                  <h2>
                    Drop your product image here
                  </h2>

                  <p>
                    Drag and drop an image or select one from
                    your computer.
                  </p>

                  <button
                    className="browse-button"
                    onClick={() => inputRef.current?.click()}
                  >
                    <ImagePlus size={17} />
                    Browse Image
                  </button>

                  <div className="upload-divider">
                    <span></span>
                    <small>OR</small>
                    <span></span>
                  </div>

                  <button
                    className="camera-button"
                    type="button"
                  >
                    <Camera size={17} />
                    Use Camera
                  </button>

                  <span className="upload-help">
                    JPG, JPEG or PNG • Maximum file size 10 MB
                  </span>
                </div>
              ) : (
                <div className="image-preview-card">
                  <div className="preview-toolbar">
                    <div>
                      <FileImage size={17} />

                      <div>
                        <strong>
                          {selectedFile?.name}
                        </strong>

                        <span>
                          {selectedFile
                            ? `${(
                                selectedFile.size /
                                1024 /
                                1024
                              ).toFixed(2)} MB`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <button
                      className="remove-image-button"
                      onClick={removeImage}
                    >
                      <X size={17} />
                    </button>
                  </div>

                  <div className="preview-image-wrapper">
                    <img
                      src={preview}
                      alt="Product preview"
                    />

                    <div className="preview-ready-badge">
                      <CheckCircle2 size={14} />
                      Ready for AI analysis
                    </div>
                  </div>

                  <button
                    className="replace-image-button"
                    onClick={() => inputRef.current?.click()}
                  >
                    <ImagePlus size={16} />
                    Replace Image
                  </button>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                hidden
                onChange={handleFileChange}
              />
            </div>

            {/* RIGHT SIDE */}

            <div className="inspection-config">
              <div className="section-title">
                <div className="section-number">
                  02
                </div>

                <div>
                  <h3>
                    Inspection Configuration
                  </h3>

                  <p>
                    Configure the AI inspection process.
                  </p>
                </div>
              </div>

              <div className="config-card">
                <label className="field-label">
                  Product Category
                </label>

                <div className="select-wrapper">
                  <select
                    value={selectedCategory}
                    onChange={(event) => {
                      setSelectedCategory(event.target.value);

                      setResult(null);
                      setProductMismatch(null);
                    }}
                  >
                    {PRODUCT_CATEGORIES.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>

                  <ChevronDown size={17} />
                </div>

                <span className="field-help">
                  Select the product type shown in the image.
                  VisionGuard will verify this selection before
                  defect inspection.
                </span>

                <div className="config-divider"></div>

                <div className="model-config-header">
                  <span>
                    AI Model Configuration
                  </span>

                  <div className="locked-badge">
                    LOCKED
                  </div>
                </div>

                <div className="model-info-card">
                  <div className="model-info-icon">
                    <Cpu size={24} />
                  </div>

                  <div className="model-info-main">
                    <span>Active Inspection Model</span>

                    <strong>
                      VisionGuard V4
                    </strong>

                    <small>
                      YOLOv8s Segmentation
                    </small>
                  </div>

                  <div className="model-version">
                    V4
                  </div>
                </div>

                <div className="config-values">
                  <div>
                    <span>
                      Confidence Threshold
                    </span>

                    <strong>0.090</strong>
                  </div>

                  <div>
                    <span>
                      Severity Threshold
                    </span>

                    <strong>5.0%</strong>
                  </div>

                  <div>
                    <span>
                      Product Classifier
                    </span>

                    <strong>15 Classes</strong>
                  </div>

                  <div>
                    <span>
                      Product Categories
                    </span>

                    <strong>15</strong>
                  </div>
                </div>

                <div className="inspection-rule">
                  <ShieldCheck size={19} />

                  <div>
                    <strong>
                      Three-Stage AI Inspection
                    </strong>

                    <p>
                      VisionGuard verifies the product category,
                      segments defects, then calculates defect
                      coverage relative to the product-specific
                      inspection area.
                    </p>
                  </div>
                </div>

                <button
                  className={`run-inspection-button ${
                    loading ? "running" : ""
                  }`}
                  onClick={handleRunInspection}
                  disabled={!selectedFile || loading}
                >
                  {loading ? (
                    <>
                      <LoaderCircle
                        size={19}
                        className="loading-spinner"
                      />

                      Verifying & Inspecting...
                    </>
                  ) : (
                    <>
                      <ScanLine size={19} />
                      Run AI Inspection
                    </>
                  )}
                </button>

                {!selectedFile && (
                  <p className="run-help">
                    Upload a product image to start inspection.
                  </p>
                )}

                {loading && (
                  <div className="ai-processing-status">
                    <div className="processing-line">
                      <span></span>
                    </div>

                    <p>
                      VisionGuard is verifying the product,
                      segmenting defects and calculating the
                      inspection area...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SUPPORTED PRODUCTS */}

          <div className="supported-products-panel">
            <div className="supported-heading">
              <div>
                <Sparkles size={19} />

                <div>
                  <h3>
                    Supported Product Categories
                  </h3>

                  <p>
                    VisionGuard supports all 15 MVTec AD product
                    categories used by the inspection system.
                  </p>
                </div>
              </div>

              <span>15 PRODUCTS</span>
            </div>

            <div className="product-chips">
              {PRODUCT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  className={
                    selectedCategory === category
                      ? "product-chip selected"
                      : "product-chip"
                  }
                  onClick={() => {
                    setSelectedCategory(category);
                    setProductMismatch(null);
                    setResult(null);
                  }}
                >
                  <span></span>
                  {category}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ======================================================
          PRODUCT CATEGORY MISMATCH
      ====================================================== */}

      {productMismatch && (
        <div className="inspection-result-page">

          <div
            className="result-hero result-reject"
            style={{ minHeight: "130px" }}
          >
            <div className="result-hero-left">
              <div className="result-status-icon">
                <AlertTriangle size={30} />
              </div>

              <div>
                <span className="result-eyebrow">
                  PRODUCT VALIDATION FAILED
                </span>

                <h2>
                  Product Category Mismatch
                </h2>

                <p>
                  The uploaded image does not match the selected
                  product category. Defect inspection was stopped
                  before segmentation.
                </p>
              </div>
            </div>

            <div className="decision-badge reject">
              MISMATCH
            </div>
          </div>

          <div className="result-details-grid">
            <div className="result-image-panel">
              <div className="result-panel-header">
                <div>
                  <span>
                    UPLOADED IMAGE
                  </span>

                  <h3>
                    Product Verification
                  </h3>
                </div>

                <Maximize2 size={17} />
              </div>

              <div className="result-image-container">
                <img
                  src={preview}
                  alt="Uploaded product"
                />
              </div>
            </div>

            <div
              className="result-details-card"
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="result-details-title">
                <Cpu size={18} />

                <div>
                  <h3>
                    Product Classifier Result
                  </h3>

                  <p>
                    VisionGuard product identity verification
                  </p>
                </div>
              </div>

              <div className="details-table">
                <div>
                  <span>
                    Selected Product
                  </span>

                  <strong style={{ color: "#dc2626" }}>
                    {productMismatch.selected_product}
                  </strong>
                </div>

                <div>
                  <span>
                    AI Detected Product
                  </span>

                  <strong style={{ color: "#2563eb" }}>
                    {productMismatch.predicted_product}
                  </strong>
                </div>

                <div>
                  <span>
                    Classification Confidence
                  </span>

                  <strong>
                    {Number(
                      productMismatch.product_confidence || 0
                    ).toFixed(2)}
                    %
                  </strong>
                </div>

                <div>
                  <span>
                    Product Match
                  </span>

                  <strong style={{ color: "#dc2626" }}>
                    NO
                  </strong>
                </div>

                <div>
                  <span>
                    Defect Inspection
                  </span>

                  <strong style={{ color: "#ea580c" }}>
                    NOT RUN
                  </strong>
                </div>
              </div>

              <div
                className="inspection-rule"
                style={{
                  marginTop: "15px",
                  borderColor: "#fde2c3",
                  background: "#fff9f2",
                  color: "#c2410c",
                }}
              >
                <ShieldCheck size={19} />

                <div>
                  <strong>
                    Safety Validation Active
                  </strong>

                  <p>
                    VisionGuard prevented defect segmentation
                    because the selected product category did not
                    match the AI-classified product.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="result-metrics-grid">
            <div className="result-metric">
              <div className="result-metric-icon red">
                <AlertTriangle size={19} />
              </div>

              <span>
                Selected Product
              </span>

              <strong style={{ fontSize: "15px" }}>
                {productMismatch.selected_product}
              </strong>
            </div>

            <div className="result-metric">
              <div className="result-metric-icon blue">
                <Cpu size={19} />
              </div>

              <span>
                AI Detected Product
              </span>

              <strong style={{ fontSize: "15px" }}>
                {productMismatch.predicted_product}
              </strong>
            </div>

            <div className="result-metric">
              <div className="result-metric-icon purple">
                <Gauge size={19} />
              </div>

              <span>
                Classification Confidence
              </span>

              <strong>
                {Number(
                  productMismatch.product_confidence || 0
                ).toFixed(2)}
                %
              </strong>
            </div>

            <div className="result-metric">
              <div className="result-metric-icon orange">
                <ScanLine size={19} />
              </div>

              <span>
                Defect Segmentation
              </span>

              <strong
                style={{
                  fontSize: "15px",
                  color: "#ea580c",
                }}
              >
                BLOCKED
              </strong>
            </div>
          </div>

          {productMismatch.top3_products?.length > 0 && (
            <div className="result-details-card">
              <div className="result-details-title">
                <Sparkles size={18} />

                <div>
                  <h3>
                    Top Product Predictions
                  </h3>

                  <p>
                    Highest product classification probabilities
                  </p>
                </div>
              </div>

              <div className="details-table">
                {productMismatch.top3_products.map(
                  (item, index) => (
                    <div
                      key={`${item.internal_name}-${index}`}
                    >
                      <span>
                        #{index + 1} Prediction
                      </span>

                      <strong>
                        {item.product} —{" "}
                        {Number(item.confidence).toFixed(2)}%
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="result-actions">
            <button
              className="secondary-result-button"
              onClick={() => {
                setProductMismatch(null);
                setError(null);
              }}
            >
              <RotateCcw size={17} />
              Change Selection
            </button>

            <button
              className="primary-result-button"
              onClick={useDetectedProduct}
            >
              <RefreshCw size={17} />

              Use {productMismatch.predicted_product}

              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          REAL AI DEFECT RESULT
      ====================================================== */}

      {result && (
        <div className="inspection-result-page">

          {/* RESULT HEADER */}

          <div
            className={`result-hero ${
              result.decision === "PASS"
                ? "result-pass"
                : "result-reject"
            }`}
          >
            <div className="result-hero-left">
              <div className="result-status-icon">
                {result.decision === "PASS" ? (
                  <CheckCircle2 size={30} />
                ) : (
                  <AlertTriangle size={30} />
                )}
              </div>

              <div>
                <span className="result-eyebrow">
                  INSPECTION COMPLETE
                </span>

                <h2>
                  {result.decision === "PASS"
                    ? "Product Passed"
                    : "Product Rejected"}
                </h2>

                <p>
                  {result.decision === "PASS"
                    ? "No defect was detected by VisionGuard."
                    : "VisionGuard detected one or more defect regions."}
                </p>
              </div>
            </div>

            <div
              className={`decision-badge ${
                result.decision === "PASS"
                  ? "pass"
                  : "reject"
              }`}
            >
              {result.decision}
            </div>
          </div>

          {/* IMAGE COMPARISON */}

          <div className="result-comparison">
            <div className="result-image-panel">
              <div className="result-panel-header">
                <div>
                  <span>INPUT</span>
                  <h3>Original Image</h3>
                </div>

                <Maximize2 size={17} />
              </div>

              <div className="result-image-container">
                <img
                  src={preview}
                  alt="Original product"
                />
              </div>
            </div>

            <div className="result-image-panel">
              <div className="result-panel-header">
                <div>
                  <span>
                    VISIONGUARD AI
                  </span>

                  <h3>
                    Defect Segmentation
                  </h3>
                </div>

                <Layers3 size={18} />
              </div>

              <div className="result-image-container">
                <img
                  src={resultImage}
                  alt="AI segmentation"
                />
              </div>
            </div>
          </div>

          {/* INSPECTION METRICS */}

          <div className="result-metrics-grid">

            <div className="result-metric">
              <div className="result-metric-icon blue">
                <Gauge size={19} />
              </div>

              <span>
                Max Confidence
              </span>

              <strong>
                {result.defect_detected
                  ? `${Number(
                      result.max_confidence || 0
                    ).toFixed(2)}%`
                  : "—"}
              </strong>
            </div>

            <div className="result-metric">
              <div className="result-metric-icon purple">
                <ScanLine size={19} />
              </div>

              <span>
                Defect Regions
              </span>

              <strong>
                {result.defect_regions}
              </strong>
            </div>

            <div className="result-metric">
              <div className="result-metric-icon blue">
                <Layers3 size={19} />
              </div>

              <span>
                Inspection Area
              </span>

              <strong>
                {Number(
                  result.inspection_area_percentage || 0
                ).toFixed(2)}
                %
              </strong>
            </div>

            <div className="result-metric">
              <div className="result-metric-icon orange">
                <Activity size={19} />
              </div>

              <span>
                Affected Area
              </span>

              <strong>
                {Number(
                  result.affected_area || 0
                ).toFixed(2)}
                %
              </strong>
            </div>

            <div className="result-metric">
              <div className="result-metric-icon purple">
                <Activity size={19} />
              </div>

              <span>
                Defect Pixels
              </span>

              <strong>
                {Number(
                  result.defect_pixels || 0
                ).toLocaleString()}
              </strong>
            </div>

            <div className="result-metric">
              <div
                className={`result-metric-icon ${
                  result.severity === "SEVERE"
                    ? "red"
                    : result.severity === "MINOR"
                    ? "orange"
                    : "green"
                }`}
              >
                <ShieldCheck size={19} />
              </div>

              <span>
                Severity
              </span>

              <strong
                className={`severity-text ${(
                  result.severity || "none"
                ).toLowerCase()}`}
              >
                {result.severity}
              </strong>
            </div>
          </div>

          {/* INSPECTION DETAILS */}

          <div className="result-details-grid">
            <div className="result-details-card">
              <div className="result-details-title">
                <Cpu size={18} />

                <div>
                  <h3>
                    AI Inspection Details
                  </h3>

                  <p>
                    Model, ROI and inference information
                  </p>
                </div>
              </div>

              <div className="details-table">
                <div>
                  <span>
                    Product
                  </span>

                  <strong>
                    {result.product_category}
                  </strong>
                </div>

                {result.predicted_product && (
                  <div>
                    <span>
                      Verified Product
                    </span>

                    <strong>
                      {result.predicted_product}
                    </strong>
                  </div>
                )}

                {result.product_confidence !== undefined && (
                  <div>
                    <span>
                      Product Confidence
                    </span>

                    <strong>
                      {Number(
                        result.product_confidence
                      ).toFixed(2)}
                      %
                    </strong>
                  </div>
                )}

                <div>
                  <span>
                    Model
                  </span>

                  <strong>
                    {result.model}
                  </strong>
                </div>

                <div>
                  <span>
                    Architecture
                  </span>

                  <strong>
                    {result.architecture}
                  </strong>
                </div>

                <div>
                  <span>
                    Confidence Threshold
                  </span>

                  <strong>
                    {Number(
                      result.threshold || 0
                    ).toFixed(3)}
                  </strong>
                </div>

                <div>
                  <span>
                    Image Resolution
                  </span>

                  <strong>
                    {result.image_width} ×{" "}
                    {result.image_height}
                  </strong>
                </div>

                <div>
                  <span>
                    Defect Detected
                  </span>

                  <strong>
                    {result.defect_detected
                      ? "YES"
                      : "NO"}
                  </strong>
                </div>

                <div>
                  <span>
                    Inspection Area
                  </span>

                  <strong>
                    {Number(
                      result.inspection_area_percentage || 0
                    ).toFixed(2)}
                    %
                  </strong>
                </div>

                <div>
                  <span>
                    Inspection Pixels
                  </span>

                  <strong>
                    {Number(
                      result.inspection_pixels || 0
                    ).toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>
                    Defect Pixels
                  </span>

                  <strong>
                    {Number(
                      result.defect_pixels || 0
                    ).toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>
                    Affected Area
                  </span>

                  <strong>
                    {Number(
                      result.affected_area || 0
                    ).toFixed(2)}
                    %
                  </strong>
                </div>

                <div>
                  <span>
                    Severity Threshold
                  </span>

                  <strong>
                    {Number(
                      result.severity_threshold || 0
                    ).toFixed(1)}
                    %
                  </strong>
                </div>
              </div>
            </div>

            <div
              className={`final-decision-card ${
                result.decision === "PASS"
                  ? "pass"
                  : "reject"
              }`}
            >
              <span>
                FINAL QUALITY DECISION
              </span>

              {result.decision === "PASS" ? (
                <CheckCircle2 size={45} />
              ) : (
                <AlertTriangle size={45} />
              )}

              <h2>
                {result.decision}
              </h2>

              <p>
                {result.decision === "PASS"
                  ? "Product meets the current AI inspection criteria."
                  : "Product requires quality control review."}
              </p>
            </div>
          </div>

          {/* ROI VISUALIZATION */}

          {roiImage && (
            <div
              className="result-image-panel"
              style={{ marginTop: "20px" }}
            >
              <div className="result-panel-header">
                <div>
                  <span>
                    INSPECTION LOGIC
                  </span>

                  <h3>
                    Inspection ROI & Defect Area
                  </h3>
                </div>

                <Layers3 size={18} />
              </div>

              <div className="result-image-container">
                <img
                  src={roiImage}
                  alt="Inspection ROI"
                />
              </div>
            </div>
          )}

          {/* ACTIONS */}

          <div className="result-actions">
            <button
              className="secondary-result-button"
              onClick={resetInspection}
            >
              <RotateCcw size={17} />
              Inspect Again
            </button>

            <button
              className="primary-result-button"
              onClick={removeImage}
            >
              <ScanLine size={17} />
              New Inspection
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default NewInspection;