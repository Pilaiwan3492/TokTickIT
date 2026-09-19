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
  ];

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

  // 6. Reset TKT-2026-000001 (E2E-05, E2E-06)
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
