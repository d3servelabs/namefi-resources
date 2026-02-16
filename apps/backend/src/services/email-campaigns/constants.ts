import {
  EMAIL_CAMPAIGN_KEY_LIST,
  EMAIL_CAMPAIGN_KEYS,
  type EmailCampaignKey,
} from '@namefi-astra/common/email-campaigns';

export { EMAIL_CAMPAIGN_KEY_LIST, EMAIL_CAMPAIGN_KEYS };
export type { EmailCampaignKey };

export const EMAIL_CAMPAIGN_SCHEDULE_IDS: Record<EmailCampaignKey, string> = {
  [EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR]: 'cart-domains-popular-schedule',
  [EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS]: 'dream-domain-awaits-schedule',
};

export const EMAIL_CAMPAIGN_CADENCE: Record<
  EmailCampaignKey,
  'WEEKLY' | 'MONTHLY'
> = {
  [EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR]: 'WEEKLY',
  [EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS]: 'MONTHLY',
};
