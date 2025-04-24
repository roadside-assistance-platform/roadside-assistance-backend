import dotenv from 'dotenv';
dotenv.config();
import amqp from 'amqplib';

async function startConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();

  // Usage: node provider-notification-consumer.js [category]
  const category = process.argv[2] || process.env.NOTIFICATION_CATEGORY || 'towling';
  const exchangeName = `${category.toLowerCase()}-notifications-exchange`;
  await channel.assertExchange(exchangeName, 'fanout', { durable: false });
  const q = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(q.queue, exchangeName, '');

  console.log(`Consumer started! Bound queue '${q.queue}' to exchange '${exchangeName}'.`);
  console.log('Waiting for notifications... (Ctrl+C to exit)');
  channel.consume(q.queue, (msg) => {
    if (msg !== null) {
      const notification = JSON.parse(msg.content.toString());
      console.log('--- Notification Received ---');
      console.log('Queue:', q.queue);
      console.log('Provider ID:', notification.providerId);
      console.log('Data:', notification.data);
      console.log('-----------------------------');
      channel.ack(msg);
    }
  });
}

startConsumer().catch(console.error);
