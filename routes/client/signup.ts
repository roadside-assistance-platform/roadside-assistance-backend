/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - fullName
 *         - phone
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           example: password123
 *         fullName:
 *           type: string
 *           example: John Doe
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         photo:
 *           type: string
 *           format: uri
 *           example: "http://example.com/photo.jpg"
 *           nullable: true
 */

/**
 * @swagger
 * /client/signup:
 *   post:
 *     summary: Create a new client
 *     tags: 
 *       - Client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       400:
 *         description: Bad request, missing required fields or client already exists
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "All fields are required: email, password, fullName, phone"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "An error occurred while creating the client"
 */

import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../app';
import { hashPassword } from '../../utilities/bcrypt';
import logger from '../../utilities/logger';
import { catchAsync } from '../../utilities/catchAsync';
import { validateRequest, ValidationRule } from '../../utilities/validation';
import { ValidationError, DatabaseError } from '../../utilities/errors';

const router = Router();

const clientSignupRules: ValidationRule[] = [
  { field: 'email', type: 'email', required: true },
  { field: 'password', type: 'string', required: true, minLength: 8, maxLength: 100 },
  { field: 'fullName', type: 'string', required: true, minLength: 2, maxLength: 100 },
  { field: 'phone', type: 'string', required: true, pattern: /^\+?[1-9]\d{1,14}$/ },
  { field: 'photo', type: 'string', required: false }
];

const createUser = async (role: 'client' | 'provider', data: any) => {
  try {
    if (role === 'client') {
      return await prisma.client.create({ data });
    } else {
      return await prisma.provider.create({ data });
    }
  } catch (error) {
    throw new DatabaseError('Failed to create user');
  }
};

router.post('/', catchAsync(async (req: Request, res: Response) => {
  // Validate request body
  validateRequest(req, clientSignupRules);

  const { email, password, fullName, phone, photo } = req.body;

  // Check for existing user
  const existingUser = await prisma.client.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    throw new ValidationError('Client with this email or phone already exists');
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  const newUser = await createUser('client', {
    email,
    password: hashedPassword,
    fullName,
    phone,
    photo: photo || null
  });

  logger.info('New client created:', { email });

  res.status(201).json({
    status: 'success',
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone,
        photo: newUser.photo
      }
    }
  });
}));

export default router;
