import { getAlchemyHttpRpcUrl, type Chain } from '@namefi-astra/utils';
import { secrets } from '#lib/env';

export const chainIdToUrl = getAlchemyHttpRpcUrl(secrets.ALCHEMY_API_KEY);
export const chainsToUrls = (chain: Chain) => chainIdToUrl(chain.id);
