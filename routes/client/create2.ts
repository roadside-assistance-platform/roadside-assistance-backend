import prisma from "../../app";
import { Router } from "express";
import logger from "../../utilities/logger";

const router = Router();

router.put("/", async (req: any, res: any) => {
  const { id, phone, photo } = req.body;

  logger.info(`Received update request for client ID: ${id}`);

  if (!id) {
    logger.warn("Client ID is missing in the request");
    return res.status(400).send("Client ID is required");
  }

  if (!phone && !photo) {
    logger.warn(`No fields provided for update in client ID: ${id}`);
    return res.status(400).send("At least one field (phone or photo) is required");
  }

  try {
    logger.info(`Checking if client with ID ${id} exists...`);
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      logger.warn(`Client not found with ID: ${id}`);
      return res.status(404).send("Client not found");
    }

    logger.info(`Updating client ID: ${id} with new data`);
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        phone: phone || existingClient.phone,
        photo: photo || existingClient.photo,
      },
    });

    logger.info(`Client ID: ${id} updated successfully`);
    res.status(200).json(updatedClient);
  } catch (error) {
    logger.error(`Error updating client ID: ${id}`, error);
    res.status(500).send("An error occurred while updating the profile");
  }
});

export default router;
