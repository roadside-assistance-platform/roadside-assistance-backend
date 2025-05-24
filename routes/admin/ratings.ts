import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import catchAsync from "../../utils/catchAsync";

/**
 * @swagger
 * /admin/ratings:
 *   get:
 *     summary: Get all ratings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of ratings with client and provider details
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a specific rating
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The rating ID
 *     responses:
 *       204:
 *         description: Rating deleted successfully
 *       404:
 *         description: Rating not found
 *       500:
 *         description: Internal server error
 */
const router = express.Router();
const prisma = new PrismaClient();

// GET /admin/ratings - List all ratings/reviews (public)
router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const ratings = await prisma.service.findMany({
      select: {
        id: true,
        clientId: true,
        providerId: true,
        description: true,
        price: true,
        rating: true,
        serviceLocation: true,
        distance: true,
        done: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            photo: true,
          },
        },
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            photo: true,
            averageRating: true,
          },
        },
      },
    });
    res.json(ratings);
  })
);

// DELETE /admin/ratings/:id - Remove a rating/review (public)
router.delete(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const rating = await prisma.service.findUnique({ where: { id } });
    if (!rating) {
      return res.status(404).json({ error: "Rating not found" });
    }
    await prisma.service.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
