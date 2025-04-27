// Mock all middlewares used in app.ts BEFORE imports
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req: any, res: any, next: any) => { req.user = { id: 'user1', role: 'client' }; next(); },
  isClient: (req: any, res: any, next: any) => next(),
  isProvider: (req: any, res: any, next: any) => next(),
}));

import request from 'supertest';
import express from 'express';
import prisma from '../app';
import router from '../routes/home/home';
import { globalErrorHandler } from '../middleware/errorHandler';

jest.mock('../app', () => ({
  __esModule: true,
  default: {
    client: { findUnique: jest.fn() },
    provider: { findUnique: jest.fn() },
  }
}));

const app = express();
app.use(express.json());
app.use((req: any, res, next) => {
  // Patch req.isAuthenticated as a type predicate
  req.isAuthenticated = function (): this is typeof req & { user: any } {
    return !!this.headers['authorization'];
  };
  if (req.headers['authorization']) {
    req.user = { id: 'user1', role: 'client' };
  }
  next();
});
app.use('/home', router);
// Attach error handler middleware
app.use(globalErrorHandler);


const mockFindUnique = (prisma as any).client.findUnique;
(prisma as any).provider.findUnique = mockFindUnique;

// Set up default mock for client.findUnique
mockFindUnique.mockImplementation(({ where }: any) => {
  if (where.id === 'user1') {
    return Promise.resolve({
      id: 'user1',
      email: 'test@user.com',
      fullName: 'Test User',
      role: 'client',
      client: { id: 'user1', email: 'test@user.com', fullName: 'Test User', phone: '1234567890' }
    });
  }
  return Promise.resolve(null);
});


describe('GET /home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue({ id: 'user1', email: 'test@user.com', fullName: 'Test User', role: 'client' });
  });

  it('should return user info for client', async () => {
    await request(app)
      .get('/home')
      .set('Authorization', 'Bearer validtoken')
      .expect(200)
      .expect(res => {
        expect(res.body).toMatchObject({ id: 'user1', email: 'test@user.com', fullName: 'Test User', role: 'client' });
      });
  });

  it('should return 401 if not authenticated', async () => {
    await request(app)
      .get('/home')
      .expect(401);
  });
});
