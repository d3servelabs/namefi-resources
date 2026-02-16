export const EMAIL_CAMPAIGNS = [
  {
    key: 'cart-domains-popular',
    title: 'Abandoned Cart',
  },
  {
    key: 'dream-domain-awaits',
    title: 'Winback',
  },
  {
    key: 'domain-traffic-surge',
    title: 'Traffic Surge',
  },
] as const;
// NOTE: These are hardcoded today; consider sourcing from the DB in the future.

export type EmailCampaignKey = (typeof EMAIL_CAMPAIGNS)[number]['key'];

export const EMAIL_CAMPAIGN_KEY_LIST = EMAIL_CAMPAIGNS.map(
  (campaign) => campaign.key,
) as [EmailCampaignKey, ...EmailCampaignKey[]];

export const EMAIL_CAMPAIGN_KEYS = {
  CART_DOMAINS_POPULAR: 'cart-domains-popular',
  DREAM_DOMAIN_AWAITS: 'dream-domain-awaits',
  DOMAIN_TRAFFIC_SURGE: 'domain-traffic-surge',
} as const satisfies Record<string, EmailCampaignKey>;
