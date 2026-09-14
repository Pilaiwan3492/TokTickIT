import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { execSync } from "child_process";

import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { getJwtSecret } from "../../src/utils/jwt.js";
import bcrypt from "bcryptjs";

describe("Lab 3 Authentication Foundation API Tests", () => {
  const prisma = getPrisma();

  beforeAll(async () => {
    // Ensure test users exist with known states
    const defaultHash = bcrypt.hashSync("Password123!", 10);
    const initialHash = bcrypt.hashSync("InitialPass123!", 10);

    // Active Requester (Bob)
    const bob = await prisma.user.upsert({
      where: { email: "bob@example.com" },
      update: {
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "bob@example.com",
        name: "Bob Smith",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    await prisma.requesterUser.upsert({
      where: { email: "bob@example.com" },
      update: { userId: bob.id, isActive: true },
      create: {
        name: "Bob Smith",
        email: "bob@example.com",
        userId: bob.id,
        isActive: true,
      },
    });

    // Inactive Requester (Eve)
    await prisma.user.upsert({
      where: { email: "eve@example.com" },
      update: {
        isActive: false,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "eve@example.com",
        name: "Eve Inactive User",
        role: "REQUESTER",
        isActive: false,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // User requiring password change (Alice)
    const alice = await prisma.user.upsert({
      where: { email: "alice@example.com" },
      update: {
        isActive: true,
        mustChangePassword: true,
        passwordHash: initialHash,
      },
      create: {
        email: "alice@example.com",
        name: "Alice Johnson",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: true,
        passwordHash: initialHash,
      },
    });

    await prisma.requesterUser.upsert({
      where: { email: "alice@example.com" },
      update: { userId: alice.id, isActive: true },
      create: {
        name: "Alice Johnson",
        email: "alice@example.com",
        userId: alice.id,
        isActive: true,
      },
    });

    // Active IT Staff (Michael)
    await prisma.user.upsert({
      where: { email: "michael.brown@toktickit.com" },
      update: {
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "michael.brown@toktickit.com",
        name: "Michael Brown",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // Active Admin (Sarah)
    await prisma.user.upsert({
      where: { email: "sarah.admin@toktickit.com" },
      update: {
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "sarah.admin@toktickit.com",
        name: "Sarah Jenkins",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
  });

  // API-01: Valid login with active account credentials
  it("API-01: should return HTTP 200 with valid JWT Bearer token and safe profile on valid login", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data).toHaveProperty("user");
    expect(res.body.data.user.email).toBe("bob@example.com");
    expect(res.body.data.user.role).toBe("REQUESTER");
    expect(res.body.data.user.isActive).toBe(true);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
  });

  // API-02: Login with incorrect password
  it("API-02: should return HTTP 401 INVALID_CREDENTIALS for incorrect password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "WrongPassword123!" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.error.message).toBe("Invalid email or password. Please try again.");
  });

  // API-03: Login with unregistered email address
  it("API-03: should return HTTP 401 INVALID_CREDENTIALS for unregistered email address", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nonexistent.user.12345@example.com", password: "Password123!" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.error.message).toBe("Invalid email or password. Please try again.");
  });

  // API-04a: Login attempt for inactive account with WRONG password (Account Enumeration Defense)
  it("API-04a: should return generic INVALID_CREDENTIALS when candidate password for inactive user is wrong", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "eve@example.com", password: "GuessedWrongPassword!" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.error.message).toBe("Invalid email or password. Please try again.");
  });

  // API-04b: Login attempt for inactive account with VALID password
  it("API-04b: should return HTTP 401 ACCOUNT_INACTIVE when credentials are valid but account is inactive", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "eve@example.com", password: "Password123!" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("ACCOUNT_INACTIVE");
    expect(res.body.error.message).toBe("Your account is currently inactive. Please contact an administrator.");
  });

  // API-05: User with mustChangePassword: true invoking normal API (First-login gating)
  it("API-05: should return HTTP 403 PASSWORD_CHANGE_REQUIRED when user with mustChangePassword invokes normal API", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "InitialPass123!" });

    expect(loginRes.status).toBe(200);
    const aliceToken = loginRes.body.data.token;
    expect(loginRes.body.data.user.mustChangePassword).toBe(true);

    // Enforced on real business endpoint per Point 3 & 7
    const gatedRes = await request(app)
      .get("/api/v1/tickets")
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(gatedRes.status).toBe(403);
    expect(gatedRes.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
  });

  // API-06: Change password with valid credentials meeting policy
  it("API-06: should return HTTP 200 and set mustChangePassword = false when changing password with valid inputs", async () => {
    // Create dedicated user for password change test
    const changeUserEmail = "pwd.change.test@example.com";
    const initialHash = bcrypt.hashSync("InitialPass123!", 10);
    await prisma.user.upsert({
      where: { email: changeUserEmail },
      update: { mustChangePassword: true, passwordHash: initialHash },
      create: {
        email: changeUserEmail,
        name: "Password Change Tester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: true,
        passwordHash: initialHash,
      },
    });

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: changeUserEmail, password: "InitialPass123!" });

    const token = loginRes.body.data.token;

    const changeRes = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "InitialPass123!",
        newPassword: "BrandNewSecurePass99!",
        confirmPassword: "BrandNewSecurePass99!",
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.data.user.mustChangePassword).toBe(false);

    // Verify login works with new password
    const reLoginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: changeUserEmail, password: "BrandNewSecurePass99!" });
    expect(reLoginRes.status).toBe(200);
  });

  // API-07: Change password where new password matches current password
  it("API-07: should return HTTP 400 VALIDATION_ERROR when new password matches current password", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "Password123!" });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "Password123!",
        confirmPassword: "Password123!",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("different");
  });

  // API-08: Change password failing complexity rule
  it("API-08: should return HTTP 400 VALIDATION_ERROR when new password fails complexity rules (< 8 chars, no symbol)", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "Password123!" });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "short",
        confirmPassword: "short",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // API-09: Retrieve profile of authenticated user (GET /api/v1/auth/me)
  it("API-09: should return HTTP 200 with authenticated user profile from GET /api/v1/auth/me", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "Password123!" });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("bob@example.com");
    expect(res.body.data.name).toBe("Bob Smith");
    expect(res.body.data.role).toBe("REQUESTER");
  });

  // API-10: Logout with active Bearer token
  it("API-10: should return HTTP 200 on logout and invalidate session on server", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "Password123!" });

    const token = loginRes.body.data.token;

    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.data.message).toContain("invalidated");
  });

  // API-10b: Repeated logout with same token
  it("API-10b: should return HTTP 401 SESSION_REVOKED on repeated logout with the same token", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "Password123!" });

    const token = loginRes.body.data.token;

    // First logout -> 200
    await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    // Second logout -> 401 SESSION_REVOKED
    const repeatLogoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(repeatLogoutRes.status).toBe(401);
    expect(repeatLogoutRes.body.error.code).toBe("SESSION_REVOKED");
  });

  // API-11: Request protected endpoint using a revoked token
  it("API-11: should return HTTP 401 SESSION_REVOKED when presenting a revoked token", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "Password123!" });

    const token = loginRes.body.data.token;

    // Logout to revoke token
    await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    // Try to access /me with revoked token
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(401);
    expect(meRes.body.error.code).toBe("SESSION_REVOKED");
  });

  // API-12a: Request protected endpoint with expired JWT
  it("API-12a: should return HTTP 401 SESSION_EXPIRED when presenting an expired token", async () => {
    const secret = getJwtSecret();
    const expiredToken = jwt.sign(
      {
        jti: "expired-jti-uuid",
        sub: "usr-expired-id",
        email: "bob@example.com",
        name: "Bob Smith",
        role: "REQUESTER",
        mustChangePassword: false,
      },
      secret,
      { algorithm: "HS256", expiresIn: "-10s" } // Expired 10 seconds ago
    );

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_EXPIRED");
  });

  // API-12b: Request protected endpoint with forged/tampered JWT
  it("API-12b: should return HTTP 401 SESSION_INVALID when presenting a forged or corrupted token", async () => {
    const forgedToken = jwt.sign(
      {
        jti: "forged-jti-uuid",
        sub: "attacker-user-id",
        email: "attacker@malicious.com",
        role: "ADMIN",
      },
      "completely-wrong-secret-key-that-attacker-used-to-sign"
    );

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  // Bearer Header Format Validation (Point 8 & 9)
  it("should return HTTP 401 SESSION_INVALID when Authorization header is missing on protected endpoint", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  it("should return HTTP 401 SESSION_INVALID when Authorization header uses non-Bearer scheme", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Basic dXNlcjpwYXNzd29yZA==");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  it("should return HTTP 401 SESSION_INVALID when Bearer token is empty", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer ");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  it("should return HTTP 401 SESSION_INVALID when JWT claims are malformed or missing sub", async () => {
    const secret = getJwtSecret();
    const badClaimsToken = jwt.sign(
      { jti: "valid-jti", role: "REQUESTER" },
      secret,
      { algorithm: "HS256" }
    );

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${badClaimsToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  it("should return HTTP 401 SESSION_INVALID when JWT role claim is not a permitted role", async () => {
    const secret = getJwtSecret();
    const badRoleToken = jwt.sign(
      { jti: "valid-jti", sub: "usr-123", role: "UNAUTHORIZED_ROLE", exp: Math.floor(Date.now() / 1000) + 3600 },
      secret,
      { algorithm: "HS256" }
    );

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${badRoleToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  // API-13: Requester ticket operation ignoring client-provided requesterId (BR-03, AC-03)
  it("API-13: should ignore client-provided requesterId and enforce identity from authenticated session token", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "Password123!" });
    expect(loginRes.status).toBe(200);
    const bobToken = loginRes.body.data.token;
    const bobId = loginRes.body.data.user.id;

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Bob creates ticket sending requesterId: 999999 in request body (spoof attempt)
    const createRes = await request(app)
      .post("/api/v1/tickets")
      .set("Authorization", `Bearer ${bobToken}`)
      .send({
        requesterId: 999999,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: "Bob authenticated ticket creation summary",
        description: "Testing that client provided requesterId is completely ignored.",
        requestedPriority: "MEDIUM",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.userId).toBe(bobId);
    expect(createRes.body.data.requesterId).not.toBe(999999);

    // Query tickets with spoof query parameter requesterId=999999
    const listRes = await request(app)
      .get("/api/v1/tickets?requesterId=999999")
      .set("Authorization", `Bearer ${bobToken}`);

    expect(listRes.status).toBe(200);
    for (const t of listRes.body.data) {
      expect(t.userId === bobId || t.requester?.userId === bobId).toBe(true);
    }
  });

  // API-14: Cross-requester ticket access blocked (BR-12, AC-03)
  it("API-14: should return HTTP 403 FORBIDDEN when Requester attempts to access another Requester's ticket", async () => {
    const charlieHash = bcrypt.hashSync("Password123!", 10);
    await prisma.user.upsert({
      where: { email: "charlie@example.com" },
      update: { isActive: true, mustChangePassword: false },
      create: {
        email: "charlie@example.com",
        name: "Charlie Brown",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: charlieHash,
      },
    });

    const charlieLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "charlie@example.com", password: "Password123!" });
    const charlieToken = charlieLogin.body.data.token;

    const bob = await prisma.user.findUnique({ where: { email: "bob@example.com" } });
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    const bobTicket = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-BOB-${Date.now().toString().slice(-6)}`,
        userId: bob!.id,
        requesterId: 1,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: "Bob private workstation issue",
        description: "Only Bob and IT Staff should be able to view this ticket.",
        requestedPriority: "LOW",
        currentStatus: "NEW",
      },
    });

    try {
      const res = await request(app)
        .get(`/api/v1/tickets/${bobTicket.id}`)
        .set("Authorization", `Bearer ${charlieToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    } finally {
      await prisma.ticket.deleteMany({ where: { id: bobTicket.id } });
    }
  });

  // API-ROLE-01: IT_STAFF blocked from Requester Ticket endpoints (AC-08, BR-24)
  it("API-ROLE-01: should return HTTP 403 INSUFFICIENT_PERMISSIONS when IT_STAFF invokes Requester Ticket API", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "michael.brown@toktickit.com", password: "Password123!" });
    expect(loginRes.status).toBe(200);
    const staffToken = loginRes.body.data.token;

    const res = await request(app)
      .get("/api/v1/tickets")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(res.body.error.message).toBe("You do not have permission to access this resource.");
  });

  // API-ROLE-02: ADMIN blocked from Requester Ticket endpoints (AC-08, BR-24)
  it("API-ROLE-02: should return HTTP 403 INSUFFICIENT_PERMISSIONS when ADMIN invokes Requester Ticket API", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "sarah.admin@toktickit.com", password: "Password123!" });
    expect(loginRes.status).toBe(200);
    const adminToken = loginRes.body.data.token;

    const res = await request(app)
      .get("/api/v1/tickets")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
  });

  // API-ROLE-03: Non-REQUESTER blocked from Requester Attachment endpoints (BR-24)
  it("API-ROLE-03: should return HTTP 403 INSUFFICIENT_PERMISSIONS when IT_STAFF invokes Requester Attachment API", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "michael.brown@toktickit.com", password: "Password123!" });
    const staffToken = loginRes.body.data.token;

    const res = await request(app)
      .get("/api/v1/attachments/00000000-0000-0000-0000-000000000000/download")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
  });

  // API-13b: Search and filter queries cannot bypass ticket ownership (BR-03, BR-12)
  it("API-13b: search and filter queries must strictly respect ticket ownership and cannot leak other users' tickets", async () => {
    const charlieLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "charlie@example.com", password: "Password123!" });
    const charlieToken = charlieLogin.body.data.token;

    const bob = await prisma.user.findUnique({ where: { email: "bob@example.com" } });
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    const bobTicket = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-BOB-SRCH-${Date.now().toString().slice(-6)}`,
        userId: bob!.id,
        requesterId: 1,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: "SuperSecretUniqueKeyword Workstation Down",
        description: "Confidential ticket details that Charlie must never find.",
        requestedPriority: "HIGH",
        currentStatus: "NEW",
      },
    });

    try {
      // 1. Charlie searches by summary keyword matching Bob's ticket
      const searchRes = await request(app)
        .get("/api/v1/tickets?search=SuperSecretUniqueKeyword")
        .set("Authorization", `Bearer ${charlieToken}`);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data).toEqual([]);

      // 2. Charlie searches by Bob's exact ticketNo
      const ticketNoRes = await request(app)
        .get(`/api/v1/tickets?search=${bobTicket.ticketNo}`)
        .set("Authorization", `Bearer ${charlieToken}`);

      expect(ticketNoRes.status).toBe(200);
      expect(ticketNoRes.body.data).toEqual([]);

      // 3. Charlie filters by category and priority matching Bob's ticket
      const filterRes = await request(app)
        .get(`/api/v1/tickets?categoryId=${category!.id}&priority=HIGH`)
        .set("Authorization", `Bearer ${charlieToken}`);

      expect(filterRes.status).toBe(200);
      const leaked = filterRes.body.data.some((t: any) => t.id === bobTicket.id);
      expect(leaked).toBe(false);
    } finally {
      await prisma.ticket.deleteMany({ where: { id: bobTicket.id } });
    }
  });

  // API-CONSISTENCY: Ensure consistent 401 SESSION_INVALID for missing/malformed auth on all protected endpoints
  it("API-CONSISTENCY: should consistently return HTTP 401 SESSION_INVALID for missing/malformed auth on all protected endpoints", async () => {
    const endpoints = [
      { method: "get", url: "/api/v1/tickets" },
      { method: "get", url: "/api/v1/attachments/00000000-0000-0000-0000-000000000000/download" },
      { method: "get", url: "/api/v1/auth/me" },
      { method: "post", url: "/api/v1/auth/logout" },
      { method: "post", url: "/api/v1/auth/change-password" },
    ];

    for (const ep of endpoints) {
      // 1. Missing header
      const resNoHeader = await (request(app) as any)[ep.method](ep.url);
      expect(resNoHeader.status).toBe(401);
      expect(resNoHeader.body.error.code).toBe("SESSION_INVALID");

      // 2. Non-Bearer scheme
      const resNonBearer = await (request(app) as any)[ep.method](ep.url)
        .set("Authorization", "Basic dXNlcjpwYXNz");
      expect(resNonBearer.status).toBe(401);
      expect(resNonBearer.body.error.code).toBe("SESSION_INVALID");

      // 3. Empty Bearer token
      const resEmptyBearer = await (request(app) as any)[ep.method](ep.url)
        .set("Authorization", "Bearer    ");
      expect(resEmptyBearer.status).toBe(401);
      expect(resEmptyBearer.body.error.code).toBe("SESSION_INVALID");
    }
  });

  // API-ENV: Throws fatal error on missing or short JWT_SECRET & crashes server startup
  it("API-ENV: should throw fatal security error and fail process startup when JWT_SECRET is missing or under 32 characters", () => {
    const originalSecret = process.env.JWT_SECRET;
    try {
      process.env.JWT_SECRET = "";
      expect(() => getJwtSecret()).toThrow("FATAL SECURITY ERROR");

      process.env.JWT_SECRET = "too-short";
      expect(() => getJwtSecret()).toThrow("FATAL SECURITY ERROR");
    } finally {
      process.env.JWT_SECRET = originalSecret;
    }

    // Real server startup process invocation assertion: crashes with code 1 on missing JWT_SECRET
    try {
      execSync("npx tsx src/index.ts", {
        env: { ...process.env, JWT_SECRET: "" },
        cwd: process.cwd(),
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.unreachable("Server should not have booted without JWT_SECRET");
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain("FATAL SECURITY ERROR");
    }
  });
});
