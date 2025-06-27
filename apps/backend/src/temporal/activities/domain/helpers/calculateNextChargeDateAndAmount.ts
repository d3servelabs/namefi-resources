import { differenceInCalendarDays, format, max, subDays } from 'date-fns';
import { groupBy, sum } from 'ramda';

/**
 * Calculates the next charge date and amount for domain renewals
 * @param chargeAmountsAndDates Array of objects containing expiration times and charge amounts
 * @returns Object containing the next charge date and amount
 */

export function calculateNextChargeDateAndAmount(
  chargeAmountsAndDates: {
    expirationTime: Date;
    chargeAmount: number;
  }[],
  renewEarlyByDays: number,
) {
  const upcomingRenewalsByDate = groupBy(({ expirationTime }) => {
    const renewDate =
      differenceInCalendarDays(expirationTime, new Date()) <= renewEarlyByDays
        ? new Date()
        : expirationTime;
    return format(renewDate, 'yyyy-MM-dd');
  }, chargeAmountsAndDates);
  if (Object.keys(upcomingRenewalsByDate).length === 0) {
    return { nextChargeDate: null, nextChargeAmount: 0 };
  }
  const upcomingRenewalsByDateKeys = Object.keys(upcomingRenewalsByDate).sort(
    (a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    },
  );
  const nearestDate = upcomingRenewalsByDateKeys[0];

  const nextChargeDate = max([
    new Date(),
    subDays(nearestDate, renewEarlyByDays),
  ]);
  const itemsThatWillBeRenewedOnNextCharge =
    upcomingRenewalsByDate[upcomingRenewalsByDateKeys[0]] ?? [];
  const nextChargeAmount = sum(
    itemsThatWillBeRenewedOnNextCharge.map(({ chargeAmount }) => chargeAmount),
  );
  return { nextChargeDate, nextChargeAmount };
}
