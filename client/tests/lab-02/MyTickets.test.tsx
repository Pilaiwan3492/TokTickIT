import "@testing-library/jest-dom";

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import MyTickets from "../../src/pages/MyTickets.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import { RequesterSelector } from "../../src/components/RequesterSelector.js";

const STORAGE_KEY = "toktickit_selected_requester";

const mockTicketsA = [
  {
    id: 1,
    ticketNo: "TKT-2026-000001",
    summary: "Cannot access email",
    description: "I cannot access my email account.",
    requestedPriority: "HIGH",
    currentStatus: "NEW",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    category: {
      id: 1,
      name: "Software",
    },
    relatedSystem: {
      id: 1,
      name: "Email",
    },
  },
  {
    id: 2,
    ticketNo: "TKT-2026-000002",
    summary: "Laptop problem",
    description: "My laptop is not working.",
    requestedPriority: "LOW",
    currentStatus: "NEW",
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z",
    category: {
      id: 2,
      name: "Hardware",
    },
    relatedSystem: {
      id: 2,
      name: "Laptop",
    },
  },
];

const mockTicketsB = [
  {
    id: 3,
    ticketNo: "TKT-2026-000003",
    summary: "Network connection problem",
    description: "I cannot connect to the network.",
    requestedPriority: "MEDIUM",
    currentStatus: "NEW",
    createdAt: "2026-09-03T10:00:00.000Z",
    updatedAt: "2026-09-03T10:00:00.000Z",
    category: {
      id: 2,
      name: "Hardware",
    },
    relatedSystem: {
      id: 2,
      name: "Network",
    },
  },
];

const mockRequesters = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    isActive: true,
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    isActive: true,
  },
];

function renderMyTickets() {
  return render(
    <MemoryRouter initialEntries={["/tickets"]}>
      <RequesterProvider>
        <Routes>
          <Route
            path="/tickets"
            element={<MyTickets />}
          />

          <Route
            path="/create-ticket"
            element={<div>Create Ticket Page</div>}
          />

          <Route
            path="/select-requester"
            element={<RequesterSelector />}
          />
        </Routes>
      </RequesterProvider>
    </MemoryRouter>
  );
}

function LocationDisplay() {
  const location = useLocation();

  return (
    <div data-testid="current-route">
      {location.pathname}
    </div>
  );
}

function renderMyTicketsWithLocation() {
  return render(
    <MemoryRouter initialEntries={["/tickets"]}>
      <RequesterProvider>
        <Routes>
          <Route
            path="/tickets"
            element={
              <>
                <MyTickets />
                <LocationDisplay />
              </>
            }
          />

          <Route
            path="/create-ticket"
            element={
              <>
                <div>Create Ticket Page</div>
                <LocationDisplay />
              </>
            }
          />

          <Route
            path="/select-requester"
            element={
              <>
                <RequesterSelector />
                <LocationDisplay />
              </>
            }
          />
        </Routes>
      </RequesterProvider>
    </MemoryRouter>
  );
}

function mockFetch(
  tickets = mockTicketsA,
  meta = {
    page: 1,
    limit: 10,
    total: tickets.length,
    totalPages: tickets.length > 0 ? 1 : 0,
  }
) {
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/categories")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 1,
                name: "Software",
              },
              {
                id: 2,
                name: "Hardware",
              },
            ],
          }),
          {
            status: 200,
          }
        );
      }

      if (url.includes("/api/v1/tickets")) {
        return new Response(
          JSON.stringify({
            data: tickets,
            meta,
          }),
          {
            status: 200,
          }
        );
      }

      return new Response(
        JSON.stringify({}),
        {
          status: 404,
        }
      );
    }
  );
}

function getTicketRequestUrls(): string[] {
  return vi
    .mocked(globalThis.fetch)
    .mock.calls
    .map((call) => String(call[0]))
    .filter((url) => url.includes("/api/v1/tickets"));
}

function getLatestTicketRequestUrl(): string {
  const requests = getTicketRequestUrls();

  if (requests.length === 0) {
    throw new Error("No ticket API request was made.");
  }

  return requests[requests.length - 1];
}

describe("MyTickets - Lab 2 UI Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        id: 1,
        name: "Alice Johnson",
        email: "alice@example.com",
        isActive: true,
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads and displays tickets successfully", async () => {
    mockFetch();

    renderMyTickets();

    expect(
      screen.getByText("Loading tickets...")
    ).toBeInTheDocument();

    expect(
      await screen.findByText("TKT-2026-000001")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Cannot access email")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Laptop problem")
    ).toBeInTheDocument();
  });

  it("sends the selected requesterId when loading tickets", async () => {
    mockFetch();

    renderMyTickets();

    await screen.findByText("TKT-2026-000001");

    await waitFor(() => {
      expect(
        getLatestTicketRequestUrl()
      ).toContain("requesterId=1");
    });
  });

  it("sends search parameter when searching tickets", async () => {
    mockFetch();

    const user = userEvent.setup();

    renderMyTickets();

    await screen.findByText("TKT-2026-000001");

    const searchInput = screen.getByPlaceholderText(
      "Search by ticket number, summary, or description..."
    );

    await user.type(searchInput, "email");

    await waitFor(
      () => {
        expect(
          getLatestTicketRequestUrl()
        ).toContain("search=email");
      },
      {
        timeout: 1500,
      }
    );
  });

  it("sends category, priority, and status filters", async () => {
    mockFetch();

    const user = userEvent.setup();

    renderMyTickets();

    await screen.findByText("TKT-2026-000001");

    const selects = screen.getAllByRole("combobox");

    expect(selects).toHaveLength(3);

    await user.selectOptions(selects[0], "1");
    await user.selectOptions(selects[1], "HIGH");
    await user.selectOptions(selects[2], "NEW");

    await waitFor(() => {
      const requestUrl = getLatestTicketRequestUrl();

      expect(requestUrl).toContain("categoryId=1");
      expect(requestUrl).toContain("priority=HIGH");
      expect(requestUrl).toContain("status=NEW");
    });
  });

  it("sends the selected sort option when Ticket No is clicked", async () => {
    mockFetch();

    const user = userEvent.setup();

    renderMyTickets();

    await screen.findByText("TKT-2026-000001");

    await user.click(
      screen.getByText(/Ticket No/)
    );

    await waitFor(() => {
      const requestUrl = getLatestTicketRequestUrl();

      expect(requestUrl).toMatch(
        /sort=ticketNo_(asc|desc)/
      );
    });
  });

  it("changes page when pagination button is clicked", async () => {
    mockFetch(
      mockTicketsA,
      {
        page: 1,
        limit: 10,
        total: 20,
        totalPages: 2,
      }
    );

    const user = userEvent.setup();

    renderMyTickets();

    await screen.findByText("TKT-2026-000001");

    await user.click(
      screen.getByRole("button", {
        name: "2",
      })
    );

    await waitFor(() => {
      const requestUrls = getTicketRequestUrls();

      expect(requestUrls.length).toBeGreaterThanOrEqual(2);

      const latestRequest =
        requestUrls[requestUrls.length - 1];

      expect(latestRequest).toContain("page=2");
    });
  });

  it("shows empty state when there are no tickets", async () => {
    mockFetch(
      [],
      {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      }
    );

    renderMyTickets();

    expect(
      await screen.findByText("No tickets found")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "You haven't created any support tickets yet."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Create Your First Ticket",
      })
    ).toBeInTheDocument();
  });

  it("shows no-results state when filters return no tickets", async () => {
  mockFetch(
    [],
    {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    }
  );

  const user = userEvent.setup();

  renderMyTickets();

  // Initial state: requester has no tickets.
  expect(
    await screen.findByText("No tickets found")
  ).toBeInTheDocument();

  const searchInput = screen.getByPlaceholderText(
    "Search by ticket number, summary, or description..."
  );

  await user.type(
    searchInput,
    "does-not-exist"
  );

  // Wait for the debounced search request to be sent.
  await waitFor(
    () => {
      const requestUrls = getTicketRequestUrls();

      expect(requestUrls.length).toBeGreaterThanOrEqual(2);

      const latestRequest =
        requestUrls[requestUrls.length - 1];

      expect(latestRequest).toContain(
        "search=does-not-exist"
      );
    },
    {
      timeout: 1500,
    }
  );

  expect(
    await screen.findByText(
      "No matching tickets found"
    )
  ).toBeInTheDocument();

  // Clear Filters should be available.
  expect(
    screen.getAllByRole("button", {
      name: "Clear Filters",
    }).length
  ).toBeGreaterThan(0);
});

  it("shows an error message when ticket loading fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/api/v1/categories")) {
          return new Response(
            JSON.stringify({
              data: [],
            }),
            {
              status: 200,
            }
          );
        }

        if (url.includes("/api/v1/tickets")) {
          return new Response(
            JSON.stringify({
              error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to fetch tickets.",
              },
            }),
            {
              status: 500,
            }
          );
        }

        return new Response(
          JSON.stringify({}),
          {
            status: 404,
          }
        );
      }
    );

    renderMyTickets();

    expect(
      await screen.findByText(
        "Failed to fetch tickets."
      )
    ).toBeInTheDocument();
  });

  it("navigates to Create Ticket when Create Ticket button is clicked", async () => {
    mockFetch();

    const user = userEvent.setup();

    renderMyTicketsWithLocation();

    await screen.findByText("TKT-2026-000001");

    expect(
      screen.getByTestId("current-route")
    ).toHaveTextContent("/tickets");

    await user.click(
      screen.getByRole("button", {
        name: /Create Ticket/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("current-route")
      ).toHaveTextContent(
        "/create-ticket"
      );
    });

    expect(
      screen.getByText("Create Ticket Page")
    ).toBeInTheDocument();
  });

  it("shows only the selected requester's tickets when switching requester", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/api/v1/categories")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  id: 1,
                  name: "Software",
                },
                {
                  id: 2,
                  name: "Hardware",
                },
              ],
            }),
            {
              status: 200,
            }
          );
        }

        if (
          url.includes(
            "/api/v1/requesters/active"
          )
        ) {
          /*
           * getActiveRequesters() returns response.json()
           * directly, so this endpoint must return an array.
           */
          return new Response(
            JSON.stringify(mockRequesters),
            {
              status: 200,
            }
          );
        }

        if (url.includes("/api/v1/tickets")) {
          const requesterId = new URL(
            url,
            window.location.origin
          ).searchParams.get(
            "requesterId"
          );

          if (requesterId === "1") {
            return new Response(
              JSON.stringify({
                data: mockTicketsA,
                meta: {
                  page: 1,
                  limit: 10,
                  total: mockTicketsA.length,
                  totalPages: 1,
                },
              }),
              {
                status: 200,
              }
            );
          }

          if (requesterId === "2") {
            return new Response(
              JSON.stringify({
                data: mockTicketsB,
                meta: {
                  page: 1,
                  limit: 10,
                  total: mockTicketsB.length,
                  totalPages: 1,
                },
              }),
              {
                status: 200,
              }
            );
          }
        }

        return new Response(
          JSON.stringify({}),
          {
            status: 404,
          }
        );
      }
    );

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/tickets"]}>
        <RequesterProvider>
          <RequesterSelector />

          <Routes>
            <Route
              path="/tickets"
              element={<MyTickets />}
            />
          </Routes>
        </RequesterProvider>
      </MemoryRouter>
    );

    // Requester A is initially selected.
    expect(
      await screen.findByText(
        "TKT-2026-000001"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Cannot access email"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Laptop problem"
      )
    ).toBeInTheDocument();

    // The Requester Selector has a labelled combobox.
    const requesterSelect =
      screen.getByRole("combobox", {
        name: /Development Requester/i,
      });

    // Switch from Requester A to Requester B.
    await user.selectOptions(
      requesterSelect,
      "2"
    );

    await user.click(
      screen.getByRole("button", {
        name: /Continue/i,
      })
    );

    // Requester B's ticket should appear.
    expect(
      await screen.findByText(
        "TKT-2026-000003"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Network connection problem"
      )
    ).toBeInTheDocument();

    // Requester A's tickets must no longer be visible.
    expect(
      screen.queryByText(
        "TKT-2026-000001"
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        "Cannot access email"
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        "Laptop problem"
      )
    ).not.toBeInTheDocument();
  });
});