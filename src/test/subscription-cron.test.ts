import { SubscriptionCronService } from '../services/subscription-cron.service';

describe('SubscriptionCronService', () => {
  beforeAll(async () => {
    // Mock MongoDB connection for testing
    jest.mock('mongoose', () => ({
      startSession: jest.fn(() => ({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      })),
    }));
  });

  describe('manualDailyUpdate', () => {
    it('should execute daily update without errors', async () => {
      // This test verifies that the method exists and can be called
      expect(SubscriptionCronService.manualDailyUpdate).toBeDefined();

      // Mock the private method to avoid actual database calls
      const mockDailyUpdate = jest.spyOn(
        SubscriptionCronService as any,
        'dailySubscriptionUpdate'
      );
      mockDailyUpdate.mockResolvedValue(undefined);

      await SubscriptionCronService.manualDailyUpdate();

      expect(mockDailyUpdate).toHaveBeenCalled();
      mockDailyUpdate.mockRestore();
    });
  });

  describe('initializeCronJobs', () => {
    it('should initialize cron jobs', () => {
      expect(SubscriptionCronService.initializeCronJobs).toBeDefined();

      // This should not throw an error
      expect(() => {
        SubscriptionCronService.initializeCronJobs();
      }).not.toThrow();
    });
  });

  describe('stopCronJobs', () => {
    it('should stop cron jobs', () => {
      expect(SubscriptionCronService.stopCronJobs).toBeDefined();

      // This should not throw an error
      expect(() => {
        SubscriptionCronService.stopCronJobs();
      }).not.toThrow();
    });
  });
});
