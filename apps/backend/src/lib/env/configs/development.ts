import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const developmentConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-dev.yz1vc',
  SMTP_PORT: 2025,
  SMTP_HOST: 'smtp.mail.namefi.dev',
  SMTP_SECURE: false,
  APP_URL: 'localhost:3001',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['astra.namefi.dev'],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: ['0x.city', 'poweredby.namefi.dev'],
  ALLOWED_CHAINS: [chains.sepolia.id, chains.base.id, chains.mainnet.id],
  EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP: {
    'dev-team@d3serve.xyz': ['0x.city'],
  },
};

export default developmentConfig;
