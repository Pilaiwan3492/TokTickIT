import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('POST /api/v1/tickets', () => {
  it('should create a ticket with TKT-YYYY-XXXXXX format and initial status NEW (AC-01)', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .send({
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Unable to access company email',
        description: 'I cannot access my company email account since this morning.',
        requestedPriority: 'HIGH'
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.ticketNo).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.data.currentStatus).toBe('NEW');
  });

  it('should return 400 with field errors for invalid lengths (AC-09)', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .send({
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Tiny',
        description: 'Short',
        requestedPriority: 'MEDIUM'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.summary).toBeDefined();
    expect(res.body.error.fields.description).toBeDefined();
  });
});