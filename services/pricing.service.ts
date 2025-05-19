import { PrismaClient } from '@prisma/client';
import { serviceCategory as ServiceCategory } from '@prisma/client';

export class PricingService {
  private readonly prisma: PrismaClient;
  private readonly baseRates: Record<ServiceCategory, number> = {
    TOWING: 1000,     // 1000 DA base rate
    FLAT_TIRE: 500,   // 500 DA base rate
    FUEL_DELIVERY: 800, // 800 DA base rate
    LOCKOUT: 600,     // 600 DA base rate
    EMERGENCY: 1200,  // 1200 DA base rate
    OTHER: 700        // 700 DA base rate
  };

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Calculate service price based on distance, time, and category
   * @param category Service category
   * @param distance Distance in kilometers
   * @param startTime Start time of service
   * @returns Calculated price in Algerian DA
   */
  async calculatePrice(category: ServiceCategory, distance: number, startTime: Date): Promise<number> {
    // Base rate for the category
    const baseRate = this.baseRates[category] || this.baseRates.OTHER;

    // Distance surcharge (100 DA per km)
    const distanceSurcharge = distance * 100;

    // Time-based surcharge (20% more after 8 PM)
    const isNightTime = startTime.getHours() >= 20 || startTime.getHours() < 6;
    const timeSurcharge = isNightTime ? 0.2 : 0;

    // Calculate final price
    const price = baseRate + distanceSurcharge;
    const finalPrice = price * (1 + timeSurcharge);

    return Math.round(finalPrice);
  }

  /**
   * Update service completion with calculated price
   */
  async completeService(serviceId: string, distance: number, completionTime: Date): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        serviceCategories: true,
        createdAt: true
      }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const category = service.serviceCategories[0]; // Get the first category
    if (!category) {
      throw new Error('Service category not found');
    }

    const price = await this.calculatePrice(
      category as ServiceCategory,
      distance,
      service.createdAt
    );

    await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        distance,
        done: true,
        price
      }
    });
  }
}
