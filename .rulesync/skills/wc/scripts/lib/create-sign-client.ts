import { SignClient } from '@walletconnect/sign-client';
import { FileStorage } from './file-storage';
import { requireEnv } from './require-env';

const PROJECT_ID = requireEnv('WALLETCONNECT_PROJECT_ID');

/**
 * Create a SignClient instance with persistent file-based storage
 *
 * Uses FileStorage with file-based locking to prevent concurrent access issues.
 * Sessions persist across script executions.
 */
export async function createSignClient() {
  const storage = new FileStorage();

  const signClient = await SignClient.init({
    projectId: PROJECT_ID,
    metadata: {
      name: 'Namefi WalletConnect Skill',
      description: 'WalletConnect session management for Namefi authentication',
      url: 'https://namefi.io',
      icons: ['https://namefi.io/favicon.ico'],
    },
    storage,
  });

  return signClient;
}
