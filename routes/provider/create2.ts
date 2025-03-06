import prisma from "../../app";
import { Router } from "express";
import logger from "../../utilities/logger";

const router = Router();

router.put("/", async (req: any, res: any) => {
  const { id, phone, photo, fullName } = req.body;

  logger.info(`Received update request for provider ID: ${id}`);

  if (!id) {
    logger.warn("Provider ID is missing in the request");
    return res.status(400).send("Provider ID is required");
  }

  if (!phone && !photo && !fullName) {
    logger.warn(`No fields provided for update in provider ID: ${id}`);
    return res.status(400).send("At least one field (phone, photo, or fullName) is required");
  }

  try {
    logger.info(`Checking if provider with ID ${id} exists...`);
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      logger.warn(`Provider not found with ID: ${id}`);
      return res.status(404).send("Provider not found");
    }

    logger.info(`Updating provider ID: ${id} with new data`);
    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        phone: phone || existingProvider.phone,
        photo: photo || existingProvider.photo,
        fullName: fullName || existingProvider.fullName,
      },
    });

    logger.info(`Provider ID: ${id} updated successfully`);
    res.status(200).json(updatedProvider);
  } catch (error) {
    logger.error(`Error updating provider ID: ${id}`, error);
    res.status(500).send("An error occurred while updating the profile");
  }
});

export default router;
