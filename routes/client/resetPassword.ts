import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../app";
import { hashPassword } from "../../utilities/bcrypt";
import logger from "../../utilities/logger";
import { catchAsync } from "../../utilities/catchAsync";
import { validateRequest, ValidationRule } from "../../utilities/validation";
import { AppError, ValidationError } from "../../utilities/errors";

const router = Router();

const resetPasswordRules: ValidationRule[] = [
  { field: 'email', type: 'email', required: true },
  { field: 'newPassword', type: 'string', required: true, minLength: 8, maxLength: 100 }
];

/**
 * @swagger
 * /client/reset-password:
 *   post:
 *     summary: Reset client password
 *     tags: [Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               newPassword:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: Password reset successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
router.post("/reset-password", validateRequest(resetPasswordRules), catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, newPassword } = req.body;
  const client = await prisma.client.findUnique({ where: { email } });
  if (!client) {
    throw new AppError('Client not found', 404);
  }
  const hashedPassword = await hashPassword(newPassword);
  await prisma.client.update({ where: { email }, data: { password: hashedPassword } });
  logger.info(`Password reset for client: ${email}`);
  res.status(200).json({ status: 'success', message: 'Password reset successfully' });
}));

export default router;
