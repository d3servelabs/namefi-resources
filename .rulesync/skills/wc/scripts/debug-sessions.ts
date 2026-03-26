#!/usr/bin/env bun
import { SignClient } from '@walletconnect/sign-client';
import { requireEnv } from './lib/require-env'

const PROJECT_ID = requireEnv('WALLETCONNECT_PROJECT_ID')

async function main() {
  console.log('Initializing SignClient...');

  const signClient = await SignClient.init({
    projectId: PROJECT_ID,
    metadata: {
      name: 'Namefi WalletConnect Skill',
      description: 'WalletConnect session management for Namefi authentication',
      url: 'https://namefi.io',
      icons: ['https://namefi.io/favicon.ico'],
    },
  });

  console.log('\nAll active sessions:');
  const sessions = signClient.session.getAll();
  console.log(JSON.stringify(sessions, null, 2));

  console.log('\nSession count:', sessions.length);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
