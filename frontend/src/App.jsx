import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  ScanLine,
  History,
  BarChart3,
  FileText,
  Settings,
  Bell,
  Search,
  TrendingUp,
  ShieldCheck,
  TriangleAlert,
  PackageCheck,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Cpu,
  RefreshCw,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import NewInspection from "./pages/NewInspection";
import InspectionHistory from "./pages/InspectionHistory";
import Analytics from "./pages/Analytics";

import "./App.css";


const API_BASE_URL = "http://127.0.0.1:8000";


// ============================================================
// SIDEBAR ITEM
// ============================================================

function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      className={`sidebar-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <Icon size={19} strokeWidth={1.9} />
      <span>{label}</span>
    </button>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  variant,
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${variant}`}>
        <Icon size={21} />
      </div>

      <div className="stat-card-top">
        <span>{title}</span>
        <ArrowUpRight size={17} />
      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-change">
        <TrendingUp size={14} />
        {change}
      </div>
    </div>
  );
}


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({ setCurrentPage }) {
  const [dashboardData, setDashboardData] =
    useState(null);

  const [
    recentInspections,
    setRecentInspections,
  ] = useState([]);

  const [
    dashboardLoading,
    setDashboardLoading,
  ] = useState(true);

  const [
    dashboardError,
    setDashboardError,
  ] = useState("");


  // ==========================================================
  // LOAD REAL DATABASE DATA
  // ==========================================================

  const loadDashboard = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError("");

      const [
        dashboardResponse,
        historyResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/dashboard`
        ),

        fetch(
          `${API_BASE_URL}/api/inspections?limit=5`
        ),
      ]);

      const dashboardJson =
        await dashboardResponse.json();

      const historyJson =
        await historyResponse.json();

      if (!dashboardResponse.ok) {
        throw new Error(
          dashboardJson.detail ||
            "Failed to load dashboard."
        );
      }

      if (!historyResponse.ok) {
        throw new Error(
          historyJson.detail ||
            "Failed to load recent inspections."
        );
      }

      setDashboardData(
        dashboardJson
      );

      setRecentInspections(
        historyJson.inspections || []
      );
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      setDashboardError(
        error.message ||
          "Could not connect to VisionGuard backend."
      );
    } finally {
      setDashboardLoading(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDashboard();
  }, []);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (dashboardLoading) {
    return (
      <section className="page coming-page">
        <Activity
          size={38}
          className="loading-spinner"
        />

        <h1>
          Loading Dashboard
        </h1>

        <p>
          Reading real VisionGuard inspection data...
        </p>
      </section>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (dashboardError) {
    return (
      <section className="page coming-page">
        <TriangleAlert size={38} />

        <h1>
          Dashboard Error
        </h1>

        <p>
          {dashboardError}
        </p>

        <button
          className="new-inspection-button"
          onClick={loadDashboard}
        >
          <RefreshCw size={17} />
          Try Again
        </button>
      </section>
    );
  }


  // ==========================================================
  // REAL STATISTICS
  // ==========================================================

  const total =
    Number(
      dashboardData?.total_inspections || 0
    );

  const passed =
    Number(
      dashboardData?.passed || 0
    );

  const rejected =
    Number(
      dashboardData?.rejected || 0
    );

  const passRate =
    Number(
      dashboardData?.pass_rate || 0
    );

  const rejectRate =
    Number(
      dashboardData?.reject_rate || 0
    );

  const severe =
    Number(
      dashboardData?.severe || 0
    );

  const minor =
    Number(
      dashboardData?.minor || 0
    );


  // ==========================================================
  // REAL TREND DATA
  // ==========================================================

  const trendData =
    dashboardData?.daily_statistics?.map(
      (item) => ({
        day: item.date,

        inspections:
          Number(item.inspections || 0),

        passed:
          Number(item.passed || 0),

        rejected:
          Number(item.rejected || 0),
      })
    ) || [];


  // ==========================================================
  // REAL QUALITY DISTRIBUTION
  // ==========================================================

  const qualityData = [
    {
      name: "Passed",
      value: passed,
    },
    {
      name: "Rejected",
      value: rejected,
    },
  ];


  // ==========================================================
  // DASHBOARD UI
  // ==========================================================

  return (
    <section className="page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            QUALITY CONTROL CENTER
          </p>

          <h1>
            Industrial Quality Overview
          </h1>

          <p>
            Real-time quality statistics generated from
            VisionGuard inspection records.
          </p>
        </div>

        <div className="dashboard-heading-actions">
          <button
            className="dashboard-refresh-button"
            onClick={loadDashboard}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <div className="live-status">
            <span className="pulse-dot"></span>
            Live database
          </div>
        </div>
      </div>


      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="stats-grid">
        <StatCard
          title="Total Inspections"
          value={total.toLocaleString()}
          change="Saved inspections"
          icon={Activity}
          variant="blue"
        />

        <StatCard
          title="Products Passed"
          value={passed.toLocaleString()}
          change={`${passRate.toFixed(
            2
          )}% pass rate`}
          icon={PackageCheck}
          variant="green"
        />

        <StatCard
          title="Products Rejected"
          value={rejected.toLocaleString()}
          change={`${rejectRate.toFixed(
            2
          )}% reject rate`}
          icon={TriangleAlert}
          variant="red"
        />

        <StatCard
          title="Quality Pass Rate"
          value={`${passRate.toFixed(2)}%`}
          change={`${severe} severe • ${minor} minor`}
          icon={ShieldCheck}
          variant="purple"
        />
      </div>


      {/* ======================================================
          CHARTS
      ====================================================== */}

      <div className="charts-grid">

        {/* ACTIVITY CHART */}

        <div className="panel trend-panel">
          <div className="panel-header">
            <div>
              <h3>
                Inspection Activity
              </h3>

              <p>
                Real inspection volume from the
                VisionGuard database
              </p>
            </div>

            <span className="real-data-badge">
              REAL DATA
            </span>
          </div>

          <div className="chart-container">
            {trendData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={trendData}
                >
                  <defs>
                    <linearGradient
                      id="inspectionGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#2563eb"
                        stopOpacity={0.25}
                      />

                      <stop
                        offset="95%"
                        stopColor="#2563eb"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#e8edf5"
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="inspections"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#inspectionGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="dashboard-empty-state">
                <Activity size={28} />

                <strong>
                  No inspection activity yet
                </strong>

                <span>
                  Run an inspection to populate this chart.
                </span>
              </div>
            )}
          </div>
        </div>


        {/* QUALITY DONUT */}

        <div className="panel quality-panel">
          <div className="panel-header">
            <div>
              <h3>
                Quality Distribution
              </h3>

              <p>
                PASS vs REJECT inspection results
              </p>
            </div>
          </div>

          <div className="donut-wrapper">
            {total > 0 ? (
              <>
                <ResponsiveContainer
                  width="100%"
                  height={210}
                >
                  <PieChart>
                    <Pie
                      data={qualityData}
                      dataKey="value"
                      innerRadius={68}
                      outerRadius={90}
                      paddingAngle={4}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="#16a34a" />
                      <Cell fill="#ef4444" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="donut-center">
                  <strong>
                    {passRate.toFixed(1)}%
                  </strong>

                  <span>
                    Pass Rate
                  </span>
                </div>
              </>
            ) : (
              <div className="dashboard-empty-state">
                <ShieldCheck size={28} />

                <strong>
                  No quality results
                </strong>

                <span>
                  Inspection results will appear here.
                </span>
              </div>
            )}
          </div>

          <div className="quality-legend">
            <div>
              <span className="legend-dot passed"></span>

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
              <span className="legend-dot rejected"></span>

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
      </div>


      {/* ======================================================
          RECENT + MODEL
      ====================================================== */}

      <div className="bottom-grid">

        {/* RECENT INSPECTIONS */}

        <div className="panel recent-panel">
          <div className="panel-header">
            <div>
              <h3>
                Recent Inspections
              </h3>

              <p>
                Latest saved VisionGuard inspections
              </p>
            </div>

            <button
              className="text-button"
              onClick={() =>
                setCurrentPage("history")
              }
            >
              View all
              <ChevronRight size={16} />
            </button>
          </div>

          {recentInspections.length === 0 ? (
            <div className="dashboard-empty-state recent-empty">
              <ScanLine size={28} />

              <strong>
                No inspections saved yet
              </strong>

              <button
                className="text-button"
                onClick={() =>
                  setCurrentPage("inspection")
                }
              >
                Run first inspection
                <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <div className="inspection-table">

              <div className="table-row table-head">
                <span>Inspection</span>
                <span>Product</span>
                <span>Affected Area</span>
                <span>Confidence</span>
                <span>Status</span>
              </div>

              {recentInspections.map(
                (inspection) => (
                  <div
                    className="table-row"
                    key={inspection.id}
                  >
                    <span>
                      <strong>
                        {
                          inspection.inspection_code
                        }
                      </strong>

                      <small>
                        {
                          inspection.created_at
                        }
                      </small>
                    </span>

                    <span>
                      {
                        inspection.product_category
                      }
                    </span>

                    <span>
                      {Number(
                        inspection.affected_area || 0
                      ).toFixed(2)}
                      %
                    </span>

                    <span>
                      {inspection.defect_detected
                        ? `${Number(
                            inspection.max_confidence ||
                              0
                          ).toFixed(2)}%`
                        : "—"}
                    </span>

                    <span>
                      <span
                        className={`status-badge ${
                          inspection.decision ===
                          "PASS"
                            ? "pass"
                            : "reject"
                        }`}
                      >
                        {
                          inspection.decision
                        }
                      </span>
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>


        {/* MODEL INFORMATION */}

        <div className="panel model-panel">
          <div className="model-icon">
            <Cpu size={28} />
          </div>

          <span className="model-label">
            ACTIVE AI MODEL
          </span>

          <h3>
            VisionGuard V4
          </h3>

          <p>
            YOLOv8s Segmentation
          </p>

          <div className="model-metrics">
            <div>
              <span>
                Validation Accuracy
              </span>

              <strong>
                95.50%
              </strong>
            </div>

            <div>
              <span>
                Validation Recall
              </span>

              <strong>
                95.24%
              </strong>
            </div>

            <div>
              <span>
                Validation F1
              </span>

              <strong>
                95.49%
              </strong>
            </div>
          </div>

          <div className="model-ready">
            <span className="status-dot"></span>
            Model ready for inspection
          </div>
        </div>
      </div>
    </section>
  );
}


// ============================================================
// MAIN APP
// ============================================================

function App() {
  const [
    currentPage,
    setCurrentPage,
  ] = useState("dashboard");

  return (
    <div className="app-shell">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        {/* BRAND */}

        <div className="brand">
          <div className="brand-icon">
            <ScanLine size={25} />
          </div>

          <div>
            <h2>
              VisionGuard
            </h2>

            <span>
              Industrial AI
            </span>
          </div>
        </div>


        {/* WORKSPACE */}

        <div className="nav-label">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={
              currentPage === "dashboard"
            }
            onClick={() =>
              setCurrentPage("dashboard")
            }
          />

          <SidebarItem
            icon={ScanLine}
            label="New Inspection"
            active={
              currentPage === "inspection"
            }
            onClick={() =>
              setCurrentPage("inspection")
            }
          />

          <SidebarItem
            icon={History}
            label="Inspection History"
            active={
              currentPage === "history"
            }
            onClick={() =>
              setCurrentPage("history")
            }
          />

          <SidebarItem
            icon={BarChart3}
            label="Analytics"
            active={
              currentPage === "analytics"
            }
            onClick={() =>
              setCurrentPage("analytics")
            }
          />

          <SidebarItem
            icon={FileText}
            label="Reports"
            active={
              currentPage === "reports"
            }
            onClick={() =>
              setCurrentPage("reports")
            }
          />
        </nav>


        {/* SYSTEM */}

        <div className="nav-label secondary">
          SYSTEM
        </div>

        <nav className="sidebar-nav">
          <SidebarItem
            icon={Settings}
            label="Settings"
            active={
              currentPage === "settings"
            }
            onClick={() =>
              setCurrentPage("settings")
            }
          />
        </nav>


        {/* SYSTEM STATUS */}

        <div className="system-card">
          <div className="system-card-title">
            <span className="status-dot"></span>
            AI System Online
          </div>

          <p>
            YOLOv8s-seg V4
          </p>

          <div className="system-detail">
            <span>
              Threshold
            </span>

            <strong>
              0.090
            </strong>
          </div>

          <div className="system-detail">
            <span>
              Validation F1
            </span>

            <strong>
              95.49%
            </strong>
          </div>
        </div>


        {/* USER */}

        <div className="sidebar-footer">
          <div className="avatar">
            VG
          </div>

          <div>
            <strong>
              VisionGuard Admin
            </strong>

            <span>
              Quality Control
            </span>
          </div>
        </div>
      </aside>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="main-content">

        {/* TOPBAR */}

        <header className="topbar">
          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Search inspections..."
            />

            <span>
              ⌘ K
            </span>
          </div>

          <div className="topbar-actions">
            <button className="icon-button">
              <Bell size={19} />

              <span className="notification-dot"></span>
            </button>

            <button
              className="new-inspection-button"
              onClick={() =>
                setCurrentPage("inspection")
              }
            >
              <ScanLine size={18} />
              New Inspection
            </button>
          </div>
        </header>


        {/* ====================================================
            DASHBOARD
        ==================================================== */}

        {currentPage === "dashboard" && (
          <Dashboard
            setCurrentPage={
              setCurrentPage
            }
          />
        )}


        {/* ====================================================
            NEW INSPECTION
        ==================================================== */}

        {currentPage === "inspection" && (
          <NewInspection />
        )}


        {/* ====================================================
            INSPECTION HISTORY
        ==================================================== */}

        {currentPage === "history" && (
          <InspectionHistory />
        )}


        {/* ====================================================
            ANALYTICS
        ==================================================== */}

        {currentPage === "analytics" && (
          <Analytics />
        )}


        {/* ====================================================
            REPORTS
        ==================================================== */}

        {currentPage === "reports" && (
          <section className="page coming-page">
            <FileText size={38} />

            <h1>
              Reports
            </h1>

            <p>
              Generated inspection reports will
              appear here.
            </p>
          </section>
        )}


        {/* ====================================================
            SETTINGS
        ==================================================== */}

        {currentPage === "settings" && (
          <section className="page coming-page">
            <Settings size={38} />

            <h1>
              Settings
            </h1>

            <p>
              VisionGuard system configuration.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;