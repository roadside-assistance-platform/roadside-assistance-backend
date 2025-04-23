import dotenv from 'dotenv';
dotenv.config();
import amqp from 'amqplib';

async function sendTestNotification() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();
  await channel.assertQueue('provider-notifications', { durable: false });

  const notification = {
    providerId: 'test-provider',
    data: { message: 'Test notification' }
  };

  channel.sendToQueue('provider-notifications', Buffer.from(JSON.stringify(notification)));
  console.log('Test notification sent!');
  await channel.close();
  await connection.close();
}

sendTestNotification().catch(console.error);