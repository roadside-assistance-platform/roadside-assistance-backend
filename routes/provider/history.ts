/**
 * @swagger
 * /provider/history/{id}:
 *   get:
 *     summary: Get provider's service history
 *     description: Retrieves all services that a specific provider has been assigned to or completed
 *     tags:
 *       - Provider
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The provider ID
 *     responses:
 *       200:
 *         description: Provider service history retrieved successfully
 *       400:
 *         description: Invalid provider ID
 *       404:
 *         description: Provider not found
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
    logger.error("Provider ID is required");
    return res.status(400).json({ error: 'Provider ID is required' });
  }

  try {
    // Check if provider exists
    const provider = await prisma.provider.findUnique({
      where: { 
        id,
        deleted: false 
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        averageRating: true
      }
    });

    if (!provider) {
      logger.error(`Provider with id ${id} not found`);
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Get all services for this provider
    const services = await prisma.service.findMany({
      where: {
        providerId: id
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
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
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

    logger.info(`Retrieved ${totalServices} services for provider ${id}`);

    return res.status(200).json({
      status: 'success',
      message: 'Provider service history retrieved successfully',
      data: {
        provider: {
          id: provider.id,
          fullName: provider.fullName,
          email: provider.email
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
    logger.error("Error retrieving provider service history:", error);
    return res.status(500).json({ error: "Failed to retrieve provider service history" });
  }
});

export default router;
