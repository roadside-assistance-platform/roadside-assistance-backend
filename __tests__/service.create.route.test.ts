// Mock all middlewares used in app.ts BEFORE imports
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req: any, res: any, next: any) => {
    req.user = { id: 'client1', role: 'client' };
    next();
  },
  isClient: (req: any, res: any, next: any) => next(),
  isProvider: (req: any, res: any, next: any) => next(),
}));

import express from 'express';
import request from 'supertest';
import prisma from '../app';
import router from '../routes/service/create';
import { globalErrorHandler } from '../middleware/errorHandler';

jest.mock('../app', () => ({
  __esModule: true,
  default: {
    service: { create: jest.fn() },
    provider: { findUnique: jest.fn() },
  }
}));

const app = express();
app.use(express.json());
app.use('/service/create', router);
// Attach error handler middleware
app.use(globalErrorHandler);

const mockCreate = (prisma as any).service.create;
const mockProviderFindUnique = (prisma as any).provider.findUnique;
mockCreate.mockImplementation(async (args: any) => {
  // Prisma shape: { data: { ...fields } }
  const d = args.data;
  return {
    id: 'service1',
    clientId: d.clientId,
    serviceCategories: d.serviceCategories,
    price: d.price,
    serviceLocation: d.serviceLocation,
    providerId: d.providerId,
    description: d.description,
  };
});
mockProviderFindUnique.mockResolvedValue({ id: 'provider1', fullName: 'Test Provider' });


describe('POST /service/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 'service1', clientId: 'client1', serviceCategories: ['TOWING'], price: 100 });
  });

  it('should create a new service request', async () => {
    await request(app)
      .post('/service/create')
      .send({ serviceCategory: 'TOWING', price: 100, serviceLocation: '123 Main St' })
      .expect(201)
      .expect(res => {
        expect(res.body).toMatchObject({ id: 'service1', clientId: 'client1', serviceCategories: ['TOWING'], price: 100 });
      });
    expect(mockCreate).toHaveBeenCalled();
  });

  it('should fail with invalid input', async () => {
    await request(app)
      .post('/service/create')
      .send({})
      .expect(400);
  });
});
