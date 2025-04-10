import type { ConfigInput } from '../schema';

const productionConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-prod.yz1vc',
  SMTP_SECURE: true,
  SMTP_HOST: 'email-smtp.us-east-1.amazonaws.com',
  APP_URL: 'astra.namefi.io',
  NAMEFI_FIRST_PARTY_ORIGINS: ['astra.namefi.io'],
  ADDITIONAL_POWERED_BY_NAMEFI_THIRD_PARTY_DOMAINS: ['0x.city'],
};

export default productionConfig;
