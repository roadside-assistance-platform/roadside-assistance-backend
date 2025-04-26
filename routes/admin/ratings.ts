import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import catchAsync from "../../utils/catchAsync";
import { requireAdmin } from "../../utils/requireAdmin";

/**
 * @swagger
 * /admin/ratings:
 *   get:
 *     summary: Get all ratings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of ratings
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete all ratings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: All ratings deleted
 *       500:
 *         description: Server error
 */
const router = express.Router();
const prisma = new PrismaClient();

// GET /admin/ratings - List all ratings/reviews
router.get(
  "/ratings",
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const ratings = await prisma.service.findMany({
      include: { client: true, provider: true },
    });
    res.json(ratings);
  })
);

// DELETE /admin/ratings/:id - Remove a rating/review
router.delete(
  "/ratings/:id",
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
