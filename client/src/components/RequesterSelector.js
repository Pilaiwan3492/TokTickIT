import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { getActiveRequesters } from "../api";
import { useRequester } from "../context/RequesterContext";
export const RequesterSelector = ({ onComplete }) => {
    const { setSelectedRequester, selectedRequester } = useRequester();
    const [requesters, setRequesters] = useState([]);
    const [selectedId, setSelectedId] = useState(selectedRequester?.id.toString() || "");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
        }
        catch (err) {
            setError("Failed to load active requesters. Please ensure backend service is running.");
        }
        finally {
            setLoading(false);
        }
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        const found = requesters.find((r) => r.id.toString() === selectedId);
        if (found) {
            setSelectedRequester(found);
            if (onComplete)
                onComplete();
        }
    };
    return (_jsx("div", { style: { backgroundColor: "#F5F7F6", minHeight: "100vh" }, className: "d-flex align-items-center justify-content-center py-5 px-3", children: _jsx("div", { className: "card shadow-sm border-0 w-100", style: { maxWidth: 580, borderRadius: 12 }, children: _jsxs("div", { className: "card-body p-4 p-md-5", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("div", { className: "d-inline-flex align-items-center justify-content-center rounded-circle mb-3", style: { width: 56, height: 56, backgroundColor: "#EAF6EF", color: "#006B3C" }, children: _jsxs("svg", { width: "28", height: "28", fill: "none", stroke: "currentColor", strokeWidth: "2", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "8.5", cy: "7", r: "4" }), _jsx("polyline", { points: "17 11 19 13 23 9" })] }) }), _jsx("h2", { className: "h4 fw-bold text-dark mb-2", children: "Select Development Requester" }), _jsx("p", { className: "text-muted small mb-0", children: "Choose a Development Requester to simulate the Current Requester Context for Lab 2." }), _jsx("p", { className: "text-muted small fw-semibold", children: "This is for testing and is not a login screen." })] }), loading && (_jsxs("div", { className: "text-center py-4", children: [_jsx("div", { className: "spinner-border text-success", role: "status" }), _jsx("p", { className: "small text-muted mt-2", children: "Loading active requesters..." })] })), error && (_jsxs("div", { className: "alert alert-danger py-2 px-3 small mb-4", role: "alert", children: [error, _jsx("button", { className: "btn btn-sm btn-link text-danger d-block p-0 mt-1", onClick: fetchRequesters, children: "Try again" })] })), !loading && !error && requesters.length === 0 && (_jsx("div", { className: "alert alert-warning py-3 text-center small mb-4", children: "No active requesters found in database. Please seed the database first." })), !loading && !error && requesters.length > 0 && (_jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "mb-4", children: [_jsxs("label", { htmlFor: "requesterSelect", className: "form-label fw-semibold small text-secondary", children: ["Development Requester ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("select", { id: "requesterSelect", className: "form-select py-2", value: selectedId, onChange: (e) => setSelectedId(e.target.value), required: true, children: requesters.map((r) => (_jsxs("option", { value: r.id, children: [r.name, " (", r.email, ")"] }, r.id))) })] }), _jsx("div", { className: "p-3 rounded mb-3", style: { backgroundColor: "#F8F9FA", borderLeft: "4px solid #006B3C" }, children: _jsxs("div", { className: "d-flex align-items-start", children: [_jsx("span", { className: "me-2 text-success", children: "\u2139\uFE0F" }), _jsx("p", { className: "small text-secondary mb-0", children: "Choosing a Development Requester sets your testing session." })] }) }), _jsx("div", { className: "p-3 rounded mb-4", style: { backgroundColor: "#F8F9FA", borderLeft: "4px solid #6C757D" }, children: _jsxs("div", { className: "d-flex align-items-start", children: [_jsx("span", { className: "me-2", children: "\uD83D\uDEE1\uFE0F" }), _jsxs("div", { children: [_jsx("div", { className: "fw-semibold small text-dark", children: "Authentication coming in Lab 3" }), _jsx("p", { className: "small text-muted mb-0", children: "In Lab 3, this identity will be replaced with real user authentication so you can access the system with your own account." })] })] }) }), _jsx("div", { className: "d-flex justify-content-end gap-2", children: _jsx("button", { type: "submit", className: "btn px-4 text-white fw-semibold", style: { backgroundColor: "#006B3C", borderColor: "#006B3C" }, children: "Continue \u2192" }) })] }))] }) }) }));
};
