import { PrismaClient } from "../../server/node_modules/@prisma/client";
import bcrypt from "bcryptjs";

let prisma: PrismaClient | null = null;

export function getE2EPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function resetDatabaseState() {
  const db = getE2EPrisma();

  const defaultPasswordHash = bcrypt.hashSync("Password123!", 10);
  const initialPasswordHash = bcrypt.hashSync("InitialPass123!", 10);

  // 1. Reset Alice Johnson (E2E-02 mandatory first-login password change)
  await db.user.updateMany({
    where: { email: "alice@example.com" },
    data: {
      passwordHash: initialPasswordHash,
      mustChangePassword: true,
      isActive: true,
    },
  });

  // 2. Reset Eve (E2E-03 inactive requester rejection)
  await db.user.updateMany({
    where: { email: "eve@example.com" },
    data: {
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      isActive: false,
    },
  });

  // 3. Reset standard users
  const standardActiveEmails = [
    "bob@example.com",
    "charlie@example.com",
    "david@example.com",
    "jennifer.anderson@example.com",
    "michael.brown@toktickit.com",
    "sarah.johnson@toktickit.com",
    "david.lee@toktickit.com",
    "admin@toktickit.com",
  ];

  for (const email of standardActiveEmails) {
    await db.user.updateMany({
      where: { email },
      data: {
        passwordHash: defaultPasswordHash,
        mustChangePassword: false,
        isActive: true,
      },
    });
  }

  // 4. Remove any dynamically created test tickets and non-canonical tickets
  const canonicalTicketNos = [
    "TKT-2026-000001",
    "TKT-2026-000002",
    "TKT-2026-000003",
    "TKT-2026-000004",
    "TKT-2026-000005",
    "TKT-2026-000006",
    "TKT-2026-000007",
    "TKT-2026-000008",
    "TKT-2026-000009",
    "TKT-2026-000010",
  ];

  const canonicalActionIds = [
    "act-seed-001",
    "act-seed-002",
    "act-seed-003",
    "act-seed-004",
    "act-seed-005",
    "act-seed-006",
    "act-seed-007",
    "act-seed-008",
    "act-seed-009",
    "act-seed-010",
  ];

  await db.actionTaken.deleteMany({
    where: {
      OR: [
        { id: { notIn: canonicalActionIds } },
        { ticket: { ticketNo: { notIn: canonicalTicketNos } } },
      ],
    },
  });

  // Reset canonical seed action act-seed-001 in case it was edited
  await db.actionTaken.updateMany({
    where: { id: "act-seed-001" },
    data: {
      actionDescription: "Verified gateway routing table and pinged remote branch subnet.",
      result: "Subnet reachable; packet loss observed on external peer hop.",
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
    },
  });

  await db.comment.deleteMany({
    where: { ticket: { ticketNo: { notIn: canonicalTicketNos } } },
  });
  await db.internalNote.deleteMany({
    where: { ticket: { ticketNo: { notIn: canonicalTicketNos } } },
  });
  await db.attachment.deleteMany({
    where: { ticket: { ticketNo: { notIn: canonicalTicketNos } } },
  });
  await db.ticket.deleteMany({
    where: { ticketNo: { notIn: canonicalTicketNos } },
  });

  // 5. Remove any dynamically created test/non-canonical users
  const canonicalUserEmails = [
    "alice@example.com",
    "bob@example.com",
    "charlie@example.com",
    "david@example.com",
    "eve@example.com",
    "jennifer.anderson@example.com",
    "michael.brown@toktickit.com",
    "sarah.johnson@toktickit.com",
    "david.lee@toktickit.com",
    "kevin.patel@toktickit.com",
    "admin@toktickit.com",
  ];

  const nonCanonicalUsers = await db.user.findMany({
    where: { email: { notIn: canonicalUserEmails } },
    select: { id: true },
  });
  const nonCanonicalUserIds = nonCanonicalUsers.map((u) => u.id);

  if (nonCanonicalUserIds.length > 0) {
    await db.revokedToken.deleteMany({ where: { userId: { in: nonCanonicalUserIds } } });
    await db.internalNote.deleteMany({ where: { authorId: { in: nonCanonicalUserIds } } });
    await db.comment.deleteMany({ where: { authorId: { in: nonCanonicalUserIds } } });
    await db.actionTaken.deleteMany({ where: { performedById: { in: nonCanonicalUserIds } } });
    await db.ticket.deleteMany({
      where: {
        OR: [
          { userId: { in: nonCanonicalUserIds } },
          { ownerId: { in: nonCanonicalUserIds } },
        ],
      },
    });
    await db.requesterUser.deleteMany({
      where: {
        OR: [
          { userId: { in: nonCanonicalUserIds } },
          { email: { notIn: canonicalUserEmails } },
        ],
      },
    });
    await db.user.deleteMany({ where: { id: { in: nonCanonicalUserIds } } });
  }

  // 6. Reset canonical tickets back to seed statuses
  await db.ticket.updateMany({
    where: { ticketNo: "TKT-2026-000001" },
    data: {
      status: "NEW",
      currentStatus: "NEW",
      ownerId: null,
      itPriority: "MEDIUM",
      isRequesterResolved: false,
    },
  });

  await db.ticket.updateMany({
    where: { ticketNo: "TKT-2026-000002" },
    data: {
      status: "OPEN",
      currentStatus: "OPEN",
      isRequesterResolved: false,
    },
  });

  await db.ticket.updateMany({
    where: { ticketNo: "TKT-2026-000003" },
    data: {
      status: "IN_PROGRESS",
      currentStatus: "IN_PROGRESS",
      isRequesterResolved: false,
    },
  });

  await db.ticket.updateMany({
    where: { ticketNo: "TKT-2026-000004" },
    data: {
      status: "WAITING_FOR_REQUESTER",
      currentStatus: "WAITING_FOR_REQUESTER",
      isRequesterResolved: false,
    },
  });

  await db.ticket.updateMany({
    where: { ticketNo: "TKT-2026-000005" },
    data: {
      status: "RESOLVED",
      currentStatus: "RESOLVED",
      isRequesterResolved: true,
    },
  });

  await db.ticket.updateMany({
    where: { ticketNo: "TKT-2026-000006" },
    data: {
      status: "CLOSED",
      currentStatus: "CLOSED",
      isRequesterResolved: true,
    },
  });

  await db.ticket.updateMany({
    where: { ticketNo: "TKT-2026-000007" },
    data: {
      status: "REOPENED",
      currentStatus: "REOPENED",
      isRequesterResolved: false,
    },
  });

  // 7. Clean up non-seed comments and notes on TKT-2026-000003 (E2E-07)
  const tkt3 = await db.ticket.findUnique({
    where: { ticketNo: "TKT-2026-000003" },
  });
  if (tkt3) {
    await db.comment.deleteMany({
      where: {
        ticketId: tkt3.id,
        id: { notIn: ["cmt-seed-001", "cmt-seed-002"] },
      },
    });
    await db.internalNote.deleteMany({
      where: {
        ticketId: tkt3.id,
        id: { notIn: ["note-seed-001", "note-seed-002"] },
      },
    });
  }
}
