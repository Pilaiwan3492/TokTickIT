import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Role-Based Authorization API Tests (Lab 3 — Issue 26: API-15..API-18)", () => {
  const prisma = getPrisma();

  let tokenRequester: string;
  let tokenStaff: string;
  let tokenAdmin: string;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // 1. Requester
    await prisma.user.upsert({
      where: { email: "authz.requester@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "authz.requester@example.com",
        name: "Arthur Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // 2. IT Staff
    await prisma.user.upsert({
      where: { email: "authz.staff@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "authz.staff@toktickit.com",
        name: "Beatrice Staff",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // 3. Admin
    await prisma.user.upsert({
      where: { email: "authz.admin@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "authz.admin@toktickit.com",
        name: "Charles Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // 4. Retrieve tokens
    const resReq = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "authz.requester@example.com", password: "Password123!" });
    tokenRequester = resReq.body.data.token;

    const resStaff = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "authz.staff@toktickit.com", password: "Password123!" });
    tokenStaff = resStaff.body.data.token;

    const resAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "authz.admin@toktickit.com", password: "Password123!" });
    tokenAdmin = resAdmin.body.data.token;
  });

  // --- API-15: Requester attempts to query IT Staff Queue ---
  it("API-15: should reject Requester attempting to query IT Staff Queue with HTTP 403 INSUFFICIENT_PERMISSIONS", async () => {
    const res = await request(app)
      .get("/api/v1/staff/tickets")
      .set("Authorization", `Bearer ${tokenRequester}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(res.body.data).toBeUndefined();
  });

  // --- API-16: Requester attempts to access Admin API ---
  it("API-16: should reject Requester attempting to access Admin API with HTTP 403 INSUFFICIENT_PERMISSIONS", async () => {
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${tokenRequester}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(res.body.data).toBeUndefined();
  });

  // --- API-17: IT Staff attempts to access Admin API ---
  it("API-17: should reject IT Staff attempting to access Admin API with HTTP 403 INSUFFICIENT_PERMISSIONS", async () => {
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(res.body.data).toBeUndefined();
  });

  // --- API-18: Administrator accesses IT Staff ticket operations ---
  it("API-18: should permit Administrator to access IT Staff ticket operations with HTTP 200 OK", async () => {
    const res = await request(app)
      .get("/api/v1/staff/tickets")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
