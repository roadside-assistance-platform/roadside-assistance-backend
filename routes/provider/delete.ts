import { Router, Request, Response } from "express";
import prisma from "../../app";
import logger from "../../utilities/logger";

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
 *                 id:
 *                   type: string
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
    res.status(200).json({ message: 'Provider deleted successfully', id });
  } catch (err) {
    logger.error('Error deleting provider', { error: err, id });
    res.status(404).json({ error: 'Provider not found' });
  }
});

export default router;
