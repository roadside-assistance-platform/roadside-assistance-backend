import request from 'supertest';
import express from 'express';
import router from '../routes/service/update';
import prisma from '../app';
import { globalErrorHandler } from '../middleware/errorHandler';

jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req: any, res: any, next: any) => {
    req.user = { id: 'client1', role: 'client' };
    next();
  },
}));

jest.mock('../app', () => ({
  __esModule: true,
  default: {
    service: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    provider: {
      update: jest.fn(),
    },
  }
}));

const app = express();
app.use(express.json());
app.use('/service/update', router);

const mockFindUnique = (prisma as any).service.findUnique = jest.fn();
const mockUpdate = (prisma as any).service.update = jest.fn();
(prisma as any).provider = { update: jest.fn() };
const mockProviderUpdate = (prisma as any).provider.update;
const mockFindMany = (prisma as any).service.findMany = jest.fn();

const baseService = { id: 'service1', done: true, providerId: 'provider1', clientId: 'client1', rating: null };
mockFindUnique.mockImplementation(async ({ where }: any) => {
  if (where.id === 'service1') {
    return { ...baseService };
  }
  return null;
});
mockUpdate.mockImplementation(async (data: any) => ({ ...data.where, ...data.data }));

describe('Service Rating Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue([{ rating: 4 }, { rating: 5 }]);
  });

  it('should allow client to rate completed service and update provider average', async () => {
    await request(app)
      .put('/service/update/service1')
      .send({ rating: 5 })
      .expect(200);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockProviderUpdate).toHaveBeenCalledWith({ where: { id: 'provider1' }, data: { averageRating: 4.5 } });
  });

  it('should not allow rating if service is not done', async () => {
    const notDoneService = { ...baseService, done: false };
    mockFindUnique.mockResolvedValueOnce(notDoneService);
    await request(app)
      .put('/service/update/service1')
      .send({ rating: 5 })
      .expect(400);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockProviderUpdate).not.toHaveBeenCalled();
  });
});

// Cleanup after all tests
afterAll(() => {
  jest.clearAllMocks();
});
