import { Router, Request, Response, NextFunction } from "express";
import passport from "../../utilities/passport";
import logger from "../../utilities/logger";
import { AppError } from "../../utilities/errors";
import { catchAsync } from "../../utilities/catchAsync";

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
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
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: Admin123!
 *     responses:
 *       200:
 *         description: Admin authenticated and logged in successfully.
 *       400:
 *         description: Missing email or password.
 *       401:
 *         description: Invalid credentials.
 *       500:
 *         description: Authentication error occurred.
 */
const router = Router();

// POST /admin/login
router.post(
  "/",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.email || !req.body.password) {
      throw new AppError("Please provide email and password", 400);
    }
    passport.authenticate("admin-local", (err: any, admin: any, info: any) => {
      if (err) {
        logger.error("Error during admin authentication:", { error: err, email: req.body.email });
        return next(new AppError("Authentication error occurred", 500));
      }
      if (!admin) {
        return next(new AppError("Invalid credentials", 401));
      }
      req.logIn(admin, (err) => {
        if (err) return next(new AppError("Error logging in", 500));
        logger.info("Admin login successful:", { email: admin.email });
        return res.status(200).json({
          status: "success",
          message: "Admin login successful",
          user: { id: admin.id, email: admin.email, role: admin.role },
        });
      });
    })(req, res, next);
  })
);

export default router;
