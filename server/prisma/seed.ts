import bcrypt from "bcryptjs";
import { getPrisma } from "../src/prisma.js";

export async function seedDatabase() {
  const prisma = getPrisma();

  console.log("Starting TokTickIT Lab 4 database seeding...");

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
    // Ticket 10: RESOLVED, Legacy Ticket with 0 Actions Taken (Tests legacy tolerance & BR-11 advisory cue)
    {
      ticketNo: "TKT-2026-000010",
      requesterId: jenniferReqId,
      userId: jenniferUserId,
      ownerId: sarahStaffId,
      categoryId: hwCatId,
      relatedSystemId: laptopSysId,
      summary: "Display brightness flickering on conference room external monitor",
      description: "Legacy hardware issue resolved without formal Action Taken entries logged.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      status: "RESOLVED" as const,
      currentStatus: "RESOLVED" as const,
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

  // 7. Seed Actions Taken (Lab 4 Parent-Child Actions across Diverse Distributions)
  const tkt2Id = ticketMap.get("TKT-2026-000002")!;
  const tkt4Id = ticketMap.get("TKT-2026-000004")!;
  const tkt5Id = ticketMap.get("TKT-2026-000005")!;
  const tkt6Id = ticketMap.get("TKT-2026-000006")!;
  const tkt7Id = ticketMap.get("TKT-2026-000007")!;
  const tkt9Id = ticketMap.get("TKT-2026-000009")!;

  const seedActions = [
    // Ticket 2 (OPEN) - 1 Action (Michael Brown)
    {
      id: "act-seed-001",
      ticketId: tkt2Id,
      actionDate: new Date("2026-10-02T10:15:00Z"),
      actionDescription: "Verified gateway routing table and pinged remote branch subnet.",
      result: "Subnet reachable; packet loss observed on external peer hop.",
      performedById: michaelStaffId,
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
    },
    // Ticket 4 (WAITING_FOR_REQUESTER) - 1 Action with Follow-up (David Lee)
    {
      id: "act-seed-002",
      ticketId: tkt4Id,
      actionDate: new Date("2026-10-03T11:00:00Z"),
      actionDescription: "Emailed department director requesting approval for ledger access.",
      result: "Director requested clarification on specific ledger accounts required.",
      performedById: davidStaffId,
      followUpRequired: true,
      followUpNote: "Awaiting response from Charlie Brown with specific cost center account codes.",
      attachmentNotes: "Attached corporate access requisition form template.",
    },
    // Ticket 5 (RESOLVED) - 1 Action (Michael Brown)
    {
      id: "act-seed-003",
      ticketId: tkt5Id,
      actionDate: new Date("2026-10-04T14:20:00Z"),
      actionDescription: "Installed latest DisplayLink USB-C firmware package 11.2 and tested dual video outputs.",
      result: "Both displays recognized in 4K resolution; dock power delivery stable.",
      performedById: michaelStaffId,
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
    },
    // Ticket 6 (CLOSED) - 1 Action (Sarah Johnson)
    {
      id: "act-seed-004",
      ticketId: tkt6Id,
      actionDate: new Date("2026-10-03T09:30:00Z"),
      actionDescription: "Reconfigured Exchange spam digest notification schedule to daily 8:00 AM delivery.",
      result: "User confirmed quarantine digest email received successfully.",
      performedById: sarahStaffId,
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
    },
    // Ticket 9 (OPEN) - 1 Action with Follow-up (Admin John Smith)
    {
      id: "act-seed-005",
      ticketId: tkt9Id,
      actionDate: new Date("2026-10-05T08:45:00Z"),
      actionDescription: "Generated ephemeral SOC2 auditor credentials with 72-hour TTL and MFA requirement.",
      result: "Auditor successfully logged in and initiated compliance review.",
      performedById: adminUserId,
      followUpRequired: true,
      followUpNote: "Audit window expires on Friday at 17:00; audit credentials will be automatically revoked.",
      attachmentNotes: "Stored security audit authorization reference in ticket internal notes.",
    },
    // Ticket 3 (IN_PROGRESS, URGENT) - Multiple Actions by Multiple Contributors
    // Contributor 1: Sarah Johnson
    {
      id: "act-seed-006",
      ticketId: tkt3Id,
      actionDate: new Date("2026-10-04T08:00:00Z"),
      actionDescription: "Reviewed Microsoft 365 tenant health and Exchange ActiveSync diagnostics.",
      result: "Discovered SSL certificate thumbprint mismatch across NLB nodes.",
      performedById: sarahStaffId,
      followUpRequired: true,
      followUpNote: "Need secondary staff member to inspect edge firewall certificate bindings.",
      attachmentNotes: "Saved diagnostic packet capture log.",
    },
    // Contributor 2: Michael Brown (different staff contributor)
    {
      id: "act-seed-007",
      ticketId: tkt3Id,
      actionDate: new Date("2026-10-04T10:30:00Z"),
      actionDescription: "Regenerated SSL intermediate certificates on reverse proxy and restarted EAS service.",
      result: "Mobile sync restored for 3 test devices; monitoring edge connection pool.",
      performedById: michaelStaffId,
      followUpRequired: true,
      followUpNote: "Coordinate with Administrator for final certificate vault sync during change window.",
      attachmentNotes: null,
    },
    // Contributor 3: John Smith (Admin contributor)
    {
      id: "act-seed-008",
      ticketId: tkt3Id,
      actionDate: new Date("2026-10-04T13:00:00Z"),
      actionDescription: "Synchronized Key Vault secrets and updated failover cluster SSL thumbprint configuration.",
      result: "Cluster health check green; zero HTTP 500 errors across all edge proxies.",
      performedById: adminUserId,
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
    },
    // Ticket 7 (REOPENED, HIGH) - Multiple Actions by Multiple Contributors
    // Contributor 1: David Lee
    {
      id: "act-seed-009",
      ticketId: tkt7Id,
      actionDate: new Date("2026-10-02T16:00:00Z"),
      actionDescription: "Rolled back router firmware from v2.4.1 to v2.3.9.",
      result: "Router rebooted cleanly; initial ping test succeeded.",
      performedById: davidStaffId,
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
    },
    // Contributor 2: Sarah Johnson
    {
      id: "act-seed-010",
      ticketId: tkt7Id,
      actionDate: new Date("2026-10-05T15:00:00Z"),
      actionDescription: "Captured Wireshark traces during scheduled evening VoIP test call.",
      result: "Identified MTU packet fragmentation causing tunnel drops at 1492 bytes.",
      performedById: sarahStaffId,
      followUpRequired: true,
      followUpNote: "Adjust WAN interface MTU to 1420 bytes on next scheduled maintenance.",
      attachmentNotes: "VoIP call capture trace attached.",
    },
  ];

  for (const a of seedActions) {
    const existing = await prisma.actionTaken.findUnique({ where: { id: a.id } });
    if (!existing) {
      await prisma.actionTaken.create({ data: a });
    }
  }
  console.log("All TokTickIT Lab 4 seed data populated successfully and idempotently without state overwrites!");

  return {
    categoriesCount: categories.length,
    systemsCount: relatedSystems.length,
    usersCount: seedUsers.length,
    requesterProjectionsCount: requesterMap.size,
    ticketsCount: seedTickets.length,
    commentsCount: seedComments.length,
    notesCount: seedNotes.length,
    actionsCount: seedActions.length,
  };
}

const isMain =
  Boolean(process.argv[1]) &&
  (process.argv[1].replace(/\\/g, "/").endsWith("prisma/seed.ts") ||
    process.argv[1].replace(/\\/g, "/").endsWith("prisma/seed.js"));

if (isMain) {
  seedDatabase()
    .catch((e) => {
      console.error("Error during seed execution:", e);
      process.exit(1);
    })
    .finally(async () => {
      await getPrisma().$disconnect();
    });
}
