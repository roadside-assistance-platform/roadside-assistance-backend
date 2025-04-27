/**
 * @swagger
 * /home:
 *   get:
 *     summary: Get home dashboard/info
 *     description: Returns a success message if the user is authenticated; otherwise, returns an unauthorized error.
 *     tags:
 *       - Home
 *     responses:
 *       200:
 *         description: User is authenticated
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
 *                   example: Successfully accessed home page
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

import { Router, Request, Response } from "express";
import logger from "../../utilities/logger";
import { sendMail } from "../../utilities/mailsender";

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

import { prisma } from "../../app";

router.get("/", async (req: any, res: any) => {
  try {
    if (!req.isAuthenticated()) {
      logger.warn("Unauthenticated access attempt to home page");
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    logger.info("Home page accessed by authenticated user");

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
    }

    // Fetch and sanitize user info
    let userInfo = null;
    if (req.user?.role === 'provider') {
      userInfo = await prisma.provider.findUnique({ where: { id: req.user.id } });
    } else if (req.user?.role === 'client') {
      userInfo = await prisma.client.findUnique({ where: { id: req.user.id } });
    }
    if (!userInfo) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    // Remove password from the returned object if present
    const { password, ...sanitizedUser } = userInfo;
    return res.json({
      status: 'success',
      message: 'Successfully accessed home page',
      user: sanitizedUser
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
