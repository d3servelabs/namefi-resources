import {
  checksumWalletAddressSchema,
  type ChecksumWalletAddress,
} from '@namefi-astra/utils';
import * as Mpp from 'mppx';
import * as Tempo from 'mppx/tempo';
import type { z } from 'zod';
import {
  createPublicClient,
  decodeFunctionData,
  http,
  isAddressEqual,
  parseEventLogs,
} from 'viem';
import {
  call as viemCall,
  getTransaction,
  getTransactionReceipt,
} from 'viem/actions';
import { tempo, tempoModerato, type Chain } from 'viem/chains';
import { Abis, Transaction } from 'viem/tempo';

type VerifyOnlyServerMethod = Mpp.Method.Server<any, any, any>;
type OverrideableServerMethod = VerifyOnlyServerMethod & {
  defaults?: VerifyOnlyServerMethod['defaults'];
  request?: VerifyOnlyServerMethod['request'];
  respond?: VerifyOnlyServerMethod['respond'];
  transport?: VerifyOnlyServerMethod['transport'];
  verify: VerifyOnlyServerMethod['verify'];
};
type TempoChargePayload = z.output<
  typeof Tempo.Methods.charge.schema.credential.payload
>;
type TempoChargeRequest = z.input<typeof Tempo.Methods.charge.schema.request>;
type TempoReceiptLogs = Parameters<typeof parseEventLogs>[0]['logs'];
type TempoCall = NonNullable<
  ReturnType<typeof Transaction.deserialize>['calls']
>[number];
type TempoDeserializedTransaction = ReturnType<
  typeof Transaction.deserialize
> & {
  calls?: readonly TempoCall[];
  chainId?: number;
  from?: string;
};

type VerifyOnlyTempoChargeParameters = {
  credential: Mpp.Credential.Credential<TempoChargePayload>;
  request: TempoChargeRequest;
};

const TEMPO_CHAINS = new Map<number, Chain>([
  [tempo.id, tempo],
  [tempoModerato.id, tempoModerato],
]);

function getTempoChainOrThrow(chainId: number) {
  const chain = TEMPO_CHAINS.get(chainId);
  if (!chain) {
    throw new Error(`Unsupported Tempo chainId: ${chainId}`);
  }

  return chain;
}

function getTempoClient(chainId: number) {
  const chain = getTempoChainOrThrow(chainId);

  return createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  });
}

function getRequiredTempoChainId(request: TempoChargeRequest) {
  if (!request.chainId) {
    throw new Error('Tempo request is missing chainId');
  }

  return request.chainId;
}

function getRequiredTempoRequestFields(request: TempoChargeRequest) {
  if (!request.currency) {
    throw new Error('Tempo request is missing currency');
  }

  if (!request.recipient) {
    throw new Error('Tempo request is missing recipient');
  }

  return {
    amount: request.amount,
    chainId: getRequiredTempoChainId(request),
    currency: checksumWalletAddressSchema.parse(request.currency),
    memo: request.memo,
    recipient: checksumWalletAddressSchema.parse(request.recipient),
  };
}

function asHex(hash: string) {
  return hash as `0x${string}`;
}

function deserializeTempoTransaction(signature: string) {
  return Transaction.deserialize(
    asHex(signature),
  ) as TempoDeserializedTransaction;
}

function getTempoChargeCredentialPayload(
  credential: Mpp.Credential.Credential,
) {
  return Tempo.Methods.charge.schema.credential.payload.parse(
    credential.payload,
  );
}

function getTempoTransactionSenderOrThrow(
  transaction: TempoDeserializedTransaction,
) {
  if (!transaction.from) {
    throw new Error(
      'Tempo auth verification failed: transaction is missing sender',
    );
  }

  return checksumWalletAddressSchema.parse(transaction.from);
}

function matchesTempoTransferCall(input: {
  amount: string;
  call: TempoCall;
  currency: ChecksumWalletAddress;
  memo?: string;
  recipient: ChecksumWalletAddress;
}) {
  if (!input.call.to || !isAddressEqual(input.call.to, input.currency)) {
    return false;
  }

  if (!input.call.data) {
    return false;
  }

  try {
    const decoded = decodeFunctionData({
      abi: Abis.tip20,
      data: input.call.data,
    });

    if (decoded.functionName === 'transfer') {
      const [to, amount] = decoded.args;

      if (input.memo) {
        return false;
      }

      return (
        isAddressEqual(to, input.recipient) &&
        amount.toString() === input.amount
      );
    }

    if (decoded.functionName === 'transferWithMemo') {
      const [to, amount, memo] = decoded.args;

      if (input.memo) {
        return (
          isAddressEqual(to, input.recipient) &&
          amount.toString() === input.amount &&
          memo.toLowerCase() === input.memo.toLowerCase()
        );
      }

      return (
        isAddressEqual(to, input.recipient) &&
        amount.toString() === input.amount
      );
    }
  } catch {
    return false;
  }

  return false;
}

function assertMatchingTempoReceipt(input: {
  amount: string;
  currency: ChecksumWalletAddress;
  logs: TempoReceiptLogs;
  memo?: string;
  recipient: ChecksumWalletAddress;
}) {
  if (input.memo) {
    const memo = input.memo.toLowerCase();
    const memoLogs = parseEventLogs({
      abi: Abis.tip20,
      eventName: 'TransferWithMemo',
      logs: input.logs,
    });

    const match = memoLogs.find(
      (log) =>
        isAddressEqual(log.address, input.currency) &&
        isAddressEqual(log.args.to, input.recipient) &&
        log.args.amount.toString() === input.amount &&
        log.args.memo.toLowerCase() === memo,
    );

    if (!match) {
      throw new Error(
        'Tempo auth verification failed: no matching transfer memo found',
      );
    }

    return;
  }

  const transferLogs = parseEventLogs({
    abi: Abis.tip20,
    eventName: 'Transfer',
    logs: input.logs,
  });
  const memoLogs = parseEventLogs({
    abi: Abis.tip20,
    eventName: 'TransferWithMemo',
    logs: input.logs,
  });

  const match = [...transferLogs, ...memoLogs].find(
    (log) =>
      isAddressEqual(log.address, input.currency) &&
      isAddressEqual(log.args.to, input.recipient) &&
      log.args.amount.toString() === input.amount,
  );

  if (!match) {
    throw new Error(
      'Tempo auth verification failed: no matching transfer found',
    );
  }
}

export function overrideMppMethodVerify<
  serverMethod extends OverrideableServerMethod,
>(
  method: serverMethod,
  verify: VerifyOnlyServerMethod['verify'],
): serverMethod {
  const baseMethod = method as OverrideableServerMethod;

  return Mpp.Method.toServer(method as Mpp.Method.Method, {
    defaults: baseMethod.defaults,
    request: baseMethod.request,
    respond: baseMethod.respond,
    transport: baseMethod.transport,
    verify,
  }) as serverMethod;
}

export async function verifyTempoChargeWithoutBroadcast({
  credential,
  request,
}: VerifyOnlyTempoChargeParameters): Promise<Mpp.Receipt.Receipt> {
  const { amount, chainId, currency, memo, recipient } =
    getRequiredTempoRequestFields(request);
  const payload = getTempoChargeCredentialPayload(credential);

  switch (payload.type) {
    case 'hash': {
      const client = getTempoClient(chainId);
      const [transaction, receipt] = await Promise.all([
        getTransaction(client, { hash: asHex(payload.hash) }),
        getTransactionReceipt(client, { hash: asHex(payload.hash) }),
      ]);

      assertMatchingTempoReceipt({
        amount,
        currency,
        logs: receipt.logs,
        memo,
        recipient,
      });

      return {
        method: 'tempo',
        status: 'success',
        timestamp: new Date().toISOString(),
        reference: transaction.hash,
      };
    }
    case 'transaction': {
      const transaction = deserializeTempoTransaction(payload.signature);
      const calls = transaction.calls ?? [];
      const matchingCall = calls.find((call: (typeof calls)[number]) =>
        matchesTempoTransferCall({
          amount,
          call,
          currency,
          memo,
          recipient,
        }),
      );

      if (!matchingCall) {
        throw new Error(
          'Tempo auth verification failed: no matching payment call found',
        );
      }

      const sender = getTempoTransactionSenderOrThrow(transaction);

      if (!matchingCall.to || !matchingCall.data) {
        throw new Error(
          'Tempo auth verification failed: matching call is incomplete',
        );
      }

      const client = getTempoClient(chainId);

      await viemCall(client, {
        account: sender,
        data: matchingCall.data,
        to: matchingCall.to,
        ...(matchingCall.value ? { value: matchingCall.value } : {}),
      });

      return {
        method: 'tempo',
        status: 'success',
        timestamp: new Date().toISOString(),
        reference: credential.challenge.id,
      };
    }
    default:
      throw new Error('Unsupported Tempo auth credential type');
  }
}

export async function assertTempoCredentialSourceMatchesIdentity(input: {
  credential: Mpp.Credential.Credential;
  expectedChainId: number;
  expectedWalletAddress: `0x${string}`;
}) {
  const payload = getTempoChargeCredentialPayload(input.credential);

  switch (payload.type) {
    case 'hash': {
      const client = getTempoClient(input.expectedChainId);
      const transaction = await getTransaction(client, {
        hash: asHex(payload.hash),
      });

      if (!isAddressEqual(transaction.from, input.expectedWalletAddress)) {
        throw new Error(
          'Tempo auth credential source does not match transaction sender',
        );
      }

      return;
    }
    case 'transaction': {
      const transaction = deserializeTempoTransaction(payload.signature);

      if (transaction.chainId !== input.expectedChainId) {
        throw new Error(
          `Tempo auth credential source does not match transaction chain.\n\tTransaction ChainId:\t${transaction.chainId}\n\tExpected ChainId:${input.expectedChainId}`,
        );
      }

      if (
        !isAddressEqual(
          getTempoTransactionSenderOrThrow(transaction),
          input.expectedWalletAddress,
        )
      ) {
        throw new Error(
          'Tempo auth credential source does not match transaction sender',
        );
      }

      return;
    }
    default:
      throw new Error('Unsupported Tempo auth credential type');
  }
}
