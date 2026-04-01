import type { ConfigInput } from '../schema';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from '../consts';

const previewConfig: ConfigInput = {
  TYPE: 'preview',
  NAMEFI_MD_API_ENDPOINT: 'https://md.namefi.io',
  ASTRA_BACKEND_URL: 'https://backend.astra.namefi.dev',
  NAMEFI_NFT_ADDRESS: '0x0000000000cf80e7cf8fa4480907f692177f8e06',
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES,
  ADDITIONAL_HOSTNAME_MAP: Object.fromEntries(
    POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.flatMap((hostname) => [
      [`${hostname}.poweredby.namefi.dev`, hostname],
      [`${hostname}.astra.namefi.dev`, hostname],
    ]),
  ),
  FRONTEND_URL: 'https://namefi.dev',
};

export default previewConfig;
