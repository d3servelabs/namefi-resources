import { addDays, differenceInCalendarDays } from 'date-fns';
import { calculateNextChargeDateAndAmount } from './calculateNextChargeDateAndAmount';
import { describe, test, expect } from 'vitest';

const RENEW_EARLY_BY_DAYS = 15;

describe('Testing Next Charge Date And Amount Calculation', () => {
  test('no next charge', () => {
    const { nextChargeAmount, nextChargeDate } =
      calculateNextChargeDateAndAmount([], RENEW_EARLY_BY_DAYS);

    expect(nextChargeAmount).toEqual(0);
    expect(nextChargeDate).toEqual(null);
  });

  test('not today', () => {
    const { nextChargeAmount, nextChargeDate } =
      calculateNextChargeDateAndAmount(
        [
          {
            expirationTime: addDays(new Date(), 30),
            chargeAmount: 100,
          },
          {
            expirationTime: addDays(new Date(), 19),
            chargeAmount: 202,
          },
          {
            expirationTime: addDays(new Date(), 21),
            chargeAmount: 303,
          },
        ],
        RENEW_EARLY_BY_DAYS,
      );

    expect(nextChargeAmount).toEqual(202);
    expect(nextChargeDate).not.toBeNull();
    if (nextChargeDate) {
      expect(differenceInCalendarDays(nextChargeDate, new Date())).toEqual(
        Math.max(0, 19 - RENEW_EARLY_BY_DAYS),
      );
    }
  });

  test('all will be charged on same day', () => {
    const { nextChargeAmount, nextChargeDate } =
      calculateNextChargeDateAndAmount(
        [
          {
            expirationTime: addDays(new Date(), 1),
            chargeAmount: 100,
          },
          {
            expirationTime: addDays(new Date(), 2),
            chargeAmount: 202,
          },
          {
            expirationTime: addDays(new Date(), 14),
            chargeAmount: 303,
          },
          {
            expirationTime: addDays(new Date(), 15),
            chargeAmount: 50,
          },
        ],
        RENEW_EARLY_BY_DAYS,
      );

    expect(nextChargeAmount).toEqual(655);
    expect(nextChargeDate).not.toBeNull();
    if (nextChargeDate) {
      expect(differenceInCalendarDays(nextChargeDate, new Date())).toEqual(0);
    }
  });

  test('some will be charged today', () => {
    const { nextChargeAmount, nextChargeDate } =
      calculateNextChargeDateAndAmount(
        [
          {
            expirationTime: addDays(new Date(), 1),
            chargeAmount: 100,
          },
          {
            expirationTime: addDays(new Date(), 2),
            chargeAmount: 202,
          },
          {
            expirationTime: addDays(new Date(), 16),
            chargeAmount: 303,
          },
        ],
        RENEW_EARLY_BY_DAYS,
      );

    expect(nextChargeAmount).toEqual(302);
    expect(nextChargeDate).not.toBeNull();
    if (nextChargeDate) {
      expect(differenceInCalendarDays(nextChargeDate, new Date())).toEqual(0);
    }
  });

  test('single subscription due today', () => {
    const { nextChargeAmount, nextChargeDate } =
      calculateNextChargeDateAndAmount(
        [
          {
            expirationTime: addDays(new Date(), 1),
            chargeAmount: 100,
          },
        ],
        RENEW_EARLY_BY_DAYS,
      );

    expect(nextChargeAmount).toEqual(100);
    expect(nextChargeDate).not.toBeNull();
    if (nextChargeDate) {
      expect(differenceInCalendarDays(nextChargeDate, new Date())).toEqual(0);
    }
  });

  test('subscriptions with past expiration dates', () => {
    const { nextChargeAmount, nextChargeDate } =
      calculateNextChargeDateAndAmount(
        [
          {
            expirationTime: addDays(new Date(), -1),
            chargeAmount: 100,
          },
          {
            expirationTime: addDays(new Date(), 5),
            chargeAmount: 200,
          },
        ],
        RENEW_EARLY_BY_DAYS,
      );

    expect(nextChargeAmount).toEqual(300);
    expect(nextChargeDate).not.toBeNull();
    if (nextChargeDate) {
      expect(differenceInCalendarDays(nextChargeDate, new Date())).toEqual(0);
    }
  });
});
