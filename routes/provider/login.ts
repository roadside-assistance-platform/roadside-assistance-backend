/**
 * @swagger
 * /provider/login:
 *   post:
 *     summary: Authenticate and log in a provider
 *     description: Authenticates a provider using the local strategy and logs them into the system.
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
 *                 description: The provider's email.
 *                 example: provider@example.com
 *               password:
 *                 type: string
 *                 description: The provider's password.
 *                 example: password123
 *     responses:
 *       200:
 *         description: Provider authenticated and logged in successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/Provider'
 *       401:
 *         description: Authentication failed due to invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       403:
 *         description: Account has been deleted and cannot be accessed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account has been deleted and cannot be accessed
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
import { Provider } from "@prisma/client";
import logger from "../../utilities/logger";
import { AppError } from "../../utilities/errors";
import { catchAsync } from "../../utilities/catchAsync";

const router = Router();

router.post("/", catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!('email' in req.body) || !('password' in req.body)) {
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

      // Block login for deleted providers
      if ((provider as any).deleted) {
        logger.warn('Login attempt for deleted account:', { email: req.body.email });
        return reject(new AppError('Account has been deleted and cannot be accessed', 403));
      }

      req.logIn(provider, (loginErr: Error | null) => {
        if (loginErr) {
          logger.error('Login error:', { error: loginErr, email: req.body.email });
          return reject(new AppError('Error logging in', 500));
        }

        logger.info('Successful provider login:', { email: provider.email });
        resolve(res.status(200).json({
          status: 'success',
          message: 'Login successful',
          data: {
            user: {
              id: provider.id,
              email: provider.email,
              fullName: provider.fullName,
              phone: provider.phone,
              photo: provider.photo,
              serviceCategories: provider.serviceCategories,
              isApproved: provider.isApproved,
              averageRating: provider.averageRating
            }
          }
        }));
      });
    })(req, res, next);
  });
}));

export default router;
