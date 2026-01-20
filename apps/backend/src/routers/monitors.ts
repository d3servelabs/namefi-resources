import {
  getViemPublicClient,
  getViemWalletClient,
} from '#lib/crypto/viem-clients';
import { config } from '#lib/env';
import { getDynadotRegistrars } from '#lib/epp-registrars/dynadot';
import type { Dynadot } from '@namefi-astra/registrars/lib/dynadot/client';
import { DynadotCommand } from '@namefi-astra/registrars/lib/dynadot/common-types';
import { CHAINS } from '@namefi-astra/utils';
import pMap from 'p-map';
import pProps from 'p-props';
import { formatEther, parseEther } from 'viem';
import { Hono } from 'hono';
import { createLogger } from '#lib/logger';

const DYNADOT_BALANCE_TRIGGER_LIMIT = Object.freeze({
  gdg: 400,
  regular: 200,
});

const BALANCE_THRESHOLD = Object.freeze({
  [CHAINS.mainnet.id]: parseEther('0.025'),
  [CHAINS.base.id]: parseEther('0.0025'),
  [CHAINS.sepolia.id]: parseEther('0.0025'),
});
async function checkSignerBalances() {
  const signer = await getViemWalletClient(config.ALLOWED_CHAINS[0]);
  return pMap(config.ALLOWED_CHAINS, async (chainId) =>
    checkBalance(chainId, signer.account.address),
  );
}

async function checkBalance(chainId: number, address: `0x${string}`) {
  const publicClient = await getViemPublicClient(chainId);

  const balance = await publicClient.getBalance({
    address: address,
    blockTag: 'safe',
  });
  if (!(chainId in BALANCE_THRESHOLD)) {
    return {
      balanceWei: balance.toString(),
      balanceETH: formatEther(balance),
      status: 'UNKNOWN',
      chainId,
      address,
    };
  }
  const threshold =
    BALANCE_THRESHOLD[chainId as keyof typeof BALANCE_THRESHOLD];

  const status = balance <= threshold ? 'UNDER_THRESHOLD' : 'ABOVE_THRESHOLD';
  return {
    balanceWei: balance.toString(),
    balanceETH: formatEther(balance),
    status,
    chainId,
    address,
  };
}

async function checkDynadotBalance(dynadot: Dynadot, limit: number) {
  const response = await dynadot.command(
    DynadotCommand.get_account_balance,
    {},
  );
  const getAccountBalanceResponse = response.GetAccountBalanceResponse;
  if (
    getAccountBalanceResponse.ResponseCode === '0' ||
    getAccountBalanceResponse.Status === 'success'
  ) {
    const balance = getAccountBalanceResponse.BalanceList?.[0];
    if (!balance) {
      return {
        status: 'BalanceUnavailable',
      };
    }
    return {
      balance: balance.Amount,
      status:
        Number.parseFloat(balance.Amount) > limit
          ? 'BalanceAboveLimit'
          : 'BalanceBelowLimit',
    };
  }
  return {
    status: 'BalanceUnavailable',
  };
}

async function checkAllDynadotBalances() {
  const dynadot = await getDynadotRegistrars(undefined);
  const balance = await pProps(dynadot, async (dynadot, key) =>
    checkDynadotBalance(
      dynadot.getClient(),
      DYNADOT_BALANCE_TRIGGER_LIMIT[key],
    ),
  );
  return balance;
}

const monitorsRouter = new Hono();
const _logger = createLogger({ context: 'MONITORS_ROUTER' });

monitorsRouter.get('/balance/onchain/signer', async (c) => {
  try {
    const res = await checkSignerBalances();
    return c.json(res);
  } catch (error) {
    _logger.trace({ error }, 'Error fetching signer balances');
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});
monitorsRouter.get('/balance/registrars/dynadot', async (c) => {
  try {
    const res = await checkAllDynadotBalances();
    return c.json(res);
  } catch (error) {
    _logger.trace({ error }, 'Error fetching Dynadot balances');
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export { monitorsRouter };
