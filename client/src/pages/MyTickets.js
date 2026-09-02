import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext.js";
export default function MyTickets() {
    const navigate = useNavigate();
    const { selectedRequester } = useRequester();
    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    // Filter & Search states
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [priority, setPriority] = useState("");
    const [status, setStatus] = useState("");
    const [sort, setSort] = useState("createdAt_desc");
    // Pagination states
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    // Status states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    // Check if any filter is currently applied (BR-25 helper)
    const isFiltered = Boolean(debouncedSearch || categoryId || priority || status);
    // BR-22: Redirect to selection screen if no requester is selected
    useEffect(() => {
        if (!selectedRequester?.id) {
            navigate("/select-requester"); // ปรับ path ให้ตรงกับระบบของคุณ เช่น / หรือ /select-requester
        }
    }, [selectedRequester, navigate]);
    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);
    // Fetch reference categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/v1/categories");
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : data.data || [];
                    setCategories(list);
                }
            }
            catch (err) {
                console.error("Failed to load categories:", err);
            }
        };
        fetchCategories();
    }, []);
    // Fetch Tickets when filters or requester changes
    useEffect(() => {
        if (!selectedRequester?.id)
            return;
        const fetchTickets = async () => {
            setIsLoading(true);
            setError("");
            try {
                const params = new URLSearchParams({
                    requesterId: String(selectedRequester.id),
                    page: String(page),
                    limit: String(limit),
                    sort,
                });
                if (debouncedSearch)
                    params.append("search", debouncedSearch);
                if (categoryId)
                    params.append("categoryId", categoryId);
                if (priority)
                    params.append("priority", priority);
                if (status)
                    params.append("status", status);
                const res = await fetch(`/api/v1/tickets?${params.toString()}`);
                const result = await res.json();
                if (res.ok) {
                    setTickets(result.data || []);
                    if (result.meta) {
                        setTotal(result.meta.total || 0);
                        setTotalPages(result.meta.totalPages || 1);
                    }
                }
                else {
                    setError(result.error?.message || "Failed to fetch tickets.");
                }
            }
            catch (err) {
                setError("An error occurred while loading tickets.");
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchTickets();
    }, [selectedRequester, debouncedSearch, categoryId, priority, status, sort, page, limit]);
    const handleClearFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setCategoryId("");
        setPriority("");
        setStatus("");
        setSort("createdAt_desc");
        setPage(1);
    };
    const renderPriorityBadge = (p) => {
        switch (p.toUpperCase()) {
            case "HIGH":
            case "URGENT":
                return _jsx("span", { className: "badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2.5 py-1 fw-medium", children: "High" });
            case "MEDIUM":
                return _jsx("span", { className: "badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-25 rounded-pill px-2.5 py-1 fw-medium", children: "Medium" });
            case "LOW":
                return _jsx("span", { className: "badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 fw-medium", children: "Low" });
            default:
                return _jsx("span", { className: "badge bg-light text-dark rounded-pill px-2.5 py-1 fw-medium", children: p });
        }
    };
    const renderStatusBadge = (s) => {
        switch (s.toUpperCase()) {
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
                return _jsx("span", { className: "badge bg-light text-dark rounded-pill px-2.5 py-1 fw-medium", children: s });
        }
    };
    return (_jsxs("div", { className: "container py-4", style: { maxWidth: 1140 }, children: [_jsxs("div", { className: "d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "h3 fw-bold mb-1 text-dark", children: "My Tickets" }), _jsx("p", { className: "text-secondary small mb-0", children: "View and track all of your support requests." })] }), _jsxs("div", { className: "d-flex align-items-center gap-2", children: [_jsxs("button", { onClick: handleClearFilters, className: "btn btn-outline-secondary rounded-2 px-3 py-2 small fw-medium d-inline-flex align-items-center gap-1", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.8, stroke: "currentColor", style: { width: 15, height: 15 }, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18 18 6M6 6l12 12" }) }), "Clear Filters"] }), _jsxs("button", { onClick: () => navigate("/create-ticket"), className: "btn text-white rounded-2 px-3 py-2 small fw-medium shadow-sm d-inline-flex align-items-center gap-1", style: { backgroundColor: "#006B3C" }, children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", style: { width: 16, height: 16 }, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) }), "Create Ticket"] })] })] }), _jsx("div", { className: "card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white", children: _jsxs("div", { className: "row g-3 align-items-end", children: [_jsxs("div", { className: "col-lg-5 col-md-12", children: [_jsx("label", { className: "form-label text-secondary small fw-medium mb-1", children: "Search" }), _jsxs("div", { className: "input-group", children: [_jsx("span", { className: "input-group-text bg-white border-end-0 border-light-subtle text-secondary", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.8, stroke: "currentColor", style: { width: 16, height: 16 }, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" }) }) }), _jsx("input", { type: "text", placeholder: "Search by ticket number, summary, or description...", value: search, onChange: (e) => setSearch(e.target.value), className: "form-control border-start-0 border-light-subtle rounded-end-2 small py-2" })] })] }), _jsxs("div", { className: "col-lg-2 col-md-4", children: [_jsx("label", { className: "form-label text-secondary small fw-medium mb-1", children: "Category" }), _jsxs("select", { value: categoryId, onChange: (e) => {
                                        setCategoryId(e.target.value);
                                        setPage(1);
                                    }, className: "form-select rounded-2 border-light-subtle small py-2 text-secondary", children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] })] }), _jsxs("div", { className: "col-lg-2 col-md-4", children: [_jsx("label", { className: "form-label text-secondary small fw-medium mb-1", children: "Priority" }), _jsxs("select", { value: priority, onChange: (e) => {
                                        setPriority(e.target.value);
                                        setPage(1);
                                    }, className: "form-select rounded-2 border-light-subtle small py-2 text-secondary", children: [_jsx("option", { value: "", children: "All Priorities" }), _jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" })] })] }), _jsxs("div", { className: "col-lg-3 col-md-4", children: [_jsx("label", { className: "form-label text-secondary small fw-medium mb-1", children: "Status" }), _jsxs("select", { value: status, onChange: (e) => {
                                        setStatus(e.target.value);
                                        setPage(1);
                                    }, className: "form-select rounded-2 border-light-subtle small py-2 text-secondary", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "NEW", children: "New" }), _jsx("option", { value: "IN_PROGRESS", children: "In Progress" }), _jsx("option", { value: "PENDING", children: "Pending" }), _jsx("option", { value: "RESOLVED", children: "Resolved" }), _jsx("option", { value: "CLOSED", children: "Closed" })] })] })] }) }), error && (_jsx("div", { className: "alert alert-danger border-0 shadow-sm rounded-3 mb-4 py-2 px-3 small", role: "alert", children: error })), _jsx("div", { className: "card border-0 shadow-sm rounded-3 overflow-hidden bg-white mb-3", children: isLoading ? (_jsxs("div", { className: "text-center py-5 text-secondary", children: [_jsx("div", { className: "spinner-border spinner-border-sm text-success me-2", role: "status" }), "Loading tickets..."] })) : tickets.length === 0 ? (isFiltered ? (
                /* BR-25: No-Results State (เมื่อค้นหา/กรองแล้วไม่พบตั๋ว) */
                _jsxs("div", { className: "text-center py-5 text-secondary", children: [_jsx("div", { className: "fs-2 mb-2", children: "\uD83D\uDD0D" }), _jsx("p", { className: "fw-medium text-dark mb-1", children: "No matching tickets found" }), _jsx("p", { className: "small text-muted mb-3", children: "Try adjusting or clearing your search and filter criteria." }), _jsx("button", { onClick: handleClearFilters, className: "btn btn-sm btn-outline-secondary rounded-2 px-3", children: "Clear Filters" })] })) : (
                /* BR-25: Empty State (เมื่อ Requester รายนี้ยังไม่มีตั๋วเลย) */
                _jsxs("div", { className: "text-center py-5 text-secondary", children: [_jsx("div", { className: "fs-2 mb-2", children: "\uD83C\uDFAB" }), _jsx("p", { className: "fw-medium text-dark mb-1", children: "No tickets found" }), _jsx("p", { className: "small text-muted mb-3", children: "You haven't created any support tickets yet." }), _jsx("button", { onClick: () => navigate("/create-ticket"), className: "btn btn-sm text-white rounded-2 px-3 fw-medium", style: { backgroundColor: "#006B3C" }, children: "Create Your First Ticket" })] }))) : (_jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table table-hover align-middle mb-0", children: [_jsx("thead", { className: "table-light border-bottom", children: _jsxs("tr", { className: "small text-secondary", children: [_jsxs("th", { style: { cursor: "pointer", userSelect: "none" }, className: "py-3 px-3", onClick: () => setSort(sort === "ticketNo_asc" ? "ticketNo_desc" : "ticketNo_asc"), children: ["Ticket No ", sort.startsWith("ticketNo") ? (sort.endsWith("asc") ? "↑" : "↓") : _jsx("span", { className: "opacity-25 ms-1", children: "\u2195" })] }), _jsxs("th", { style: { cursor: "pointer", userSelect: "none" }, className: "py-3 px-3", onClick: () => setSort(sort === "createdAt_asc" ? "createdAt_desc" : "createdAt_asc"), children: ["Created Date ", sort.startsWith("createdAt") ? (sort.endsWith("asc") ? "↑" : "↓") : _jsx("span", { className: "opacity-25 ms-1", children: "\u2195" })] }), _jsx("th", { className: "py-3 px-3", children: "Summary" }), _jsx("th", { className: "py-3 px-3", children: "Category" }), _jsx("th", { className: "py-3 px-3", children: "Priority" }), _jsx("th", { className: "py-3 px-3", children: "Status" }), _jsx("th", { className: "py-3 px-3 text-end", children: "Action" })] }) }), _jsx("tbody", { children: tickets.map((t) => (_jsxs("tr", { className: "small", children: [_jsx("td", { className: "py-3 px-3 font-monospace fw-semibold", style: { color: "#006B3C" }, children: t.ticketNo }), _jsx("td", { className: "py-3 px-3 text-secondary", children: new Date(t.createdAt).toLocaleString("en-US", {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            }) }), _jsx("td", { className: "py-3 px-3 fw-medium text-dark max-w-xs text-truncate", style: { maxWidth: 250 }, title: t.summary, children: t.summary }), _jsx("td", { className: "py-3 px-3 text-secondary", children: t.category?.name || "-" }), _jsx("td", { className: "py-3 px-3", children: renderPriorityBadge(t.requestedPriority) }), _jsx("td", { className: "py-3 px-3", children: renderStatusBadge(t.currentStatus) }), _jsx("td", { className: "py-3 px-3 text-end", children: _jsx("button", { onClick: () => navigate(`/tickets/${t.id}`), className: "btn btn-sm btn-outline-success rounded-2 px-3 fw-medium", children: "View" }) })] }, t.id))) })] }) })) }), !isLoading && tickets.length > 0 && (_jsxs("div", { className: "d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 text-secondary small mt-3", children: [_jsxs("div", { children: ["Showing ", _jsx("span", { className: "fw-semibold text-dark", children: (page - 1) * limit + 1 }), " to", " ", _jsx("span", { className: "fw-semibold text-dark", children: Math.min(page * limit, total) }), " of", " ", _jsx("span", { className: "fw-semibold text-dark", children: total }), " tickets"] }), _jsxs("div", { className: "d-flex align-items-center gap-1", children: [_jsx("button", { disabled: page <= 1, onClick: () => setPage((p) => p - 1), className: "btn btn-sm btn-outline-secondary rounded-2 px-3 disabled:opacity-50", children: "< Previous" }), Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (_jsx("button", { onClick: () => setPage(p), className: `btn btn-sm rounded-2 px-3 ${page === p
                                    ? "text-white fw-medium"
                                    : "btn-outline-secondary"}`, style: page === p ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : {}, children: p }, p))), _jsx("button", { disabled: page >= totalPages, onClick: () => setPage((p) => p + 1), className: "btn btn-sm btn-outline-secondary rounded-2 px-3 disabled:opacity-50", children: "Next >" })] })] }))] }));
}
