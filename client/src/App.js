import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { checkSystem } from "./api.js";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { Header } from "./components/Header.js";
import CreateTicket from "./pages/CreateTicket.js";
import MyTickets from "./pages/MyTickets";
import TicketDetail from "./pages/TicketDetail.js";
function HomeContent() {
    const { selectedRequester } = useRequester();
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    async function handleCheck() {
        setState("loading");
        setErrorMessage(null);
        try {
            const data = await checkSystem();
            setCategories(data.categories);
            setState("success");
        }
        catch (error) {
            console.error("Error checking system:", error);
            setErrorMessage("Unable to connect to TokTickIT API.");
            setState("error");
        }
    }
    return (_jsx("main", { className: "container py-5", style: { maxWidth: 640 }, children: _jsxs("div", { className: "card shadow-sm border-0 p-4 mb-4", children: [_jsxs("h1", { className: "h4 mb-3", children: ["TokTickIT ", _jsx("span", { style: { color: "#006B3C" }, children: "IT Service Desk" })] }), _jsxs("div", { className: "alert alert-success py-2 mb-3 small", children: ["Current Active Requester: ", _jsx("strong", { children: selectedRequester?.name }), " (", selectedRequester?.email, ")"] }), _jsx("div", { className: "d-flex gap-2", children: _jsx("button", { className: "btn text-white fw-semibold", style: { backgroundColor: "#006B3C" }, onClick: handleCheck, disabled: state === "loading", children: state === "loading" ? "Loading…" : "Check System" }) }), state === "loading" && _jsx("div", { className: "mt-3 text-secondary", children: "Loading system status..." }), state === "success" && (_jsxs("div", { className: "mt-3", children: [_jsxs("p", { className: "fw-bold mb-2", children: ["System status: ", _jsx("span", { className: "text-success", children: "Online" })] }), _jsx("p", { className: "fw-semibold mb-2", children: "Supported Request Categories:" }), _jsx("ol", { className: "ps-3", children: categories.map((category) => (_jsx("li", { className: "mb-1", children: category.name }, category.id))) })] })), state === "error" && (_jsxs("div", { className: "mt-3", children: [_jsxs("p", { className: "fw-bold mb-2", children: ["System status: ", _jsx("span", { className: "text-danger", children: "Offline" })] }), errorMessage && _jsxs("div", { className: "alert alert-danger py-2", role: "alert", children: [" ", errorMessage] })] }))] }) }));
}
function AppContent() {
    const { selectedRequester } = useRequester();
    const [isChanging, setIsChanging] = useState(false);
    if (!selectedRequester || isChanging) {
        return _jsx(RequesterSelector, { onComplete: () => setIsChanging(false) });
    }
    return (_jsxs("div", { style: { backgroundColor: "#F5F7F6", minHeight: "100vh" }, children: [_jsx(Header, { onChangeRequester: () => setIsChanging(true) }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomeContent, {}) }), _jsx(Route, { path: "/create-ticket", element: _jsx(CreateTicket, {}) }), _jsx(Route, { path: "/tickets/new", element: _jsx(CreateTicket, {}) }), _jsx(Route, { path: "/tickets", element: _jsx(MyTickets, {}) }), _jsx(Route, { path: "/tickets/:id", element: _jsx(TicketDetail, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] })] }));
}
export default function App() {
    return (_jsx(RequesterProvider, { children: _jsx(AppContent, {}) }));
}
