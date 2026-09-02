import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext";
export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { selectedRequester } = useRequester();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!selectedRequester?.id) {
            navigate("/select-requester");
            return;
        }
        async function fetchTicket() {
            const requesterId = selectedRequester?.id;
            if (!id || !requesterId)
                return;
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`/api/v1/tickets/${id}?requesterId=${requesterId}`, {
                    headers: {
                        "x-requester-id": String(requesterId),
                    },
                });
                if (res.status === 403) {
                    throw new Error("Access denied: You do not have permission to view this ticket.");
                }
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error?.message || "Failed to fetch ticket details.");
                }
                const data = await res.json();
                setTicket(data.data || data);
            }
            catch (err) {
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        }
        fetchTicket();
    }, [id, selectedRequester, navigate]);
    const renderPriorityBadge = (priority) => {
        switch (priority?.toUpperCase()) {
            case "HIGH":
                return _jsx("span", { className: "badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2.5 py-1 fw-medium", children: "High" });
            case "MEDIUM":
                return _jsx("span", { className: "badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-25 rounded-pill px-2.5 py-1 fw-medium", children: "Medium" });
            case "LOW":
                return _jsx("span", { className: "badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 fw-medium", children: "Low" });
            default:
                return _jsx("span", { className: "badge bg-light text-dark rounded-pill px-2.5 py-1 fw-medium", children: priority || "-" });
        }
    };
    const renderStatusBadge = (status) => {
        switch (status?.toUpperCase()) {
            case "NEW":
                return _jsx("span", { className: "badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-1 fw-medium", children: "New" });
            case "IN_PROGRESS":
                return _jsx("span", { className: "badge text-white rounded-pill px-2.5 py-1 fw-medium", style: { backgroundColor: "#52C41A" }, children: "In Progress" });
            case "PENDING":
                return _jsx("span", { className: "badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-25 rounded-pill px-2.5 py-1 fw-medium", children: "Pending" });
            case "RESOLVED":
                return _jsx("span", { className: "badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-2.5 py-1 fw-medium", children: "Resolved" });
            case "CLOSED":
                return _jsx("span", { className: "badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2.5 py-1 fw-medium", children: "Closed" });
            default:
                return _jsx("span", { className: "badge bg-light text-dark rounded-pill px-2.5 py-1 fw-medium", children: status || "-" });
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "container py-5 text-center text-secondary", children: [_jsx("div", { className: "spinner-border spinner-border-sm text-success me-2", role: "status" }), "Loading ticket details..."] }));
    }
    if (error) {
        return (_jsxs("div", { className: "container py-4", style: { maxWidth: 800 }, children: [_jsx("div", { className: "alert alert-danger border-0 shadow-sm rounded-3 mb-3", role: "alert", children: error }), _jsx(Link, { to: "/tickets", className: "btn btn-outline-secondary btn-sm rounded-2", children: "\u2190 Back to My Tickets" })] }));
    }
    if (!ticket) {
        return (_jsxs("div", { className: "container py-4 text-center text-secondary", style: { maxWidth: 800 }, children: [_jsx("p", { children: "Ticket not found." }), _jsx(Link, { to: "/tickets", className: "btn btn-outline-secondary btn-sm rounded-2", children: "\u2190 Back to My Tickets" })] }));
    }
    return (_jsxs("div", { className: "container py-4", style: { maxWidth: 800 }, children: [_jsx("div", { className: "mb-3", children: _jsx(Link, { to: "/tickets", className: "btn btn-outline-secondary btn-sm rounded-2 fw-medium d-inline-flex align-items-center gap-1", children: "\u2190 Back to My Tickets" }) }), _jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-4 bg-white", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [_jsx("h1", { className: "h4 fw-bold font-monospace mb-0", style: { color: "#006B3C" }, children: ticket.ticketNo }), _jsx("div", { children: renderStatusBadge(ticket.currentStatus) })] }), _jsx("h2", { className: "h5 fw-bold text-dark mb-3", children: ticket.summary }), _jsx("div", { className: "p-3 rounded-2 mb-4", style: { backgroundColor: "#F5F7F6", border: "1px solid #EAF6EF" }, children: _jsxs("div", { className: "row g-3 small", children: [_jsxs("div", { className: "col-sm-6", children: [_jsx("span", { className: "text-secondary d-block mb-1", children: "Category" }), _jsx("span", { className: "fw-semibold text-dark", children: ticket.category?.name || "-" })] }), _jsxs("div", { className: "col-sm-6", children: [_jsx("span", { className: "text-secondary d-block mb-1", children: "Related System" }), _jsx("span", { className: "fw-semibold text-dark", children: ticket.relatedSystem?.name || "-" })] }), _jsxs("div", { className: "col-sm-6", children: [_jsx("span", { className: "text-secondary d-block mb-1", children: "Priority" }), _jsx("div", { children: renderPriorityBadge(ticket.requestedPriority) })] }), _jsxs("div", { className: "col-sm-6", children: [_jsx("span", { className: "text-secondary d-block mb-1", children: "Created At" }), _jsx("span", { className: "fw-semibold text-dark", children: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "-" })] })] }) }), _jsxs("div", { children: [_jsx("h3", { className: "h6 fw-semibold text-secondary mb-2", children: "Description" }), _jsx("p", { className: "text-dark mb-0", style: { whiteSpace: "pre-wrap", lineHeight: "1.6" }, children: ticket.description })] })] })] }));
}
