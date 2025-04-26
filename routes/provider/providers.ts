import { Router, Request, Response } from "express";
import prisma from "../../app";
import logger from "../../utilities/logger";

const router = Router();

// DELETE /providers/:id
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

router.get("/", async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const providers = await prisma.provider.findMany({
      skip: offset,
      take: limit,
    });

    const totalProviders = await prisma.provider.count();

    res.status(200).json({
      data: providers,
      meta: {
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

export default router;
