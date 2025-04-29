import dotenv from 'dotenv';
dotenv.config();
import amqp from 'amqplib';
import prisma from '../app';

export class NotificationService {
  // Send notification to a specific provider
  async notifyProvider(providerId: string, data: any) {
    await this.init();
    const queue = `notifications_provider_${providerId}`;
    await this.channel!.assertQueue(queue, { durable: false });
    this.channel!.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
  }
  // Send notification to a specific client
  async notifyClient(clientId: string, data: any) {
    await this.init();
    const queue = `notifications_client_${clientId}`;
    await this.channel!.assertQueue(queue, { durable: false });
    this.channel!.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
  }
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
      // Send a single broadcast to the relevant category exchange
      const category = (service.serviceCategories && service.serviceCategories[0]);
      await this.init();
      const exchangeName = `${category.toLowerCase()}-notifications-exchange`;
      await this.channel!.assertExchange(exchangeName, 'fanout', { durable: false });
      const notification = {
        type: 'NEW_SERVICE_REQUEST',
        data: {
          ...service,
          timestamp: new Date()
        }
      };
      this.channel!.publish(exchangeName, '', Buffer.from(JSON.stringify(notification)));
    }
  }

}
