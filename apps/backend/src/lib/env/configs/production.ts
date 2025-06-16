import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const productionConfig: ConfigInput = {
  LOG_LEVEL: 'debug',
  PRIVY_APP_ID: 'cm23ds44v09x0oyiqqa7blr8i',
  TEMPORAL_API_URL: 'us-east-1.aws.api.temporal.io:7233',
  TEMPORAL_NAMESPACE: 'namefi-astra-prod.yz1vc',
  SMTP_SECURE: true,
  SMTP_HOST: 'email-smtp.us-east-1.amazonaws.com',
  APP_URL: 'astra.namefi.io',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['astra.namefi.io'],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: ['0x.city', 'poweredby.namefi.io'],
  ADDITIONAL_HOSTNAME_MAP: {
    '0xcity.astra.namefi.io': '0x.city',
  },
  ALLOWED_CHAINS: [chains.mainnet.id, chains.base.id],
  EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP: {
    'dev-team@d3serve.xyz': ['0x.city'],
  },
  NAMEFI_ASTRA_NAMESERVERS: ['ns3.namefi.io.', 'ns4.namefi.io.'],

  // TODO: replace with actual values (temporary)
  DNSSEC_DNSKEY_PUBLIC_RECORD:
    'example.com. 3600 IN DNSKEY 257 3 13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
  DNSSEC_DNSKEY_KEY_TAG: 22005,
};

export default productionConfig;
