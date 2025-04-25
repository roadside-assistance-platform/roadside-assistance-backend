import dotenv from 'dotenv';
dotenv.config();
import amqp from 'amqplib';
import prisma from '../app';

export class NotificationService {
  private channel: amqp.Channel | null = null;

  async init() {
    if (!this.channel) {
      const connection = await amqp.connect(process.env.RABBITMQ_URL!);
      this.channel = await connection.createChannel();
    }
  }

  // Send notification to a specific provider in a category queue
  // Publish to a fanout exchange per category
  async sendCategoryNotification(category: string, providerId: string, data: any) {
    await this.init();
    const exchangeName = `${category.toLowerCase()}-notifications-exchange`;
    await this.channel!.assertExchange(exchangeName, 'fanout', { durable: false });
    const notification = { providerId, data };
    this.channel!.publish(exchangeName, '', Buffer.from(JSON.stringify(notification)));
  }

  // Publish to all fanout exchanges (for 'other')
  async sendNotificationToAllCategories(providerId: string, data: any) {
    await this.init();
    // Get all unique categories (fields) from provider table
    const categories = await prisma.field.findMany({ select: { name: true } });
    for (const category of categories) {
      const exchangeName = `${category.name.toLowerCase()}-notifications-exchange`;
      await this.channel!.assertExchange(exchangeName, 'fanout', { durable: false });
      const notification = { providerId, data };
      this.channel!.publish(exchangeName, '', Buffer.from(JSON.stringify(notification)));
    }
  }

  // Main method to notify providers of a new service
  async notifyProvidersOfNewService(service: any) {
    await this.init();
    const isOther = (service.serviceCategories && service.serviceCategories[0]).toLowerCase() === 'other';
    if (isOther) {
      // Send to all category queues for all providers
      const allProviders = await prisma.provider.findMany();
      for (const provider of allProviders) {
        await this.sendNotificationToAllCategories(provider.id, {
          ...service,
          type: 'NEW_SERVICE_REQUEST',
          timestamp: new Date()
        });
      }
    } else {
      // Send only to the relevant category queue for matching providers
      const relevantProviders = await prisma.provider.findMany({
        where: {
          field: {
            name: (service.serviceCategories && service.serviceCategories[0])
          }
        }
      });
      for (const provider of relevantProviders) {
        await this.sendCategoryNotification((service.serviceCategories && service.serviceCategories[0]), provider.id, {
          ...service,
          type: 'NEW_SERVICE_REQUEST',
          timestamp: new Date()
        });
      }
    }
  }

}
