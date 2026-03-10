import {
  type NamefiNormalizedDomain,
  fqdnLowercaseToNamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { fqdnLowercaseSchema, recordTypeEnum } from '@namefi-astra/zod-dns';
import { z } from 'zod';
import { dnsRecordTypeCodes } from '#lib/dns/record-type-codes';
import { createLogger } from '#lib/logger';
import type {
  DnsRequestQuery,
  ParseDnsQuestionResult,
} from './dns-request-handler.types';

const logger = createLogger({ context: 'DNS-Request-Question' });

const requestQuerySchema = z.object({
  name: z.union([
    fqdnLowercaseSchema,
    z
      .string()
      .startsWith('*.')
      .refine(
        (value) => fqdnLowercaseSchema.safeParse(value.slice(2)).success,
        {
          message: 'Wildcard domain must be a valid FQDN',
        },
      ),
  ]),
  type: z
    .string()
    .superRefine((value, ctx) => {
      if (Number.isNaN(Number(value))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Type must be a numeric DNS record type (1-255). Received: "${value}"`,
        });
      }
    })
    .transform(Number)
    .pipe(z.number().int().min(1).max(32769)),
});

function createValidationError(message: string): ParseDnsQuestionResult {
  return {
    ok: false,
    kind: 'error',
    error: {
      statusCode: 412,
      message,
    },
  };
}

export function parseDnsQuestion(
  query: DnsRequestQuery,
): ParseDnsQuestionResult {
  const requestQueryResult = requestQuerySchema.safeParse(query);

  if (!requestQueryResult.success) {
    return createValidationError(
      `Invalid parameters, expecting name and type but got errors. ${requestQueryResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')}`,
    );
  }

  const { name: rawName, type: rawType } = requestQueryResult.data;
  const qTypeString =
    rawType === dnsRecordTypeCodes.get('ANY')
      ? 'A'
      : dnsRecordTypeCodes.inverse.get(rawType as never);
  const qTypeEnumParseResult = recordTypeEnum.safeParse(qTypeString);

  if (!qTypeEnumParseResult.success) {
    if (qTypeString) {
      return {
        ok: false,
        kind: 'response',
        response: {
          RCODE: 0,
          Answer: [],
        },
      };
    }

    return createValidationError(`Invalid DNS record type: ${qTypeString}`);
  }

  let recordName: NamefiNormalizedDomain;
  let wildcard = false;

  try {
    if (rawName.startsWith('*.')) {
      recordName = fqdnLowercaseToNamefiNormalizedDomain(rawName.slice(2));
      wildcard = true;
    } else {
      recordName = fqdnLowercaseToNamefiNormalizedDomain(rawName);
    }
  } catch (error) {
    logger.trace({ error }, 'Domain normalisation failed');

    return createValidationError((error as Error).message);
  }

  return {
    ok: true,
    question: {
      rawName,
      rawType,
      recordName,
      recordType: qTypeEnumParseResult.data,
      wildcard,
    },
  };
}
