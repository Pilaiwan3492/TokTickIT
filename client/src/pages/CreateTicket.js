import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext.js";
export default function CreateTicket() {
    const navigate = useNavigate();
    const { selectedRequester } = useRequester();
    // Reference Data State
    const [categories, setCategories] = useState([]);
    const [relatedSystems, setRelatedSystems] = useState([]);
    // Form Fields State
    const [categoryId, setCategoryId] = useState("");
    const [relatedSystemId, setRelatedSystemId] = useState("");
    const [requestedPriority, setRequestedPriority] = useState("MEDIUM");
    const [summary, setSummary] = useState("");
    const [description, setDescription] = useState("");
    // Validation & Loading State
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdTicketNo, setCreatedTicketNo] = useState(null);
    // Fetch Reference Data
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/v1/categories");
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || []);
                    setCategories(list.filter((item) => item.isActive !== false));
                }
            }
            catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        const fetchRelatedSystems = async () => {
            try {
                const res = await fetch("/api/v1/related-systems");
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || []);
                    setRelatedSystems(list.filter((item) => item.isActive !== false));
                }
            }
            catch (err) {
                console.error("Error fetching related systems:", err);
            }
        };
        fetchCategories();
        fetchRelatedSystems();
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        setGeneralError("");
        if (!selectedRequester?.id) {
            setGeneralError("Please select a requester before creating a ticket.");
            return;
        }
        // ---------------------------------------------------------
        // Client-side Validation Checks
        // ---------------------------------------------------------
        const errors = {};
        if (!categoryId) {
            errors.categoryId = "Please select a category";
        }
        if (!relatedSystemId) {
            errors.relatedSystemId = "Please select a related system";
        }
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
                headers: {
                    "Content-Type": "application/json",
                },
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
                }
                else {
                    setGeneralError(resData.error?.message || "Failed to create ticket");
                }
            }
            else {
                setCreatedTicketNo(resData.data?.ticketNo);
            }
        }
        catch (error) {
            setGeneralError("An unexpected error occurred. Please try again.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    // ---------------------------------------------------------
    // Success View Screen 
    // ---------------------------------------------------------
    if (createdTicketNo) {
        return (_jsxs("div", { className: "max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center space-y-4", children: [_jsx("div", { className: "text-emerald-600 text-5xl", children: "\u2713" }), _jsx("h2", { className: "text-2xl font-bold text-gray-800", children: "Ticket Created Successfully!" }), _jsx("p", { className: "text-sm text-gray-600", children: "Your ticket has been submitted with reference number:" }), _jsx("div", { className: "text-2xl font-mono font-bold text-emerald-800 bg-emerald-50 py-3 rounded border border-emerald-200", children: createdTicketNo }), _jsxs("div", { className: "flex justify-center space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: () => navigate("/tickets"), className: "px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700", children: "View My Tickets" }), _jsx("button", { type: "button", onClick: () => {
                                setCreatedTicketNo(null);
                                setSummary("");
                                setDescription("");
                                setCategoryId("");
                                setRelatedSystemId("");
                            }, className: "px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50", children: "Create Another Ticket" })] })] }));
    }
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6", children: [_jsx("h1", { className: "text-2xl font-bold text-emerald-800 mb-6", children: "Create New Ticket" }), generalError && (_jsx("div", { className: "mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded", children: generalError })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Category ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: categoryId, onChange: (e) => setCategoryId(e.target.value), className: "w-full border border-gray-300 p-2 rounded focus:ring-emerald-500 focus:border-emerald-500", children: [_jsx("option", { value: "", children: "-- Select Category --" }), categories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] }), fieldErrors.categoryId && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: fieldErrors.categoryId }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Related System ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: relatedSystemId, onChange: (e) => setRelatedSystemId(e.target.value), className: "w-full border border-gray-300 p-2 rounded focus:ring-emerald-500 focus:border-emerald-500", children: [_jsx("option", { value: "", children: "-- Select Related System --" }), relatedSystems.map((sys) => (_jsx("option", { value: sys.id, children: sys.name }, sys.id)))] }), fieldErrors.relatedSystemId && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: fieldErrors.relatedSystemId }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Requested Priority ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: requestedPriority, onChange: (e) => setRequestedPriority(e.target.value), className: "w-full border border-gray-300 p-2 rounded focus:ring-emerald-500 focus:border-emerald-500", children: [_jsx("option", { value: "LOW", children: "LOW" }), _jsx("option", { value: "MEDIUM", children: "MEDIUM" }), _jsx("option", { value: "HIGH", children: "HIGH" })] }), fieldErrors.requestedPriority && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: fieldErrors.requestedPriority }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Summary ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: summary, onChange: (e) => setSummary(e.target.value), placeholder: "Brief summary (5-150 characters)", className: "w-full border border-gray-300 p-2 rounded focus:ring-emerald-500 focus:border-emerald-500" }), fieldErrors.summary && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: fieldErrors.summary }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Description ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("textarea", { rows: 4, value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Detailed description (10-2000 characters)", className: "w-full border border-gray-300 p-2 rounded focus:ring-emerald-500 focus:border-emerald-500" }), fieldErrors.description && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: fieldErrors.description }))] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: () => navigate("/tickets"), className: "px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50", children: isSubmitting ? "Submitting..." : "Create Ticket" })] })] })] }));
}
