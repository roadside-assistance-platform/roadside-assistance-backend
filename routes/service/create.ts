import { Router } from "express";
import prisma from "../../app";
import logger from "../../utilities/logger";

const router = Router();

router.post("/", async (req: any, res: any) => {
  const { providerId, price, serviceLocation } = req.body;
  const clientId = req.user.id; // Assuming client authentication middleware attaches user to req

  // Validate required fields (providerId is optional)
  if (!price || !serviceLocation) {
    logger.error("All fields are required: price, serviceLocation");
    return res.status(400).send("All fields are required: price, serviceLocation");
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
        price,
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
