import { Router, Request, Response } from "express";
import prisma from "../../app";
import logger from "../../utilities/logger";

const router = Router();

/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: Soft delete a client by ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *     responses:
 *       204:
 *         description: Client marked as deleted
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.client.update({ where: { id }, data: { deleted: true } });
    logger.info(`Client deleted: ${id}`);
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting client', { error: err, id });
    res.status(404).json({ error: 'Client not found' });
  }
});

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Retrieve a paginated list of clients
 *     tags: [Clients]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: A list of clients with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalClients:
 *                       type: integer
 *                       description: Total number of clients
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
    const clients = await prisma.client.findMany({
      skip: offset,
      take: limit,
    });

    const totalClients = await prisma.client.count();
    const totalPages = Math.ceil(totalClients / limit);

    res.status(200).json({
      data: clients,
      meta: {
        totalClients,
        totalPages,
        currentPage: page,
      },
    });
  } catch (error) {
    logger.error('Error fetching clients:', error);
    res.status(500).send("An error occurred while fetching clients");
  }
});

export default router;
