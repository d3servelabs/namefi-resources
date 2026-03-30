import {
  checksumWalletAddressSchema,
  type ChecksumWalletAddress,
} from '@namefi-astra/utils';
import { db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { Credential, Receipt } from 'mppx';
import { Mppx, tempo } from 'mppx/server';
import { createApiAuthJwt } from '#lib/auth/jwt';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { getRedisClient } from '#lib/redis';
import { findOrCreateUserFromWallet } from '#temporal/activities/x402.activities';
import { parseMppDidSource } from './source-did';

const logger = createLogger({ context: 'MPP_SIGN_IN' });

const MPP_SIGN_IN_DESCRIPTION = 'Sign in to Namefi API';
const MPP_SIGN_IN_REPLAY_KEY_PREFIX = 'mpp:sign-in:challenge';
const MPP_SIGN_IN_REPLAY_TTL_SECONDS = 60 * 5;

export type MppSignInSuccessResult = {
  chain: string;
  expiresAt: string;
  issuedAt: string;
  status: 'signed_in';
  token: string;
  tokenType: 'Bearer';
  userId: string;
  walletAddress: ChecksumWalletAddress;
};

export type MppSignInResult =
  | {
      challenge: Response;
      status: 'payment_required';
    }
  | MppSignInSuccessResult;

function getMppTempoCurrency() {
  return checksumWalletAddressSchema.parse(config.MPP_TEMPO_CURRENCY);
}

function getMppTempoRecipientOrThrow() {
  return checksumWalletAddressSchema.parse(
    config.MPP_TEMPO_RECIPIENT || config.X402_SIGNER_ADDRESS,
  );
}

function createMppSignInHandler(realm: string) {
  return Mppx.create({
    methods: [
      tempo({
        currency: getMppTempoCurrency(),
        decimals: 6,
        recipient: getMppTempoRecipientOrThrow(),
        testnet: config.MPP_TEMPO_TESTNET,
      }),
    ],
    realm,
    secretKey: secrets.COOKIE_SECRET,
  });
}

async function consumeMppSignInChallenge(input: {
  challengeId: string;
  expires?: string;
}) {
  const client = await getRedisClient();
  const key = `${MPP_SIGN_IN_REPLAY_KEY_PREFIX}:${input.challengeId}`;

  const expiresAt = input.expires
    ? new Date(input.expires).getTime()
    : undefined;
  const ttlSeconds = expiresAt
    ? Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 1)
    : MPP_SIGN_IN_REPLAY_TTL_SECONDS;

  const result = await client.set(key, 'true', {
    EX: ttlSeconds,
    NX: true,
  });

  if (!result) {
    return {
      valid: false,
      error: 'Replay detected: MPP challenge already used',
    } as const;
  }

  return { valid: true } as const;
}

function getSignInCredential(request: Request) {
  try {
    return Credential.fromRequest(request);
  } catch {
    return null;
  }
}

export async function getMppSignInResult(input: {
  request: Request;
}): Promise<MppSignInResult> {
  if (!config.MPP_ENABLED) {
    throw new Error('MPP payment protocol is not allowed');
  }

  getMppTempoRecipientOrThrow();

  const realm = new URL(input.request.url).host;
  const signInHandler = createMppSignInHandler(realm);
  const result = await signInHandler.tempo.charge({
    amount: '0',
    description: MPP_SIGN_IN_DESCRIPTION,
    meta: {
      action: 'sign-in',
    },
  })(input.request);

  if (result.status === 402) {
    return {
      challenge: result.challenge,
      status: 'payment_required',
    };
  }

  const credential = getSignInCredential(input.request);
  if (!credential) {
    throw new Error(
      'Missing MPP credential after successful sign-in verification',
    );
  }

  const didSource = parseMppDidSource(credential.source);
  if (!didSource) {
    throw new Error('MPP sign-in requires a valid DID source');
  }

  const replayResult = await consumeMppSignInChallenge({
    challengeId: credential.challenge.id,
    expires: credential.challenge.expires,
  });
  if (!replayResult.valid) {
    throw new Error(replayResult.error);
  }

  const receipt = Receipt.fromResponse(
    result.withReceipt(new Response(null, { status: 204 })),
  );

  const userResult = await findOrCreateUserFromWallet({
    walletAddress: didSource.walletAddress,
  });
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userResult.userId),
  });

  if (!user) {
    throw new Error('Could not load user after MPP sign-in');
  }

  const jwt = await createApiAuthJwt({
    chain: didSource.chain,
    userId: user.id,
    walletAddress: didSource.walletAddress,
    sessionDurationInSeconds: 3600,
  });

  logger.trace(
    {
      chain: didSource.chain,
      receiptReference: receipt.reference,
      userId: user.id,
      walletAddress: didSource.walletAddress,
    },
    'MPP sign-in succeeded',
  );

  return {
    ...jwt,
    status: 'signed_in',
    tokenType: 'Bearer',
  };
}
