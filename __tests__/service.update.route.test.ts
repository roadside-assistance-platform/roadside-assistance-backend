// Mock the isAuthenticated middleware and NotificationService BEFORE any imports
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req: any, res: any, next: any) => {
    req.user = { id: 'client1', role: 'client' };
    next();
  },
  isClient: (req: any, res: any, next: any) => next(),
  isProvider: (req: any, res: any, next: any) => next(),
}));

jest.mock('../services/notification.service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    notifyClient: jest.fn(),
    notifyProvidersOfNewService: jest.fn(),
    notifyProviderOfAssignment: jest.fn(),
    notifyClientOfCompletion: jest.fn(),
  }))
}));

import request from 'supertest';
import express from 'express';
import { NotificationService } from '../services/notification.service';
jest.mock('../app', () => ({
  __esModule: true,
  default: {
    service: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));
import prisma from '../app';
import router from '../routes/service/update';
import { globalErrorHandler } from '../middleware/errorHandler';

afterAll(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

jest.mock('../app');

const app = express();
app.use(express.json());
app.use('/service/update', router);
// Attach error handler middleware
app.use(globalErrorHandler);

const mockNotifyClient = jest.fn();
(NotificationService as any).mockImplementation(() => ({
  notifyClient: mockNotifyClient,
}));

// Use the mocked methods from the prisma mock above
const mockFindUnique = (prisma as any).service.findUnique;
const mockUpdate = (prisma as any).service.update;

describe('PUT /service/update/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue({
      id: 'service1',
      clientId: 'client1',
      providerId: null,
      done: false,
      client: { id: 'client1', fullName: 'Test Client', email: 'test@client.com', phone: '123' },
      provider: null,
    });
    mockUpdate.mockImplementation((args: any) => ({ ...args.data, id: 'service1', client: { id: 'client1' } }));
  });

  it('should notify client when provider is assigned', async () => {
    await request(app)
      .put('/service/update/service1')
      .send({ providerId: 'provider1' })
      .expect(200);
    expect(mockNotifyClient).toHaveBeenCalledWith('client1', expect.objectContaining({ type: 'SERVICE_STATUS', status: 'ACCEPTED' }));
  });

  it('should notify client when status is IN_PROGRESS', async () => {
    await request(app)
      .put('/service/update/service1')
      .send({ status: 'IN_PROGRESS' })
      .expect(200);
    expect(mockNotifyClient).toHaveBeenCalledWith('client1', expect.objectContaining({ type: 'SERVICE_STATUS', status: 'IN_PROGRESS' }));
  });

  it('should notify client when provider is EN_ROUTE', async () => {
    await request(app)
      .put('/service/update/service1')
      .send({ status: 'EN_ROUTE' })
      .expect(200);
    expect(mockNotifyClient).toHaveBeenCalledWith('client1', expect.objectContaining({ type: 'PROVIDER_ARRIVAL', status: 'EN_ROUTE' }));
  });

  it('should notify client when provider is ARRIVED', async () => {
    await request(app)
      .put('/service/update/service1')
      .send({ status: 'ARRIVED' })
      .expect(200);
    expect(mockNotifyClient).toHaveBeenCalledWith('client1', expect.objectContaining({ type: 'PROVIDER_ARRIVAL', status: 'ARRIVED' }));
  });

  it('should notify client when service is completed and request feedback', async () => {
    await request(app)
      .put('/service/update/service1')
      .send({ done: true })
      .expect(200);
    expect(mockNotifyClient).toHaveBeenCalledWith('client1', expect.objectContaining({ type: 'SERVICE_STATUS', status: 'COMPLETED' }));
    expect(mockNotifyClient).toHaveBeenCalledWith('client1', expect.objectContaining({ type: 'FEEDBACK_REQUEST' }));
  });
});
