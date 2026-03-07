/**
 * x402 Signer Activities
 *
 * Activities for handling x402 blockchain transactions (USDC transfers for refunds).
 * These run on the MINT task queue for proper transaction handling.
 */

import {
  encodeFunctionData,
  parseAbi,
  type EstimateGasErrorType,
  type GetGasPriceErrorType,
  type PrepareTransactionRequestReturnType,
  type SendTransactionErrorType,
  type WaitForTransactionReceiptErrorType,
} from 'viem';
import { Context } from '@temporalio/activity';
import { BigNumber } from 'bignumber.js';
import { resolve } from '../../utils/resolve';
import {
  getX402WalletClient,
  getX402PublicClient,
  getUsdcContractAddress,
} from '#lib/crypto/x402-viem-clients';
import type {
  TxPrepareResult,
  TxSendResult,
  PreparedTxOnlySerializableParams,
} from './mint/mint.activities';

const ERC20_TRANSFER_ABI = parseAbi([
  'function transfer(address recipient, uint256 amount) external returns (bool)',
]);
const ABSOLUTE_MAX_GAS_PRICE_MULTIPLIER = 1.2;

function multiplyBigIntByFraction(
  bigInt: bigint | bigint,
  fractionalNumber: number,
): bigint {
  return BigInt(
    BigNumber(bigInt.toString()).multipliedBy(fractionalNumber).toFixed(0),
  );
}

/**
 * Prepare a transaction to transfer USDC for x402 refund
 *
 * Following the pattern from mint.activities.ts, this prepares the transaction
 * without sending it, allowing the workflow to handle retries with gas adjustments.
 *
 * @param chainId - The chain ID (from CAIP-2 network)
 * @param toAddress - The recipient address (buyer wallet)
 * @param amountInUsdCents - Amount to transfer in USD cents
 * @returns Prepared transaction or error
 */
export async function prepareTxToTransferUsdc(
  chainId: number,
  toAddress: `0x${string}`,
  amountInUsdCents: number,
): Promise<TxPrepareResult> {
  const ctx = Context.current();
  ctx.log.info(
    `Preparing USDC transfer - chainId: ${chainId}, to: ${toAddress}, amountInUsdCents: ${amountInUsdCents}`,
  );

  const usdcAddress = getUsdcContractAddress(chainId);

  // USDC has 6 decimals, convert cents to atomic units
  // cents * 10_000 = atomic units (e.g., 100 cents = 1_000_000 = 1 USDC)
  const amountInAtomicUnits = BigInt(amountInUsdCents * 10_000);

  const walletClient = await getX402WalletClient(chainId);

  const preparedTx = await walletClient.prepareTransactionRequest({
    chainId,
    to: usdcAddress,
    data: encodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [toAddress, amountInAtomicUnits],
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

/**
 * Updates the prepared transaction with current nonce, gas limit, and gas price
 * for x402 transactions
 */
const _updateX402PreparedTxParamsBeforeSend = async (
  _preparedTx: PreparedTxOnlySerializableParams,
  chainId: number,
  gasPriceMultiplier = 1,
): Promise<
  TxSendResult | { preparedTx: PrepareTransactionRequestReturnType }
> => {
  const ctx = Context.current();
  const walletClient = await getX402WalletClient(chainId);
  const publicClient = getX402PublicClient(chainId);

  const preparedTx = {
    ..._preparedTx,
    account: walletClient.account,
  } as PrepareTransactionRequestReturnType;

  // Get current nonce for the account
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

  // Estimate gas limit for the transaction
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

  // Get current gas price
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
 * Signs and sends a x402 transaction to the blockchain with retry logic for gas price
 *
 * Uses the x402 signer wallet (configured via X402_SIGNER_* secrets) to send transactions.
 * This is used for USDC refunds where we need to transfer USDC back to the buyer.
 *
 * @param _preparedTx The prepared transaction without gas parameters
 * @param chainId The chain ID to send the transaction to
 * @param timeoutInMs Timeout in milliseconds for transaction confirmation (default: 30000)
 * @param gasPriceMultiplier Multiplier for gas price to handle network congestion (default: 1)
 * @returns Transaction result with status and hash or error details
 */
export const signAndSendX402Transaction = async (
  _preparedTx: PreparedTxOnlySerializableParams,
  chainId: number,
  timeoutInMs = 30000,
  gasPriceMultiplier = 1,
): Promise<TxSendResult> => {
  const ctx = Context.current();
  const walletClient = await getX402WalletClient(chainId);
  const publicClient = getX402PublicClient(chainId);

  const result = await _updateX402PreparedTxParamsBeforeSend(
    _preparedTx,
    chainId,
    gasPriceMultiplier,
  );
  if ('status' in result) {
    return result;
  }
  const { preparedTx } = result;

  // Send Transaction
  const [sendError, txHash] = await resolve(
    walletClient.sendTransaction({
      ...preparedTx,
    }),
  );
  if (sendError) {
    const error = sendError as SendTransactionErrorType;
    ctx.log.error(`Failed to send transaction - error: ${error.message}`);
    ctx.log.error(JSON.stringify(error));

    // Determine if it's a known error
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
