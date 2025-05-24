/**
 * @swagger
 * /client/history/{id}:
 *   get:
 *     summary: Get client's service history
 *     description: Retrieves all services that a specific client has requested
 *     tags:
 *       - Client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The client ID
 *     responses:
 *       200:
 *         description: Client service history retrieved successfully
 *       400:
 *         description: Invalid client ID
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */

import { Router } from "express";
import prisma from "../../app";
import logger from "../../utilities/logger";

const router = Router();

router.get("/:id", async (req: any, res: any) => {
  const { id } = req.params;

  // Basic ID validation
  if (!id) {
    logger.error("Client ID is required");
    return res.status(400).json({ error: 'Client ID is required' });
  }

  try {
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { 
        id,
        deleted: false 
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    if (!client) {
      logger.error(`Client with id ${id} not found`);
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get all services for this client
    const services = await prisma.service.findMany({
      where: {
        clientId: id
      },
      select: {
        id: true,
        serviceLocation: true,
        serviceCategories: true,
        price: true,
        rating: true,
        done: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            averageRating: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics
    const totalServices = services.length;
    const completedServices = services.filter(service => service.done).length;
    const ratedServices = services.filter(service => service.rating !== null);
    const averageRating = ratedServices.length > 0 
      ? ratedServices.reduce((sum, service) => sum + (service.rating || 0), 0) / ratedServices.length 
      : null;

    // Format services response (convert serviceCategories array to single string)
    const formattedServices = services.map(service => ({
      ...service,
      serviceCategory: service.serviceCategories[0] || 'OTHER'
    }));

    logger.info(`Retrieved ${totalServices} services for client ${id}`);

    return res.status(200).json({
      status: 'success',
      message: 'Client service history retrieved successfully',
      data: {
        client: {
          id: client.id,
          fullName: client.fullName,
          email: client.email
        },
        services: formattedServices,
        statistics: {
          totalServices,
          completedServices,
          pendingServices: totalServices - completedServices,
          averageRating: averageRating ? Math.round(averageRating * 100) / 100 : null,
          totalRatings: ratedServices.length
        }
      }
    });

  } catch (error) {
    logger.error("Error retrieving client service history:", error);
    return res.status(500).json({ error: "Failed to retrieve client service history" });
  }
});

export default router;
