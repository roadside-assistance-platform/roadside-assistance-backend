/**
 * @swagger
 * /:
 *   get:
 *     summary: Home page
 *     description: Returns a success message if the user is authenticated; otherwise, redirects to the login page.
 *     tags:
 *       - Home
 *     responses:
 *       200:
 *         description: User is authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Success! You are in home.
 *       302:
 *         description: User is not authenticated and is redirected to the login page.
 */

import { Router, Request, Response } from "express";
import logger from "../../utilities/logger";
import { sendMail } from "../../utilities/mailsender"

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      role?: string;
      email?: string;
    }
  }
}

const router = Router();

router.get("/", (req: any, res: any) => {
  // Use type assertion for router.get
  try {
    if (!req.isAuthenticated()) {
      logger.warn("Unauthenticated access attempt to home page");
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    logger.info("Home page accessed by authenticated user");

    // Optionally send email - wrapped in try-catch
    try {
      sendMail(
        'alpha@gmail.com',
        'animemino19@gmail.com',
        'Test Subject',
        'This is a test email.',
        '<p>This is a test email.</p>'
      );
    } catch (emailError) {
      logger.error('Failed to send email:', emailError);
      // Don't return here - email failure shouldn't block the response
    }

    return res.json({
      status: 'success',
      message: 'Successfully accessed home page',
      user: {
        id: req.user?.id,
        role: (req.user as any)?.role
      }
    });
  } catch (error) {
    logger.error('Error in home route:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});


export default router;
