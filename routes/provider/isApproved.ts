import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { catchAsync } from '../../utilities/catchAsync';
import { NotFoundError } from '../../errors/notFound.error';

const prisma = new PrismaClient();

/**
 * @swagger
 * /provider/is-approved/{id}:
 *   get:
 *     summary: Check if provider is approved
 *     description: Check if a provider's account has been approved by checking the isApproved field.
 *     tags:
 *       - Provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the provider
 *     responses:
 *       200:
 *         description: Approval status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isApproved:
 *                       type: boolean
 *                       description: Whether the provider's account is approved
 *       404:
 *         description: Provider not found
 *       500:
 *         description: Internal server error
 */
export const isProviderApproved = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const provider = await prisma.provider.findUnique({
    where: { id },
    select: {
      id: true,
      isApproved: true
    }
  });

  if (!provider) {
    return next(new NotFoundError('Provider not found'));
  }

  res.status(200).json({
    status: 'success',
    data: {
      isApproved: provider.isApproved
    }
  });
});
