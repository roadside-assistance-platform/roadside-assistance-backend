import dotenv from 'dotenv';
dotenv.config();
import amqp from 'amqplib';

/**
 * Generic notification consumer for any role and category/queue.
 * Usage:
 *   node notification-consumer.js <role> <target> <category>
 *   - role: 'client', 'provider', or 'admin'
 *   - target: userId (for client/admin) or providerId (for provider)
 *   - category: for providers (e.g., 'TOWING'), ignored for client/admin
 */
async function startConsumer() {
  const role = process.argv[2];
  const target = process.argv[3];
  const category = process.argv[4];

  const connection = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();

  if (role === 'client') {
    const queue = `notifications_client_${target}`;
    await channel.assertQueue(queue, { durable: false });
    console.log(`Listening for client notifications on queue: ${queue}`);
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const notification = JSON.parse(msg.content.toString());
        console.log('--- Client Notification Received ---');
        console.log(notification);
        console.log('-----------------------------------');
        channel.ack(msg);
      }
    });
  } else if (role === 'provider') {
    const queue = `notifications_provider_${target}`;
    await channel.assertQueue(queue, { durable: false });
    console.log(`Listening for provider notifications on queue: ${queue}`);
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const notification = JSON.parse(msg.content.toString());
        console.log('--- Provider Notification Received ---');
        console.log(notification);
        console.log('--------------------------------------');
        channel.ack(msg);
      }
    });
  } else if (role === 'admin') {
    const queue = `notifications_admin_${target}`;
    await channel.assertQueue(queue, { durable: false });
    console.log(`Listening for admin notifications on queue: ${queue}`);
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const notification = JSON.parse(msg.content.toString());
        console.log('--- Admin Notification Received ---');
        console.log(notification);
        console.log('-----------------------------------');
        channel.ack(msg);
      }
    });
  } else {
    console.error('Invalid role. Use "client", "provider", or "admin".');
  }
}

startConsumer().catch(console.error);
