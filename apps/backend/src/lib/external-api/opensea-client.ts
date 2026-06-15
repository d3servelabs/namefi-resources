import { lazy } from '@namefi-astra/utils/lazy';
import axios, { type AxiosInstance } from 'axios';
import { createLogger } from '#lib/logger';
import { secrets } from '#lib/env';
import { CHAINS, getChain } from '@namefi-astra/utils';
import type { Chain } from 'viem';

const logger = createLogger({ module: 'opensea-client' });

interface RefreshNftParams {
  chainId: number;
  address: string;
  identifier: string;
}

class OpenSeaClient {
  private chain: Chain = CHAINS.mainnet;

  constructor(private readonly apiKey: string) {}

  async refreshNft(params: RefreshNftParams): Promise<unknown> {
    const { chainId, address, identifier } = params;

    logger.debug({ chainId, address, identifier }, 'Refreshing NFT metadata');

    const chain = getChain(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not found`);
    }

    const axiosInstance = this._getAxiosInstance(chain.testnet ?? false);

    const response = await axiosInstance.post(
      `/chain/${OpenSeaClient.getChainNameFromId(chainId)}/contract/${address}/nfts/${identifier}/refresh`,
    );

    return response.data;
  }

  selectDefaultServerFromChainId(chainId: number) {
    const chain = getChain(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not found`);
    }
    this.chain = chain;
  }

  private _testnetAxiosInstance: AxiosInstance | undefined;
  private _mainnetAxiosInstance: AxiosInstance | undefined;

  get testnetMode(): boolean {
    return this.chain.testnet ?? false;
  }

  private _axiosConfig(testnetMode = this.testnetMode) {
    return {
      baseURL: testnetMode
        ? 'https://testnets-api.opensea.io/api/v2'
        : 'https://api.opensea.io/api/v2',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    };
  }

  private _getAxiosInstance(testnetMode = this.testnetMode) {
    if (testnetMode) {
      this._testnetAxiosInstance =
        this._testnetAxiosInstance ||
        axios.create(this._axiosConfig(testnetMode));
      return this._testnetAxiosInstance;
    }
    this._mainnetAxiosInstance =
      this._mainnetAxiosInstance ||
      axios.create(this._axiosConfig(testnetMode));
    return this._mainnetAxiosInstance;
  }

  static getChainNameFromId(chainId: number): string {
    const chainIdToName: Record<number, string> = {
      1: 'ethereum',
      11155111: 'sepolia',
      8453: 'base',
      137: 'polygon',
      80001: 'mumbai',
      5: 'goerli',
    };
    return chainIdToName[chainId] || 'ethereum';
  }
}

// Export lazy singleton instance
export const getOpenSeaClient = lazy(
  () => new OpenSeaClient(secrets.OPENSEA_API_KEY),
);
