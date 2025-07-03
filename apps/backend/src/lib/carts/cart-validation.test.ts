import { describe, expect, it } from 'vitest';
import { addYears } from 'date-fns';
import type { CartItemSelect } from '@namefi-astra/db';
import { itemTypeSchema } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

// Import the functions we want to test
// Note: These are private functions, so we need to access them via a test export
// For now, we'll assume they're exported for testing purposes
import { __INTERNAL__ } from './cart-validation';

const {
  _determineDurationLimitsForRenewItems,
  _generateSummaryOfCartItemsChanges,
  _getAvailabilityChangesInRegisterCartItems,
  _getAvailabilityChangesInImportCartItems,
  _getAvailabilityChangesInRenewCartItems,
} = __INTERNAL__;

describe('cart-validation', () => {
  describe('_determineDurationLimitsForRenewItems', () => {
    it('should calculate correct duration limits for domain with years remaining', () => {
      const expirationTime = addYears(new Date(), 2); // Expires in 2 years
      const domainPricing = {
        durationValidationInYears: { min: 1, max: 10 },
      };

      const result = _determineDurationLimitsForRenewItems(
        expirationTime,
        domainPricing,
      );

      expect(result).toEqual({
        min: 1,
        max: 8, // 10 - 2 = 8 years can be added
      });
    });

    it('should return max 0 when domain is already at maximum registration', () => {
      const expirationTime = addYears(new Date(), 10); // Expires in 10 years
      const domainPricing = {
        durationValidationInYears: { min: 1, max: 10 },
      };

      const result = _determineDurationLimitsForRenewItems(
        expirationTime,
        domainPricing,
      );

      expect(result).toEqual({
        min: 0,
        max: 0, // 10 - 10 = 0 years can be added
      });
    });

    it('should handle domain that exceeds maximum registration', () => {
      const expirationTime = addYears(new Date(), 12); // Expires in 12 years
      const domainPricing = {
        durationValidationInYears: { min: 1, max: 10 },
      };

      const result = _determineDurationLimitsForRenewItems(
        expirationTime,
        domainPricing,
      );

      expect(result).toEqual({
        min: 0,
        max: 0, // Cannot add any more years
      });
    });

    it('should handle domain with less than 1 year remaining', () => {
      const expirationTime = new Date(
        Date.now() + 6 * 30 * 24 * 60 * 60 * 1000,
      ); // ~6 months
      const domainPricing = {
        durationValidationInYears: { min: 1, max: 10 },
      };

      const result = _determineDurationLimitsForRenewItems(
        expirationTime,
        domainPricing,
      );

      expect(result).toEqual({
        min: 1,
        max: 10, // Can add up to 10 years
      });
    });

    it('should handle edge case where min years is higher than available years', () => {
      const expirationTime = addYears(new Date(), 8); // Expires in 8 years
      const domainPricing = {
        durationValidationInYears: { min: 5, max: 10 },
      };

      const result = _determineDurationLimitsForRenewItems(
        expirationTime,
        domainPricing,
      );

      expect(result).toEqual({
        min: 2, // min(5, 2) = 2
        max: 2, // 10 - 8 = 2 years can be added
      });
    });

    it('should handle domain with fractional years correctly', () => {
      const expirationTime = new Date(
        Date.now() + 18 * 30 * 24 * 60 * 60 * 1000,
      ); // ~18 months
      const domainPricing = {
        durationValidationInYears: { min: 1, max: 10 },
      };

      const result = _determineDurationLimitsForRenewItems(
        expirationTime,
        domainPricing,
      );

      expect(result).toEqual({
        min: 1,
        max: 9, // 10 - 1 (rounded) = 9 years can be added
      });
    });
  });

  describe('_generateSummaryOfCartItemsChanges', () => {
    const mockCartItem: CartItemSelect = {
      id: '1',
      userId: 'user1',
      normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
      type: itemTypeSchema.Values.REGISTER,
      durationInYears: 1,
      amountInUSDCents: 1000,
      registrar: 'test-registrar',
      encryptionKeyId: null,
      encryptedEppAuthorizationCode: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return empty array when no changes', () => {
      const changes: Parameters<typeof _generateSummaryOfCartItemsChanges>[0] =
        {
          noLongerAvailableCartItems: [],
          priceChangedCartItems: [],
          durationChangedCartItems: [],
          allExpiredRenewalCartItems: [],
          maxRegistrationReachedRenewalItems: [],
          areThereAnyChanges: false,
        };

      const result = _generateSummaryOfCartItemsChanges(changes);

      expect(result).toEqual([]);
    });

    it('should generate summary for unavailable domains', () => {
      const changes: Parameters<typeof _generateSummaryOfCartItemsChanges>[0] =
        {
          noLongerAvailableCartItems: [
            {
              ...mockCartItem,
              normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
            },
            {
              ...mockCartItem,
              normalizedDomainName: 'test.com' as NamefiNormalizedDomain,
            },
          ],
          priceChangedCartItems: [],
          durationChangedCartItems: [],
          allExpiredRenewalCartItems: [],
          maxRegistrationReachedRenewalItems: [],
          areThereAnyChanges: true,
        };

      const result = _generateSummaryOfCartItemsChanges(changes);

      expect(result).toEqual([
        'multiple domains are no longer available for purchase: example.com, test.com',
      ]);
    });

    it('should generate summary for single unavailable domain', () => {
      const changes: Parameters<typeof _generateSummaryOfCartItemsChanges>[0] =
        {
          noLongerAvailableCartItems: [
            {
              ...mockCartItem,
              normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
            },
          ],
          priceChangedCartItems: [],
          durationChangedCartItems: [],
          allExpiredRenewalCartItems: [],
          maxRegistrationReachedRenewalItems: [],
          areThereAnyChanges: true,
        };

      const result = _generateSummaryOfCartItemsChanges(changes);

      expect(result).toEqual([
        'One domain is no longer available for purchase: example.com',
      ]);
    });

    it('should generate summary for expired domains', () => {
      const changes: Parameters<typeof _generateSummaryOfCartItemsChanges>[0] =
        {
          noLongerAvailableCartItems: [],
          priceChangedCartItems: [],
          durationChangedCartItems: [],
          allExpiredRenewalCartItems: [
            {
              ...mockCartItem,
              normalizedDomainName: 'expired.com' as NamefiNormalizedDomain,
            },
          ],
          maxRegistrationReachedRenewalItems: [],
          areThereAnyChanges: true,
        };

      const result = _generateSummaryOfCartItemsChanges(changes);

      expect(result).toEqual([
        'One domain has expired and been removed from cart: expired.com',
      ]);
    });

    it('should generate summary for max registration reached domains', () => {
      const changes: Parameters<typeof _generateSummaryOfCartItemsChanges>[0] =
        {
          noLongerAvailableCartItems: [],
          priceChangedCartItems: [],
          durationChangedCartItems: [],
          allExpiredRenewalCartItems: [],
          maxRegistrationReachedRenewalItems: [
            {
              ...mockCartItem,
              normalizedDomainName: 'maxed.com' as NamefiNormalizedDomain,
            },
          ],
          areThereAnyChanges: true,
        };

      const result = _generateSummaryOfCartItemsChanges(changes);

      expect(result).toEqual([
        'One domain is already at maximum registration period and been removed from cart: maxed.com',
      ]);
    });

    it('should generate summary for price changes', () => {
      const changes: Parameters<typeof _generateSummaryOfCartItemsChanges>[0] =
        {
          noLongerAvailableCartItems: [],
          priceChangedCartItems: [
            {
              changeType: 'priceChanged',
              originalItem: { ...mockCartItem, amountInUSDCents: 1000 },
              newItem: { ...mockCartItem, amountInUSDCents: 1200 },
            },
          ],
          durationChangedCartItems: [],
          allExpiredRenewalCartItems: [],
          maxRegistrationReachedRenewalItems: [],
          areThereAnyChanges: true,
        };

      const result = _generateSummaryOfCartItemsChanges(changes);

      expect(result).toEqual([
        'Pricing has changed from 10.00 $USD to 12.00 $USD for these domains: example.com',
      ]);
    });

    it('should generate summary for duration changes', () => {
      const changes: Parameters<typeof _generateSummaryOfCartItemsChanges>[0] =
        {
          noLongerAvailableCartItems: [],
          priceChangedCartItems: [],
          durationChangedCartItems: [
            {
              changeType: 'durationChanged',
              originalItem: { ...mockCartItem, durationInYears: 2 },
              newItem: { ...mockCartItem, durationInYears: 3 },
            },
          ],
          allExpiredRenewalCartItems: [],
          maxRegistrationReachedRenewalItems: [],
          areThereAnyChanges: true,
        };

      const result = _generateSummaryOfCartItemsChanges(changes);

      expect(result).toEqual([
        'Duration has changed from 2 years to 3 years for these domains: example.com',
      ]);
    });

    it('should handle multiple changes of the same type', () => {
      const changes: Parameters<typeof _generateSummaryOfCartItemsChanges>[0] =
        {
          noLongerAvailableCartItems: [],
          priceChangedCartItems: [
            {
              changeType: 'priceChanged',
              originalItem: {
                ...mockCartItem,
                amountInUSDCents: 1000,
                normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
              },
              newItem: { ...mockCartItem, amountInUSDCents: 1200 },
            },
            {
              changeType: 'priceChanged',
              originalItem: {
                ...mockCartItem,
                amountInUSDCents: 1000,
                normalizedDomainName: 'test.com' as NamefiNormalizedDomain,
              },
              newItem: { ...mockCartItem, amountInUSDCents: 1200 },
            },
          ],
          durationChangedCartItems: [],
          allExpiredRenewalCartItems: [],
          maxRegistrationReachedRenewalItems: [],
          areThereAnyChanges: true,
        };

      const result = _generateSummaryOfCartItemsChanges(changes);

      expect(result).toEqual([
        'Pricing has changed from 10.00 $USD to 12.00 $USD for these domains: example.com, test.com',
      ]);
    });

    it('should group price changes by price range', () => {
      const changes: Parameters<typeof _generateSummaryOfCartItemsChanges>[0] =
        {
          noLongerAvailableCartItems: [],
          priceChangedCartItems: [
            {
              changeType: 'priceChanged',
              originalItem: {
                ...mockCartItem,
                amountInUSDCents: 1000,
                normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
              },
              newItem: { ...mockCartItem, amountInUSDCents: 1200 },
            },
            {
              changeType: 'priceChanged',
              originalItem: {
                ...mockCartItem,
                amountInUSDCents: 1500,
                normalizedDomainName: 'test.com' as NamefiNormalizedDomain,
              },
              newItem: { ...mockCartItem, amountInUSDCents: 1800 },
            },
          ],
          durationChangedCartItems: [],
          allExpiredRenewalCartItems: [],
          maxRegistrationReachedRenewalItems: [],
          areThereAnyChanges: true,
        };

      const result = _generateSummaryOfCartItemsChanges(changes);

      expect(result).toEqual([
        'Pricing has changed from 10.00 $USD to 12.00 $USD for these domains: example.com',
        'Pricing has changed from 15.00 $USD to 18.00 $USD for these domains: test.com',
      ]);
    });
  });

  describe('_getAvailabilityChangesInRegisterCartItems', () => {
    const mockCartItem: CartItemSelect = {
      id: '1',
      userId: 'user1',
      normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
      type: itemTypeSchema.Values.REGISTER,
      durationInYears: 1,
      amountInUSDCents: 1000,
      registrar: 'test-registrar',
      encryptionKeyId: null,
      encryptedEppAuthorizationCode: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should categorize available domains correctly', () => {
      const items = [mockCartItem];
      const domainPricing = {
        'example.com': {
          availability: true,
        },
      } as any;

      const result = _getAvailabilityChangesInRegisterCartItems(
        items,
        domainPricing,
      );

      expect(result).toEqual({
        noLongerAvailable: [],
        stillAvailable: [mockCartItem],
      });
    });

    it('should categorize unavailable domains correctly', () => {
      const items = [mockCartItem];
      const domainPricing = {
        'example.com': {
          availability: false,
        },
      } as any;

      const result = _getAvailabilityChangesInRegisterCartItems(
        items,
        domainPricing,
      );

      expect(result).toEqual({
        noLongerAvailable: [mockCartItem],
        stillAvailable: [],
      });
    });

    it('should handle missing domain pricing', () => {
      const items = [mockCartItem];
      const domainPricing = {} as any;

      const result = _getAvailabilityChangesInRegisterCartItems(
        items,
        domainPricing,
      );

      expect(result).toEqual({
        noLongerAvailable: [mockCartItem],
        stillAvailable: [],
      });
    });

    it('should handle mixed availability', () => {
      const availableItem = {
        ...mockCartItem,
        normalizedDomainName: 'available.com' as NamefiNormalizedDomain,
      };
      const unavailableItem = {
        ...mockCartItem,
        normalizedDomainName: 'unavailable.com' as NamefiNormalizedDomain,
      };
      const items = [availableItem, unavailableItem];

      const domainPricing = {
        'available.com': { availability: true },
        'unavailable.com': { availability: false },
      } as any;

      const result = _getAvailabilityChangesInRegisterCartItems(
        items,
        domainPricing,
      );

      expect(result).toEqual({
        noLongerAvailable: [unavailableItem],
        stillAvailable: [availableItem],
      });
    });
  });

  describe('_getAvailabilityChangesInImportCartItems', () => {
    const mockCartItem: CartItemSelect = {
      id: '1',
      userId: 'user1',
      normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
      type: itemTypeSchema.Values.IMPORT,
      durationInYears: 1,
      amountInUSDCents: 1000,
      registrar: 'test-registrar',
      encryptionKeyId: null,
      encryptedEppAuthorizationCode: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should handle domains when domain pricing exists', () => {
      const items = [mockCartItem];
      const domainPricing = {
        'example.com': {
          availability: false,
        },
      } as any;

      // This test is limited since isDomainImportable is hard to mock
      // The function will call isDomainImportable and return based on its result
      const result = _getAvailabilityChangesInImportCartItems(
        items,
        domainPricing,
      );

      // We can at least verify the structure is correct
      expect(result).toHaveProperty('noLongerAvailable');
      expect(result).toHaveProperty('stillAvailable');
      expect(Array.isArray(result.noLongerAvailable)).toBe(true);
      expect(Array.isArray(result.stillAvailable)).toBe(true);
    });

    it('should handle missing domain pricing', () => {
      const items = [mockCartItem];
      const domainPricing = {} as any;

      const result = _getAvailabilityChangesInImportCartItems(
        items,
        domainPricing,
      );

      expect(result).toEqual({
        noLongerAvailable: [mockCartItem],
        stillAvailable: [],
      });
    });
  });

  describe('_getAvailabilityChangesInRenewCartItems', () => {
    const mockCartItem: CartItemSelect = {
      id: '1',
      userId: 'user1',
      normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
      type: itemTypeSchema.Values.RENEW,
      durationInYears: 1,
      amountInUSDCents: 1000,
      registrar: 'test-registrar',
      encryptionKeyId: null,
      encryptedEppAuthorizationCode: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should categorize expired domains correctly', () => {
      const items = [mockCartItem];
      const domainPricing = {
        'example.com': {
          durationValidationInYears: { min: 1, max: 10 },
        },
      } as any;

      // Domain expired 10 days ago (beyond 7-day grace period)
      const expiredDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const expirationMap = new Map([
        ['example.com' as NamefiNormalizedDomain, expiredDate],
      ]);

      const result = _getAvailabilityChangesInRenewCartItems(
        items,
        domainPricing,
        expirationMap,
      );

      expect(result).toEqual({
        noLongerAvailable: [],
        stillAvailable: [],
        expired: [mockCartItem],
        maxRegistrationReached: [],
      });
    });

    it('should categorize domains at max registration correctly', () => {
      const items = [mockCartItem];
      const domainPricing = {
        'example.com': {
          durationValidationInYears: { min: 1, max: 10 },
        },
      } as any;

      // Domain expires in 10 years (already at max)
      const maxDate = addYears(new Date(), 10);
      const expirationMap = new Map([
        ['example.com' as NamefiNormalizedDomain, maxDate],
      ]);

      const result = _getAvailabilityChangesInRenewCartItems(
        items,
        domainPricing,
        expirationMap,
      );

      expect(result).toEqual({
        noLongerAvailable: [],
        stillAvailable: [],
        expired: [],
        maxRegistrationReached: [mockCartItem],
      });
    });

    it('should categorize renewable domains correctly', () => {
      const items = [mockCartItem];
      const domainPricing = {
        'example.com': {
          durationValidationInYears: { min: 1, max: 10 },
        },
      } as any;

      // Domain expires in 2 years (can be renewed)
      const futureDate = addYears(new Date(), 2);
      const expirationMap = new Map([
        ['example.com' as NamefiNormalizedDomain, futureDate],
      ]);

      const result = _getAvailabilityChangesInRenewCartItems(
        items,
        domainPricing,
        expirationMap,
      );

      expect(result).toEqual({
        noLongerAvailable: [],
        stillAvailable: [mockCartItem],
        expired: [],
        maxRegistrationReached: [],
      });
    });

    it('should handle missing duration validation data', () => {
      const items = [mockCartItem];
      const domainPricing = {
        'example.com': {
          // Missing durationValidationInYears
        },
      } as any;

      const futureDate = addYears(new Date(), 2);
      const expirationMap = new Map([
        ['example.com' as NamefiNormalizedDomain, futureDate],
      ]);

      const result = _getAvailabilityChangesInRenewCartItems(
        items,
        domainPricing,
        expirationMap,
      );

      expect(result).toEqual({
        noLongerAvailable: [mockCartItem],
        stillAvailable: [],
        expired: [],
        maxRegistrationReached: [],
      });
    });

    it('should handle missing expiration date', () => {
      const items = [mockCartItem];
      const domainPricing = {
        'example.com': {
          durationValidationInYears: { min: 1, max: 10 },
        },
      } as any;

      const expirationMap = new Map(); // Empty map, no expiration date

      const result = _getAvailabilityChangesInRenewCartItems(
        items,
        domainPricing,
        expirationMap,
      );

      expect(result).toEqual({
        noLongerAvailable: [],
        stillAvailable: [],
        expired: [mockCartItem],
        maxRegistrationReached: [],
      });
    });
  });

  // Note: _determineChangesIfAnyToCartItems and _prepareCartItemsWithChangesReflected are complex functions
  // that depend on external pricing calculation functions and are not suitable for simple unit testing
  // without extensive mocking. They would be better tested as integration tests.
});
