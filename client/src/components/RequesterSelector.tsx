import React, { useEffect, useState } from "react";
import { getActiveRequesters, Requester } from "../api";
import { useRequester } from "../context/RequesterContext";

interface Props {
  onComplete?: () => void;
}

export const RequesterSelector: React.FC<Props> = ({ onComplete }) => {
  const { setSelectedRequester, selectedRequester } = useRequester();
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [selectedId, setSelectedId] = useState<string>(selectedRequester?.id.toString() || "");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequesters();
  }, []);

  async function fetchRequesters() {
    setLoading(true);
    setError(null);
    try {
      const data = await getActiveRequesters();
      setRequesters(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id.toString());
      }
    } catch (err) {
      setError("Failed to load active requesters. Please ensure backend service is running.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = requesters.find((r) => r.id.toString() === selectedId);
    if (found) {
      setSelectedRequester(found);
      if (onComplete) onComplete();
    }
  };

  return (
    <div style={{ backgroundColor: "#F5F7F6", minHeight: "100vh" }} className="d-flex align-items-center justify-content-center py-5 px-3">
      <div className="card shadow-sm border-0 w-100" style={{ maxWidth: 580, borderRadius: 12 }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 56, height: 56, backgroundColor: "#EAF6EF", color: "#006B3C" }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
            </div>
            <h2 className="h4 fw-bold text-dark mb-2">Select Development Requester</h2>
            <p className="text-muted small mb-0">Choose a Development Requester to simulate the Current Requester Context for Lab 2.</p>
            <p className="text-muted small fw-semibold">This is for testing and is not a login screen.</p>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-success" role="status"></div>
              <p className="small text-muted mt-2">Loading active requesters...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger py-2 px-3 small mb-4" role="alert">
              {error}
              <button className="btn btn-sm btn-link text-danger d-block p-0 mt-1" onClick={fetchRequesters}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && requesters.length === 0 && (
            <div className="alert alert-warning py-3 text-center small mb-4">
              No active requesters found in database. Please seed the database first.
            </div>
          )}

          {!loading && !error && requesters.length > 0 && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="requesterSelect" className="form-label fw-semibold small text-secondary">
                  Development Requester <span className="text-danger">*</span>
                </label>
                <select
                  id="requesterSelect"
                  className="form-select py-2"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  required
                >
                  {requesters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded mb-3" style={{ backgroundColor: "#F8F9FA", borderLeft: "4px solid #006B3C" }}>
                <div className="d-flex align-items-start">
                  <span className="me-2 text-success">ℹ️</span>
                  <p className="small text-secondary mb-0">
                    Choosing a Development Requester sets your testing session.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded mb-4" style={{ backgroundColor: "#F8F9FA", borderLeft: "4px solid #6C757D" }}>
                <div className="d-flex align-items-start">
                  <span className="me-2">🛡️</span>
                  <div>
                    <div className="fw-semibold small text-dark">Authentication coming in Lab 3</div>
                    <p className="small text-muted mb-0">
                      In Lab 3, this identity will be replaced with real user authentication so you can access the system with your own account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="submit"
                  className="btn px-4 text-white fw-semibold"
                  style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                >
                  Continue →
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};