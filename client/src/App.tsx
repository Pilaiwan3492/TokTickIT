import { useState } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCheck() {
    // TODO(Issue 4): set loading, call checkSystem(), then either
    //   - success: store categories and show Online + the list, or
    //   - error: show Offline + a useful message.
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
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {/* TODO(Issue 4): render loading / success (Online + categories) / error (Offline) states. */}
      {state === "loading" && (<div className="mt-3 text-secondary">Loading system status...</div>)}

      {state === "success" && (
        <div className="mt-3">
          <p className="fw-bold mb-2">System status: <span className="text-success">Online</span></p>
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
          <p className="fw-bold mb-2">System status: <span className="text-danger">Offline</span></p>
          {errorMessage && <div className="alert alert-danger py-2" role="alert"> {errorMessage}</div>}
        </div>
      )}
    </div>
  );
}
