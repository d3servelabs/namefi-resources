import {
  NAMEFI_NFT_CONTRACT_ADDRESS,
  NFSC_CONTRACT_ADDRESS,
} from '@namefi-astra/utils';
import { Context } from '@temporalio/activity';
import * as workflow from '@temporalio/workflow';
import { BigNumber } from 'bignumber.js';
import {
  type Address,
  type EstimateGasErrorType,
  type GetGasPriceErrorType,
  type Hash,
  type PrepareTransactionRequestReturnType,
  type PublicClient,
  type SendTransactionErrorType,
  type WaitForTransactionReceiptErrorType,
  encodeFunctionData,
  formatUnits,
  getContract,
  parseUnits,
} from 'viem';
import { nftIdFromDomainName } from '#lib/nftHash';
import { resolve } from '../../utils/resolve';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';
import {
  getViemPublicClient,
  getViemWalletClient,
} from '#lib/crypto/viem-clients';

export type PreparedTxOnlySerializableParams = Omit<
  PrepareTransactionRequestReturnType,
  | 'account'
  | 'gas'
  | 'gasPrice'
  | 'maxFeePerGas'
  | 'maxPriorityFeePerGas'
  | 'blobVersionedHashes'
>;

export type TxPrepareResult =
  | { preparedTx: PreparedTxOnlySerializableParams }
  | { error: Error };
export type TxSendResult =
  | { status: 'SUCCESS'; txHash: Hash }
  | {
      status:
        | 'FAILED_TO_GET_NONCE'
        | 'FAILED_TO_SIGN_TRANSACTION'
        | 'FAILED_TO_SEND_TRANSACTION'
        | 'FAILED_TO_WAIT_FOR_TRANSACTION'
        | 'FAILED_TO_ESTIMATE_GAS'
        | 'FAILED_TO_GET_GAS_PRICE'
        | 'UNPREDICTABLE_GAS_LIMIT'
        | 'INSUFFICIENT_FUNDS'
        | 'NONCE_EXPIRED'
        | 'REPLACEMENT_UNDERPRICED'
        | 'GAS_PRICE_TOO_LOW';
      error: Error;
    };

const ABSOLUTE_MAX_GAS_PRICE_MULTIPLIER = 1.2;

export const prepareTxToMintNfsc = async (
  chainId: number,
  account: Address,
  amountInUsd: number,
): Promise<TxPrepareResult> => {
  const ctx = Context.current();
  ctx.log.info(
    `Minting NFSC - chainId: ${chainId}, account: ${account}, amountInUsd: ${amountInUsd}`,
  );

  const convertedAmount = parseUnits(amountInUsd.toString(), 18);

  const walletClient = await getViemWalletClient(chainId);
  const preparedTx = await walletClient.prepareTransactionRequest({
    chainId,
    to: NFSC_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: NfscAbi,
      functionName: 'mint',
      args: [account, convertedAmount],
    }),
  });
  return {
    preparedTx: {
      data: preparedTx.data,
      to: preparedTx.to,
      type: preparedTx.type,
      chainId: preparedTx.chainId,
      from: preparedTx.from,
      nonce: preparedTx.nonce,
      //gas: preparedTx.gas, // not-serializable
      //gasPrice: preparedTx.gasPrice,
      //maxFeePerGas: preparedTx.maxFeePerGas,
      //maxPriorityFeePerGas: preparedTx.maxPriorityFeePerGas,
    },
  };
};

export const prepareTxToMintNamefiNft = async (
  chainId: number,
  account: Address,
  domainNameLdh: string,
  expirationTimeInUnix: number,
): Promise<TxPrepareResult> => {
  const ctx = Context.current();
  ctx.log.info(
    `Minting Namefi NFT - chainId: ${chainId}, account: ${account}, domainNameLdh: ${domainNameLdh}, expirationTimeInUnix: ${expirationTimeInUnix}`,
  );

  const walletClient = await getViemWalletClient(chainId);
  const preparedTx = await walletClient.prepareTransactionRequest({
    chainId,
    to: NAMEFI_NFT_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: NftAbi,
      functionName: 'safeMintByNameNoCharge',
      args: [account, domainNameLdh, BigInt(expirationTimeInUnix)],
    }),
  });

  return {
    preparedTx: {
      data: preparedTx.data,
      to: preparedTx.to,
      type: preparedTx.type,
      chainId: preparedTx.chainId,
      from: preparedTx.from,
      nonce: preparedTx.nonce,
      //gas: preparedTx.gas, // not-serializable
      //gasPrice: preparedTx.gasPrice,
      //maxFeePerGas: preparedTx.maxFeePerGas,
      //maxPriorityFeePerGas: preparedTx.maxPriorityFeePerGas,
    },
  };
};

/**
 * Updates the prepared transaction with current nonce, gas limit, and gas price
 * @param _preparedTx The prepared transaction without gas parameters
 * @param chainId The chain ID
 * @param gasPriceMultiplier Optional multiplier for gas price (default: 1)
 * @returns Updated transaction parameters or error result
 */
const _updatePreparedTxParamsBeforeSend = async (
  _preparedTx: PreparedTxOnlySerializableParams,
  chainId: number,
  gasPriceMultiplier = 1,
): Promise<
  TxSendResult | { preparedTx: PrepareTransactionRequestReturnType }
> => {
  const ctx = Context.current();
  const walletClient = await getViemWalletClient(chainId);
  const publicClient = getViemPublicClient(chainId);

  const preparedTx = {
    ..._preparedTx,
    account: walletClient.account,
  } as PrepareTransactionRequestReturnType;

  //----------------------------------------
  // Get current nonce for the account
  //----------------------------------------
  const [nonceError, nonce] = await resolve(
    publicClient.getTransactionCount({
      address: walletClient.account.address,
    }),
  );
  if (nonceError) {
    const error = nonceError;
    ctx.log.error('Failed to get nonce - error:');
    ctx.log.error(JSON.stringify(error));
    return { status: 'FAILED_TO_GET_NONCE', error };
  }
  ctx.log.info(`Nonce: ${nonce}`);
  preparedTx.nonce = nonce;

  //----------------------------------------
  // Estimate gas limit for the transaction
  //----------------------------------------
  const [gasLimitError, gasLimit] = await resolve(
    publicClient.estimateGas(preparedTx),
  );

  if (gasLimitError) {
    const error = gasLimitError as EstimateGasErrorType;
    ctx.log.error(`Failed to estimate gas - error: ${error.message}`);
    ctx.log.error(JSON.stringify(error));
    return { status: 'UNPREDICTABLE_GAS_LIMIT', error };
  }
  ctx.log.info(`Gas limit: ${gasLimit}`);

  preparedTx.gas = gasLimit;

  //----------------------------------------
  // Get current gas price
  //----------------------------------------
  const [gasPriceError, gasPrice] = await resolve(publicClient.getGasPrice());

  if (gasPriceError) {
    const error = gasPriceError as GetGasPriceErrorType;
    ctx.log.error(`Failed to get gas price - error: ${error.message}`);
    ctx.log.error(JSON.stringify(error));
    return { status: 'FAILED_TO_GET_GAS_PRICE', error };
  }
  ctx.log.info(`Gas price: ${gasPrice}`);
  preparedTx.maxFeePerGas = multiplyBigIntByFraction(
    gasPrice,
    Math.min(gasPriceMultiplier, ABSOLUTE_MAX_GAS_PRICE_MULTIPLIER),
  );

  return { preparedTx };
};

/**
 * Signs and sends a transaction to the blockchain with retry logic for gas price
 * @param _preparedTx The prepared transaction without gas parameters
 * @param chainId The chain ID to send the transaction to
 * @param timeoutInMs Timeout in milliseconds for transaction confirmation (default: 30000)
 * @param gasPriceMultiplier Multiplier for gas price to handle network congestion (default: 1)
 * @returns Transaction result with status and hash or error details
 */
export const signAndSendTransaction = async (
  _preparedTx: PreparedTxOnlySerializableParams,
  chainId: number,
  timeoutInMs = 30000,
  gasPriceMultiplier = 1,
): Promise<TxSendResult> => {
  const ctx = Context.current();
  const walletClient = await getViemWalletClient(chainId);
  const publicClient = getViemPublicClient(chainId);

  const result = await _updatePreparedTxParamsBeforeSend(
    _preparedTx,
    chainId,
    gasPriceMultiplier,
  );
  if ('status' in result) {
    return result;
  }
  const { preparedTx } = result;

  //----------------------------------------
  // Sign Transaction
  //----------------------------------------
  //
  // TODO(Sami): investigate  "using sendRawTransaction with a signedTx was not working"
  //ctx.log.info(`Signing transaction - tx: ${SuperJSON.stringify(preparedTx)}`);
  //
  //const [signError, serializedTransaction] = await resolve(
  //  walletClient.signTransaction(preparedTx),
  //);
  //if (signError) {
  //  const error = signError as SignTransactionErrorType;
  //  ctx.log.error(`Failed to sign transaction - error: ${error.message}`);
  //  ctx.log.error(JSON.stringify(error));
  //  return { status: 'FAILED_TO_SIGN_TRANSACTION', error };
  //}
  //ctx.log.info(`Transaction signed - signedTx: ${serializedTransaction}`);

  //----------------------------------------
  // Send Transaction
  //----------------------------------------
  const [sendError, txHash] = await resolve(
    walletClient.sendTransaction({
      ...preparedTx,
    }),
  );
  if (sendError) {
    const error = sendError as SendTransactionErrorType;
    ctx.log.error(`Failed to send transaction - error: ${error.message}`);
    ctx.log.error(JSON.stringify(error));

    // determine if it's a known error
    if ('details' in error) {
      if (
        error.details === 'replacement transaction underpriced' ||
        ('details' in error.cause &&
          error.cause.details === 'replacement transaction underpriced')
      ) {
        return { status: 'REPLACEMENT_UNDERPRICED', error };
      }
      if (
        error.cause.name === 'NonceTooLowError' ||
        error.details.startsWith('nonce too low')
      ) {
        return { status: 'NONCE_EXPIRED', error };
      }
    }
    return { status: 'FAILED_TO_SEND_TRANSACTION', error };
  }
  ctx.log.info(`Transaction Sent - hash: ${txHash}`);

  const [waitError, _txReceipt] = await resolve(
    publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 3,
      timeout: timeoutInMs,
    }),
  );

  if (waitError) {
    const error = waitError as WaitForTransactionReceiptErrorType;
    ctx.log.error(`Failed to wait for transaction - error: ${error.message}`);
    ctx.log.error(JSON.stringify(error));
    return { status: 'FAILED_TO_WAIT_FOR_TRANSACTION', error };
  }
  return {
    status: 'SUCCESS',
    txHash,
  };
};

// Example of how to use these functions together
export const mintNFSC = async (
  chainId: number,
  account: Address,
  amountInUsd: number,
) => {
  const prepareResults = await prepareTxToMintNfsc(
    chainId,
    account,
    amountInUsd,
  );

  if ('error' in prepareResults) {
    throw prepareResults.error;
  }

  const { preparedTx } = prepareResults;

  return signAndSendTransaction(preparedTx, chainId);
};

export const getNfscBalanceInUSD = async (
  chainId: number,
  account: Address,
  publicClient: PublicClient = getViemPublicClient(chainId),
): Promise<number> => {
  const ctx = Context.current();
  ctx.log.info(
    `Getting NFSC balance - chainId: ${chainId}, account: ${account}`,
  );

  const nfscContract = getContract({
    address: NFSC_CONTRACT_ADDRESS,
    abi: NfscAbi,
    client: publicClient,
  });

  const balance = await nfscContract.read.balanceOf([account]);
  return Number(formatUnits(balance, 18));
};

function multiplyBigIntByFraction(
  bigInt: bigint | bigint,
  fractionalNumber: number,
): bigint {
  return BigInt(
    BigNumber(bigInt.toString()).multipliedBy(fractionalNumber).toFixed(0),
  );
}

/**
 * Prepare a transaction to charge NFSC
 * @param chainId - The chain ID
 * @param chargee - The account to charge
 * @param amountInUsd - The amount to charge in USD
 * @param reason - The reason for the charge
 * @param extra - Extra data to include in the charge
 * @returns The prepared transaction
 */
export async function prepareTxToChargeNfsc(
  chainId: number,
  chargee: `0x${string}`,
  amountInUsd: number,
  reason: string,
  extra: `0x${string}`,
): Promise<TxPrepareResult> {
  const ctx = Context.current();
  ctx.log.info(
    `Charging NFSC - chainId: ${chainId}, chargee: ${chargee}, amountInUsd: ${amountInUsd}`,
  );
  const walletClient = await getViemWalletClient(chainId);

  const charger = walletClient.account.address;

  const convertedAmount = parseUnits(amountInUsd.toString(), 18);

  const preparedTx = await walletClient.prepareTransactionRequest({
    chainId,
    to: NFSC_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: NfscAbi,
      functionName: 'charge',
      //address charger, address chargee, uint256 amount, string memory reason, bytes memory extra
      args: [charger, chargee, convertedAmount, reason, extra],
    }),
  });
  return {
    preparedTx: {
      data: preparedTx.data,
      to: preparedTx.to,
      type: preparedTx.type,
      chainId: preparedTx.chainId,
      from: preparedTx.from,
      nonce: preparedTx.nonce,
    },
  };
}

export const prepareTxToSetExpirationForNamefiNft = async (
  chainId: number,
  domainNameLdh: string,
  expirationTimeInUnix: number,
): Promise<TxPrepareResult> => {
  const ctx = Context.current();
  const tokenId = nftIdFromDomainName(domainNameLdh);

  ctx.log.info(
    `Setting expiration for Namefi NFT - chainId: ${chainId}, tokenId: ${tokenId}, domainNameLdh: ${domainNameLdh}, expirationTimeInUnix: ${expirationTimeInUnix}`,
  );
  const walletClient = await getViemWalletClient(chainId);
  if (!walletClient) {
    ctx.log.error(`Wallet client not found for chainId: ${chainId}`);
    throw workflow.ApplicationFailure.create({
      message: `Wallet client not found for chainId: ${chainId}`,
      nonRetryable: true,
    });
  }

  const preparedTx = await walletClient.prepareTransactionRequest({
    chainId,
    to: NAMEFI_NFT_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: NftAbi,
      functionName: 'setExpiration',
      args: [tokenId, BigInt(expirationTimeInUnix)],
    }),
  });

  return {
    preparedTx: {
      data: preparedTx.data,
      to: preparedTx.to,
      type: preparedTx.type,
      chainId: preparedTx.chainId,
      from: preparedTx.from,
      nonce: preparedTx.nonce,
    },
  };
};

export const prepareTxToLockNamefiNftByName = async (
  chainId: number,
  domainNameLdh: string,
): Promise<TxPrepareResult> => {
  const ctx = Context.current();

  ctx.log.info(
    `Locking Namefi NFT by name - chainId: ${chainId}, domainNameLdh: ${domainNameLdh}`,
  );
  const walletClient = await getViemWalletClient(chainId);
  if (!walletClient) {
    ctx.log.error(`Wallet client not found for chainId: ${chainId}`);
    throw workflow.ApplicationFailure.create({
      message: `Wallet client not found for chainId: ${chainId}`,
      nonRetryable: true,
    });
  }

  const preparedTx = await walletClient.prepareTransactionRequest({
    chainId,
    to: NAMEFI_NFT_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: NftAbi,
      functionName: 'lockByName',
      args: [domainNameLdh],
    }),
  });

  return {
    preparedTx: {
      data: preparedTx.data,
      to: preparedTx.to,
      type: preparedTx.type,
      chainId: preparedTx.chainId,
      from: preparedTx.from,
      nonce: preparedTx.nonce,
    },
  };
};
