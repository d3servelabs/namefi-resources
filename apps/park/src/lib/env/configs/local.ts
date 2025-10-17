import type { ConfigInput } from '../schema';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from '../consts';

const localConfig: ConfigInput = {
  TYPE: 'local',
  NAMEFI_MD_API_ENDPOINT: 'https://md.namefi.io',
  ASTRA_BACKEND_URL: 'http://localhost:3000',
  NAMEFI_NFT_ADDRESS: '0x0000000000cf80e7cf8fa4480907f692177f8e06',
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES,
  ADDITIONAL_HOSTNAME_MAP: Object.fromEntries(
    POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.map((hostname) => [
      `${hostname}.localhost`,
      hostname,
    ]),
  ),
  FRONTEND_URL: 'https://localhost:5050',
};

export default localConfig;
