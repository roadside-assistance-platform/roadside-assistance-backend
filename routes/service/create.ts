/**
 * @swagger
 * /service/create:
 *   post:
 *     summary: Create a new service
 *     description: Creates a new service request by a client. If a provider ID is provided, it verifies the provider exists.
 *     tags:
 *       - Services
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price
 *               - serviceLocation
 *               - serviceCategory
 *             properties:
 *               providerId:
 *                 type: string
 *                 nullable: true
 *                 description: Optional provider ID for the service.
 *               price:
 *                 type: number
 *                 description: Price of the service in cents.
 *               serviceLocation:
 *                 type: string
 *                 description: Location where the service is needed.
 *               serviceCategory:
 *                 type: string
 *                 description: Category of the service.
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Additional details about the service.
 *     responses:
 *       201:
 *         description: Service successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier of the created service.
 *                 clientId:
 *                   type: string
 *                   description: ID of the client who created the service.
 *                 providerId:
 *                   type: string
 *                   nullable: true
 *                   description: ID of the provider assigned to the service (if provided).
 *                 price:
 *                   type: number
 *                   description: Price of the service in cents.
 *                 serviceLocation:
 *                   type: string
 *                   description: Service location.
 *                 serviceCategory:
 *                   type: string
 *                   description: Category of the service.
 *                 description:
 *                   type: string
 *                   nullable: true
 *                   description: Additional details about the service.
 *       400:
 *         description: Bad request, required fields are missing.
 *       404:
 *         description: Provider not found.
 *       500:
 *         description: Internal server error.
 */

import { Router } from "express";
import prisma from "../../app";
import logger from "../../utilities/logger";
import { ValidationError } from '../../utilities/errors';

const router = Router();

router.post("/", async (req: any, res: any, next: any) => {
  const allowedCategories = ["TOWING", "FLAT_TIRE", "FUEL_DELIVERY", "LOCKOUT", "EMERGENCY", "OTHER"];
  try {
    // Validate request body using your validation system
    const { providerId, price, serviceLocation, serviceCategory, description } = req.body;
    const clientId = req.user.id; // Assuming client authentication middleware attaches user to req

    // Comprehensive validation
    const errors: string[] = [];
    if (!serviceLocation || typeof serviceLocation !== 'string' || serviceLocation.length < 3)
      errors.push('serviceLocation is required and must be a string of at least 3 characters.');
    if (!serviceCategory || typeof serviceCategory !== 'string' || !allowedCategories.includes(serviceCategory))
      errors.push(`serviceCategory is required and must be one of: ${allowedCategories.join(', ')}`);
    if (price === undefined || typeof price !== 'number' || price < 0)
      errors.push('price is required and must be a non-negative number.');
    if (description && (typeof description !== 'string' || description.length > 500))
      errors.push('description must be a string of max 500 characters.');
    if (providerId && typeof providerId !== 'string')
      errors.push('providerId must be a string if provided.');
    if (errors.length > 0) {
      logger.error('Validation errors on service creation', { errors });
      return next(new ValidationError(errors.join(' ')));
    }

    // If providerId is provided, verify that the provider exists
    if (providerId) {
      const provider = await prisma.provider.findUnique({ where: { id: providerId } });
      if (!provider) {
        logger.error(`Provider with id ${providerId} not found`);
        return next(new ValidationError('Provider not found'));
      }
    }

    // Create new service with providerId as null if not provided
    const newService = await prisma.service.create({
      data: {
        clientId,
        providerId: providerId || null,
        price,
        serviceLocation,
        serviceCategories: [serviceCategory],
        description: description || null,
      },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        description: true,
        serviceCategories: true,
        price: true,
        rating: true,
        serviceLocation: true,
        done: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          }
        },
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          }
        }
      }
    });
    logger.info(`New service created with id: ${newService.id}`);
    return res.status(201).json({
      status: 'success',
      data: {
        service: {
          ...newService,
          serviceCategories: newService.serviceCategories[0] // Convert array to single string
        }
      }
    });
  } catch (error) {
    logger.error("Error occurred while creating the service", { error });
    next(error);
  }
});

export default router;
