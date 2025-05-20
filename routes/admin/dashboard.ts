import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalClients,
      totalProviders,
      totalServices,
      recentServices,
    ] = await Promise.all([
      prisma.client.count({
        where: { deleted: false }
      }),
      prisma.provider.count({
        where: { deleted: false, isApproved: true }
      }),
      prisma.service.count(),
      prisma.service.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' } as const,
        include: {
          client: {
            select: {
              fullName: true,
              email: true,
              phone: true,
            },
          },
          provider: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Calculate total revenue from completed services
    const revenueResult = await prisma.service.aggregate({
      _sum: {
        price: true,
      },
      where: {
        done: true,
      },
    });

    res.json({
      stats: {
        totalClients,
        totalProviders,
        totalServices,
        totalRevenue: revenueResult._sum.price || 0,
      },
      recentServices,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      details: error.message 
    });
  }
};

const router = require('express').Router();

// Dashboard stats route
router.get('/stats', getDashboardStats);

export default router;
