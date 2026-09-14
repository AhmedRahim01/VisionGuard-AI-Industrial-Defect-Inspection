import { useEffect, useState } from "react";
import {
  History,
  Search,
  RefreshCw,
  LoaderCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ScanLine,
  Gauge,
  CalendarDays,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/inspections";

function InspectionHistory() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadInspections = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail || "Failed to load inspection history."
        );
      }

      setInspections(data.inspections || []);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Could not connect to VisionGuard backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const filteredInspections = inspections.filter((inspection) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      inspection.inspection_code
        ?.toLowerCase()
        .includes(searchText) ||
      inspection.product_category
        ?.toLowerCase()
        .includes(searchText) ||
      inspection.predicted_product
        ?.toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" ||
      inspection.decision === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString.replace(" ", "T"));

    return date.toLocaleString();
  };

  return (
    <section className="page history-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">QUALITY RECORDS</p>
          <h1>Inspection History</h1>
          <p>
            Review all AI inspections stored by VisionGuard.
          </p>
        </div>

        <button
          className="new-inspection-button"
          onClick={loadInspections}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="history-summary-grid">
        <div className="history-summary-card">
          <History size={20} />
          <div>
            <span>Total Records</span>
            <strong>{inspections.length}</strong>
          </div>
        </div>

        <div className="history-summary-card">
          <CheckCircle2 size={20} />
          <div>
            <span>Passed</span>
            <strong>
              {
                inspections.filter(
                  (item) => item.decision === "PASS"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="history-summary-card">
          <XCircle size={20} />
          <div>
            <span>Rejected</span>
            <strong>
              {
                inspections.filter(
                  (item) => item.decision === "REJECT"
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      <div className="panel history-panel">
        <div className="history-toolbar">
          <div className="history-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by inspection ID or product..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="ALL">All Decisions</option>
            <option value="PASS">Passed</option>
            <option value="REJECT">Rejected</option>
          </select>
        </div>

        {loading && (
          <div className="history-state">
            <LoaderCircle
              size={28}
              className="loading-spinner"
            />
            <strong>Loading inspection history...</strong>
          </div>
        )}

        {!loading && error && (
          <div className="history-state error">
            <AlertTriangle size={28} />
            <strong>{error}</strong>
          </div>
        )}

        {!loading &&
          !error &&
          filteredInspections.length === 0 && (
            <div className="history-state">
              <ScanLine size={32} />
              <strong>No inspections found</strong>
              <span>
                Completed inspections will appear here.
              </span>
            </div>
          )}

        {!loading &&
          !error &&
          filteredInspections.length > 0 && (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Inspection</th>
                    <th>Product</th>
                    <th>AI Product</th>
                    <th>Confidence</th>
                    <th>Defects</th>
                    <th>Affected Area</th>
                    <th>Severity</th>
                    <th>Decision</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInspections.map((inspection) => (
                    <tr key={inspection.id}>
                      <td>
                        <strong className="inspection-code">
                          {inspection.inspection_code}
                        </strong>
                      </td>

                      <td>
                        {inspection.product_category || "—"}
                      </td>

                      <td>
                        {inspection.predicted_product || "—"}
                      </td>

                      <td>
                        <span className="table-value-with-icon">
                          <Gauge size={14} />

                          {Number(
                            inspection.product_confidence || 0
                          ).toFixed(2)}
                          %
                        </span>
                      </td>

                      <td>
                        {inspection.defect_regions ?? 0}
                      </td>

                      <td>
                        {Number(
                          inspection.affected_area || 0
                        ).toFixed(2)}
                        %
                      </td>

                      <td>
                        <span
                          className={`severity-history ${
                            inspection.severity || "NONE"
                          }`}
                        >
                          {inspection.severity || "NONE"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            inspection.decision === "PASS"
                              ? "pass"
                              : "reject"
                          }`}
                        >
                          {inspection.decision}
                        </span>
                      </td>

                      <td>
                        <span className="table-value-with-icon">
                          <CalendarDays size={14} />
                          {formatDate(
                            inspection.created_at
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </section>
  );
}

export default InspectionHistory;