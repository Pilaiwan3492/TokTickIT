import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { checkSystem, Category } from "./api";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import { RequesterSelector } from "./components/RequesterSelector";
import { Header } from "./components/Header";
import CreateTicket from "./pages/CreateTicket";
import MyTickets from "./pages/MyTickets";
import TicketDetail from "./pages/TicketDetail";

type UiState = "idle" | "loading" | "success" | "error";

function HomeContent() {
  const { selectedRequester } = useRequester();
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCheck() {
    setState("loading");
    setErrorMessage(null);

    try {
      const data = await checkSystem();
      setCategories(data.categories);
      setState("success");
    } catch (error) {
      console.error("Error checking system:", error);
      setErrorMessage("Unable to connect to TokTickIT API.");
      setState("error");
    }
  }

  return (
    <main className="container py-5" style={{ maxWidth: 640 }}>
      <div className="card shadow-sm border-0 p-4 mb-4">
        <h1 className="h4 mb-3">
          TokTickIT <span style={{ color: "#006B3C" }}>IT Service Desk</span>
        </h1>

        <div className="alert alert-success py-2 mb-3 small">
          Current Active Requester: <strong>{selectedRequester?.name}</strong> ({selectedRequester?.email})
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn text-white fw-semibold"
            style={{ backgroundColor: "#006B3C" }}
            onClick={handleCheck}
            disabled={state === "loading"}
          >
            {state === "loading" ? "Loading…" : "Check System"}
          </button>
        </div>

        {state === "loading" && <div className="mt-3 text-secondary">Loading system status...</div>}

        {state === "success" && (
          <div className="mt-3">
            <p className="fw-bold mb-2">
              System status: <span className="text-success">Online</span>
            </p>
            <p className="fw-semibold mb-2">Supported Request Categories:</p>
            <ol className="ps-3">
              {categories.map((category) => (
                <li key={category.id} className="mb-1">
                  {category.name}
                </li>
              ))}
            </ol>
          </div>
        )}

        {state === "error" && (
          <div className="mt-3">
            <p className="fw-bold mb-2">
              System status: <span className="text-danger">Offline</span>
            </p>
            {errorMessage && <div className="alert alert-danger py-2" role="alert"> {errorMessage}</div>}
          </div>
        )}
      </div>
    </main>
  );
}

function AppContent() {
  const { selectedRequester } = useRequester();
  const [isChanging, setIsChanging] = useState(false);

  if (!selectedRequester || isChanging) {
    return <RequesterSelector onComplete={() => setIsChanging(false)} />;
  }

  return (
    <div style={{ backgroundColor: "#F5F7F6", minHeight: "100vh" }}>
      <Header onChangeRequester={() => setIsChanging(true)} />
      <Routes>
        <Route path="/" element={<HomeContent />} />
        
        <Route path="/create-ticket" element={<CreateTicket />} />
        <Route path="/tickets/new" element={<CreateTicket />} />

        <Route path="/tickets" element={<MyTickets />} />

        <Route path="/tickets/:id" element={<TicketDetail />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <AppContent />
    </RequesterProvider>
  );
}