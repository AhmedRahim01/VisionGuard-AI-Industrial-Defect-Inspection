import { useEffect, useMemo, useState } from "react";

import {
  FileText,
  Download,
  Search,
  RefreshCw,
  LoaderCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Package,
  ShieldCheck,
  FileDown,
  Mail,
  Send,
  X,
} from "lucide-react";

import "./Reports.css";


const API_BASE_URL = "http://127.0.0.1:8000";


function Reports() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("ALL");
  const [downloadingId, setDownloadingId] = useState(null);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");


  // ==========================================================
  // LOAD INSPECTIONS
  // ==========================================================

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/inspections?limit=500`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail || "Failed to load inspection reports."
        );
      }

      setInspections(data.inspections || []);
    } catch (err) {
      console.error("Reports error:", err);

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
    loadReports();
  }, []);


  // ==========================================================
  // FILTER REPORTS
  // ==========================================================

  const filteredReports = useMemo(() => {
    const query = search.toLowerCase().trim();

    return inspections.filter((inspection) => {
      const matchesSearch =
        !query ||
        inspection.inspection_code
          ?.toLowerCase()
          .includes(query) ||
        inspection.product_category
          ?.toLowerCase()
          .includes(query) ||
        inspection.predicted_product
          ?.toLowerCase()
          .includes(query) ||
        inspection.severity
          ?.toLowerCase()
          .includes(query);

      const matchesDecision =
        decisionFilter === "ALL" ||
        inspection.decision === decisionFilter;

      return matchesSearch && matchesDecision;
    });
  }, [inspections, search, decisionFilter]);


  // ==========================================================
  // SUMMARY VALUES
  // ==========================================================

  const totalReports = inspections.length;

  const passedReports = inspections.filter(
    (inspection) => inspection.decision === "PASS"
  ).length;

  const rejectedReports = inspections.filter(
    (inspection) => inspection.decision === "REJECT"
  ).length;


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "—";
    }

    const date = new Date(
      dateString.replace(" ", "T")
    );

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString();
  };


  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  const downloadReport = async (inspection) => {
    try {
      setDownloadingId(inspection.id);

      const response = await fetch(
        `${API_BASE_URL}/api/inspections/${inspection.id}/report`
      );

      if (!response.ok) {
        let message = "Failed to generate PDF report.";

        try {
          const data = await response.json();

          message =
            data.detail ||
            message;
        } catch {
          // Response was not JSON.
        }

        throw new Error(message);
      }

      const pdfBlob = await response.blob();

      const downloadUrl =
        window.URL.createObjectURL(pdfBlob);

      const link =
        document.createElement("a");

      link.href = downloadUrl;

      link.download =
        `VisionGuard_${
          inspection.inspection_code ||
          `VG-${inspection.id}`
        }_Report.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(
        downloadUrl
      );
    } catch (err) {
      console.error(
        "PDF download error:",
        err
      );

      window.alert(
        err.message ||
          "Could not download the PDF report."
      );
    } finally {
      setDownloadingId(null);
    }
  };


  // ==========================================================
  // OPEN EMAIL MODAL
  // ==========================================================

  const openEmailModal = (inspection) => {
    setSelectedInspection(inspection);
    setRecipientEmail("");
    setEmailError("");
    setEmailSuccess("");
    setEmailModalOpen(true);
  };


  // ==========================================================
  // CLOSE EMAIL MODAL
  // ==========================================================

  const closeEmailModal = () => {
    if (sendingEmail) {
      return;
    }

    setEmailModalOpen(false);
    setSelectedInspection(null);
    setRecipientEmail("");
    setEmailError("");
    setEmailSuccess("");
  };


  // ==========================================================
  // SEND EMAIL REPORT
  // ==========================================================

  const sendEmailReport = async (event) => {
    event.preventDefault();

    if (!selectedInspection) {
      return;
    }

    const cleanEmail = recipientEmail.trim();

    if (!cleanEmail) {
      setEmailError(
        "Please enter the recipient email address."
      );

      return;
    }

    try {
      setSendingEmail(true);
      setEmailError("");
      setEmailSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/api/inspections/${selectedInspection.id}/email`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            recipient_email: cleanEmail,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail ||
            "Failed to send inspection report."
        );
      }

      setEmailSuccess(
        `Report sent successfully to ${cleanEmail}.`
      );

      setRecipientEmail("");
    } catch (err) {
      console.error(
        "Email report error:",
        err
      );

      setEmailError(
        err.message ||
          "Could not send the inspection report."
      );
    } finally {
      setSendingEmail(false);
    }
  };


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <section className="page reports-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="page-heading reports-heading">
        <div>
          <p className="eyebrow">
            QUALITY DOCUMENTATION
          </p>

          <h1>
            Inspection Reports
          </h1>

          <p>
            Generate, download and email professional PDF
            reports for completed VisionGuard inspections.
          </p>
        </div>

        <button
          className="reports-refresh-button"
          onClick={loadReports}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "reports-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="reports-summary-grid">

        <div className="reports-summary-card">
          <div className="reports-summary-icon blue">
            <FileText size={21} />
          </div>

          <div>
            <span>
              Available Reports
            </span>

            <strong>
              {totalReports}
            </strong>

            <small>
              Completed inspections
            </small>
          </div>
        </div>


        <div className="reports-summary-card">
          <div className="reports-summary-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>
              Passed Products
            </span>

            <strong>
              {passedReports}
            </strong>

            <small>
              Quality approved
            </small>
          </div>
        </div>


        <div className="reports-summary-card">
          <div className="reports-summary-icon red">
            <XCircle size={21} />
          </div>

          <div>
            <span>
              Rejected Products
            </span>

            <strong>
              {rejectedReports}
            </strong>

            <small>
              Defect detected
            </small>
          </div>
        </div>

      </div>


      {/* ======================================================
          REPORT LIBRARY
      ====================================================== */}

      <div className="panel reports-panel">

        <div className="reports-panel-header">
          <div>
            <div className="reports-title-row">
              <div className="reports-title-icon">
                <FileDown size={20} />
              </div>

              <div>
                <h3>
                  Report Library
                </h3>

                <p>
                  PDF documentation generated from
                  saved inspection records.
                </p>
              </div>
            </div>
          </div>

          <span className="reports-count-badge">
            {filteredReports.length} Reports
          </span>
        </div>


        {/* ====================================================
            TOOLBAR
        ==================================================== */}

        <div className="reports-toolbar">

          <div className="reports-search">
            <Search size={17} />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search inspection ID or product..."
            />
          </div>


          <select
            className="reports-filter"
            value={decisionFilter}
            onChange={(event) =>
              setDecisionFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Decisions
            </option>

            <option value="PASS">
              Passed
            </option>

            <option value="REJECT">
              Rejected
            </option>
          </select>

        </div>


        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <div className="reports-state">
            <LoaderCircle
              size={31}
              className="reports-spin"
            />

            <strong>
              Loading reports...
            </strong>

            <span>
              Reading inspection records from VisionGuard.
            </span>
          </div>
        )}


        {/* ====================================================
            ERROR
        ==================================================== */}

        {!loading && error && (
          <div className="reports-state reports-error">
            <AlertTriangle size={31} />

            <strong>
              Unable to load reports
            </strong>

            <span>
              {error}
            </span>

            <button
              className="reports-retry-button"
              onClick={loadReports}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}


        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!loading &&
          !error &&
          filteredReports.length === 0 && (
            <div className="reports-state">
              <FileText size={34} />

              <strong>
                No reports found
              </strong>

              <span>
                Completed inspections will become
                available as PDF reports here.
              </span>
            </div>
          )}


        {/* ====================================================
            REPORT TABLE
        ==================================================== */}

        {!loading &&
          !error &&
          filteredReports.length > 0 && (
            <div className="reports-table-wrapper">

              <table className="reports-table">

                <thead>
                  <tr>
                    <th>
                      Report
                    </th>

                    <th>
                      Product
                    </th>

                    <th>
                      Inspection Result
                    </th>

                    <th>
                      Affected Area
                    </th>

                    <th>
                      Severity
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Report Actions
                    </th>
                  </tr>
                </thead>


                <tbody>
                  {filteredReports.map(
                    (inspection) => (
                      <tr key={inspection.id}>

                        {/* REPORT */}

                        <td>
                          <div className="report-id-cell">
                            <div className="report-file-icon">
                              <FileText size={18} />
                            </div>

                            <div>
                              <strong>
                                {
                                  inspection.inspection_code
                                }
                              </strong>

                              <span>
                                Inspection #{inspection.id}
                              </span>
                            </div>
                          </div>
                        </td>


                        {/* PRODUCT */}

                        <td>
                          <div className="report-product-cell">
                            <Package size={15} />

                            <span>
                              {
                                inspection.product_category ||
                                "—"
                              }
                            </span>
                          </div>
                        </td>


                        {/* DECISION */}

                        <td>
                          <span
                            className={`reports-decision ${
                              inspection.decision ===
                              "PASS"
                                ? "pass"
                                : "reject"
                            }`}
                          >
                            {inspection.decision ===
                            "PASS" ? (
                              <CheckCircle2
                                size={14}
                              />
                            ) : (
                              <XCircle
                                size={14}
                              />
                            )}

                            {
                              inspection.decision
                            }
                          </span>
                        </td>


                        {/* AFFECTED AREA */}

                        <td>
                          <strong className="report-area">
                            {Number(
                              inspection.affected_area ||
                                0
                            ).toFixed(2)}
                            %
                          </strong>
                        </td>


                        {/* SEVERITY */}

                        <td>
                          <span
                            className={`reports-severity ${
                              inspection.severity ||
                              "NONE"
                            }`}
                          >
                            <ShieldCheck
                              size={14}
                            />

                            {
                              inspection.severity ||
                              "NONE"
                            }
                          </span>
                        </td>


                        {/* DATE */}

                        <td>
                          <div className="report-date-cell">
                            <CalendarDays
                              size={14}
                            />

                            <span>
                              {formatDate(
                                inspection.created_at
                              )}
                            </span>
                          </div>
                        </td>


                        {/* REPORT ACTIONS */}

                        <td>
                          <div className="report-actions">

                            <button
                              className="report-download-button"
                              onClick={() =>
                                downloadReport(
                                  inspection
                                )
                              }
                              disabled={
                                downloadingId ===
                                inspection.id
                              }
                            >
                              {downloadingId ===
                              inspection.id ? (
                                <>
                                  <LoaderCircle
                                    size={16}
                                    className="reports-spin"
                                  />

                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Download
                                    size={16}
                                  />

                                  Download PDF
                                </>
                              )}
                            </button>


                            <button
                              className="report-email-button"
                              onClick={() =>
                                openEmailModal(
                                  inspection
                                )
                              }
                            >
                              <Mail size={16} />

                              Send Email
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )}
                </tbody>

              </table>

            </div>
          )}

      </div>


      {/* ======================================================
          EMAIL REPORT MODAL
      ====================================================== */}

      {emailModalOpen && selectedInspection && (
        <div
          className="reports-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeEmailModal();
            }
          }}
        >
          <div className="reports-email-modal">

            <div className="reports-modal-header">
              <div className="reports-modal-title">

                <div className="reports-modal-icon">
                  <Mail size={21} />
                </div>

                <div>
                  <h3>
                    Send Inspection Report
                  </h3>

                  <p>
                    Email the PDF report directly
                    to the recipient.
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="reports-modal-close"
                onClick={closeEmailModal}
                disabled={sendingEmail}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>


            <div className="reports-modal-report">

              <div>
                <span>
                  Inspection
                </span>

                <strong>
                  {
                    selectedInspection.inspection_code
                  }
                </strong>
              </div>

              <div>
                <span>
                  Product
                </span>

                <strong>
                  {
                    selectedInspection.product_category ||
                    "—"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Result
                </span>

                <strong
                  className={
                    selectedInspection.decision ===
                    "PASS"
                      ? "reports-modal-pass"
                      : "reports-modal-reject"
                  }
                >
                  {
                    selectedInspection.decision
                  }
                </strong>
              </div>

            </div>


            <form
              className="reports-email-form"
              onSubmit={sendEmailReport}
            >

              <label htmlFor="report-recipient-email">
                Recipient Email
              </label>

              <div className="reports-email-input">
                <Mail size={17} />

                <input
                  id="report-recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => {
                    setRecipientEmail(
                      event.target.value
                    );

                    if (emailError) {
                      setEmailError("");
                    }

                    if (emailSuccess) {
                      setEmailSuccess("");
                    }
                  }}
                  placeholder="customer@example.com"
                  autoFocus
                  disabled={sendingEmail}
                  required
                />
              </div>


              <p className="reports-email-help">
                The VisionGuard PDF inspection report
                will be attached automatically.
              </p>


              {emailError && (
                <div className="reports-email-message error">
                  <AlertTriangle size={17} />

                  <span>
                    {emailError}
                  </span>
                </div>
              )}


              {emailSuccess && (
                <div className="reports-email-message success">
                  <CheckCircle2 size={17} />

                  <span>
                    {emailSuccess}
                  </span>
                </div>
              )}


              <div className="reports-modal-actions">

                <button
                  type="button"
                  className="reports-modal-cancel"
                  onClick={closeEmailModal}
                  disabled={sendingEmail}
                >
                  {
                    emailSuccess
                      ? "Close"
                      : "Cancel"
                  }
                </button>


                {!emailSuccess && (
                  <button
                    type="submit"
                    className="reports-modal-send"
                    disabled={
                      sendingEmail ||
                      !recipientEmail.trim()
                    }
                  >
                    {sendingEmail ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="reports-spin"
                        />

                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={17} />

                        Send Report
                      </>
                    )}
                  </button>
                )}

              </div>

            </form>

          </div>
        </div>
      )}

    </section>
  );
}


export default Reports;