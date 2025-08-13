import { createLogger } from '#lib/logger';

export const logger = createLogger({
  module: 'hunt-helpers',
});

export const DAILY_PERIOD_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const WEEKLY_PERIOD_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const MONTHLY_PERIOD_KEY_REGEX = /^\d{4}-\d{2}$/;
export const YEARLY_PERIOD_KEY_REGEX = /^\d{4}$/;
