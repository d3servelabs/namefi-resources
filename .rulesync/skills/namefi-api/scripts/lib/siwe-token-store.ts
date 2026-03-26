import { siweTokensPath } from './constants';
import { fileExists, readJsonFile, writeJsonFile } from './json';

export type StoredSiweToken = {
  token: string;
  address: string;
  chainId: number;
  createdAt: string;
  expiresAt: number;
};

type SiweTokenStore = Record<string, Record<string, StoredSiweToken>>;

const EMPTY_STORE: SiweTokenStore = {};

async function loadStore(): Promise<SiweTokenStore> {
  if (!fileExists(siweTokensPath)) {
    return EMPTY_STORE;
  }

  return readJsonFile<SiweTokenStore>(siweTokensPath);
}

async function saveStore(store: SiweTokenStore): Promise<void> {
  await writeJsonFile(siweTokensPath, store);
}

export async function loadStoredSiweToken(args: {
  env: string;
  address: string;
}): Promise<StoredSiweToken | null> {
  const store = await loadStore();
  return store[args.env]?.[args.address.toLowerCase()] ?? null;
}

export async function saveStoredSiweToken(args: {
  env: string;
  address: string;
  token: StoredSiweToken;
}): Promise<void> {
  const store = await loadStore();
  const envStore = store[args.env] ?? {};
  envStore[args.address.toLowerCase()] = args.token;
  store[args.env] = envStore;
  await saveStore(store);
}
