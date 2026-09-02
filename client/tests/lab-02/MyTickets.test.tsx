import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, } from "react-router-dom";
import MyTickets from "../../src/pages/MyTickets";
import { RequesterProvider } from "../../src/context/RequesterContext";
import { RequesterSelector } from "../../src/components/RequesterSelector";

const mockTickets = [
  {
    id: 1,
    ticketNo: "TKT-2026-000001",
    summary: "Computer is not working",
    description: "My computer cannot start.",
    requestedPriority: "HIGH",
    currentStatus: "NEW",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
    category: {
      id: 1,
      name: "Hardware",
    },
    relatedSystem: {
      id: 1,
      name: "Network",
    },
  },
  {
    id: 2,
    ticketNo: "TKT-2026-000002",
    summary: "Software installation request",
    description: "I need help installing software.",
    requestedPriority: "MEDIUM",
    currentStatus: "NEW",
    createdAt: "2026-01-11T10:00:00.000Z",
    updatedAt: "2026-01-11T10:00:00.000Z",
    category: {
      id: 2,
      name: "Software",
    },
    relatedSystem: {
      id: 2,
      name: "Email",
    },
  },
];

const mockRequesterTickets = {
  1: [
    {
      ...mockTickets[0],
      id: 1,
      ticketNo: "TKT-2026-000001",
    },
  ],
  2: [
    {
      ...mockTickets[1],
      id: 2,
      ticketNo: "TKT-2026-000002",
    },
  ],
};

const mockRequesters = [
  {
    id: 1,
    name: "Alice Smith",
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

const mockCategories = [
  {
    id: 1,
    name: "Hardware",
  },
  {
    id: 2,
    name: "Software",
  },
];

function createMockResponse(
  data: unknown,
  meta = {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  }
) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data,
      meta,
    }),
  };
}

function createRequesterResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => mockRequesters,
  };
}

function mockFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      // Active requesters
      if (url.includes("/api/v1/requesters/active")) {
        return createRequesterResponse();
      }

      // Categories
      if (url.includes("/api/v1/categories")) {
        return createMockResponse(mockCategories);
      }

      // Tickets
      if (url.includes("/api/v1/tickets")) {
        const parsedUrl = new URL(
          url,
          "http://localhost"
        );

        const requesterId =
          parsedUrl.searchParams.get("requesterId");

        const categoryId =
          parsedUrl.searchParams.get("categoryId");

        const priority =
          parsedUrl.searchParams.get("priority");

        const status =
          parsedUrl.searchParams.get("status");

        const search =
          parsedUrl.searchParams.get("search");

        const page = Number(
          parsedUrl.searchParams.get("page") || "1"
        );

        /*
         * No-results test.
         *
         * Selecting category 1 should return no tickets.
         */
        if (categoryId === "1") {
          return createMockResponse([], {
            total: 0,
            page,
            limit: 10,
            totalPages: 0,
          });
        }

        /*
         * Return tickets according to the selected requester.
         *
         * requesterId=1 -> Alice
         * requesterId=2 -> Bob
         */
        let tickets =
          requesterId === "2"
            ? mockRequesterTickets[2]
            : mockRequesterTickets[1];

        // Search
        if (search) {
          const searchValue = search.toLowerCase();

          tickets = tickets.filter(
            (ticket) =>
              ticket.ticketNo
                .toLowerCase()
                .includes(searchValue) ||
              ticket.summary
                .toLowerCase()
                .includes(searchValue) ||
              ticket.description
                .toLowerCase()
                .includes(searchValue)
          );
        }

        // Priority filter
        if (priority) {
          tickets = tickets.filter(
            (ticket) =>
              ticket.requestedPriority === priority
          );
        }

        // Status filter
        if (status) {
          tickets = tickets.filter(
            (ticket) =>
              ticket.currentStatus === status
          );
        }

        return createMockResponse(tickets, {
          total: tickets.length,
          page,
          limit: 10,
          totalPages: tickets.length > 0 ? 1 : 0,
        });
      }

      return createMockResponse([]);
    })
  );
}

function renderMyTickets() {
  localStorage.setItem(
    "toktickit_selected_requester",
    JSON.stringify(mockRequesters[0])
  );

  return render(
    <MemoryRouter initialEntries={["/my-tickets"]}>
      <RequesterProvider>
        <LocationDisplay />
        <MyTickets />
      </RequesterProvider>
    </MemoryRouter>
  );
}

function renderWithRequesterSelector() {
  localStorage.setItem(
    "toktickit_selected_requester",
    JSON.stringify(mockRequesters[0])
  );

  return render(
    <MemoryRouter initialEntries={["/my-tickets"]}>
      <RequesterProvider>
        <RequesterSelector />
        <MyTickets />
      </RequesterProvider>
    </MemoryRouter>
  );
}

/*
 * Helper component used to verify that navigation
 * actually changes the current route.
 */
function LocationDisplay() {
  const location = useLocation();

  return (
    <div data-testid="current-location">
      {location.pathname}
    </div>
  );
}

function getLatestTicketRequestUrl() {
  const fetchMock = vi.mocked(fetch);

  const ticketRequests = fetchMock.mock.calls.filter(
    ([input]) =>
      String(input).includes("/api/v1/tickets?")
  );

  if (ticketRequests.length === 0) {
    throw new Error("No ticket request was made.");
  }

  return String(
    ticketRequests[ticketRequests.length - 1][0]
  );
}

describe("MyTickets - Lab 2 UI Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    localStorage.clear();

    mockFetch();
  });

  it("loads and displays the user's tickets", async () => {
    renderMyTickets();

    expect(
      await screen.findByText("TKT-2026-000001")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Computer is not working")
    ).toBeInTheDocument();

    /*
     * "Hardware" appears both in the Category
     * filter option and in the ticket table.
     *
     * Use the table cell to avoid the duplicate match.
     */
    expect(
      screen.getByRole("cell", {
        name: "Hardware",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("cell", {
        name: "High",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("cell", {
        name: "New",
      })
    ).toBeInTheDocument();
  });

  it("sends the selected requesterId when loading tickets", async () => {
    renderMyTickets();

    await screen.findByText(
      "TKT-2026-000001"
    );

    const url = getLatestTicketRequestUrl();

    expect(url).toContain("requesterId=1");
  });

  it("sends the search parameter when searching", async () => {
    renderMyTickets();

    await screen.findByText(
      "TKT-2026-000001"
    );

    const user = userEvent.setup();

    const searchInput =
      screen.getByPlaceholderText(
        "Search by ticket number, summary, or description..."
      );

    await user.type(
      searchInput,
      "computer"
    );

    await waitFor(
      () => {
        const url =
          getLatestTicketRequestUrl();

        expect(url).toContain(
          "search=computer"
        );
      },
      {
        timeout: 1000,
      }
    );
  });

  it("renders category, priority, status, and sort filters", async () => {
    renderMyTickets();

    await screen.findByText(
      "TKT-2026-000001"
    );

    const selects =
      screen.getAllByRole("combobox");

    expect(selects).toHaveLength(4);
  });

  it("sends category, priority, and status filters", async () => {
    renderMyTickets();

    await screen.findByText(
      "TKT-2026-000001"
    );

    const user = userEvent.setup();

    const selects =
      screen.getAllByRole("combobox");

    const categorySelect = selects[0];

    const prioritySelect = selects[1];

    const statusSelect = selects[2];

    await user.selectOptions(
      categorySelect,
      "1"
    );

    await waitFor(() => {
      expect(
        getLatestTicketRequestUrl()
      ).toContain("categoryId=1");
    });

    /*
     * Clear the category filter before testing
     * the next filter so that the request does
     * not remain in the no-results state.
     */
    await user.selectOptions(
      categorySelect,
      ""
    );

    await waitFor(() => {
      expect(
        getLatestTicketRequestUrl()
      ).not.toContain("categoryId=1");
    });

    await user.selectOptions(
      prioritySelect,
      "HIGH"
    );

    await waitFor(() => {
      expect(
        getLatestTicketRequestUrl()
      ).toContain("priority=HIGH");
    });

    await user.selectOptions(
      statusSelect,
      "NEW"
    );

    await waitFor(() => {
      expect(
        getLatestTicketRequestUrl()
      ).toContain("status=NEW");
    });
  });

  it("sends the selected sort option when sort is changed", async () => {
    renderMyTickets();

    await screen.findByText(
      "TKT-2026-000001"
    );

    const user = userEvent.setup();

    const sortSelect =
      screen.getByRole("combobox", {
        name: "Sort",
      });

    await user.selectOptions(
      sortSelect,
      "ticketNo_asc"
    );

    await waitFor(() => {
      expect(
        getLatestTicketRequestUrl()
      ).toContain(
        "sort=ticketNo_asc"
      );
    });
  });

  it("supports pagination", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (
          url.includes(
            "/api/v1/requesters/active"
          )
        ) {
          return createRequesterResponse();
        }

        if (
          url.includes(
            "/api/v1/categories"
          )
        ) {
          return createMockResponse(
            mockCategories
          );
        }

        if (
          url.includes(
            "/api/v1/tickets"
          )
        ) {
          const parsedUrl = new URL(
            url,
            "http://localhost"
          );

          const page = Number(
            parsedUrl.searchParams.get(
              "page"
            ) || "1"
          );

          return createMockResponse(
            mockTickets,
            {
              total: 20,
              page,
              limit: 10,
              totalPages: 2,
            }
          );
        }

        return createMockResponse([]);
      })
    );

    renderMyTickets();

    await screen.findByText(
      "TKT-2026-000001"
    );

    const user = userEvent.setup();

    const nextButton =
      screen.getByRole("button", {
        name: /Next/i,
      });

    expect(nextButton).not.toBeDisabled();

    await user.click(nextButton);

    await waitFor(() => {
      expect(
        getLatestTicketRequestUrl()
      ).toContain("page=2");
    });
  });

  it("shows the empty state when there are no tickets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (
          url.includes(
            "/api/v1/requesters/active"
          )
        ) {
          return createRequesterResponse();
        }

        if (
          url.includes(
            "/api/v1/categories"
          )
        ) {
          return createMockResponse(
            mockCategories
          );
        }

        if (
          url.includes(
            "/api/v1/tickets"
          )
        ) {
          return createMockResponse([], {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          });
        }

        return createMockResponse([]);
      })
    );

    renderMyTickets();

    expect(
      await screen.findByText(
        "No tickets found"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "You haven't created any support tickets yet."
      )
    ).toBeInTheDocument();
  });

  it("shows no-results state when a filter returns no tickets", async () => {
    renderMyTickets();

    await screen.findByText(
      "TKT-2026-000001"
    );

    const user = userEvent.setup();

    const categorySelect =
      screen.getAllByRole("combobox")[0];

    await user.selectOptions(
      categorySelect,
      "1"
    );

    expect(
      await screen.findByText(
        "No tickets match your current filters."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Try adjusting or clearing your search and filter criteria."
      )
    ).toBeInTheDocument();
  });

  it("shows an error state when loading tickets fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (
          url.includes(
            "/api/v1/requesters/active"
          )
        ) {
          return createRequesterResponse();
        }

        if (
          url.includes(
            "/api/v1/categories"
          )
        ) {
          return createMockResponse(
            mockCategories
          );
        }

        if (
          url.includes(
            "/api/v1/tickets"
          )
        ) {
          return {
            ok: false,
            status: 500,
            json: async () => ({
              error: {
                code:
                  "INTERNAL_SERVER_ERROR",
                message:
                  "An error occurred while loading tickets.",
              },
            }),
          };
        }

        return createMockResponse([]);
      })
    );

    renderMyTickets();

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "An error occurred while loading tickets."
    );
  });

  it("navigates to Create Ticket when clicking Create Ticket", async () => {
    renderMyTickets();

    await screen.findByText(
      "TKT-2026-000001"
    );

    const user = userEvent.setup();

    const createButton =
      screen.getByRole("button", {
        name: "Create Ticket",
      });

    await user.click(createButton);

    expect(
      screen.getByTestId(
        "current-location"
      )
    ).toHaveTextContent(
      "/create-ticket"
    );
  });

  it("shows only Lab 2 supported status options", async () => {
    renderMyTickets();

    await screen.findByText(
      "TKT-2026-000001"
    );

    expect(
      screen.getByRole("option", {
        name: "New",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "In Progress",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "Resolved",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "Closed",
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("option", {
        name: "Pending",
      })
    ).not.toBeInTheDocument();
  });

  it("switches requester and only shows the selected requester's tickets", async () => {
    renderWithRequesterSelector();

    /*
     * Alice is selected initially.
     */
    expect(
      await screen.findByText(
        "TKT-2026-000001"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "TKT-2026-000002"
      )
    ).not.toBeInTheDocument();

    const user = userEvent.setup();

    const requesterSelect =
      screen.getByRole("combobox", {
        name: /Development Requester/i,
      });

    /*
     * Select Bob.
     */
    await user.selectOptions(
      requesterSelect,
      "2"
    );

    /*
     * Apply the new requester context.
     */
    const continueButton =
      screen.getByRole("button", {
        name: /Continue/i,
      });

    await user.click(continueButton);

    /*
     * Bob's ticket should appear.
     */
    expect(
      await screen.findByText(
        "TKT-2026-000002"
      )
    ).toBeInTheDocument();

    /*
     * Alice's ticket must disappear.
     */
    await waitFor(() => {
      expect(
        screen.queryByText(
          "TKT-2026-000001"
        )
      ).not.toBeInTheDocument();
    });

    /*
     * Verify that MyTickets now requests
     * tickets using Bob's requesterId.
     */
    await waitFor(() => {
      expect(
        getLatestTicketRequestUrl()
      ).toContain(
        "requesterId=2"
      );
    });
  });
});