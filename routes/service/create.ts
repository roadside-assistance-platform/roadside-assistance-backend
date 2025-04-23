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
import { NotificationService } from "../../services/notification.service";

const router = Router();
const notificationService = new NotificationService();

router.post("/", async (req: any, res: any) => {
  const { providerId, price, serviceLocation, serviceCategory, description } = req.body;
  const clientId = req.user.id; // Assuming client authentication middleware attaches user to req

  // Validate required fields (providerId is optional)
  if (!serviceLocation) {
    logger.error("serviceLocation is required: serviceLocation");
    return res.status(400).send("serviceLocation is required: serviceLocation");
  }
  if (!serviceCategory) {
    logger.error("serviceCategory is required: serviceCategory");
    return res.status(400).send("serviceCategory is required: serviceCategory");
  }
  if (!('price' in req.body)) {
    logger.error("Price field is required in request");
    return res.status(400).send("Price field is required in request");
  }

  try {
    // If providerId is provided, verify that the provider exists
    if (providerId) {
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
      });
      if (!provider) {
        logger.error(`Provider with id ${providerId} not found`);
        return res.status(404).send("Provider not found");
      }
    }

    // Create new service with providerId as null if not provided
    const newService = await prisma.service.create({
      data: {
        clientId,
        providerId: providerId || null,
        price: price || 0,
        serviceLocation: serviceLocation,
        serviceCategory: serviceCategory,
        description: description || null,
      },
    });
    logger.info(`New service created with id: ${newService.id}`);
    // Notify relevant providers for this category with full service info
    await notificationService.sendProviderNotification(newService.id, newService);
    return res.status(201).json(newService);
  } catch (error) {
    logger.error("Error occurred while creating the service", { error });
    return res.status(500).send("An error occurred while creating the service");
  }
});

export default router;
