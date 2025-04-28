import request from 'supertest';
import express from 'express';
import router from '../routes/service/info';

// Mock the isAuthenticated middleware to always call next()
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req: any, res: any, next: any) => next(),
}));
import prisma from '../app';

jest.mock('../app', () => ({
  __esModule: true,
  default: {
    service: { findUnique: jest.fn() },
  }
}));

const app = express();
app.use(express.json());
app.use('/service/info', router);

const mockFindUnique = (prisma as any).service.findUnique;


describe('GET /service/info/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue({ id: 'service1', clientId: 'client1', providerId: 'provider1', serviceCategories: ['TOWING'] });
  });

  it('should return service info if found', async () => {
    await request(app)
      .get('/service/info/service1')
      .expect(200)
      .expect(res => {
        expect(res.body).toMatchObject({ status: 'success', data: { service: { id: 'service1' } } });
      });
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 'service1' }, select: expect.any(Object) });
  });

  it('should return 404 if service not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    await request(app)
      .get('/service/info/unknown')
      .expect(404);
  });
});
