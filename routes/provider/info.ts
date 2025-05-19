/**
 * @swagger
 * /provider/info/{id}:
 *   get:
 *     summary: Get provider info by ID
 *     description: Retrieve provider information using their unique identifier. Requires authentication. The password is not included in the response.
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
 *         description: Provider information retrieved successfully
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
 *                     provider:
 *                       type: object
 *                       example:
 *                         id: "string"
 *                         fullName: "Provider Name"
 *                         email: "provider@example.com"
 *                         phone: "+1234567890"
 *                         photo: "photo-url"
 *                         serviceCategories: ["TOWING"]
 *                         averageRating: 4.5
 *                         isApproved: true
 *                         deleted: false
 *                         createdAt: "2025-04-24T21:35:32.284Z"
 *                         updatedAt: "2025-04-24T21:36:42.285Z"
 *       404:
 *         description: Provider not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "Provider not found"
 */
import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../app";
import { isAuthenticated } from "../../middleware/auth";
import logger from "../../utilities/logger";

const router = Router();

// GET /provider/info/:id
router.get("/:id", isAuthenticated, async (req: any, res: any, next: NextFunction) => {
  const { id } = req.params;
  try {
    const provider = await prisma.provider.findUnique({
      where: { id },
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
        updatedAt: true,
      },
    });
    if (!provider) {
      return res.status(404).json({ status: "fail", message: "Provider not found" });
    }
    return res.json({ status: "success", data: { provider } });
  } catch (error) {
    logger.error("Error fetching provider info", { error, id });
    next(error);
  }
});

export default router;
