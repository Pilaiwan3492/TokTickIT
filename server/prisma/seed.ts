import bcrypt from "bcryptjs";
import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

  console.log("Starting TokTickIT Lab 3 database seeding...");

  // 1. Categories
  const categories = ["Account and Access", "Hardware", "Software", "Network"];
  const categoryMap = new Map<string, number>();

  for (const name of categories) {
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      categoryMap.set(name, existing.id);
    } else {
      const record = await prisma.category.create({
        data: { name, isActive: true },
      });
      categoryMap.set(name, record.id);
    }
  }
  console.log("✓ Seeded 4 categories");

  // 2. Related Systems
  const relatedSystems = [
    "ERP System",
    "HR Portal",
    "Email & Calendar",
    "VPN & Remote Access",
    "Internal Wiki",
    "Finance & Accounting",
  ];
  const systemMap = new Map<string, number>();

  for (const name of relatedSystems) {
    const existing = await prisma.relatedSystem.findUnique({ where: { name } });
    if (existing) {
      systemMap.set(name, existing.id);
    } else {
      const record = await prisma.relatedSystem.create({
        data: { name, isActive: true },
      });
      systemMap.set(name, record.id);
    }
  }
  console.log("✓ Seeded 6 related systems");

  // Common password hashes (rounds = 10)
  const defaultPasswordHash = bcrypt.hashSync("Password123!", 10);
  const initialPasswordHash = bcrypt.hashSync("InitialPass123!", 10);

  // 3. Users (Lab 3 Canonical User Entity)
  // All emails are normalized to lowercase to uphold case-insensitive uniqueness
  const seedUsers = [
    // Requesters (>= 4 active, 1 inactive, 1 mandatory password change)
    {
      email: "alice@example.com",
      name: "Alice Johnson",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: true, // Special case: API-05, E2E-02 mandatory first-login change
      passwordHash: initialPasswordHash,
    },
    {
      email: "bob@example.com",
      name: "Bob Smith",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
    },
    {
      email: "charlie@example.com",
      name: "Charlie Brown",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
    },
    {
      email: "david@example.com",
      name: "David Miller",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
    },
    {
      email: "eve@example.com",
      name: "Eve Inactive User",
      role: "REQUESTER" as const,
      isActive: false, // Special case: API-04, E2E-03 inactive requester rejection
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
    },
    {
      email: "jennifer.anderson@example.com",
      name: "Jennifer Anderson",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
    },

    // IT Staff (>= 3 active, 1 inactive)
    {
      email: "michael.brown@toktickit.com",
      name: "Michael Brown",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
    },
    {
      email: "sarah.johnson@toktickit.com",
      name: "Sarah Johnson",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
    },
    {
      email: "david.lee@toktickit.com",
      name: "David Lee",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
    },
    {
      email: "kevin.patel@toktickit.com",
      name: "Kevin Patel",
      role: "IT_STAFF" as const,
      isActive: false, // Special case: inactive IT Staff member
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
    },

    // Administrator (>= 1 active)
    {
      email: "admin@toktickit.com",
      name: "John Smith",
      role: "ADMIN" as const,
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
    },
  ];

  const userMap = new Map<string, string>(); // lowercase email -> User.id

  for (const u of seedUsers) {
    const normalizedEmail = u.email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      // True Idempotency: Preserve existing user state completely.
      // Never overwrite isActive, role, name, mustChangePassword, or passwordHash.
      userMap.set(normalizedEmail, existing.id);
    } else {
      const created = await prisma.user.create({
        data: {
          ...u,
          email: normalizedEmail,
        },
      });
      userMap.set(normalizedEmail, created.id);
    }
  }
  console.log(`✓ Seeded/verified ${seedUsers.length} Users across REQUESTER, IT_STAFF, and ADMIN`);

  // 4. RequesterUser (Legacy Projection for Lab 2 Compatibility)
  const requesterMap = new Map<string, number>(); // lowercase email -> RequesterUser.id
  for (const u of seedUsers) {
    if (u.role === "REQUESTER") {
      const normalizedEmail = u.email.trim().toLowerCase();
      const userId = userMap.get(normalizedEmail);
      const existing = await prisma.requesterUser.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
      });

      if (existing) {
        // Preserve existing state; link userId if missing
        if (!existing.userId && userId) {
          await prisma.requesterUser.update({
            where: { id: existing.id },
            data: { userId },
          });
        }
        requesterMap.set(normalizedEmail, existing.id);
      } else {
        const created = await prisma.requesterUser.create({
          data: {
            email: normalizedEmail,
            name: u.name,
            isActive: u.isActive,
            userId,
          },
        });
        requesterMap.set(normalizedEmail, created.id);
      }
    }
  }
  console.log(`✓ Seeded/verified ${requesterMap.size} RequesterUser legacy projections`);

  // 5. Test-Oriented Seed Tickets
  const jenniferReqId = requesterMap.get("jennifer.anderson@example.com")!;
  const jenniferUserId = userMap.get("jennifer.anderson@example.com")!;
  const bobReqId = requesterMap.get("bob@example.com")!;
  const bobUserId = userMap.get("bob@example.com")!;
  const charlieReqId = requesterMap.get("charlie@example.com")!;
  const charlieUserId = userMap.get("charlie@example.com")!;
  const davidReqId = requesterMap.get("david@example.com")!;
  const davidUserId = userMap.get("david@example.com")!;
  const aliceReqId = requesterMap.get("alice@example.com")!;
  const aliceUserId = userMap.get("alice@example.com")!;

  const michaelStaffId = userMap.get("michael.brown@toktickit.com")!;
  const sarahStaffId = userMap.get("sarah.johnson@toktickit.com")!;
  const davidStaffId = userMap.get("david.lee@toktickit.com")!;
  const adminUserId = userMap.get("admin@toktickit.com")!;

  const hwCatId = categoryMap.get("Hardware")!;
  const swCatId = categoryMap.get("Software")!;
  const netCatId = categoryMap.get("Network")!;
  const accCatId = categoryMap.get("Account and Access")!;

  const laptopSysId = systemMap.get("Finance & Accounting")!;
  const vpnSysId = systemMap.get("VPN & Remote Access")!;
  const emailSysId = systemMap.get("Email & Calendar")!;
  const erpSysId = systemMap.get("ERP System")!;

  const seedTickets = [
    // Ticket 1: NEW, Unassigned (Claimable), MEDIUM priority
    {
      ticketNo: "TKT-2026-000001",
      requesterId: jenniferReqId,
      userId: jenniferUserId,
      ownerId: null,
      categoryId: hwCatId,
      relatedSystemId: laptopSysId,
      summary: "Laptop battery drains quickly under normal office load",
      description: "Battery depletes in under 40 minutes after Windows 11 system update.",
      requestedPriority: "MEDIUM" as const,
      itPriority: "MEDIUM" as const,
      status: "NEW" as const,
      currentStatus: "NEW" as const,
      isRequesterResolved: false,
    },
    // Ticket 2: OPEN, Assigned to IT Staff (Michael Brown), HIGH priority
    {
      ticketNo: "TKT-2026-000002",
      requesterId: bobReqId,
      userId: bobUserId,
      ownerId: michaelStaffId,
      categoryId: netCatId,
      relatedSystemId: vpnSysId,
      summary: "Cannot connect to corporate VPN from remote office",
      description: "Client reports timeout error 789 when establishing IPSec tunnel.",
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      status: "OPEN" as const,
      currentStatus: "OPEN" as const,
      isRequesterResolved: false,
    },
    // Ticket 3: IN_PROGRESS, Assigned to IT Staff (Sarah Johnson), URGENT priority, with Comments & Notes
    {
      ticketNo: "TKT-2026-000003",
      requesterId: jenniferReqId,
      userId: jenniferUserId,
      ownerId: sarahStaffId,
      categoryId: swCatId,
      relatedSystemId: emailSysId,
      summary: "Executive email not syncing on mobile devices",
      description: "Exchange ActiveSync fails with HTTP 500 error on multiple mobile clients.",
      requestedPriority: "HIGH" as const,
      itPriority: "URGENT" as const,
      status: "IN_PROGRESS" as const,
      currentStatus: "IN_PROGRESS" as const,
      isRequesterResolved: false,
    },
    // Ticket 4: WAITING_FOR_REQUESTER, Assigned to IT Staff (David Lee), LOW priority
    {
      ticketNo: "TKT-2026-000004",
      requesterId: charlieReqId,
      userId: charlieUserId,
      ownerId: davidStaffId,
      categoryId: accCatId,
      relatedSystemId: erpSysId,
      summary: "Requesting additional permissions for Q3 billing report module",
      description: "Needs read access to financial billing sub-ledger.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      status: "WAITING_FOR_REQUESTER" as const,
      currentStatus: "WAITING_FOR_REQUESTER" as const,
      isRequesterResolved: false,
    },
    // Ticket 5: RESOLVED, Assigned (Michael Brown), MEDIUM priority, isRequesterResolved = true
    {
      ticketNo: "TKT-2026-000005",
      requesterId: bobReqId,
      userId: bobUserId,
      ownerId: michaelStaffId,
      categoryId: hwCatId,
      relatedSystemId: laptopSysId,
      summary: "External dual monitor docking station not detected",
      description: "DisplayPort over USB-C fails to initialize on Dell dock.",
      requestedPriority: "MEDIUM" as const,
      itPriority: "MEDIUM" as const,
      status: "RESOLVED" as const,
      currentStatus: "RESOLVED" as const,
      isRequesterResolved: true, // Special case: Requester indicates resolved
    },
    // Ticket 6: CLOSED, Assigned (Sarah Johnson), LOW priority
    {
      ticketNo: "TKT-2026-000006",
      requesterId: aliceReqId,
      userId: aliceUserId,
      ownerId: sarahStaffId,
      categoryId: swCatId,
      relatedSystemId: emailSysId,
      summary: "Spam filter configuration inquiry",
      description: "Requested explanation of quarantine notification frequency.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      status: "CLOSED" as const,
      currentStatus: "CLOSED" as const,
      isRequesterResolved: true,
    },
    // Ticket 7: REOPENED, Assigned (David Lee), HIGH priority
    {
      ticketNo: "TKT-2026-000007",
      requesterId: davidReqId,
      userId: davidUserId,
      ownerId: davidStaffId,
      categoryId: netCatId,
      relatedSystemId: vpnSysId,
      summary: "Intermittent connection drop during evening conference calls",
      description: "Issue reoccurred after router firmware downgrade.",
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      status: "REOPENED" as const,
      currentStatus: "REOPENED" as const,
      isRequesterResolved: false,
    },
    // Ticket 8: CANCELLED, Unassigned, LOW priority
    {
      ticketNo: "TKT-2026-000008",
      requesterId: aliceReqId,
      userId: aliceUserId,
      ownerId: null,
      categoryId: hwCatId,
      relatedSystemId: laptopSysId,
      summary: "Keyboard replacement requested by mistake",
      description: "User located their original wireless peripheral; ticket cancelled.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      status: "CANCELLED" as const,
      currentStatus: "CANCELLED" as const,
      isRequesterResolved: false,
    },
    // Ticket 9: Admin-Owned Ticket (John Smith / ADMIN), OPEN, HIGH priority
    {
      ticketNo: "TKT-2026-000009",
      requesterId: bobReqId,
      userId: bobUserId,
      ownerId: adminUserId, // Owned by Administrator to test dual IT Staff / Admin ticket capability
      categoryId: accCatId,
      relatedSystemId: erpSysId,
      summary: "Critical access credential provisioning for system auditor",
      description: "Direct administrator intervention required for SOC2 audit credentials.",
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      status: "OPEN" as const,
      currentStatus: "OPEN" as const,
      isRequesterResolved: false,
    },
  ];

  const ticketMap = new Map<string, string>(); // ticketNo -> Ticket.id

  for (const t of seedTickets) {
    const existing = await prisma.ticket.findUnique({
      where: { ticketNo: t.ticketNo },
    });

    if (existing) {
      // True Idempotency: Preserve existing ticket state.
      // Do not overwrite status, ownerId, priority, or user edits on subsequent seed runs.
      ticketMap.set(t.ticketNo, existing.id);
    } else {
      const created = await prisma.ticket.create({
        data: t,
      });
      ticketMap.set(t.ticketNo, created.id);
    }
  }
  console.log(`✓ Seeded/verified ${seedTickets.length} test-oriented Tickets covering all 8 statuses and 4 priorities`);

  // 6. Seed Public Comments & Internal Notes for Ticket 3
  const tkt3Id = ticketMap.get("TKT-2026-000003")!;

  // Public Comments
  const seedComments = [
    {
      id: "cmt-seed-001",
      ticketId: tkt3Id,
      authorId: jenniferUserId, // Requester comment
      content: "I noticed this issue started happening right after the latest system update.",
    },
    {
      id: "cmt-seed-002",
      ticketId: tkt3Id,
      authorId: sarahStaffId, // IT Staff comment
      content: "Thank you for the update Jennifer. We are actively reviewing Exchange connection logs now.",
    },
  ];

  for (const c of seedComments) {
    const existing = await prisma.comment.findUnique({ where: { id: c.id } });
    if (!existing) {
      await prisma.comment.create({ data: c });
    }
  }
  console.log(`✓ Seeded/verified ${seedComments.length} Public Comments`);

  // Internal Notes (Role-restricted)
  const seedNotes = [
    {
      id: "note-seed-001",
      ticketId: tkt3Id,
      authorId: sarahStaffId, // IT Staff note
      content: "Diagnostic telemetry points to SSL certificate thumbprint mismatch on load balancer #2.",
    },
    {
      id: "note-seed-002",
      ticketId: tkt3Id,
      authorId: adminUserId, // Admin note
      content: "Certificate renewed in key vault. Awaiting maintenance window for rolling restart.",
    },
  ];

  for (const n of seedNotes) {
    const existing = await prisma.internalNote.findUnique({ where: { id: n.id } });
    if (!existing) {
      await prisma.internalNote.create({ data: n });
    }
  }
  console.log(`✓ Seeded/verified ${seedNotes.length} Internal Notes`);

  console.log("All TokTickIT Lab 3 seed data populated successfully and idempotently without state overwrites!");
}

main()
  .catch((e) => {
    console.error("Error during seed execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
