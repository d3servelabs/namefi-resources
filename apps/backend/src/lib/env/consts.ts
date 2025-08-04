//!! Warning: Couldn't use global config because it doesn't work with temporal workers
/**
 * Number of days before domain expiration when the renewal process should begin.
 * threshold determines when automatic renewals are triggered and when early renewal notifications are sent.
 * Used as a base value for calculating various renewal alert spans.
 * @constant {number}
 */
export const SEND_RENEW_REMINDERS_THRESHOLD = 30;
export const RENEW_EARLY_BY_DAYS = 15;

export const HUNT_PERIOD_AWARD_LIMITS = {
  DAILY: 10,
  WEEKLY: 20,
  MONTHLY: 50,
  YEARLY: 100,
};
