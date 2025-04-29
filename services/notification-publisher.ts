import dotenv from 'dotenv';
dotenv.config();
import amqp from 'amqplib';

/**
 * Generic notification publisher for any role and category/queue.
 * Usage:
 *   node notification-publisher.js <role> <target> <category> <message>
 *   - role: 'client', 'provider', or 'admin'
 *   - target: userId (for client/admin) or providerId (for provider)
 *   - category: for providers (e.g., 'TOWING'), ignored for client/admin
 *   - message: notification message
 */
async function sendNotification() {
  const role = process.argv[2];
  const target = process.argv[3];
  const category = process.argv[4];
  const message = process.argv[5] || 'Test notification';

  const connection = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();

  if (role === 'client') {
    const queue = `notifications_client_${target}`;
    await channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify({ message, timestamp: new Date() })));
    console.log(`Notification sent to client queue ${queue}:`, message);
  } else if (role === 'provider') {
    const queue = `notifications_provider_${target}`;
    await channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify({ message, timestamp: new Date() })));
    console.log(`Notification sent to provider queue ${queue}:`, message);
  } else if (role === 'admin') {
    const queue = `notifications_admin_${target}`;
    await channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify({ message, timestamp: new Date() })));
    console.log(`Notification sent to admin queue ${queue}:`, message);
  } else {
    console.error('Invalid role. Use "client", "provider", or "admin".');
  }

  await channel.close();
  await connection.close();
}

sendNotification().catch(console.error);
