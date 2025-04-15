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
 *             properties:
 *               providerId:
 *                 type: string
 *                 nullable: true
 *                 description: Optional provider ID for the service.
 *               price:
 *                 type: number
 *                 description: Price of the service.
 *               serviceLocation:
 *                 type: string
 *                 description: Location where the service is needed.
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
 *                   description: Price of the service.
 *                 serviceLocation:
 *                   type: string
 *                   description: Service location.
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

const router = Router();

router.post("/", async (req: any, res: any) => {
  const { providerId, price, serviceLocation } = req.body;
  const clientId = req.user.id; // Assuming client authentication middleware attaches user to req

  // Validate required fields (providerId is optional)
  if (!serviceLocation) {
    logger.error("serviceLocation is required: serviceLocation");
    return res.status(400).send("serviceLocation is required: serviceLocation");
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
        serviceLocation,
      },
    });
    logger.info(`New service created with id: ${newService.id}`);
    return res.status(201).json(newService);
  } catch (error) {
    logger.error("error");
    return res.status(500).send("An error occurred while creating the service");
  }
});

export default router;
