import { useState } from "react";
import { checkSystem, Category } from "./api.js";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { Header } from "./components/Header.js";

type UiState = "idle" | "loading" | "success" | "error";

function MainContent() {
  const { selectedRequester } = useRequester();
  const [isChanging, setIsChanging] = useState(false);
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!selectedRequester || isChanging) {
    return <RequesterSelector onComplete={() => setIsChanging(false)} />;
  }

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
    <div style={{ backgroundColor: "#F5F7F6", minHeight: "100vh" }}>
      <Header onChangeRequester={() => setIsChanging(true)} />

      <main className="container py-5" style={{ maxWidth: 640 }}>
        <div className="card shadow-sm border-0 p-4 mb-4">
          <h1 className="h4 mb-3">
            TokTickIT <span style={{ color: "#006B3C" }}>IT Service Desk</span>
          </h1>

          <div className="alert alert-success py-2 mb-3 small">
            Current Active Requester: <strong>{selectedRequester.name}</strong> ({selectedRequester.email})
          </div>

          <div>
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
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <MainContent />
    </RequesterProvider>
  );
}