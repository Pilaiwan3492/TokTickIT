import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/utils/password.js";

describe("Administrator User Management API Tests (Lab 3 — Issue 27: API-39..API-48)", () => {
  const prisma = getPrisma();

  let adminToken: string;
  let adminUserId: string;
  let staffToken: string;
  let requesterToken: string;

  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    const defaultHash = await hashPassword("Password123!");

    // 1. Primary Admin for testing
    const admin = await prisma.user.upsert({
      where: { email: "admin.primary@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash, role: "ADMIN" },
      create: {
        email: "admin.primary@toktickit.com",
        name: "Primary Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    adminUserId = admin.id;

    // 2. Secondary Admin (so primary is not the last active admin during general tests)
    await prisma.user.upsert({
      where: { email: "admin.secondary@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash, role: "ADMIN" },
      create: {
        email: "admin.secondary@toktickit.com",
        name: "Secondary Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // 3. IT Staff for authorization testing
    const staff = await prisma.user.upsert({
      where: { email: "staff.authcheck@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash, role: "IT_STAFF" },
      create: {
        email: "staff.authcheck@toktickit.com",
        name: "Staff AuthCheck",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // 4. Requester for authorization testing
    const requester = await prisma.user.upsert({
      where: { email: "requester.authcheck@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash, role: "REQUESTER" },
      create: {
        email: "requester.authcheck@toktickit.com",
        name: "Requester AuthCheck",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // Log in all three roles to retrieve JWTs
    const loginAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin.primary@toktickit.com", password: "Password123!" });
    adminToken = loginAdmin.body.data.token;

    const loginStaff = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "staff.authcheck@toktickit.com", password: "Password123!" });
    staffToken = loginStaff.body.data.token;

    const loginReq = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "requester.authcheck@toktickit.com", password: "Password123!" });
    requesterToken = loginReq.body.data.token;
  });

  // --- API-39: Administrator retrieves user list with search & role filter ---
  it("API-39: should list users with safe fields, search by name/email, and role filter", async () => {
    // 1. Full list
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const firstUser = res.body.data[0];
    expect(firstUser).toHaveProperty("id");
    expect(firstUser).toHaveProperty("name");
    expect(firstUser).toHaveProperty("email");
    expect(firstUser).toHaveProperty("role");
    expect(firstUser).toHaveProperty("isActive");
    expect(firstUser).toHaveProperty("mustChangePassword");
    expect(firstUser).toHaveProperty("createdAt");

    // Security invariant: never expose credential secrets
    expect(firstUser).not.toHaveProperty("passwordHash");
    expect(firstUser).not.toHaveProperty("tokenVersion");
    expect(firstUser).not.toHaveProperty("password");

    // 2. Search by name
    const resSearchName = await request(app)
      .get("/api/v1/admin/users?search=Primary+Admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(resSearchName.status).toBe(200);
    expect(resSearchName.body.data.some((u: any) => u.email === "admin.primary@toktickit.com")).toBe(true);

    // 3. Search by email
    const resSearchEmail = await request(app)
      .get("/api/v1/admin/users?search=staff.authcheck@toktickit.com")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(resSearchEmail.status).toBe(200);
    expect(resSearchEmail.body.data.length).toBe(1);
    expect(resSearchEmail.body.data[0].email).toBe("staff.authcheck@toktickit.com");

    // 4. Role filter
    const resRoleStaff = await request(app)
      .get("/api/v1/admin/users?role=IT_STAFF")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(resRoleStaff.status).toBe(200);
    expect(resRoleStaff.body.data.every((u: any) => u.role === "IT_STAFF")).toBe(true);

    // 5. Invalid role filter rejected with 400
    const resInvalidRole = await request(app)
      .get("/api/v1/admin/users?role=SUPER_USER")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(resInvalidRole.status).toBe(400);
    expect(resInvalidRole.body.error.code).toBe("VALIDATION_ERROR");
  });

  // --- API-40: Administrator creates new user with one role and initial password ---
  it("API-40: should create a new user with initial password and mustChangePassword = true", async () => {
    testUserEmail = `test.user.${Date.now()}@example.com`;

    const res = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Requester",
        email: testUserEmail,
        role: "REQUESTER",
        isActive: true,
        initialPassword: "InitialPassword123!",
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe("Test Requester");
    expect(res.body.data.email).toBe(testUserEmail.toLowerCase());
    expect(res.body.data.role).toBe("REQUESTER");
    expect(res.body.data.isActive).toBe(true);
    expect(res.body.data.mustChangePassword).toBe(true); // BR-23

    // Exclude password secrets
    expect(res.body.data).not.toHaveProperty("passwordHash");
    expect(res.body.data).not.toHaveProperty("initialPassword");

    testUserId = res.body.data.id;

    // Verify user can log in with initial password and has mustChangePassword = true
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUserEmail, password: "InitialPassword123!" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.mustChangePassword).toBe(true);

    // Verify legacy RequesterUser profile was created/linked
    const legacyReq = await prisma.requesterUser.findFirst({
      where: { email: testUserEmail.toLowerCase() },
    });
    expect(legacyReq).toBeDefined();
    expect(legacyReq?.userId).toBe(testUserId);
  });

  // --- API-41: Administrator attempts to create user with duplicate email ---
  it("API-41: should return HTTP 409 DUPLICATE_EMAIL when email already exists", async () => {
    const res = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Duplicate User",
        email: testUserEmail.toUpperCase(), // Test case-insensitive collision
        role: "IT_STAFF",
        initialPassword: "Password123!",
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_EMAIL");
  });

  // --- API-42: Administrator updates user name, email, role, and active status ---
  it("API-42: should update user profile fields and active status", async () => {
    const updatedEmail = `updated.${Date.now()}@example.com`;

    const res = await request(app)
      .patch(`/api/v1/admin/users/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Updated Requester Name",
        email: updatedEmail,
        role: "IT_STAFF",
        isActive: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Updated Requester Name");
    expect(res.body.data.email).toBe(updatedEmail);
    expect(res.body.data.role).toBe("IT_STAFF");
    expect(res.body.data.isActive).toBe(true);
    expect(res.body.data).not.toHaveProperty("passwordHash");
  });

  // --- API-43: Administrator resets initial password for user ---
  it("API-43: should reset initial password, set mustChangePassword = true, and invalidate sessions", async () => {
    // 1. Create a session for the target user first
    const userEmail = `session.target.${Date.now()}@example.com`;
    const createRes = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Session Target",
        email: userEmail,
        role: "IT_STAFF",
        initialPassword: "OldPassword123!",
      });

    const targetId = createRes.body.data.id;

    // Log in to get active session token
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: userEmail, password: "OldPassword123!" });
    const userSessionToken = loginRes.body.data.token;

    // Small delay to ensure timestamp difference
    await new Promise((r) => setTimeout(r, 50));

    // 2. Admin resets password
    const resetRes = await request(app)
      .post(`/api/v1/admin/users/${targetId}/reset-password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ newInitialPassword: "NewTempPassword123!" });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.data.message).toContain("Initial password reset successfully");

    // 3. Old session token must now be rejected with SESSION_REVOKED
    const accessWithOldToken = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${userSessionToken}`);

    expect(accessWithOldToken.status).toBe(401);
    expect(accessWithOldToken.body.error.code).toBe("SESSION_REVOKED");

    // 4. Old password no longer works
    const failedLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: userEmail, password: "OldPassword123!" });

    expect(failedLogin.status).toBe(401);
    expect(failedLogin.body.error.code).toBe("INVALID_CREDENTIALS");

    // 5. New password works and requires password change
    const successfulLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: userEmail, password: "NewTempPassword123!" });

    expect(successfulLogin.status).toBe(200);
    expect(successfulLogin.body.data.user.mustChangePassword).toBe(true);

    // 6. Reviewer requirement: Old session token MUST still be rejected with 401 SESSION_REVOKED after new login!
    const accessWithOldTokenAfterNewLogin = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${userSessionToken}`);

    expect(accessWithOldTokenAfterNewLogin.status).toBe(401);
    expect(accessWithOldTokenAfterNewLogin.body.error.code).toBe("SESSION_REVOKED");

    // 7. And new session token works cleanly
    const newToken = successfulLogin.body.data.token;
    const accessWithNewToken = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${newToken}`);

    expect(accessWithNewToken.status).toBe(200);
    expect(accessWithNewToken.body.data.email).toBe(userEmail);
  });

  // --- API-44: Administrator attempts to deactivate their own account ---
  it("API-44: should reject self-deactivation with HTTP 400 CANNOT_DEACTIVATE_SELF", async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${adminUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("CANNOT_DEACTIVATE_SELF");

    // Verify admin account remains active
    const checkUser = await prisma.user.findUnique({ where: { id: adminUserId } });
    expect(checkUser?.isActive).toBe(true);
  });

  // --- API-45: Administrator attempts to deactivate or demote the last active Admin ---
  it("API-45: should reject deactivating or demoting the last active Administrator", async () => {
    // 1. Find all other active admins in system
    const otherActiveAdmins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true, id: { not: adminUserId } },
      select: { id: true },
    });

    // Temporarily deactivate them so primary admin is the ONLY active admin in the entire system
    if (otherActiveAdmins.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: otherActiveAdmins.map((u) => u.id) } },
        data: { isActive: false },
      });
    }

    try {
      // Case A: Attempting to demote last active admin to IT_STAFF
      const resDemote = await request(app)
        .patch(`/api/v1/admin/users/${adminUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "IT_STAFF" });

      expect(resDemote.status).toBe(400);
      expect(resDemote.body.error.code).toBe("LAST_ACTIVE_ADMIN_PROTECTED");
    } finally {
      // Restore other admins
      if (otherActiveAdmins.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: otherActiveAdmins.map((u) => u.id) } },
          data: { isActive: true },
        });
      }
    }
  });

  // --- API-45b: Concurrency safety during concurrent demotions of active Administrators ---
  it("API-45b: should prevent race conditions during concurrent demotions of active Administrators", async () => {
    // 1. Create two isolated test admins
    const defaultHash = await hashPassword("Password123!");
    const adminA = await prisma.user.create({
      data: {
        email: `concurrent.admin.a.${Date.now()}@toktickit.com`,
        name: "Concurrent Admin A",
        role: "ADMIN",
        isActive: true,
        passwordHash: defaultHash,
      },
    });

    const adminB = await prisma.user.create({
      data: {
        email: `concurrent.admin.b.${Date.now()}@toktickit.com`,
        name: "Concurrent Admin B",
        role: "ADMIN",
        isActive: true,
        passwordHash: defaultHash,
      },
    });

    // Deactivate all other admins so ONLY adminA and adminB are active
    const otherAdmins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true, id: { notIn: [adminA.id, adminB.id] } },
      select: { id: true },
    });

    if (otherAdmins.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: otherAdmins.map((u) => u.id) } },
        data: { isActive: false },
      });
    }

    try {
      // Log in as Admin A to get authenticated admin token
      const loginA = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: adminA.email, password: "Password123!" });
      const tokenA = loginA.body.data.token;

      // Both requests attempt to demote one admin concurrently using tokenA:
      // Request 1: Demote Admin B to IT_STAFF
      // Request 2: Demote Admin A to IT_STAFF
      const [resA, resB] = await Promise.all([
        request(app)
          .patch(`/api/v1/admin/users/${adminB.id}`)
          .set("Authorization", `Bearer ${tokenA}`)
          .send({ role: "IT_STAFF" }),
        request(app)
          .patch(`/api/v1/admin/users/${adminA.id}`)
          .set("Authorization", `Bearer ${tokenA}`)
          .send({ role: "IT_STAFF" }),
      ]);

      // Exactly ONE request must fail with 400 LAST_ACTIVE_ADMIN_PROTECTED
      const statuses = [resA.status, resB.status];
      expect(statuses).toContain(400);

      const failedRes = resA.status === 400 ? resA : resB;
      expect(failedRes.body.error.code).toBe("LAST_ACTIVE_ADMIN_PROTECTED");

      // Verify at least one active Admin still exists in the database
      const remainingCount = await prisma.user.count({
        where: { id: { in: [adminA.id, adminB.id] }, role: "ADMIN", isActive: true },
      });
      expect(remainingCount).toBeGreaterThanOrEqual(1);
    } finally {
      // Restore other admins
      if (otherAdmins.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: otherAdmins.map((u) => u.id) } },
          data: { isActive: true },
        });
      }
      // Clean up test admins
      await prisma.user.deleteMany({
        where: { id: { in: [adminA.id, adminB.id] } },
      });
    }
  });

  // --- API-42b: RequesterUser synchronization across role transitions ---
  it("API-42b: should synchronize RequesterUser properly across role transitions (IT_STAFF <-> REQUESTER)", async () => {
    const defaultHash = await hashPassword("Password123!");
    const transitionEmail = `transition.${Date.now()}@toktickit.com`;

    // 1. Create IT_STAFF user
    const user = await prisma.user.create({
      data: {
        email: transitionEmail,
        name: "Transition User",
        role: "IT_STAFF",
        isActive: true,
        passwordHash: defaultHash,
      },
    });

    // Initially, no linked RequesterUser
    let reqUser = await prisma.requesterUser.findFirst({ where: { userId: user.id } });
    expect(reqUser).toBeNull();

    // 2. Change role from IT_STAFF to REQUESTER
    const promoteRes = await request(app)
      .patch(`/api/v1/admin/users/${user.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "REQUESTER" });

    expect(promoteRes.status).toBe(200);
    expect(promoteRes.body.data.role).toBe("REQUESTER");

    // RequesterUser must now exist and be linked
    reqUser = await prisma.requesterUser.findFirst({ where: { userId: user.id } });
    expect(reqUser).not.toBeNull();
    expect(reqUser?.email).toBe(transitionEmail);
    expect(reqUser?.isActive).toBe(true);

    // 3. Change role from REQUESTER to IT_STAFF
    const demoteRes = await request(app)
      .patch(`/api/v1/admin/users/${user.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "IT_STAFF" });

    expect(demoteRes.status).toBe(200);
    expect(demoteRes.body.data.role).toBe("IT_STAFF");

    // RequesterUser must still exist for historical ticket integrity
    reqUser = await prisma.requesterUser.findFirst({ where: { userId: user.id } });
    expect(reqUser).not.toBeNull();

    // Clean up
    await prisma.requesterUser.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  // --- API-46: Server-side authorization verification on all Admin endpoints ---
  it("API-46: should reject non-admin users with HTTP 403 INSUFFICIENT_PERMISSIONS", async () => {
    // 1. Requester attempting GET /api/v1/admin/users
    const reqGet = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${requesterToken}`);
    expect(reqGet.status).toBe(403);
    expect(reqGet.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");

    // 2. IT Staff attempting GET /api/v1/admin/users
    const staffGet = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(staffGet.status).toBe(403);
    expect(staffGet.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");

    // 3. Requester attempting POST /api/v1/admin/users
    const reqPost = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ name: "Hacker", email: "hacker@evil.com", role: "ADMIN", initialPassword: "Password123!" });
    expect(reqPost.status).toBe(403);
    expect(reqPost.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");

    // 4. Unauthenticated request without token
    const unauth = await request(app).get("/api/v1/admin/users");
    expect(unauth.status).toBe(401);
  });

  // --- API-47: Safe error responses and validation handling ---
  it("API-47: should return proper status codes for invalid inputs and nonexistent resources", async () => {
    // 1. Nonexistent user UUID -> 404
    const res404 = await request(app)
      .patch("/api/v1/admin/users/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Ghost" });

    expect(res404.status).toBe(404);
    expect(res404.body.error.code).toBe("RESOURCE_NOT_FOUND");

    // 2. Weak initial password -> 400
    const resWeak = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Weak Pass User",
        email: `weak.${Date.now()}@example.com`,
        role: "REQUESTER",
        initialPassword: "weak",
      });

    expect(resWeak.status).toBe(400);
    expect(resWeak.body.error.code).toBe("VALIDATION_ERROR");

    // 3. Empty name -> 400
    const resEmptyName = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "   ",
        email: `emptyname.${Date.now()}@example.com`,
        role: "REQUESTER",
        initialPassword: "Password123!",
      });

    expect(resEmptyName.status).toBe(400);
    expect(resEmptyName.body.error.code).toBe("VALIDATION_ERROR");
  });

  // --- API-48: Direct HTTP DELETE is prohibited (BR-19) ---
  it("API-48: should return HTTP 405 Method Not Allowed on DELETE /api/v1/admin/users/:id", async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/users/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(405);
    expect(res.body.error.code).toBe("METHOD_NOT_ALLOWED");
    expect(res.body.error.message).toContain("cannot be deleted");
  });
});
