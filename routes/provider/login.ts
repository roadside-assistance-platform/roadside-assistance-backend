/**
 * @swagger
 * /provider/login:
 *   post:
 *     summary: Provider login
 *     description: Authenticates a provider using email and password and logs them in.
 *     tags:
 *       - Provider
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
 *                 format: email
 *                 example: provider@example.com
 *                 description: The provider's email address
 *               password:
 *                 type: string
 *                 example: password123
 *                 description: The provider's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 Provider:
 *                   $ref: '#/components/schemas/Provider'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Authentication failed
 *                 details:
 *                   type: string
 *                   example: Invalid email or password
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred
 *                 details:
 *                   type: string
 *                   example: Database connection failed
 */
import { Router, Request, Response, NextFunction } from "express";
import passport from "../../utilities/passport";
import { Provider } from "@prisma/client";
import logger from "../../utilities/logger";
import { AppError } from "../../utilities/errors";
import { catchAsync } from "../../utilities/catchAsync";

const router = Router();

router.post("/", catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.email || !req.body.password) {
    throw new AppError('Please provide email and password', 400);
  }

  return new Promise((resolve, reject) => {
    passport.authenticate('provider-local', (err: Error | null, provider: Provider | false, info: unknown) => {
      if (err) {
        logger.error('Error during authentication:', { error: err, email: req.body.email });
        return reject(new AppError('Authentication error occurred', 500));
      }

      if (!provider) {
        logger.warn('Failed login attempt:', { email: req.body.email, info });
        return reject(new AppError('Invalid email or password', 401));
      }

      req.logIn(provider, (loginErr: Error | null) => {
        if (loginErr) {
          logger.error('Login error:', { error: loginErr, email: req.body.email });
          return reject(new AppError('Error logging in', 500));
        }

        logger.info('Successful login:', { email: provider.email });
        resolve(res.status(200).json({
          status: 'success',
          message: 'Login successful',
          data: {
            provider
          }
        }));
      });
    })(req, res, next);
  });
}));

export default router;
