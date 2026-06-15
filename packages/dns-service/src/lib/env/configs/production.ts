import { DNS_NAMESERVERS_PROD } from '../dns-config-schema';
import type { ConfigInput } from '../schema';

const productionConfig: ConfigInput = {
  NAMEFI_ASTRA_NAMESERVERS: [...DNS_NAMESERVERS_PROD],
};

export default productionConfig;
