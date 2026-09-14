import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers3,
  PackageSearch,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import "./Analytics.css";


const API_URL = "http://127.0.0.1:8000/api/dashboard";


// ============================================================
// ANALYTICS KPI CARD
// ============================================================

function AnalyticsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  variant = "blue",
}) {
  return (
    <div className="analytics-kpi-card">
      <div className={`analytics-kpi-icon ${variant}`}>
        <Icon size={20} />
      </div>

      <div className="analytics-kpi-content">
        <span>{title}</span>

        <strong>{value}</strong>

        <small>{subtitle}</small>
      </div>
    </div>
  );
}


// ============================================================
// ANALYTICS PAGE
// ============================================================

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ==========================================================
  // LOAD REAL ANALYTICS FROM BACKEND
  // ==========================================================

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail ||
            "Failed to load VisionGuard analytics."
        );
      }

      setAnalytics(data);
    } catch (err) {
      console.error("Analytics error:", err);

      setError(
        err.message ||
          "Could not connect to VisionGuard backend."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadAnalytics();
  }, []);


  // ==========================================================
  // PRODUCT ANALYTICS DATA
  // ==========================================================

  const productData = useMemo(() => {
    if (!analytics?.product_statistics) {
      return [];
    }

    return analytics.product_statistics.map((item) => ({
      product: item.product_category,

      total: Number(
        item.total || 0
      ),

      passed: Number(
        item.passed || 0
      ),

      rejected: Number(
        item.rejected || 0
      ),

      rejectRate: Number(
        item.reject_rate || 0
      ),

      passRate: Number(
        item.pass_rate || 0
      ),

      affectedArea: Number(
        item.average_affected_area || 0
      ),

      defectRegions: Number(
        item.defect_regions || 0
      ),

      confidence: Number(
        item.average_confidence || 0
      ),
    }));
  }, [analytics]);


  // ==========================================================
  // DAILY ANALYTICS DATA
  // ==========================================================

  const dailyData = useMemo(() => {
    if (!analytics?.daily_statistics) {
      return [];
    }

    return analytics.daily_statistics.map((item) => ({
      date: item.date,

      total: Number(
        item.inspections || 0
      ),

      passed: Number(
        item.passed || 0
      ),

      rejected: Number(
        item.rejected || 0
      ),

      defects: Number(
        item.defect_regions || 0
      ),

      affectedArea: Number(
        item.average_affected_area || 0
      ),
    }));
  }, [analytics]);


  // ==========================================================
  // SEVERITY DISTRIBUTION DATA
  // ==========================================================

  const severityData = useMemo(() => {
    if (!analytics?.severity_statistics) {
      return [];
    }

    return analytics.severity_statistics.map((item) => ({
      name: item.severity,

      value: Number(
        item.count || 0
      ),
    }));
  }, [analytics]);


  // ==========================================================
  // QUALITY DISTRIBUTION DATA
  // ==========================================================

  const qualityData = useMemo(
    () => [
      {
        name: "PASS",
        value: Number(
          analytics?.passed || 0
        ),
      },

      {
        name: "REJECT",
        value: Number(
          analytics?.rejected || 0
        ),
      },
    ],
    [analytics]
  );


  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <section className="page analytics-page">
        <div className="analytics-loading">
          <RefreshCw
            size={34}
            className="loading-spinner"
          />

          <strong>
            Loading Quality Analytics
          </strong>

          <span>
            Analyzing VisionGuard inspection records...
          </span>
        </div>
      </section>
    );
  }


  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (error) {
    return (
      <section className="page analytics-page">
        <div className="analytics-loading analytics-error">
          <AlertTriangle size={35} />

          <strong>
            Analytics unavailable
          </strong>

          <span>
            {error}
          </span>

          <button
            className="new-inspection-button"
            onClick={loadAnalytics}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </section>
    );
  }


  // ==========================================================
  // MAIN ANALYTICS VALUES
  // ==========================================================

  const totalInspections = Number(
    analytics?.total_inspections || 0
  );

  const passed = Number(
    analytics?.passed || 0
  );

  const rejected = Number(
    analytics?.rejected || 0
  );

  const passRate = Number(
    analytics?.pass_rate || 0
  );

  const rejectRate = Number(
    analytics?.reject_rate || 0
  );

  const averageAffectedArea = Number(
    analytics?.average_affected_area || 0
  );

  const averageProductConfidence = Number(
    analytics?.average_product_confidence || 0
  );

  const totalDefectRegions = Number(
    analytics?.total_defect_regions || 0
  );

  const defectiveInspections = Number(
    analytics?.defective_inspections || 0
  );

  const defectDetectionRate = Number(
    analytics?.defect_detection_rate || 0
  );

  const worstProduct =
    analytics?.worst_product;

  const bestProduct =
    analytics?.best_product;

  const mostInspectedProduct =
    analytics?.most_inspected_product;


  // ==========================================================
  // ANALYTICS PAGE UI
  // ==========================================================

  return (
    <section className="page analytics-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-heading analytics-heading">
        <div>
          <p className="eyebrow">
            PRODUCTION INTELLIGENCE
          </p>

          <h1>
            Quality Analytics
          </h1>

          <p>
            Detailed analysis of product quality,
            defects, severity and AI inspection
            performance.
          </p>
        </div>

        <div className="analytics-heading-actions">
          <div className="live-status">
            <span className="pulse-dot"></span>
            Live Analytics
          </div>

          <button
            className="dashboard-refresh-button"
            onClick={loadAnalytics}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>


      {/* ======================================================
          MAIN KPI CARDS
      ====================================================== */}

      <div className="analytics-kpi-grid">

        <AnalyticsCard
          icon={Activity}
          title="Total Inspections"
          value={totalInspections.toLocaleString()}
          subtitle="All stored inspections"
          variant="blue"
        />

        <AnalyticsCard
          icon={CheckCircle2}
          title="Quality Pass Rate"
          value={`${passRate.toFixed(2)}%`}
          subtitle={`${passed} products passed`}
          variant="green"
        />

        <AnalyticsCard
          icon={XCircle}
          title="Reject Rate"
          value={`${rejectRate.toFixed(2)}%`}
          subtitle={`${rejected} products rejected`}
          variant="red"
        />

        <AnalyticsCard
          icon={Target}
          title="Defect Detection Rate"
          value={`${defectDetectionRate.toFixed(2)}%`}
          subtitle={`${defectiveInspections} defective inspections`}
          variant="orange"
        />

      </div>


      {/* ======================================================
          SECONDARY KPI CARDS
      ====================================================== */}

      <div className="analytics-secondary-grid">

        <AnalyticsCard
          icon={Gauge}
          title="Avg. AI Confidence"
          value={`${averageProductConfidence.toFixed(2)}%`}
          subtitle="Product verification confidence"
          variant="purple"
        />

        <AnalyticsCard
          icon={ScanLine}
          title="Avg. Affected Area"
          value={`${averageAffectedArea.toFixed(3)}%`}
          subtitle="Average inspected defect area"
          variant="orange"
        />

        <AnalyticsCard
          icon={Layers3}
          title="Defect Regions"
          value={totalDefectRegions.toLocaleString()}
          subtitle="Total regions detected"
          variant="red"
        />

        <AnalyticsCard
          icon={PackageSearch}
          title="Products Analyzed"
          value={productData.length}
          subtitle="Unique product categories"
          variant="blue"
        />

      </div>


      {/* ======================================================
          QUALITY TREND
      ====================================================== */}

      <div className="analytics-wide-panel">

        <div className="analytics-panel-header">
          <div>
            <span className="analytics-panel-icon">
              <TrendingUp size={18} />
            </span>

            <div>
              <h3>
                Inspection Quality Trend
              </h3>

              <p>
                Total, passed and rejected inspections
                across active inspection days.
              </p>
            </div>
          </div>

          <span className="real-data-badge">
            DATABASE
          </span>
        </div>

        <div className="analytics-large-chart">
          {dailyData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={dailyData}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e8edf5"
                />

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#2563eb"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="passed"
                  name="Passed"
                  stroke="#16a34a"
                  strokeWidth={2}
                />

                <Line
                  type="monotone"
                  dataKey="rejected"
                  name="Rejected"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="analytics-empty">
              <BarChart3 size={31} />

              <strong>
                No trend data yet
              </strong>

              <span>
                Complete inspections to generate
                quality trends.
              </span>
            </div>
          )}
        </div>
      </div>


      {/* ======================================================
          QUALITY + SEVERITY DISTRIBUTION
      ====================================================== */}

      <div className="analytics-two-column">

        {/* QUALITY DISTRIBUTION */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">
            <div>
              <span className="analytics-panel-icon green">
                <ShieldCheck size={18} />
              </span>

              <div>
                <h3>
                  Quality Distribution
                </h3>

                <p>
                  PASS vs REJECT inspections
                </p>
              </div>
            </div>
          </div>

          <div className="analytics-donut">
            {totalInspections > 0 ? (
              <>
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={qualityData}
                      dataKey="value"
                      innerRadius={75}
                      outerRadius={105}
                      paddingAngle={4}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="#16a34a" />
                      <Cell fill="#ef4444" />
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="analytics-donut-center">
                  <strong>
                    {passRate.toFixed(1)}%
                  </strong>

                  <span>
                    Pass Rate
                  </span>
                </div>
              </>
            ) : (
              <div className="analytics-empty">
                <ShieldCheck size={30} />

                <strong>
                  No quality data
                </strong>
              </div>
            )}
          </div>

          <div className="analytics-distribution-footer">
            <div>
              <span className="analytics-dot green"></span>

              <div>
                <small>
                  Passed
                </small>

                <strong>
                  {passed}
                </strong>
              </div>
            </div>

            <div>
              <span className="analytics-dot red"></span>

              <div>
                <small>
                  Rejected
                </small>

                <strong>
                  {rejected}
                </strong>
              </div>
            </div>
          </div>
        </div>


        {/* SEVERITY DISTRIBUTION */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">
            <div>
              <span className="analytics-panel-icon orange">
                <AlertTriangle size={18} />
              </span>

              <div>
                <h3>
                  Severity Distribution
                </h3>

                <p>
                  NONE, MINOR and SEVERE results
                </p>
              </div>
            </div>
          </div>

          <div className="analytics-donut">
            {totalInspections > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={severityData}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#16a34a" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="analytics-empty">
                <AlertTriangle size={30} />

                <strong>
                  No severity data
                </strong>
              </div>
            )}
          </div>

          <div className="analytics-severity-legend">
            {severityData.map((item) => (
              <div key={item.name}>
                <span
                  className={`analytics-dot ${item.name.toLowerCase()}`}
                ></span>

                <small>
                  {item.name}
                </small>

                <strong>
                  {item.value}
                </strong>
              </div>
            ))}
          </div>
        </div>

      </div>


      {/* ======================================================
          PRODUCT INSPECTION VOLUME
      ====================================================== */}

      <div className="analytics-wide-panel">

        <div className="analytics-panel-header">
          <div>
            <span className="analytics-panel-icon">
              <PackageSearch size={18} />
            </span>

            <div>
              <h3>
                Inspection Volume by Product
              </h3>

              <p>
                Number of PASS and REJECT inspections
                for each product category.
              </p>
            </div>
          </div>
        </div>

        <div className="analytics-product-chart">
          {productData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={productData}
                margin={{
                  top: 10,
                  right: 15,
                  left: 0,
                  bottom: 30,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e8edf5"
                />

                <XAxis
                  dataKey="product"
                  axisLine={false}
                  tickLine={false}
                  fontSize={9}
                  angle={-20}
                  textAnchor="end"
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="passed"
                  name="Passed"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="rejected"
                  name="Rejected"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="analytics-empty">
              <PackageSearch size={31} />

              <strong>
                No product statistics
              </strong>
            </div>
          )}
        </div>
      </div>


      {/* ======================================================
          PRODUCT DEFECT ANALYTICS
      ====================================================== */}

      <div className="analytics-two-column">

        {/* REJECT RATE */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">
            <div>
              <span className="analytics-panel-icon red">
                <XCircle size={18} />
              </span>

              <div>
                <h3>
                  Reject Rate by Product
                </h3>

                <p>
                  Percentage of rejected inspections
                </p>
              </div>
            </div>
          </div>

          <div className="analytics-medium-chart">
            {productData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={productData}
                  layout="vertical"
                  margin={{
                    left: 20,
                    right: 25,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={false}
                    stroke="#e8edf5"
                  />

                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    fontSize={9}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="product"
                    width={75}
                    fontSize={9}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(2)}%`,
                      "Reject Rate",
                    ]}
                  />

                  <Bar
                    dataKey="rejectRate"
                    fill="#ef4444"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="analytics-empty">
                <BarChart3 size={30} />

                <strong>
                  No product data
                </strong>
              </div>
            )}
          </div>
        </div>


        {/* AFFECTED AREA */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">
            <div>
              <span className="analytics-panel-icon orange">
                <ScanLine size={18} />
              </span>

              <div>
                <h3>
                  Average Affected Area
                </h3>

                <p>
                  Average defect percentage by product
                </p>
              </div>
            </div>
          </div>

          <div className="analytics-medium-chart">
            {productData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={productData}
                  layout="vertical"
                  margin={{
                    left: 20,
                    right: 25,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={false}
                    stroke="#e8edf5"
                  />

                  <XAxis
                    type="number"
                    fontSize={9}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="product"
                    width={75}
                    fontSize={9}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(3)}%`,
                      "Affected Area",
                    ]}
                  />

                  <Bar
                    dataKey="affectedArea"
                    fill="#f59e0b"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="analytics-empty">
                <ScanLine size={30} />

                <strong>
                  No affected-area data
                </strong>
              </div>
            )}
          </div>
        </div>

      </div>


      {/* ======================================================
          PRODUCT INSIGHTS
      ====================================================== */}

      <div className="analytics-insights-grid">

        {/* MOST INSPECTED */}

        <div className="analytics-insight-card">
          <div className="analytics-insight-icon blue">
            <PackageSearch size={20} />
          </div>

          <span>
            Most Inspected Product
          </span>

          <strong>
            {mostInspectedProduct?.product_category ||
              "No Data"}
          </strong>

          <small>
            {mostInspectedProduct
              ? `${mostInspectedProduct.total} inspections`
              : "Run more inspections"}
          </small>
        </div>


        {/* BEST PRODUCT */}

        <div className="analytics-insight-card">
          <div className="analytics-insight-icon green">
            <CheckCircle2 size={20} />
          </div>

          <span>
            Best Performing Product
          </span>

          <strong>
            {bestProduct?.product_category ||
              "No Data"}
          </strong>

          <small>
            {bestProduct
              ? `${Number(
                  bestProduct.pass_rate || 0
                ).toFixed(2)}% pass rate`
              : "Not enough data"}
          </small>
        </div>


        {/* WORST PRODUCT */}

        <div className="analytics-insight-card">
          <div className="analytics-insight-icon red">
            <AlertTriangle size={20} />
          </div>

          <span>
            Highest Risk Product
          </span>

          <strong>
            {worstProduct?.product_category ||
              "No Rejects"}
          </strong>

          <small>
            {worstProduct
              ? `${Number(
                  worstProduct.reject_rate || 0
                ).toFixed(2)}% reject rate`
              : "No rejected products detected"}
          </small>
        </div>


        {/* AI CONFIDENCE */}

        <div className="analytics-insight-card">
          <div className="analytics-insight-icon purple">
            <Cpu size={20} />
          </div>

          <span>
            Average AI Confidence
          </span>

          <strong>
            {averageProductConfidence.toFixed(2)}%
          </strong>

          <small>
            Product classification confidence
          </small>
        </div>

      </div>


      {/* ======================================================
          PRODUCT ANALYTICS TABLE
      ====================================================== */}

      <div className="analytics-wide-panel">

        <div className="analytics-panel-header">
          <div>
            <span className="analytics-panel-icon">
              <BarChart3 size={18} />
            </span>

            <div>
              <h3>
                Product Quality Breakdown
              </h3>

              <p>
                Complete quality statistics for every
                inspected product category.
              </p>
            </div>
          </div>
        </div>

        {productData.length > 0 ? (
          <div className="analytics-table-wrapper">

            <table className="analytics-table">

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Inspections</th>
                  <th>Passed</th>
                  <th>Rejected</th>
                  <th>Pass Rate</th>
                  <th>Reject Rate</th>
                  <th>Defect Regions</th>
                  <th>Avg. Area</th>
                  <th>AI Confidence</th>
                </tr>
              </thead>

              <tbody>
                {productData.map((product) => (
                  <tr key={product.product}>

                    <td>
                      <strong>
                        {product.product}
                      </strong>
                    </td>

                    <td>
                      {product.total}
                    </td>

                    <td className="analytics-pass-value">
                      {product.passed}
                    </td>

                    <td className="analytics-reject-value">
                      {product.rejected}
                    </td>

                    <td>
                      {product.passRate.toFixed(2)}%
                    </td>

                    <td>
                      {product.rejectRate.toFixed(2)}%
                    </td>

                    <td>
                      {product.defectRegions}
                    </td>

                    <td>
                      {product.affectedArea.toFixed(3)}%
                    </td>

                    <td>
                      {product.confidence.toFixed(2)}%
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        ) : (
          <div className="analytics-empty analytics-table-empty">

            <BarChart3 size={30} />

            <strong>
              No product analytics yet
            </strong>

            <span>
              Complete product inspections to populate
              this table.
            </span>

          </div>
        )}
      </div>

    </section>
  );
}

export default Analytics;