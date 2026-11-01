import { Priority, Role, TicketStatus } from "@prisma/client";

export const REQUESTER_OPEN_STATUSES: TicketStatus[] = [
  TicketStatus.NEW,
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_REQUESTER,
];

export const TERMINAL_TICKET_STATUSES: TicketStatus[] = [
  TicketStatus.CLOSED,
  TicketStatus.CANCELLED,
];

export const ALL_TICKET_STATUSES: TicketStatus[] = [
  TicketStatus.NEW,
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_REQUESTER,
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
  TicketStatus.REOPENED,
  TicketStatus.CANCELLED,
];

export const REQUESTER_DRILL_DOWN_PATHS = {
  openTickets: "/my-tickets?status=open_all",
  waitingForRequester: "/my-tickets?status=WAITING_FOR_REQUESTER",
  resolved: "/my-tickets?status=RESOLVED",
  closed: "/my-tickets?status=CLOSED",
} as const;

export const STAFF_DRILL_DOWN_PATHS = {
  newCount: "/staff/tickets?status=NEW",
  openCount: "/staff/tickets?status=OPEN",
  inProgressCount: "/staff/tickets?status=IN_PROGRESS",
  waitingForRequesterCount: "/staff/tickets?status=WAITING_FOR_REQUESTER",
  myAssignedCount: "/staff/tickets?ownership=assigned_to_me",
  unassignedCount: "/staff/tickets?ownership=unassigned",
  urgentCount: "/staff/tickets?priority=URGENT",
  highCount: "/staff/tickets?priority=HIGH",
} as const;

/**
 * Builds the canonical Prisma ownership filter for a Requester (BR-13).
 * Matches tickets where Ticket.userId === userId, with legacy fallback for
 * unmigrated tickets where userId is null and requesterId matches requesterProfileId.
 */
export const buildRequesterOwnershipWhere = (
  userId: string,
  requesterProfileId?: number | null
) => {
  if (typeof requesterProfileId === "number") {
    return {
      OR: [
        { userId },
        { AND: [{ userId: null }, { requesterId: requesterProfileId }] },
      ],
    };
  }
  return { userId };
};

/**
 * Builds Prisma where clauses for Requester Dashboard queries (BR-13, BR-16).
 */
export const buildRequesterDashboardQueries = (
  userId: string,
  requesterProfileId?: number | null
) => {
  const ownershipWhere = buildRequesterOwnershipWhere(
    userId,
    requesterProfileId
  );

  return {
    ownershipWhere,
    openTicketsWhere: {
      AND: [ownershipWhere, { status: { in: REQUESTER_OPEN_STATUSES } }],
    },
    waitingForRequesterWhere: {
      AND: [ownershipWhere, { status: TicketStatus.WAITING_FOR_REQUESTER }],
    },
    resolvedWhere: {
      AND: [ownershipWhere, { status: TicketStatus.RESOLVED }],
    },
    closedWhere: {
      AND: [ownershipWhere, { status: TicketStatus.CLOSED }],
    },
  };
};

export interface StatusGroupRow {
  status: TicketStatus;
  _count: {
    _all: number;
  };
}

/**
 * Computes Requester Dashboard metric counters from PostgreSQL GROUP BY status rows (BR-13, BR-16).
 */
export const aggregateRequesterStatusCounts = (rows: StatusGroupRow[]) => {
  let openTickets = 0;
  let waitingForRequester = 0;
  let resolved = 0;
  let closed = 0;

  for (const row of rows) {
    const count = row._count?._all ?? 0;
    if (REQUESTER_OPEN_STATUSES.includes(row.status)) {
      openTickets += count;
    }
    if (row.status === TicketStatus.WAITING_FOR_REQUESTER) {
      waitingForRequester += count;
    }
    if (row.status === TicketStatus.RESOLVED) {
      resolved += count;
    }
    if (row.status === TicketStatus.CLOSED) {
      closed += count;
    }
  }

  return {
    openTickets,
    waitingForRequester,
    resolved,
    closed,
  };
};

/**
 * Builds Prisma where clauses for IT Staff & Administrator Dashboard queries (BR-14, BR-16).
 */
export const buildStaffDashboardQueries = (currentUserId: string) => {
  const activeStatusFilter = { notIn: TERMINAL_TICKET_STATUSES };

  return {
    myAssignedWhere: {
      ownerId: currentUserId,
      status: activeStatusFilter,
    },
    unassignedWhere: {
      ownerId: null,
      status: activeStatusFilter,
    },
    urgentWhere: {
      itPriority: Priority.URGENT,
      status: activeStatusFilter,
    },
    highWhere: {
      itPriority: Priority.HIGH,
      status: activeStatusFilter,
    },
    myActionsWhere: {
      performedById: currentUserId,
    },
  };
};

/**
 * Computes IT Staff Dashboard status breakdown and primary status counters from SQL GROUP BY rows (BR-14, BR-16).
 */
export const aggregateStaffStatusCounts = (rows: StatusGroupRow[]) => {
  const byStatus: Record<TicketStatus, number> = {
    NEW: 0,
    OPEN: 0,
    IN_PROGRESS: 0,
    WAITING_FOR_REQUESTER: 0,
    RESOLVED: 0,
    CLOSED: 0,
    REOPENED: 0,
    CANCELLED: 0,
  };

  for (const row of rows) {
    if (row.status in byStatus) {
      byStatus[row.status] = row._count?._all ?? 0;
    }
  }

  return {
    byStatus,
    statusMetrics: {
      newCount: byStatus.NEW,
      openCount: byStatus.OPEN,
      inProgressCount: byStatus.IN_PROGRESS,
      waitingForRequesterCount: byStatus.WAITING_FOR_REQUESTER,
    },
  };
};

export interface UserRoleGroupRow {
  role: Role;
  _count: {
    _all: number;
  };
}

/**
 * Computes Administrator active user statistics from SQL GROUP BY role rows (BR-15, BR-16).
 */
export const aggregateAdminUserStats = (rows: UserRoleGroupRow[]) => {
  let activeUsers = 0;
  let activeStaff = 0;
  let activeAdmins = 0;

  for (const row of rows) {
    const count = row._count?._all ?? 0;
    activeUsers += count;
    if (row.role === Role.IT_STAFF) {
      activeStaff += count;
    } else if (row.role === Role.ADMIN) {
      activeAdmins += count;
    }
  }

  return {
    activeUsers,
    activeStaff,
    activeAdmins,
  };
};
