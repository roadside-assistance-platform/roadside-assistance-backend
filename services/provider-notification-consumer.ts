import dotenv from 'dotenv';
dotenv.config();
import amqp from 'amqplib';

async function startConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();
  await channel.assertQueue('provider-notifications', { durable: false });

  console.log('Waiting for notifications...');
  channel.consume('provider-notifications', (msg) => {
    if (msg !== null) {
      const notification = JSON.parse(msg.content.toString());
      console.log('Notification for provider:', notification.providerId, notification.data);
      // Here you would forward to WebSocket, email, etc.
      channel.ack(msg);
    }
  });
}

startConsumer().catch(console.error);
