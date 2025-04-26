import express, { Request, Response, NextFunction } from "express";
import passport from "../utilities/passport";
import logger from "../utilities/logger";
import { AppError } from "../utilities/errors";
import { catchAsync } from "../utilities/catchAsync";

const router = express.Router();

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login for admin, client, or provider
 *     tags:
 *       - Authentication
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
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: strongPassword123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 12345
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Email and password not provided
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Authentication error occurred
 */

// POST /login (admin, client, provider)
router.post(
  "/",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.email || !req.body.password) {
      throw new AppError("Please provide email and password", 400);
    }
    // Helper function to handle login
    const handleLogin = (role: string, user: any) => {
      req.logIn(user, (err) => {
        if (err) return next(new AppError("Error logging in", 500));
        logger.info(`${role} login successful:`, { email: user.email });
        return res.status(200).json({
          status: "success",
          message: `${role} login successful`,
          user: { id: user.id, email: user.email, role: user.role },
        });
      });
    };

    // Try admin login first
    passport.authenticate("admin-local", (err:any, user:any) => {
      if (err) {
        logger.error("Error during admin authentication:", { error: err, email: req.body.email });
        return next(new AppError("Authentication error occurred", 500));
      }
      if (user) {
        handleLogin("Admin", user);
        return;
      }

      // Try client login
      passport.authenticate("client-local", (err:any, user:any) => {
        if (err) {
          logger.error("Error during client authentication:", { error: err, email: req.body.email });
          return next(new AppError("Authentication error occurred", 500));
        }
        if (user) {
          handleLogin("Client", user);
          return;
        }

        // Try provider login
        passport.authenticate("provider-local", (err:any, user:any) => {
          if (err) {
            logger.error("Error during provider authentication:", { error: err, email: req.body.email });
            return next(new AppError("Authentication error occurred", 500));
          }
          if (user) {
            handleLogin("Provider", user);
            return;
          }

          // No user found
          return next(new AppError("Invalid credentials", 401));
        })(req, res, next);
      })(req, res, next);
    })(req, res, next);
  })
);

export default router;
