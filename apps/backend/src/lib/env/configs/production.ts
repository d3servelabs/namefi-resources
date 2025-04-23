import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const productionConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-prod.yz1vc',
  SMTP_SECURE: true,
  SMTP_HOST: 'email-smtp.us-east-1.amazonaws.com',
  APP_URL: 'astra.namefi.io',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['astra.namefi.io'],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: ['0x.city', 'poweredby.namefi.io'],
  ALLOWED_CHAINS: [chains.mainnet.id, chains.base.id],
  EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP: {
    'dev-team@d3serve.xyz': ['0x.city'],
  },
};

export default productionConfig;
