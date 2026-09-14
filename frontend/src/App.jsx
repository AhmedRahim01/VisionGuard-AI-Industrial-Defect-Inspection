import { useState } from "react";
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
import "./App.css";

const trendData = [
  { day: "Mon", inspections: 118 },
  { day: "Tue", inspections: 145 },
  { day: "Wed", inspections: 132 },
  { day: "Thu", inspections: 184 },
  { day: "Fri", inspections: 168 },
  { day: "Sat", inspections: 206 },
  { day: "Sun", inspections: 192 },
];

const qualityData = [
  { name: "Passed", value: 88.6 },
  { name: "Rejected", value: 11.4 },
];

const recentInspections = [
  {
    id: "VG-1248",
    product: "Metal Nut",
    time: "10:42 PM",
    affected: "0.00%",
    confidence: "—",
    status: "PASS",
  },
  {
    id: "VG-1247",
    product: "Capsule",
    time: "10:38 PM",
    affected: "8.31%",
    confidence: "96.4%",
    status: "REJECT",
  },
  {
    id: "VG-1246",
    product: "Tile",
    time: "10:31 PM",
    affected: "2.14%",
    confidence: "91.7%",
    status: "REJECT",
  },
  {
    id: "VG-1245",
    product: "Hazelnut",
    time: "10:24 PM",
    affected: "0.00%",
    confidence: "—",
    status: "PASS",
  },
];

function SidebarItem({ icon: Icon, label, active, onClick }) {
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

function StatCard({ title, value, change, icon: Icon, variant }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${variant}`}>
        <Icon size={21} />
      </div>

      <div className="stat-card-top">
        <span>{title}</span>
        <ArrowUpRight size={17} />
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-change">
        <TrendingUp size={14} />
        {change}
      </div>
    </div>
  );
}

function Dashboard({ setCurrentPage }) {
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">QUALITY CONTROL CENTER</p>
          <h1>Industrial Quality Overview</h1>
          <p>
            Real-time AI inspection performance and production quality
            monitoring.
          </p>
        </div>

        <div className="live-status">
          <span className="pulse-dot"></span>
          Live monitoring
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Inspections"
          value="1,284"
          change="+12.4% this week"
          icon={Activity}
          variant="blue"
        />

        <StatCard
          title="Products Passed"
          value="1,137"
          change="+8.2% this week"
          icon={PackageCheck}
          variant="green"
        />

        <StatCard
          title="Products Rejected"
          value="147"
          change="11.4% reject rate"
          icon={TriangleAlert}
          variant="red"
        />

        <StatCard
          title="Quality Pass Rate"
          value="88.6%"
          change="+2.1% improvement"
          icon={ShieldCheck}
          variant="purple"
        />
      </div>

      <div className="charts-grid">
        <div className="panel trend-panel">
          <div className="panel-header">
            <div>
              <h3>Inspection Activity</h3>
              <p>Inspection volume during the last 7 days</p>
            </div>

            <select defaultValue="7">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
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
          </div>
        </div>

        <div className="panel quality-panel">
          <div className="panel-header">
            <div>
              <h3>Quality Distribution</h3>
              <p>Current inspection results</p>
            </div>
          </div>

          <div className="donut-wrapper">
            <ResponsiveContainer width="100%" height={210}>
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
              <strong>88.6%</strong>
              <span>Pass Rate</span>
            </div>
          </div>

          <div className="quality-legend">
            <div>
              <span className="legend-dot passed"></span>
              <div>
                <small>Passed</small>
                <strong>1,137</strong>
              </div>
            </div>

            <div>
              <span className="legend-dot rejected"></span>
              <div>
                <small>Rejected</small>
                <strong>147</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="panel recent-panel">
          <div className="panel-header">
            <div>
              <h3>Recent Inspections</h3>
              <p>Latest AI-powered quality inspections</p>
            </div>

            <button className="text-button">
              View all
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="inspection-table">
            <div className="table-row table-head">
              <span>Inspection</span>
              <span>Product</span>
              <span>Affected Area</span>
              <span>Confidence</span>
              <span>Status</span>
            </div>

            {recentInspections.map((inspection) => (
              <div className="table-row" key={inspection.id}>
                <span>
                  <strong>{inspection.id}</strong>
                  <small>{inspection.time}</small>
                </span>

                <span>{inspection.product}</span>
                <span>{inspection.affected}</span>
                <span>{inspection.confidence}</span>

                <span>
                  <span
                    className={`status-badge ${
                      inspection.status === "PASS"
                        ? "pass"
                        : "reject"
                    }`}
                  >
                    {inspection.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel model-panel">
          <div className="model-icon">
            <Cpu size={28} />
          </div>

          <span className="model-label">ACTIVE AI MODEL</span>

          <h3>VisionGuard V4</h3>
          <p>YOLOv8s Segmentation</p>

          <div className="model-metrics">
            <div>
              <span>Accuracy</span>
              <strong>95.50%</strong>
            </div>

            <div>
              <span>Recall</span>
              <strong>96.30%</strong>
            </div>

            <div>
              <span>F1 Score</span>
              <strong>95.54%</strong>
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

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ScanLine size={25} />
          </div>

          <div>
            <h2>VisionGuard</h2>
            <span>Industrial AI</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={currentPage === "dashboard"}
            onClick={() => setCurrentPage("dashboard")}
          />

          <SidebarItem
            icon={ScanLine}
            label="New Inspection"
            active={currentPage === "inspection"}
            onClick={() => setCurrentPage("inspection")}
          />

          <SidebarItem
            icon={History}
            label="Inspection History"
            active={currentPage === "history"}
            onClick={() => setCurrentPage("history")}
          />

          <SidebarItem
            icon={BarChart3}
            label="Analytics"
            active={currentPage === "analytics"}
            onClick={() => setCurrentPage("analytics")}
          />

          <SidebarItem
            icon={FileText}
            label="Reports"
            active={currentPage === "reports"}
            onClick={() => setCurrentPage("reports")}
          />
        </nav>

        <div className="nav-label secondary">SYSTEM</div>

        <nav className="sidebar-nav">
          <SidebarItem
            icon={Settings}
            label="Settings"
            active={currentPage === "settings"}
            onClick={() => setCurrentPage("settings")}
          />
        </nav>

        <div className="system-card">
          <div className="system-card-title">
            <span className="status-dot"></span>
            AI System Online
          </div>

          <p>YOLOv8s-seg V4</p>

          <div className="system-detail">
            <span>Threshold</span>
            <strong>0.090</strong>
          </div>

          <div className="system-detail">
            <span>Model F1</span>
            <strong>95.54%</strong>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="avatar">VG</div>

          <div>
            <strong>VisionGuard Admin</strong>
            <span>Quality Control</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input placeholder="Search inspections..." />
            <span>⌘ K</span>
          </div>

          <div className="topbar-actions">
            <button className="icon-button">
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            <button
              className="new-inspection-button"
              onClick={() => setCurrentPage("inspection")}
            >
              <ScanLine size={18} />
              New Inspection
            </button>
          </div>
        </header>

        {currentPage === "dashboard" && (
          <Dashboard setCurrentPage={setCurrentPage} />
        )}

        {currentPage === "inspection" && <NewInspection />}

        {currentPage === "history" && (
          <section className="page coming-page">
            <History size={38} />
            <h1>Inspection History</h1>
            <p>This module will display all saved inspections.</p>
          </section>
        )}

        {currentPage === "analytics" && (
          <section className="page coming-page">
            <BarChart3 size={38} />
            <h1>Analytics</h1>
            <p>Advanced production quality analytics will appear here.</p>
          </section>
        )}

        {currentPage === "reports" && (
          <section className="page coming-page">
            <FileText size={38} />
            <h1>Reports</h1>
            <p>Generated inspection reports will appear here.</p>
          </section>
        )}

        {currentPage === "settings" && (
          <section className="page coming-page">
            <Settings size={38} />
            <h1>Settings</h1>
            <p>VisionGuard system configuration.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;