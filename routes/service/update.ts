/**
 * @swagger
 * /service/update/{id}:
 *   put:
 *     summary: Update an existing service request
 *     description: Allows updating of a service request. Different roles have varying permissions for update actions.
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
 *         description: Unique identifier for the service request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               providerId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the provider to assign (admin-only if already assigned)
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               price:
 *                 type: integer
 *                 minimum: 0
 *                 description: Service price in cents
 *                 example: 15000
 *               serviceRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating provided by client (only after service completion)
 *                 example: 5
 *               serviceLocation:
 *                 type: string
 *                 description: Location where the service is needed
 *                 example: "123 Main St, New York, NY 10001"
 *               done:
 *                 type: boolean
 *                 description: Indicates whether the service is completed
 *                 example: true
 *     responses:
 *       200:
 *         description: Service updated successfully
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
 *                         client:
 *                           id: "string"
 *                           fullName: "Jane Smith"
 *                           email: "client@example.com"
 *                           phone: "1234567890"
 *                         provider:
 *                           id: "string"
 *                           fullName: "Provider Name"
 *                           email: "provider@example.com"
 *                           phone: "+1234567890"
 *       400:
 *         description: Bad request due to validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "fail"
 *               code: "VALIDATION_ERROR"
 *               message: "Invalid input data"
 *               requestId: "req-123"
 *       401:
 *         description: Unauthorized access - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "fail"
 *               code: "AUTHENTICATION_ERROR"
 *               message: "Please log in to access this resource"
 *               requestId: "req-123"
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "fail"
 *               code: "AUTHORIZATION_ERROR"
 *               message: "Not authorized to update this service"
 *               requestId: "req-123"
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "fail"
 *               code: "NOT_FOUND_ERROR"
 *               message: "Service not found"
 *               requestId: "req-123"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "error"
 *               code: "INTERNAL_SERVER_ERROR"
 *               message: "Something went wrong!"
 *               requestId: "req-123"
 */

import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../app";
import logger from "../../utilities/logger";
import { validateRequest } from "../../middleware/validation";
import { catchAsync } from '../../utilities/catchAsync';
import { isAuthenticated } from "../../middleware/auth";

const router = Router();

// Validation rules for service update
const serviceUpdateRules = {
  providerId: { type: 'string', optional: true },
  price: { type: 'number', min: 0, optional: true },
  rating: { type: 'number', min: 0, max: 5, optional: true }, // Service rating (0-5)
  serviceLocation: { type: 'string', optional: true }, // Optional for update
  done: { type: 'boolean', optional: true },
  distance: { type: 'number', min: 0, optional: true } // Distance in kilometers
};

import { requireProviderApproval } from "../../middleware/providerApproval";

router.put("/:id", 
  isAuthenticated,
  requireProviderApproval,
  validateRequest(serviceUpdateRules), 
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      logger.error("Service ID is required");
      return res.status(400).send("Service ID is required");
    }

    try {
      // Check if service exists
      const existingService = await prisma.service.findUnique({ 
        where: { id },
        include: {
          client: true,
          provider: true
        }
      });

      if (!existingService) {
        logger.error("Service not found");
        return res.status(404).send("Service not found");
      }

      // Authorization check
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      // Check provider approval if user is a provider
      if (userRole === 'provider') {
        const provider = await prisma.provider.findUnique({
          where: { id: userId },
          select: { isApproved: true }
        });
        if (!provider?.isApproved) {
          logger.error("Provider account is pending approval");
          return res.status(403).send("Your account is pending approval. You cannot accept or service requests until approved by admin.");
        }
      }

      const isAuthorized = 
        userRole === 'admin' || 
        existingService.clientId === userId ||
        existingService.providerId === userId;

      if (!isAuthorized) {
        logger.error("Not authorized to update this service");
        return res.status(403).send("Not authorized to update this service");
      }

      // Validate service rating update
      if (updateData.rating !== undefined) {
        if (existingService.clientId !== userId) {
          logger.error("Only the client can update service rating");
          return res.status(403).send("Only the client can update service rating");
        }
        if (!existingService.done) {
          logger.error("Cannot rate service before it's completed");
          return res.status(400).send("Cannot rate service before it's completed");
        }
        // Clamp rating to 0-5 just in case
        updateData.rating = Math.max(0, Math.min(5, updateData.rating));
      }

      // Validate provider assignment
      if (updateData.providerId !== undefined) {
        // Only allow if not already assigned
        if (existingService.providerId) {
          logger.error("Service already accepted by another provider");
          return res.status(409).send("Service already accepted by another provider");
        }
        // Verify provider exists
        const provider = await prisma.provider.findUnique({
          where: { id: updateData.providerId }
        });
        if (!provider) {
          logger.error("Provider not found");
          return res.status(404).send("Provider not found");
        }
      }

      const updatedService = await prisma.service.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          provider: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              averageRating: true
            }
          }
        }
      });

      logger.info("Service updated successfully", {
        serviceId: id,
        updatedBy: userId,
        updates: updateData
      });

      // If rating was updated, recalculate provider's averageRating
      if (updateData.rating !== undefined && updateData.rating >= 0 && updateData.rating <= 5 && updatedService.providerId) {
        const providerId = updatedService.providerId;
        // Get all rated services for this provider
        const ratedServices = await prisma.service.findMany({
          where: {
            providerId: providerId,
            rating: { not: null }
          },
          select: { rating: true }
        });
        const ratings = ratedServices.map(s => s.rating!).filter(r => typeof r === 'number');
        const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0;
        await prisma.provider.update({
          where: { id: providerId },
          data: { averageRating: parseFloat(averageRating.toFixed(1)) }
        });
        logger.info(`Updated provider's average rating to ${averageRating.toFixed(1)}`);
      }

      // Format the response to return serviceCategories as a single string
      const responseService = {
        ...updatedService,
        serviceCategory: updatedService.serviceCategories[0] // Convert array to single string
      };

      return res.status(200).json({
        status: 'success',
        data: { service: responseService }
      });
    } catch (error) {
      logger.error("Error updating service", { error, serviceId: id });
      next(error);
    }
  })
);

export default router;
