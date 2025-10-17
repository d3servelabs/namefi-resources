import type { ConfigInput } from '../schema';

const testConfig: ConfigInput = {
  TYPE: 'test',
  NAMEFI_MD_API_ENDPOINT: 'http://localhost:8080',
  ASTRA_BACKEND_URL: 'http://localhost:3000',
  NAMEFI_NFT_ADDRESS: '0x0000000000cf80e7cf8fa4480907f692177f8e06',
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: [],
  ADDITIONAL_HOSTNAME_MAP: {},
  FRONTEND_URL: 'https://namefi.dev',
};

export default testConfig;
