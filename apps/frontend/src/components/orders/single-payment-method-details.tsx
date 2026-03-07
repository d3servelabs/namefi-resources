import { useMemo } from 'react';
import { getChain } from '@namefi-astra/utils/chains';
import { getShortAddress } from '@/lib/string';
import { StatusBadge } from '@/components/status-badge';
import type { PaymentSelect } from '@namefi-astra/db/types';
import type { AppRouterOutput } from '@/lib/trpc';
import { ExternalLink } from 'lucide-react';

type PaymentMethodDetails =
  AppRouterOutput['orders']['getOrderPaymentMethodsDetails'][number];

/**
 * Get block explorer URL for a given network and transaction hash
 */
function getBlockExplorerUrl(network: string, txHash: string): string | null {
  if (network === 'eip155:8453') {
    return `https://basescan.org/tx/${txHash}`;
  }
  if (network === 'eip155:84532') {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }
  return null;
}

/**
 * Get network display name from CAIP-2 format
 */
function getNetworkName(network: string): string {
  if (network === 'eip155:8453') {
    return 'Base';
  }
  if (network === 'eip155:84532') {
    return 'Base Sepolia';
  }
  return network;
}

export function SinglePaymentMethodDetails({
  payment,
  paymentMethodDetails,
}: {
  payment: PaymentSelect;
  paymentMethodDetails: PaymentMethodDetails;
}) {
  const isCreditCardPayment = useMemo(
    () => payment.paymentProvider === 'STRIPE',
    [payment.paymentProvider],
  );

  const isX402Payment = useMemo(
    () => payment.paymentProvider === 'X402',
    [payment.paymentProvider],
  );

  const primaryPaymentMethod = paymentMethodDetails;
  const creditCardPreviewText = useMemo(() => {
    if (!isCreditCardPayment || !primaryPaymentMethod) {
      return '-';
    }

    if (
      !(
        !primaryPaymentMethod.isOnChainPayment &&
        primaryPaymentMethod.brand &&
        primaryPaymentMethod.last4
      )
    ) {
      return 'Credit Card';
    }

    return `${primaryPaymentMethod.brand.toLocaleUpperCase()}(${primaryPaymentMethod.last4})`;
  }, [isCreditCardPayment, primaryPaymentMethod]);

  const nfscPaymentPreviewText = useMemo(() => {
    if (isCreditCardPayment || isX402Payment) {
      return '';
    }

    if (!payment.nfscPaymentDetails) {
      return '-';
    }

    const chain = getChain(payment.nfscPaymentDetails.chainId);
    const chainName =
      chain?.name || `Chain ID ${payment.nfscPaymentDetails.chainId}`;
    return `(${chainName}) ${getShortAddress(payment.nfscPaymentDetails.walletAddress)}`;
  }, [isCreditCardPayment, isX402Payment, payment.nfscPaymentDetails]);

  const x402PaymentPreview = useMemo(() => {
    if (!isX402Payment || !payment.x402PaymentDetails) {
      return null;
    }

    const { network, buyerWalletAddress, settlementTxHash } =
      payment.x402PaymentDetails;
    const networkName = getNetworkName(network);
    const shortAddress = getShortAddress(buyerWalletAddress);
    const explorerUrl = settlementTxHash
      ? getBlockExplorerUrl(network, settlementTxHash)
      : null;

    return {
      networkName,
      shortAddress,
      explorerUrl,
      settlementTxHash,
    };
  }, [isX402Payment, payment.x402PaymentDetails]);

  // Determine currency display
  const currencyDisplay = useMemo(() => {
    if (isCreditCardPayment) {
      return '  USD';
    }
    if (isX402Payment) {
      return 'USDC';
    }
    return 'NFSC';
  }, [isCreditCardPayment, isX402Payment]);

  return (
    <div className="flex flex-row gap-2 items-center">
      {isCreditCardPayment ? (
        <span className="font-medium text-muted-foreground text-sm">
          {creditCardPreviewText}
        </span>
      ) : isX402Payment && x402PaymentPreview ? (
        <span className="font-medium text-muted-foreground text-sm inline-flex items-center gap-1">
          ({x402PaymentPreview.networkName}) {x402PaymentPreview.shortAddress}
          {x402PaymentPreview.explorerUrl && (
            <a
              href={x402PaymentPreview.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center"
              title="View transaction"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </span>
      ) : (
        <span className="font-medium text-muted-foreground text-sm">
          {nfscPaymentPreviewText}
        </span>
      )}
      {payment.status && (
        <div className="scale-90">
          <StatusBadge status={payment.status} type="payment" />
        </div>
      )}
      <span className="w-[8ch] text-end whitespace-pre">
        ${payment.amountInUSDCents / 100} {currencyDisplay}
      </span>
    </div>
  );
}
