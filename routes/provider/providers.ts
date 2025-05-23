import { Router, Request, Response } from "express";
import prisma from "../../app";
import logger from "../../utilities/logger";
import { AppError } from "../../utilities/errors";

const router = Router();

/**
 * @swagger
 * /providers/{id}:
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
 *       204:
 *         description: Provider marked as deleted successfully
 *       404:
 *         description: Provider not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.provider.update({ where: { id }, data: { deleted: true } });
    logger.info(`Provider deleted: ${id}`);
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting provider', { error: err, id });
    res.status(404).json({ error: 'Provider not found' });
  }
});

/**
 * @swagger
 * /providers:
 *   get:
 *     summary: Retrieve a paginated list of providers
 *     tags: [Providers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: A list of providers with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Provider'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalProviders:
 *                       type: integer
 *                       description: Total number of providers
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                     currentPage:
 *                       type: integer
 *                       description: Current page number
 */
router.get("/", async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const providers = await prisma.provider.findMany({
      where: { deleted: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        photo: true,
        serviceCategories: true,
        averageRating: true,
        isApproved: true,
        deleted: true,
        createdAt: true,
        updatedAt: true
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalProviders = await prisma.provider.count();

    res.status(200).json({
      data: providers,
      meta: {
        totalProviders,
        totalPages: Math.ceil(totalProviders / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    logger.error("Error fetching providers:", error);
    res.status(500).send("An error occurred while fetching providers");
  }
});

/**
 * @swagger
 * /provider/providers/{id}/undelete:
 *   patch:
 *     summary: Undelete a provider
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
 *         description: Provider restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
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
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         photo:
 *                           type: string
 *                         serviceCategories:
 *                           type: array
 *                           items:
 *                             type: string
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

export default router;
