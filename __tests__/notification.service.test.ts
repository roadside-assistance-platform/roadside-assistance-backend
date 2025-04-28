jest.unmock('../services/notification.service');
import { NotificationService } from '../services/notification.service';

afterAll(() => jest.clearAllMocks());

// Mock nodemailer to prevent real email sending
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn((mailOptions, callback) => {
      if (callback) callback(null, { response: '250 OK' });
      return Promise.resolve({ response: '250 OK' });
    })
  }))
}));
import amqp from 'amqplib';

jest.mock('amqplib');

const mockChannel = {
  assertQueue: jest.fn(),
  sendToQueue: jest.fn(),
  assertExchange: jest.fn(),
  publish: jest.fn(),
};

const mockConnection = {
  createChannel: jest.fn(() => mockChannel),
  close: jest.fn(),
};

(amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
    jest.clearAllMocks();
  });

  it('should send notification to a specific client queue', async () => {
    await notificationService.notifyClient('client123', { foo: 'bar' });
    expect(mockChannel.assertQueue).toHaveBeenCalledWith('notifications_client_client123', { durable: false });
    expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
      'notifications_client_client123',
      Buffer.from(JSON.stringify({ foo: 'bar' }))
    );
  });

  it('should send notification to a provider category exchange', async () => {
    await notificationService.sendCategoryNotification('TOWING', 'provider123', { foo: 'bar' });
    expect(mockChannel.assertExchange).toHaveBeenCalledWith('towing-notifications-exchange', 'fanout', { durable: false });
    expect(mockChannel.publish).toHaveBeenCalledWith(
      'towing-notifications-exchange',
      '',
      Buffer.from(JSON.stringify({ providerId: 'provider123', data: { foo: 'bar' } }))
    );
  });
});
