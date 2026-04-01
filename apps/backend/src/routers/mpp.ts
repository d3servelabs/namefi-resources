import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { TRPCError } from '@trpc/server';
import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { z } from 'zod';
import {
  buildMppPaymentRequiredResponse,
  getMppResourceMetadata,
  getRegisterDomainMppPaymentResult,
} from '#lib/mpp/helpers';
import {
  buildMppSignInPaymentRequiredResponse,
  getMppSignInResult,
} from '#lib/mpp/sign-in';
import { createMppInstantRegistration } from '#lib/mpp/register-domain';

const domainParamSchema = z.object({
  domain: namefiNormalizedDomainSchema,
});

const domainQuerySchema = z.object({
  nftReceivingWalletAddress: checksumWalletAddressSchema,
  years: z.coerce.number().int().min(1).max(10).default(1),
});

export const mppRouter = new Hono();

function throwAsHttpException(error: unknown): never {
  if (error instanceof HTTPException) {
    throw error;
  }

  if (error instanceof TRPCError) {
    const status =
      error.code === 'BAD_REQUEST'
        ? 400
        : error.code === 'CONFLICT'
          ? 409
          : error.code === 'FORBIDDEN'
            ? 403
            : 500;
    throw new HTTPException(status, { message: error.message });
  }

  throw new HTTPException(400, {
    message: error instanceof Error ? error.message : 'MPP request failed',
  });
}

mppRouter.get('/domain/:domain', async (c) => {
  const domainParam = domainParamSchema.safeParse({
    domain: c.req.param('domain'),
  });

  if (!domainParam.success) {
    throw new HTTPException(400, {
      message: `Invalid domain format: ${domainParam.error.message}`,
    });
  }

  const queryResult = domainQuerySchema.safeParse({
    nftReceivingWalletAddress: c.req.query('nftReceivingWalletAddress'),
    years: c.req.query('years') || c.req.query('durationInYears'),
  });

  if (!queryResult.success) {
    throw new HTTPException(400, {
      message: queryResult.error.message,
    });
  }

  try {
    const paymentResult = await getRegisterDomainMppPaymentResult({
      durationInYears: queryResult.data.years,
      nftReceivingWalletAddress: queryResult.data.nftReceivingWalletAddress,
      normalizedDomainName: domainParam.data.domain,
      request: c.req.raw,
    });

    if (paymentResult.status === 'payment_required') {
      return buildMppPaymentRequiredResponse({
        challenge: paymentResult.challenge,
        metadata: getMppResourceMetadata({
          durationInYears: queryResult.data.years,
          normalizedDomainName: domainParam.data.domain,
          nftReceivingWalletAddress: queryResult.data.nftReceivingWalletAddress,
          priceInUsdCents: paymentResult.priceInUsdCents,
        }),
      });
    }

    const result = await createMppInstantRegistration({
      credential: paymentResult.credential,
      durationInYears: queryResult.data.years,
      nftReceivingWalletAddress: queryResult.data.nftReceivingWalletAddress,
      normalizedDomainName: domainParam.data.domain,
      receipt: paymentResult.receipt,
      validation: paymentResult.validation,
    });

    return c.json(result);
  } catch (error) {
    throwAsHttpException(error);
  }
});

mppRouter.get('/sign-in', async (c) => {
  try {
    const result = await getMppSignInResult({
      request: c.req.raw,
    });

    if (result.status === 'payment_required') {
      return buildMppSignInPaymentRequiredResponse({
        challenge: result.challenge,
        metadata: result.metadata,
      });
    }

    return c.json(result);
  } catch (error) {
    throwAsHttpException(error);
  }
});
