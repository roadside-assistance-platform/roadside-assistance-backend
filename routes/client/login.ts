/**
 * @swagger
 * /client/login:
 *   post:
 *     summary: Authenticate and log in a client
 *     description: Authenticates a client using the local strategy and logs them into the system.
 *     tags:
 *       - Client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: The client's email or username.
 *                 example: client@example.com
 *               password:
 *                 type: string
 *                 description: The client's password.
 *                 example: password123
 *     responses:
 *       200:
 *         description: Client authenticated and logged in successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 Client:
 *                   $ref: '#/components/schemas/Client'
 *       401:
 *         description: Authentication failed due to invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Authentication failed
 *                 info:
 *                   type: object
 *                   description: Additional information about the failure.
 *                   example: {}
 *       500:
 *         description: Internal server error occurred during authentication.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
import { Router, Request, Response, NextFunction } from "express";
import passport from "../../utilities/passport";
import { Client } from "@prisma/client";
import logger from "../../utilities/logger";
import { AppError } from "../../utilities/errors";
import { catchAsync } from "../../utilities/catchAsync";

const router = Router();

router.post("/", catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.email || !req.body.password) {
    throw new AppError('Please provide email and password', 400);
  }

  return new Promise((resolve, reject) => {
    passport.authenticate('client-local', (err: Error | null, client: Client | false, info: unknown) => {
      if (err) {
        logger.error('Error during authentication:', { error: err, email: req.body.email });
        return reject(new AppError('Authentication error occurred', 500));
      }

      if (!client) {
        logger.warn('Failed login attempt:', { email: req.body.email, info });
        return reject(new AppError('Invalid email or password', 401));
      }

      req.logIn(client, (loginErr: Error | null) => {
        if (loginErr) {
          logger.error('Login error:', { error: loginErr, email: req.body.email });
          return reject(new AppError('Error logging in', 500));
        }

        logger.info('Successful login:', { email: client.email });
        resolve(res.status(200).json({
          status: 'success',
          message: 'Login successful',
          data: {
            client: {
              id: client.id,
              email: client.email,
              fullName: client.fullName
            }
          }
        }));
      });
    })(req, res, next);
  });
}));


export default router;
