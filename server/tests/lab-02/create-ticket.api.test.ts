import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

describe("POST /api/v1/tickets Validation & Creation Scenarios", () => {
  it("should create a ticket with valid data, TKT-YYYY-XXXXXX format, and initial status NEW", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .send({
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "   Unable to access company email   ",
        description: "   I cannot access my company email account since this morning.   ",
        requestedPriority: "HIGH",
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.ticketNo).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.data.currentStatus).toBe("NEW");
    expect(res.body.data.summary).toBe("Unable to access company email");
    expect(res.body.data.description).toBe("I cannot access my company email account since this morning.");
  });

  it("should return 400 INVALID_REQUESTER_CONTEXT when requester context is missing or invalid", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Valid summary text",
        description: "Valid description text long enough",
        requestedPriority: "MEDIUM",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUESTER_CONTEXT");
  });

  it("should return 400 when categoryId does not exist or is inactive", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .send({
        requesterId: 1,
        categoryId: 99999,
        relatedSystemId: 1,
        summary: "Valid summary text",
        description: "Valid description text long enough",
        requestedPriority: "MEDIUM",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });

  it("should return 400 when relatedSystemId does not exist or is inactive", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .send({
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 99999,
        summary: "Valid summary text",
        description: "Valid description text long enough",
        requestedPriority: "MEDIUM",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });

  it("should return 400 when requestedPriority is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .send({
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Valid summary text",
        description: "Valid description text long enough",
        requestedPriority: "URGENT",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields.requestedPriority).toBeDefined();
  });

  it("should return 400 when summary or description length boundary fails", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .send({
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Tiny",
        description: "Short",
        requestedPriority: "LOW",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields.summary).toBeDefined();
    expect(res.body.error.fields.description).toBeDefined();
  });
});