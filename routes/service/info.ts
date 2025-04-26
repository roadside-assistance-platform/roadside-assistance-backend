/**
 * @swagger
 * /service/info/{id}:
 *   get:
 *     summary: Get service info by ID
 *     description: Returns service information by ID. Requires authentication.
 *     tags:
 *       - Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the service
 *     responses:
 *       200:
 *         description: Service found
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
 *                     service:
 *                       type: object
 *                       example:
 *                         id: "string"
 *                         clientId: "string"
 *                         providerId: "string"
 *                         description: "string"
 *                         serviceCategory: "TOWING"
 *                         price: 21
 *                         serviceRating: null
 *                         serviceLocation: "string"
 *                         done: true
 *                         createdAt: "2025-04-24T21:35:32.284Z"
 *                         updatedAt: "2025-04-24T21:36:42.285Z"
 *       404:
 *         description: Service not found
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
 *                   example: "Service not found"
 */
import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../app";
import { isAuthenticated } from "../../middleware/auth";
import logger from "../../utilities/logger";

/**
 * @swagger
 * /service/info:
 *   get:
 *     summary: Get service info
 *     tags: [Service]
 *     responses:
 *       200:
 *         description: Service info
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
const router = Router();

// GET /service/info/:id
router.get("/:id", isAuthenticated, async (req: any, res: any, next: NextFunction) => {
  const { id } = req.params;
  try {
    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        description: true,
        serviceCategories: true,
        price: true,
        serviceRating: true,
        serviceLocation: true,
        done: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!service) {
      return res.status(404).json({ status: "fail", message: "Service not found" });
    }
    return res.json({ status: "success", data: { service } });
  } catch (error) {
    logger.error("Error fetching service info", { error, id });
    next(error);
  }
});

export default router;
