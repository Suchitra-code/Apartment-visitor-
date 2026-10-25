require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Flat = require('../src/models/Flat');
const Visitor = require('../src/models/Visitor');
const Ticket = require('../src/models/Ticket');

let adminToken, residentToken, guardToken;
let testFlat, testResident;

jest.setTimeout(30000);

beforeAll(async () => {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);

  // Setup test Flat with unique block for test isolation
  testFlat = await Flat.create({
    block: 'TEST' + Math.floor(Math.random() * 1000),
    floor: 2,
    number: '201',
    type: '2BHK',
  });

  const rand = Math.floor(Math.random() * 100000);

  // Setup Admin
  const adminEmail = `admin_test_${rand}@test.com`;
  const adminRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Test Admin',
      email: adminEmail,
      phone: '1112223334',
      password: 'Password@123',
    });
  await User.findByIdAndUpdate(adminRes.body.data.id, { role: 'admin', status: 'approved' });
  const loginAdmin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: adminEmail, password: 'Password@123' });
  adminToken = loginAdmin.body.data.token;

  // Setup Resident
  const resEmail = `res_test_${rand}@test.com`;
  const resRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Test Resident',
      email: resEmail,
      phone: '5556667778',
      password: 'Password@123',
      flatId: testFlat._id,
    });
  await User.findByIdAndUpdate(resRes.body.data.id, { status: 'approved' });
  testResident = await User.findById(resRes.body.data.id);
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: resEmail, password: 'Password@123' });
  residentToken = loginRes.body.data.token;

  // Setup Guard
  const guardEmail = `guard_test_${rand}@test.com`;
  const guardRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Test Guard',
      email: guardEmail,
      phone: '9998887776',
      password: 'Password@123',
    });
  await User.findByIdAndUpdate(guardRes.body.data.id, { role: 'guard', status: 'approved' });
  const loginGuard = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: guardEmail, password: 'Password@123' });
  guardToken = loginGuard.body.data.token;
});

afterAll(async () => {
  if (testFlat) await Flat.findByIdAndDelete(testFlat._id);
  if (testResident) await User.findByIdAndDelete(testResident._id);
  await mongoose.disconnect();
});

describe('1. Authentication & RBAC Tests', () => {
  it('should prevent unauthorized access to protected endpoints without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should allow authenticated resident to fetch profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${residentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Test Resident');
  });

  it('should reject non-admin from accessing admin endpoints (RBAC check)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${residentToken}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow admin to access metrics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.metrics).toBeDefined();
  });
});

describe('2. Visitor Management & Edge Cases Tests', () => {
  let createdPassCode, createdVisitorId;

  it('should allow resident to pre-approve a visitor with passCode generation', async () => {
    const res = await request(app)
      .post('/api/v1/visitors/pre-approve')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        name: 'James Bond',
        phone: '1234567890',
        purpose: 'guest',
        peopleCount: 2,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.passCode).toBeDefined();
    expect(res.body.data.status).toBe('Pre-approved');
    createdPassCode = res.body.data.passCode;
    createdVisitorId = res.body.data._id;
  });

  it('Edge Case: Guard cannot check-out a visitor who has not checked in yet', async () => {
    const res = await request(app)
      .post('/api/v1/visitors/check-out')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ passCode: createdPassCode });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('must be checked-in first');
  });

  it('Guard checks in visitor with valid pass code', async () => {
    const res = await request(app)
      .post('/api/v1/visitors/check-in')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ passCode: createdPassCode });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('Checked-In');
  });

  it('Edge Case: Guard cannot double check-in an already checked-in visitor', async () => {
    const res = await request(app)
      .post('/api/v1/visitors/check-in')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ passCode: createdPassCode });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('already checked in');
  });

  it('Guard checks out visitor and records duration', async () => {
    const res = await request(app)
      .post('/api/v1/visitors/check-out')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ passCode: createdPassCode });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('Checked-Out');
  });

  it('Edge Case: Guard cannot re-use a checked-out single-entry pass', async () => {
    const res = await request(app)
      .post('/api/v1/visitors/check-in')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ passCode: createdPassCode });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('already been used and checked out');
  });

  it('Edge Case: Expired pass code cannot check in', async () => {
    const expCode = 'EXP' + Math.floor(1000 + Math.random() * 9000);
    const expiredPass = await Visitor.create({
      name: 'Late Visitor',
      phone: '9876543210',
      flat: testFlat._id,
      host: testResident._id,
      passCode: expCode,
      expectedAt: new Date(Date.now() - 48 * 3600 * 1000),
      validUntil: new Date(Date.now() - 24 * 3600 * 1000),
      status: 'Pre-approved',
    });

    const res = await request(app)
      .post('/api/v1/visitors/check-in')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ passCode: expCode });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('expired');
  });
});

describe('3. Maintenance Ticket Workflow Tests', () => {
  let ticketId;

  it('should allow resident to raise a maintenance ticket', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        title: 'Water tap leaking',
        category: 'Plumbing',
        priority: 'High',
        description: 'Persistent dripping sound in bathroom',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('Open');
    expect(res.body.data.ticketNumber).toBeDefined();
    ticketId = res.body.data._id;
  });

  it('should allow adding comments to ticket conversation thread', async () => {
    const res = await request(app)
      .post(`/api/v1/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ message: 'Plumber may come after 2 PM' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should allow admin to change ticket status to Resolved', async () => {
    const res = await request(app)
      .put(`/api/v1/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Resolved', notes: 'Washer replaced' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('Resolved');
  });

  it('should allow resident to rate and close the resolved ticket', async () => {
    const res = await request(app)
      .post(`/api/v1/tickets/${ticketId}/feedback`)
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ rating: 5, feedback: 'Fixed promptly!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.status).toBe('Closed');
  });
});
