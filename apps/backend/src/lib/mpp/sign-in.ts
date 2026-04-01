import { randomBytes } from 'node:crypto';
import {
  CHAINS,
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
import {
  assertTempoCredentialSourceMatchesIdentity,
  overrideMppMethodVerify,
  verifyTempoChargeWithoutBroadcast,
} from './verify-only';

const logger = createLogger({ context: 'MPP_SIGN_IN' });

const MPP_SIGN_IN_DESCRIPTION = 'Sign in to Namefi API';
const MPP_SIGN_IN_REPLAY_KEY_PREFIX = 'mpp:sign-in:challenge';
const MPP_SIGN_IN_REPLAY_TTL_SECONDS = 60 * 5;
const MPP_SIGN_IN_ACCEPTED_CREDENTIAL_TYPES = ['transaction', 'hash'] as const;
const MPP_SIGN_IN_PREFERRED_MODE = 'pull';
const MPP_SIGN_IN_PUSH_WARNING =
  'Push mode may spend gas before authentication completes.';

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

export type MppSignInPaymentRequiredMetadata = {
  acceptedCredentialTypes: string[];
  action: 'sign-in';
  preferredMode: 'pull';
  warning: string;
  zeroFeePreferred: true;
};

export type MppSignInResult =
  | {
      challenge: Response;
      metadata: MppSignInPaymentRequiredMetadata;
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

function createMppSignInMemo() {
  return `0x${randomBytes(32).toString('hex')}` as `0x${string}`;
}

function getMppSignInChallengeMeta() {
  return {
    acceptedCredentialTypes: MPP_SIGN_IN_ACCEPTED_CREDENTIAL_TYPES.join(','),
    action: 'sign-in',
    preferredMode: MPP_SIGN_IN_PREFERRED_MODE,
    zeroFeePreferred: 'true',
    warning: MPP_SIGN_IN_PUSH_WARNING,
  } satisfies Record<string, string>;
}

function getMppSignInPaymentRequiredMetadata(): MppSignInPaymentRequiredMetadata {
  return {
    acceptedCredentialTypes: [...MPP_SIGN_IN_ACCEPTED_CREDENTIAL_TYPES],
    action: 'sign-in',
    preferredMode: MPP_SIGN_IN_PREFERRED_MODE,
    warning: MPP_SIGN_IN_PUSH_WARNING,
    zeroFeePreferred: true,
  };
}

export function buildMppSignInPaymentRequiredResponse(input: {
  challenge: Response;
  metadata: MppSignInPaymentRequiredMetadata;
}) {
  const headers = new Headers(input.challenge.headers);
  headers.set('Content-Type', 'application/json');

  return new Response(
    JSON.stringify({
      message: 'Payment Required',
      status: 402,
      ...input.metadata,
    }),
    {
      headers,
      status: 402,
    },
  );
}

function createVerifyOnlyTempoSignInMethod() {
  const [tempoChargeMethod] = tempo({
    currency: getMppTempoCurrency(),
    decimals: 6,
    recipient: getMppTempoRecipientOrThrow(),
    testnet: config.MPP_TEMPO_TESTNET,
  });

  return overrideMppMethodVerify(
    tempoChargeMethod,
    verifyTempoChargeWithoutBroadcast,
  );
}

function createMppSignInHandler(realm: string) {
  return Mppx.create({
    methods: [createVerifyOnlyTempoSignInMethod()],
    realm,
    secretKey: secrets.COOKIE_SECRET,
  });
}

function getChainIdFromDidChain(chain: string) {
  const match = chain.match(/^eip155:(\d+)$/);
  if (!match) {
    throw new Error('MPP sign-in requires an eip155 DID chain');
  }

  return Number(match[1]);
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

function getSignInMemoFromCredential(credential: Credential.Credential | null) {
  const challengeRequest = credential?.challenge?.request;

  if (
    challengeRequest &&
    typeof challengeRequest === 'object' &&
    'methodDetails' in challengeRequest &&
    challengeRequest.methodDetails &&
    typeof challengeRequest.methodDetails === 'object' &&
    'memo' in challengeRequest.methodDetails &&
    typeof challengeRequest.methodDetails.memo === 'string'
  ) {
    return challengeRequest.methodDetails.memo as `0x${string}`;
  }

  if (
    challengeRequest &&
    typeof challengeRequest === 'object' &&
    'memo' in challengeRequest &&
    typeof challengeRequest.memo === 'string'
  ) {
    return challengeRequest.memo as `0x${string}`;
  }

  return createMppSignInMemo();
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
  const credential = getSignInCredential(input.request);
  const memo = getSignInMemoFromCredential(credential);
  const paymentRequiredMetadata = getMppSignInPaymentRequiredMetadata();
  const result = await signInHandler.tempo.charge({
    amount: '0',
    description: MPP_SIGN_IN_DESCRIPTION,
    memo,
    meta: getMppSignInChallengeMeta(),
    chainId: (config.MPP_TEMPO_TESTNET ? CHAINS.tempoModerato : CHAINS.tempo)
      .id,
  })(input.request);

  if (result.status === 402) {
    return {
      challenge: result.challenge,
      metadata: paymentRequiredMetadata,
      status: 'payment_required',
    };
  }

  if (!credential) {
    throw new Error(
      'Missing MPP credential after successful sign-in verification',
    );
  }

  const didSource = parseMppDidSource(credential.source);
  if (!didSource) {
    throw new Error('MPP sign-in requires a valid DID source');
  }

  logger.info(
    {
      didSource,
      credentialSource: credential.source,
      expectedChainId: getChainIdFromDidChain(didSource.chain),
      expectedWalletAddress: didSource.walletAddress,
    },
    'getMppSignInResult',
  );
  await assertTempoCredentialSourceMatchesIdentity({
    credential,
    expectedChainId: getChainIdFromDidChain(didSource.chain),
    expectedWalletAddress: didSource.walletAddress,
  });

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
