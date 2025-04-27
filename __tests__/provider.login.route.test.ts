import request from 'supertest';
import express from 'express';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
import router from '../routes/provider/login';
import prisma from '../app';

jest.mock('../app', () => ({
  __esModule: true,
  default: {
    provider: { findUnique: jest.fn() },
  }
}));

const app = express();
app.use(express.json());
app.use('/provider/login', router);

const mockFindUnique = (prisma as any).provider.findUnique;
(prisma as any).provider.findUnique = mockFindUnique;
mockFindUnique.mockImplementation(async ({ where }: any) => {
  if (where.email === 'provider@exe.mmaammm') {
    return {
      id: 'provider1',
      email: 'provider@exe.mmaammm',
      fullName: 'Jane Smith',
      password: 'hashedpassword',
      serviceCategories: ['TOWING'],
      phone: '+21322221122',
      photo: 'https://example.com/provider-photo.jpg',
    };
  }
  return null;
});

jest.mock('bcrypt', () => ({
  compare: jest.fn(() => Promise.resolve(true)),
}));

describe('POST /provider/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue({
      id: 'provider1',
      email: 'provider@exe.mmaammm',
      fullName: 'Jane Smith',
      serviceCategories: ['TOWING'],
      phone: '+21322221122',
      photo: 'https://example.com/provider-photo.jpg',
    });
  });

  it('should login provider and return user info with categories', async () => {
    await request(app)
      .post('/provider/login')
      .send({ email: 'provider@exe.mmaammm', password: 'securepassword' })
      .expect(200)
      .expect(res => {
        expect(res.body).toMatchObject({
          id: 'provider1',
          email: 'provider@exe.mmaammm',
          fullName: 'Jane Smith',
          serviceCategories: ['TOWING'],
          phone: '+21322221122',
          photo: 'https://example.com/provider-photo.jpg',
        });
      });
    expect(mockFindUnique).toHaveBeenCalled();
  });

  it('should fail with invalid credentials', async () => {
    mockFindUnique.mockResolvedValue(null);
    await request(app)
      .post('/provider/login')
      .send({ email: 'wrong@provider.com', password: 'wrong' })
      .expect(401);
  });
});
