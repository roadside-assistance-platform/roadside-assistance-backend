import { Router, Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utilities/catchAsync";
import logger from "../../utilities/logger";

const router = Router();

/**
 * @swagger
 * /admin/logout:
 *   post:
 *     summary: Log out the current admin user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
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
 *                   example: Successfully logged out
 *       500:
 *         description: Server error during logout
 */
router.post(
  "/",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Log the logout action
    if (req.user) {
      logger.info(`Admin logging out: ${req.user.email}`, { userId: req.user.id });
    }
    
    // Clear the session
    req.logout((err) => {
      if (err) {
        logger.error('Error during logout:', err);
        return next(err);
      }
      
      // Clear the session cookie
      res.clearCookie('roadside.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      
      // Clear the connect.sid cookie that express-session sets
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      
      // Send success response
      res.status(200).json({
        status: 'success',
        message: 'Successfully logged out',
      });
    });
  })
);

export default router;
