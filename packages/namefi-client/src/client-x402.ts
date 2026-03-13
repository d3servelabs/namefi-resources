import type { ClientOptions } from '@orpc/client';
import {
  buildX402PaymentSignatureHeader,
  getX402PaymentRequiredHeader,
  hasX402PaymentSignatureHeader,
  parseX402PaymentRequiredHeader,
  selectFirstExactAcceptedPayment,
  type X402AcceptedPayment,
  type X402PaymentPredicate,
  type X402PaymentPredicateContext,
  type X402PaymentRequired,
  type X402RequestContext,
  type X402Signer,
} from './x402';

type ClientX402Logger = {
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

export type NamefiClientFetch = (
  request: Request,
  init: {
    redirect?: Request['redirect'];
  },
  options: ClientOptions<NamefiClientContext>,
  path: readonly string[],
  input: unknown,
) => Promise<Response>;

export type CreateNamefiClientX402Options = {
  signer: X402Signer;
  shouldAcceptPayment?: X402PaymentPredicate;
  validAfterLeewaySeconds?: number;
};

export type NamefiClientContext = {
  x402?: {
    shouldAcceptPayment?: X402PaymentPredicate;
  };
};

export function createNamefiClientX402Fetch({
  x402,
  logger,
  nextFetch,
}: {
  x402?: CreateNamefiClientX402Options;
  logger?: ClientX402Logger;
  nextFetch: NamefiClientFetch;
}) {
  return (async (
    request: Request,
    init: {
      redirect?: Request['redirect'];
    },
    options: ClientOptions<NamefiClientContext>,
    path: readonly string[],
    input: unknown,
  ): Promise<Response> => {
    const firstAttemptRequest = new Request(request, {
      ...init,
      credentials: 'include',
    });
    const replayableRequest = firstAttemptRequest.clone();

    const firstResponse = await nextFetch(
      firstAttemptRequest,
      init,
      options,
      path,
      input,
    );

    if (!x402?.signer || firstResponse.status !== 402) {
      return firstResponse;
    }

    if (hasX402PaymentSignatureHeader(replayableRequest.headers)) {
      return firstResponse;
    }

    const paymentRequiredHeader = getX402PaymentRequiredHeader(
      firstResponse.headers,
    );

    if (!paymentRequiredHeader) {
      return firstResponse;
    }

    try {
      const paymentRequired = parseX402PaymentRequiredHeader(
        paymentRequiredHeader,
      );
      const acceptedPayment = selectFirstExactAcceptedPayment(paymentRequired);

      if (!acceptedPayment) {
        return firstResponse;
      }

      const signerAddress = await x402.signer.getAddress();
      const shouldRetry = await resolveShouldRetry({
        x402,
        options,
        signerAddress,
        path,
        input,
        request: replayableRequest,
        paymentRequired,
        acceptedPayment,
      });

      if (!shouldRetry) {
        return firstResponse;
      }

      const { paymentSignatureHeader } = await buildX402PaymentSignatureHeader({
        paymentRequired,
        acceptedPayment,
        signer: x402.signer,
        signerAddress,
        validAfterLeewaySeconds: x402.validAfterLeewaySeconds,
      });

      const replayHeaders = new Headers(replayableRequest.headers);
      replayHeaders.set('PAYMENT-SIGNATURE', paymentSignatureHeader);
      replayHeaders.set('X-PAYMENT-SIGNATURE', paymentSignatureHeader);

      logger?.info('Retrying request with x402 payment signature');

      return await nextFetch(
        new Request(replayableRequest, {
          headers: replayHeaders,
          credentials: 'include',
        }),
        init,
        options,
        path,
        input,
      );
    } catch (error) {
      logger?.error('Failed to process x402 payment-required response');
      logger?.error(error);
      return firstResponse;
    }
  }) satisfies NamefiClientFetch;
}

async function resolveShouldRetry({
  x402,
  options,
  signerAddress,
  path,
  input,
  request,
  paymentRequired,
  acceptedPayment,
}: {
  x402: CreateNamefiClientX402Options;
  options: ClientOptions<NamefiClientContext>;
  signerAddress: `0x${string}`;
  path: readonly string[];
  input: unknown;
  request: Request;
  paymentRequired: X402PaymentRequired;
  acceptedPayment: X402AcceptedPayment;
}): Promise<boolean> {
  const shouldAcceptPayment =
    options.context?.x402?.shouldAcceptPayment ?? x402?.shouldAcceptPayment;

  if (!shouldAcceptPayment) {
    return true;
  }

  return await shouldAcceptPayment({
    signer: x402.signer,
    signerAddress,
    request: {
      url: request.url,
      method: request.method,
      path,
      input,
    } satisfies X402RequestContext,
    paymentRequired,
    acceptedPayment,
  } satisfies X402PaymentPredicateContext);
}
