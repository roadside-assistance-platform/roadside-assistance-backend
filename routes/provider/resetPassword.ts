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
 * /provider/reset-password:
 *   post:
 *     summary: Reset provider password
 *     tags: [Provider]
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
 *                 example: provider@example.com
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
 *         description: Provider not found
 *       500:
 *         description: Internal server error
 */
router.post("/reset-password", validateRequest(resetPasswordRules), catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, newPassword } = req.body;
  const provider = await prisma.provider.findUnique({ where: { email } });
  if (!provider) {
    throw new AppError('Provider not found', 404);
  }
  const hashedPassword = await hashPassword(newPassword);
  await prisma.provider.update({ where: { email }, data: { password: hashedPassword } });
  logger.info(`Password reset for provider: ${email}`);
  res.status(200).json({ status: 'success', message: 'Password reset successfully' });
}));

export default router;
