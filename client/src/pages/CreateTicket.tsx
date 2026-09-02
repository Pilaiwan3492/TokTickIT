import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext.js";

interface Category {
  id: number;
  name: string;
  isActive?: boolean;
}

interface RelatedSystem {
  id: number;
  name: string;
  isActive?: boolean;
}

export default function CreateTicket() {
  const navigate = useNavigate();
  const { selectedRequester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<string>("MEDIUM");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdTicketNo, setCreatedTicketNo] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/v1/categories");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          setCategories(list.filter((item: Category) => item.isActive !== false));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    const fetchRelatedSystems = async () => {
      try {
        const res = await fetch("/api/v1/related-systems");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          setRelatedSystems(list.filter((item: RelatedSystem) => item.isActive !== false));
        }
      } catch (err) {
        console.error("Error fetching related systems:", err);
      }
    };

    fetchCategories();
    fetchRelatedSystems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");

    if (!selectedRequester?.id) {
      setGeneralError("Please select a requester before creating a ticket.");
      return;
    }

    const errors: Record<string, string> = {};

    if (!categoryId) errors.categoryId = "Please select a category";
    if (!relatedSystemId) errors.relatedSystemId = "Please select a related system";

    const trimmedSummary = summary.trim();
    if (trimmedSummary.length < 5 || trimmedSummary.length > 150) {
      errors.summary = "Summary must be between 5 and 150 characters.";
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      errors.description = "Description must be between 10 and 2,000 characters.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: Number(selectedRequester.id),
          categoryId: Number(categoryId),
          relatedSystemId: Number(relatedSystemId),
          requestedPriority,
          summary: trimmedSummary,
          description: trimmedDescription,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        if (resData.error?.fields) {
          setFieldErrors(resData.error.fields);
        } else {
          setGeneralError(resData.error?.message || "Failed to create ticket");
        }
      } else {
        setCreatedTicketNo(resData.data?.ticketNo);
      }
    } catch (error) {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common Field Style
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "6px",
  };

  const errorTextStyle: React.CSSProperties = {
    color: "#dc2626",
    fontSize: "12px",
    marginTop: "4px",
  };

  if (createdTicketNo) {
    return (
      <div style={{ backgroundColor: "#f8fafc", minHeight: "calc(100vh - 64px)", padding: "40px 16px" }}>
        <div
          style={{
            maxWidth: "480px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            padding: "32px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "48px", color: "#006644", marginBottom: "12px" }}>✓</div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
            Ticket Created Successfully!
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
            Your ticket has been submitted with reference number:
          </p>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "700",
              fontFamily: "monospace",
              color: "#006644",
              backgroundColor: "#e6f0eb",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #b3d6c5",
              marginBottom: "24px",
            }}
          >
            {createdTicketNo}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              style={{
                backgroundColor: "#006644",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              View My Tickets
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatedTicketNo(null);
                setSummary("");
                setDescription("");
                setCategoryId("");
                setRelatedSystemId("");
              }}
              style={{
                backgroundColor: "#ffffff",
                color: "#475569",
                border: "1px solid #cbd5e1",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Create Another Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "calc(100vh - 64px)", padding: "32px 16px" }}>
      <div style={{ maxWidth: "768px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            Create New Ticket
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Fill out the details below to open a new support request.
          </p>
        </div>

        {/* Card Form */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            padding: "28px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {generalError && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Category */}
            <div>
              <label style={labelStyle}>
                Category <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.categoryId ? "#dc2626" : "#cbd5e1",
                }}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && <div style={errorTextStyle}>{fieldErrors.categoryId}</div>}
            </div>

            {/* Related System */}
            <div>
              <label style={labelStyle}>
                Related System <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select
                value={relatedSystemId}
                onChange={(e) => setRelatedSystemId(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.relatedSystemId ? "#dc2626" : "#cbd5e1",
                }}
              >
                <option value="">-- Select Related System --</option>
                {relatedSystems.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {sys.name}
                  </option>
                ))}
              </select>
              {fieldErrors.relatedSystemId && <div style={errorTextStyle}>{fieldErrors.relatedSystemId}</div>}
            </div>

            {/* Priority */}
            <div>
              <label style={labelStyle}>
                Requested Priority <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select
                value={requestedPriority}
                onChange={(e) => setRequestedPriority(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.requestedPriority ? "#dc2626" : "#cbd5e1",
                }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
              {fieldErrors.requestedPriority && <div style={errorTextStyle}>{fieldErrors.requestedPriority}</div>}
            </div>

            {/* Summary */}
            <div>
              <label style={labelStyle}>
                Summary <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary (5-150 characters)"
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.summary ? "#dc2626" : "#cbd5e1",
                }}
              />
              {fieldErrors.summary && <div style={errorTextStyle}>{fieldErrors.summary}</div>}
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>
                Description <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description (10-2000 characters)"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  borderColor: fieldErrors.description ? "#dc2626" : "#cbd5e1",
                }}
              />
              {fieldErrors.description && <div style={errorTextStyle}>{fieldErrors.description}</div>}
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/tickets")}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: "#006644",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? "Submitting..." : "Create Ticket"}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}