import { NotificationService } from '../services/notification.service';
import prisma from '../app';

jest.mock('../app', () => ({
  __esModule: true,
  default: {
    provider: { findMany: jest.fn() },
    field: { findMany: jest.fn() },
  }
}));

// Mock NotificationService dependencies
const mockSendCategoryNotification = jest.fn();
const mockSendNotificationToAllCategories = jest.fn();
(NotificationService.prototype as any).sendCategoryNotification = mockSendCategoryNotification;
(NotificationService.prototype as any).sendNotificationToAllCategories = mockSendNotificationToAllCategories;

const mockFindManyProviders = (prisma as any).provider.findMany;
const mockFindManyFields = (prisma as any).field.findMany;


describe('Provider Matching Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindManyProviders.mockResolvedValue([{ id: 'provider1' }, { id: 'provider2' }]);
    mockFindManyFields.mockResolvedValue([{ name: 'TOWING' }, { name: 'FUEL_DELIVERY' }]);
  });

  it('should send notifications to all categories if service is "other"', async () => {
    const notificationService = new NotificationService();
    await notificationService.notifyProvidersOfNewService({ serviceCategories: ['OTHER'] });
    expect(mockFindManyProviders).toHaveBeenCalled();
    expect(mockSendNotificationToAllCategories).toHaveBeenCalled();
  });

  it('should send notifications only to relevant category for matching providers', async () => {
    const notificationService = new NotificationService();
    await notificationService.notifyProvidersOfNewService({ serviceCategories: ['TOWING'] });
    expect(mockFindManyProviders).toHaveBeenCalledWith({
      where: { field: { name: 'TOWING' } }
    });
    expect(mockSendCategoryNotification).toHaveBeenCalled();
  });
});
