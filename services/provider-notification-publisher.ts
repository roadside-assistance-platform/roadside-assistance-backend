import dotenv from 'dotenv';
dotenv.config();
import amqp from 'amqplib';

async function sendTestNotification() {
  const category = process.argv[2] || process.env.NOTIFICATION_CATEGORY || 'towling';
  const providerId = process.argv[3] || 'test-provider';
  const message = process.argv[4] || 'Test notification';

  const allCategories = [
    'TOWING',
    'FLAT_TIRE',
    'FUEL_DELIVERY',
    'LOCKOUT',
    'EMERGENCY',
    'OTHER',
  ];

  const connection = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();

  let publishedTo: string[] = [];
  if (category.toLowerCase() === 'other') {
    for (const cat of allCategories) {
      const exchangeName = `${cat}-notifications-exchange`;
      await channel.assertExchange(exchangeName, 'fanout', { durable: false });
      const notification = {
        providerId,
        data: { message }
      };
      channel.publish(exchangeName, '', Buffer.from(JSON.stringify(notification)));
      publishedTo.push(exchangeName);
    }
    console.log(`Test notification sent to ALL categories (${publishedTo.join(', ')}) for providerId=${providerId}:`, message);
  } else {
    const exchangeName = `${category.toLowerCase()}-notifications-exchange`;
    await channel.assertExchange(exchangeName, 'fanout', { durable: false });
    const notification = {
      providerId,
      data: { message }
    };
    channel.publish(exchangeName, '', Buffer.from(JSON.stringify(notification)));
    console.log(`Test notification sent to ${exchangeName} for providerId=${providerId}:`, message);
  }
  await channel.close();
  await connection.close();
}

// Usage: node provider-notification-publisher.js [category] [providerId] [message]
sendTestNotification().catch(console.error);