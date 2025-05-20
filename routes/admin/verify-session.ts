import { Router, Request, Response, NextFunction } from "express";
import { isAuthenticated } from "../../middleware/auth";
import { catchAsync } from "../../utilities/catchAsync";

const router = Router();

/**
 * @swagger
 * /admin/verify-session:
 *   get:
 *     summary: Verify if the current session is valid
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authenticated:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get(
  "/",
  isAuthenticated,
  catchAsync(async (req: Request, res: Response) => {
    // If we get here, the authentication middleware has already verified the session
    res.status(200).json({
      authenticated: true,
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
      },
    });
  })
);

export default router;
