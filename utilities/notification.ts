import amqp from 'amqplib';
import logger from './logger'; // Adjust path based on your project structure

const RABBITMQ_URL = process.env.RABBITMQ_URL as string;

if (!RABBITMQ_URL) {
    throw new Error('RABBITMQ_URL is not defined');
}

export async function sendNotification(userId: string, message: string) {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        const queue = `notifications_${userId}`;

        await channel.assertQueue(queue, { durable: false });
        channel.sendToQueue(queue, Buffer.from(message));

        logger.info(`Notification sent to ${userId}: ${message}`);

        setTimeout(() => {
            connection.close().catch(err => logger.error('Error closing connection', err));
        }, 500);
    } catch (error) {
        logger.error('Error sending notification', error);
    }
}
