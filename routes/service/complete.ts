/**
 * @swagger
 * /service/complete:
 *   post:
 *     summary: Complete a service and calculate final price
 *     description: Provider completes a service, providing distance traveled and completion time. The system calculates the final price based on distance, time, and service category.
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - completionTime
 *             properties:
 *               serviceId:
 *                 type: string
 *                 description: ID of the service being completed
 *               distance:
 *                 type: [number, 'null']
 *                 nullable: true
 *                 description: Distance traveled in kilometers (optional, can be null if not applicable)
 *               completionTime:
 *                 type: string
 *                 format: date-time
 *                 description: Time when the service was completed
 *     responses:
 *       200:
 *         description: Service completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serviceId:
 *                   type: string
 *                   description: ID of the completed service
 *                 price:
 *                   type: number
 *                   description: Final price in Algerian DA
 *                 status:
 *                   type: string
 *                   description: Service status
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal server error
 */

import { Router } from "express";
import prisma from "../../app";
import logger from "../../utilities/logger";
import { PricingService } from "../../services/pricing.service";
import { isProvider } from "../../middleware/auth";
import { ValidationError } from '../../utilities/errors';

const router = Router();
const pricingService = new PricingService();

router.post("/", async (req: any, res: any, next: any) => {
  try {
    const { serviceId, distance, completionTime } = req.body;

    // Input validation
    if (!serviceId || !completionTime) {
      throw new ValidationError('serviceId and completionTime are required');
    }

    if (distance !== null && (typeof distance !== 'number' || distance <= 0)) {
      throw new ValidationError('distance must be a positive number or null');
    }

    const parsedCompletionTime = new Date(completionTime);
    if (isNaN(parsedCompletionTime.getTime())) {
      throw new ValidationError('Invalid completionTime format');
    }

    // Check if service exists and belongs to this provider
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        clientId: true,
        done: true
      }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    if (service.clientId !== req.user.id) {
      throw new Error('Unauthorized: This service belongs to another client');
    }

    if (service.done) {
      throw new Error('Service is already completed');
    }

    // Complete the service and calculate price
    await pricingService.completeService(serviceId, distance, parsedCompletionTime);

    const completedService = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!completedService) {
      throw new Error('Service not found after completion');
    }

    res.status(200).json({
      message: 'Service completed successfully',
      serviceId,
      price: completedService.price,
      status: 'COMPLETED'
    });

  } catch (error) {
    logger.error('Error completing service:', error);
    next(error);
  }
});

export default router;
