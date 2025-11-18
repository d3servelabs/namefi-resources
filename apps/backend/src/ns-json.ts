// Router for NS JSON

import {
  db,
  dnsRecordsTable,
  namefiNftOwnersCte,
  namefiNftOwnersView,
} from '@namefi-astra/db';
import {
  type NamefiNormalizedDomain,
  fqdnLowercaseToNamefiNormalizedDomain,
} from '@namefi-astra/utils';
import type { RecordType } from '@namefi-astra/zod-dns';
import { fqdnLowercaseSchema, recordTypeEnum } from '@namefi-astra/zod-dns';
import { and, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { isNotEmpty, isNotNil } from 'ramda';
import { z } from 'zod';
import { createLogger } from '#lib/logger';
import { dnsRecordTypeCodes } from './lib/dns/record-type-codes';
import type { DnsResponse, DnsTable } from './lib/dns/types';
import { getAnswerForDnsQueryFromPreferences } from './lib/domains/domain-preferences';
import { matchAny } from '@namefi-astra/utils/match';
import { config } from '#lib/env';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';

const nsJsonRouter = new Hono();

const _logger = createLogger({ context: 'NS-JSON' });

nsJsonRouter.get('/healthz', (c) => c.json({ message: 'OK' }));

const USE_MOCK_DNS_TABLE = false;

const requestQuerySchema = z.object({
  name: fqdnLowercaseSchema,
  type: z
    .string()
    .superRefine((val, ctx) => {
      if (Number.isNaN(Number(val))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Type must be a numeric DNS record type (1-255). Received: "${val}"`,
        });
      }
    })
    .transform(Number)
    .pipe(z.number().int().min(1).max(32769)),
});

// Define route handler for DNS API endpoint
//
// Note: to test this endpoint, you can use the following curl command:
// curl -X GET 'http://localhost:3000/v1/ns-json?name=example.com.&type=1' # Mocked response
// curl -X GET 'http://localhost:3000/v1/ns-json?name=test.com.&type=1' # Response from Astra DB
nsJsonRouter.get('/', async (c) => {
  _logger.assign({ query: c.req.query() });
  // get qname and qtype from query params
  if (c.req.query('name') === '041.ai.') {
    _logger.assign({ heartbeat: true });
  }
  const requestQueryResult = requestQuerySchema.safeParse(c.req.query());

  if (!requestQueryResult.success) {
    c.status(400);
    return c.json({
      error: 'Bad Request',
      message: `Invalid parameters, expecting name and type but got errors. ${requestQueryResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')}`,
    });
  }

  const { name: qname, type: qtype } = requestQueryResult.data;

  // convert qtype to RecordType (string enum)
  const qTypeString = dnsRecordTypeCodes.inverse.get(qtype);
  const qTypeEnumParseResult = recordTypeEnum.safeParse(qTypeString);

  if (!qTypeEnumParseResult.success) {
    if (qTypeString) {
      return c.json({
        RCODE: 0,
        Answer: [],
      });
    }
    c.status(400);
    return c.json({
      error: 'Bad Request',
      message: `Invalid DNS record type: ${qTypeString}`,
    });
  }

  const qTypeEnum = qTypeEnumParseResult.data;
  let recordName: NamefiNormalizedDomain;
  try {
    recordName = fqdnLowercaseToNamefiNormalizedDomain(qname);
  } catch (err) {
    _logger.warn({ err }, 'Domain normalisation failed');
    c.status(400);
    return c.json({
      error: 'Bad Request',
      message: (err as Error).message,
    });
  }

  const response = await getAnswerForDnsQuery(recordName, qTypeEnum);
  _logger.trace({ response }, 'Response from getAnswerForDnsQuery');
  if (response) {
    return c.json(response);
  }

  if (USE_MOCK_DNS_TABLE) {
    const response = await getAnswerForDnsQueryMock(recordName, qTypeEnum);
    if (response) {
      return c.json(response);
    }
  }
  _logger.info({
    error: new Error('Not Found'),
    message: 'No DNS record found for domain',
  });

  return c.json({
    RCODE: 0,
    Answer: [],
  });
});

// fallback route when not captured
// biome-ignore lint/suspicious/useAwait: to be added
nsJsonRouter.use('/*', async (c) => {
  _logger.assign({ query: c.req.query() });
  _logger.error(`Unhandled request: ${c.req.method} ${c.req.url}`);
  c.status(404);
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

export { nsJsonRouter };

export const getAnswerForDnsQuery = async (
  recordName: NamefiNormalizedDomain,
  qTypeEnum: RecordType,
) => {
  const result: DnsResponse = {
    RCODE: undefined,
    Answer: [],
  };

  const nsAndSoaRecords = await getNsAndSoaRecords(recordName, qTypeEnum);
  if (isNotNil(nsAndSoaRecords)) {
    if (isNotNil(nsAndSoaRecords.RCODE)) {
      return nsAndSoaRecords;
    }
    if (
      isNotNil(nsAndSoaRecords.Answer) &&
      isNotEmpty(nsAndSoaRecords.Answer)
    ) {
      result.Answer = [...(result.Answer ?? []), ...nsAndSoaRecords.Answer];
    }
  }

  const answerFromPreferences = await getAnswerForDnsQueryFromPreferences(
    recordName,
    qTypeEnum,
  );
  _logger.trace({ answerFromPreferences }, 'Answer from preferences');

  if (answerFromPreferences) {
    if (isNotNil(answerFromPreferences.RCODE)) {
      return answerFromPreferences;
    }
    if (
      isNotNil(answerFromPreferences.Answer) &&
      isNotEmpty(answerFromPreferences.Answer)
    ) {
      result.Answer = [
        ...(result.Answer ?? []),
        ...answerFromPreferences.Answer,
      ];
    }
  }

  const records = await db.query.dnsRecordsTable.findMany({
    where: and(
      eq(
        /**
         * This combines the name and zoneName into a single string.
         * it also handles the case where the name is '@'
         * | name | zoneName    | result          |
         * | ---- | ----------- | --------------- |
         * | @    | example.com | example.com     |
         * | www  | example.com | www.example.com |
         * */
        sql`ARRAY_TO_STRING( ARRAY[ CASE WHEN ${dnsRecordsTable.name} = '@' THEN NULL ELSE lower(${dnsRecordsTable.name}) END, lower(${dnsRecordsTable.zoneName})], '.')`,
        recordName,
      ),
      eq(dnsRecordsTable.type, qTypeEnum),
    ),
  });

  _logger.trace({ records }, 'Records');

  result.Answer = [
    ...(result.Answer ?? []),
    ...records.map((record) => ({
      name: recordName,
      type: dnsRecordTypeCodes.get(record.type) as number,
      TTL: record.ttl,
      data: record.rdata,
    })),
  ];

  if (isNotNil(result.Answer) && isNotEmpty(result.Answer)) {
    return {
      ...result,
      RCODE: 0,
    };
  }

  return null;
};

const mockDnsTable: DnsTable = {
  'example.com.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 mail.example.com',
  },
  '0x801.click.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 0x801.click',
  },
  '1.0x801.click.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 1.0x801.click',
    [dnsRecordTypeCodes.get('TXT') as number]: 'abcd',
  },
  '0x002.click.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 0x002.click',
  },
};

/**
 * Mocked DNS table for testing
 * @param qname - The name of the DNS record
 * @param qtypeEnum - The type of the DNS record
 * @returns The DNS response
 */
export const getAnswerForDnsQueryMock = (
  qname: string,
  qtypeEnum: RecordType,
) => {
  const qtype = dnsRecordTypeCodes.get(qtypeEnum);
  if (!qtype) {
    return null;
  }
  _logger.assign({ query: { name: qname, type: qtype } });
  const record = mockDnsTable[qname]?.[qtype];
  if (!record) {
    return null;
  }
  _logger.info({ foundRecord: record }, `Found DNS record ${qname} ${qtype}`);

  const result: DnsResponse = {
    RCODE: 0,
    Answer: [
      {
        name: qname,
        type: qtype,
        TTL: 300,
        data: mockDnsTable[qname][qtype],
      },
    ],
    Question: [
      {
        name: qname,
        type: qtype,
      },
    ],
  };

  return result;
};

export async function getNsAndSoaRecords(
  recordName: NamefiNormalizedDomain,
  qTypeEnum: RecordType,
) {
  _logger.assign({ query: { name: recordName, type: qTypeEnum } });
  if (!matchAny(qTypeEnum, 'NS', 'SOA')) {
    _logger.trace(
      { recordName, qTypeEnum },
      'Not returning NS and SOA records',
    );
    return null;
  }
  const parsedDomainName = parseDomainName(recordName);
  if (
    !parsedDomainName.valid ||
    parsedDomainName.registryType !== 'traditional'
  ) {
    return null;
  }
  const isPoweredByNamefi = (await getPoweredByNamefi3PDomains()).includes(
    recordName,
  );
  _logger.trace({ isPoweredByNamefi, recordName }, 'Is powered by namefi ?');
  if (!isPoweredByNamefi) {
    // if not powered by namefi, check if the domain has a nft hence it should has a zone (ie; NS and SOA records)
    const nft = await db
      .with(namefiNftOwnersCte)
      .select()
      .from(namefiNftOwnersView)
      .where(eq(namefiNftOwnersView.normalizedDomainName, recordName))
      .limit(1);
    if (!nft[0]) {
      _logger.trace({ recordName }, 'No NFT found');
      return null;
    }
    _logger.trace({ nft: nft[0], recordName }, 'NFT found');
  }

  _logger.trace({ recordName, qTypeEnum }, 'Returning NS and SOA records');

  const nsRecords = config.NAMEFI_ASTRA_NAMESERVERS.map((ns) => ({
    name: recordName,
    type: dnsRecordTypeCodes.get('NS') as number,
    TTL: 300,
    data: ns,
  }));

  const soaRecord = [
    {
      name: recordName,
      type: dnsRecordTypeCodes.get('SOA') as number,
      TTL: 300,
      data: `${config.NAMEFI_ASTRA_NAMESERVERS[0]} ${config.NAMEFI_ASTRA_NAMESERVERS[0].replace(/^.*?\./, 'admin.')} 2023080901 60 30 300 60`,
    },
  ];
  // for NS, we return the NS records and SOA record
  // for SOA, we return the SOA record
  return {
    RCODE: 0,
    Answer: qTypeEnum === 'NS' ? nsRecords : soaRecord,
  };
}
