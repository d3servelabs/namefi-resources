import {
  getViemPublicClient,
  getViemWalletClient,
} from '#lib/crypto/viem-clients';
import { config, secrets } from '#lib/env';
import { getConfiguredAllowedChainIds } from '#lib/env/allowed-chains';
import { getDynadotRegistrars } from '#lib/epp-registrars/dynadot';
import type { Dynadot } from '@namefi-astra/registrars/lib/dynadot/client';
import { DynadotCommand } from '@namefi-astra/registrars/lib/dynadot/common-types';
import { CHAINS } from '@namefi-astra/utils';
import pMap, { pMapSkip } from 'p-map';
import pProps from 'p-props';
import { formatEther, parseEther } from 'viem';
import { Hono } from 'hono';
import { createLogger } from '#lib/logger';
import axios from 'axios';
import z from 'zod';

const monitorsRouter = new Hono();
const _logger = createLogger({ context: 'MONITORS_ROUTER' });

const DYNADOT_BALANCE_TRIGGER_LIMIT = Object.freeze({
  gdg: 300,
  regular: 200,
});
const CENTRALNIC_BALANCE_TRIGGER_LIMIT = 200;

/**
 * Based on 01Jan-31Mar 2026
 *
 * 1 ETH = 2024.89 USD (Apr06 2026)
 *
 * For ETH mainnet (504 Transactions in 3 months)
 * Avg/Month: ~0.0023ETH ( 4.68 $USD )
 *
 * > Estimated For 4 Months: ~0.0093ETH ( 18.72 $USD )
 *
 *
 * For Base mainnet (702 Transactions in 3 months)
 * Avg/Month: ~0.00011ETH ( 0.22 $USD )
 *
 * > Estimated For 4 Months: ~0.00044ETH ( 0.88 $USD )
 *
 * The Threshold will be the estimated amount needed for 4 Months
 *
 */
const BALANCE_THRESHOLD = Object.freeze({
  [CHAINS.mainnet.id]: parseEther('0.0093'),
  [CHAINS.base.id]: parseEther('0.00044'),
  [CHAINS.sepolia.id]: parseEther('0.0093'),
});

const zStringNumber = z.union([
  z.number(),
  z
    .string()
    .transform((v) => Number.parseFloat(v))
    .pipe(z.number()),
]);
const CentralNicBalanceSchema = z.object({
  availableCredit: zStringNumber,
  balance: zStringNumber,
  creditLimit: zStringNumber,
  creditThreshold: zStringNumber,
});

async function checkSignerBalances() {
  const configuredChainIds = getConfiguredAllowedChainIds();
  if (configuredChainIds.length === 0) {
    return [];
  }

  const signer = await getViemWalletClient(configuredChainIds[0]);
  if (!signer.account?.address) {
    throw new Error('Could not determine signer address');
  }
  return pMap(configuredChainIds, async (chainId) =>
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

async function checkCentralNicBalance() {
  if (!secrets.CENTRALNIC_CLID || !secrets.CENTRALNIC_PASS) {
    return {
      status: 'CredentialsUnavailable',
    } as const;
  }
  if (!config.CENTRALNIC_BALANCE_ENDPOINT) {
    return {
      status: 'NotEnabled',
    } as const;
  }

  const response = await axios.get(config.CENTRALNIC_BALANCE_ENDPOINT, {
    auth: {
      username: secrets.CENTRALNIC_CLID,
      password: secrets.CENTRALNIC_PASS,
    },
  });

  if (response.status >= 400) {
    return {
      status: 'BalanceUnavailable',
    } as const;
  }

  const rawPayload: unknown = response.data;
  const payloadParseRes = CentralNicBalanceSchema.safeParse(rawPayload);
  if (!payloadParseRes.success) {
    return {
      status: 'BalanceUnavailable',
    } as const;
  }
  const payload = payloadParseRes.data;

  return {
    ...payload,
    status:
      payload.balance > CENTRALNIC_BALANCE_TRIGGER_LIMIT
        ? 'BalanceAboveThreshold'
        : 'BalanceBelowThreshold',
  } as const;
}

monitorsRouter.get('/balance/onchain/signer', async (c) => {
  try {
    const res = await checkSignerBalances();
    return c.json(res);
  } catch (error) {
    _logger.error({ error }, 'Error fetching signer balances');
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});
monitorsRouter.get('/balance/registrars/dynadot', async (c) => {
  try {
    const res = await checkAllDynadotBalances();
    return c.json(res);
  } catch (error) {
    _logger.error({ error }, 'Error fetching Dynadot balances');
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

if (config.CENTRALNIC_BALANCE_ENDPOINT) {
  monitorsRouter.get('/balance/registrars/centralnic', async (c) => {
    try {
      const res = await checkCentralNicBalance();
      return c.json(res);
    } catch (error) {
      _logger.error({ error }, 'Error fetching CentralNic balance');
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  });
}

export { monitorsRouter };
