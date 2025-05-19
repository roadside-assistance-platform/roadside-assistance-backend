import { Router, Request, Response } from "express";
import prisma from "../../app";
import logger from "../../utilities/logger";
import { AppError } from "../../utilities/errors";

const router = Router();

/**
 * @swagger
 * /provider/delete/{id}:
 *   delete:
 *     summary: Soft delete a provider by ID
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The provider ID
 *     responses:
 *       200:
 *         description: Provider marked as deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     provider:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                           format: email
 *                         fullName:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         photo:
 *                           type: string
 *                           format: uri
 *                         serviceCategories:
 *                           type: array
 *                           items:
 *                             type: string
 *                             enum: ["TOWING", "FLAT_TIRE", "FUEL_DELIVERY", "LOCKOUT", "EMERGENCY", "OTHER"]
 *                         averageRating:
 *                           type: number
 *                         isApproved:
 *                           type: boolean
 *                         deleted:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                         updatedAt:
 *                           type: string
 *       404:
 *         description: Provider not found
 *       500:
 *         description: Server error
 */
router.delete('/delete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const provider = await prisma.provider.update({ 
      where: { id }, 
      data: { deleted: true }
    });
    logger.info(`Provider deleted: ${id}`);
    res.status(200).json({ 
      message: 'Provider deleted successfully',
      data: {
        provider: {
          id: provider.id,
          email: provider.email,
          fullName: provider.fullName,
          phone: provider.phone,
          photo: provider.photo,
          serviceCategories: provider.serviceCategories,
          averageRating: provider.averageRating ?? null,
          isApproved: provider.isApproved,
          deleted: provider.deleted,
          createdAt: provider.createdAt,
          updatedAt: provider.updatedAt
        }
      }
    });
  } catch (err) {
    logger.error('Error deleting provider', { error: err, id });
    res.status(404).json({ error: 'Provider not found' });
  }
});
router.patch('/undelete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      throw new AppError('Provider not found', 404);
    }

    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: { deleted: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        photo: true,
        serviceCategories: true,
        isApproved: true,
        deleted: true,
        createdAt: true,
        updatedAt: true,
        averageRating: true,
      },
    });

    logger.info(`Provider restored: ${id}`);
    res.status(200).json({
      status: 'success',
      message: 'Provider restored successfully',
      data: { provider: updatedProvider }
    });
  } catch (error) {
    logger.error('Error restoring provider', { error, id });
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while restoring the provider'
      });
    }
  }
});


export default router;
