import { differenceInDays, isBefore } from 'date-fns';

export function isDomainExpirationDatePassed(
  expirationDate: Date | null | undefined,
) {
  return expirationDate ? isBefore(expirationDate, new Date()) : true;
}

export function getDaysPassedSinceExpiration(
  expirationDate: Date | null | undefined,
) {
  return expirationDate && isDomainExpirationDatePassed(expirationDate)
    ? differenceInDays(new Date(), expirationDate)
    : -1;
}

export function isDomainAssumedInLateRenewalPeriod(
  expirationDate: Date | null | undefined,
) {
  const daysPassedSinceExpiration =
    getDaysPassedSinceExpiration(expirationDate);

  return isDomainExpirationDatePassed(expirationDate)
    ? daysPassedSinceExpiration <= 30 && daysPassedSinceExpiration >= 0
    : false;
}

export function isDomainAssumedBeyondLateRenewalPeriod(
  expirationDate: Date | null | undefined,
) {
  const daysPassedSinceExpiration =
    getDaysPassedSinceExpiration(expirationDate);

  return expirationDate && isDomainExpirationDatePassed(expirationDate)
    ? daysPassedSinceExpiration > 30
    : false;
}

export function isDomainAssumedInGraceRestorationPeriod(
  expirationDate: Date | null | undefined,
) {
  const daysPassedSinceExpiration =
    getDaysPassedSinceExpiration(expirationDate);
  return expirationDate && isDomainExpirationDatePassed(expirationDate)
    ? daysPassedSinceExpiration > 30 && daysPassedSinceExpiration <= 60
    : false;
}

export function isDomainAssumedBeyondGraceRestorationPeriod(
  expirationDate: Date | null | undefined,
) {
  const daysPassedSinceExpiration =
    getDaysPassedSinceExpiration(expirationDate);
  return expirationDate && isDomainExpirationDatePassed(expirationDate)
    ? daysPassedSinceExpiration > 60
    : false;
}
