import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({
        id: 1,
        name: "Alice Johnson",
        email: "alice@example.com",
        isActive: true,
      })
    );
  });

  it("renders the TokTickIT heading", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/TokTickIT/i)[0]).toBeInTheDocument();
  });

  it("shows Online and the seeded categories on success", async () => {
    vi.spyOn(api, "checkSystem").mockResolvedValue({
      online: true,
      categories: [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Software" },
        { id: 4, name: "Network" },
      ],
    });

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    const button = screen.getByRole("button", { name: /Check System/i });
    await userEvent.click(button);

    expect(await screen.findByText(/Online/i)).toBeInTheDocument();
    expect(screen.getByText("Account and Access")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();
    expect(screen.getByText("Software")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
  });

  it("shows an Offline error message when the API is unavailable", async () => {
    vi.spyOn(api, "checkSystem").mockRejectedValue(
      new Error("Unable to connect to TokTickIT API.")
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    const button = screen.getByRole("button", { name: /Check System/i });
    await userEvent.click(button);

    expect(await screen.findByText(/Offline/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to connect/i)
    ).toBeInTheDocument();
  });
});