import { z } from 'zod';
import { secrets } from '../lib/env';

const historicSetExpirationCallSchema = z.object({
  blockNumber: z.coerce.bigint(),
  blockTimestamp: z.coerce.number(),
  chainId: z.coerce.number(),
  newExpirationTime: z.coerce.bigint(),
  previousExpirationTime: z.coerce.bigint(),
  normalizedDomainName: z.string(),
  timestamp: z.coerce.date(),
  tokenId: z.string(),
  transactionHash: z.string(),
  source: z.enum(['set_expiration_trace_call', 'mint', 'event']),
});

export type HistoricSetExpirationCall = z.infer<
  typeof historicSetExpirationCallSchema
>;

export async function getHistoricSetExpirationCallsBeforeEventAdded({
  chainId,
}: {
  chainId: number;
}): Promise<HistoricSetExpirationCall[] | undefined> {
  const baseurl = 'https://endpoint.sentio.xyz/d3serve-labs/namefi-indexer/';
  const url = new URL(
    'domain_expiration_update_before_event_was_added',
    baseurl,
  );
  url.searchParams.set('cache_policy.ttl_secs', '0');
  url.searchParams.set('cache_policy.refresh_ttl_secs', '0');
  url.searchParams.set('size', '0');
  url.searchParams.set('engine', 'ULTRA');
  url.searchParams.set('version', '0');

  const urlString = url.toString();

  const data = {
    chainId: chainId.toString(),
  };
  const method = 'POST';
  const headers = {
    'api-key': secrets.SENTIO_API_KEY,
  };

  const response = await fetchSentioData(urlString, method, data, headers);

  if (!response?.syncSqlResponse?.result?.rows) {
    return [];
  }
  return z
    .array(historicSetExpirationCallSchema)
    .parse(response.syncSqlResponse.result.rows);
}
async function fetchSentioData(
  url: string,
  method: string,
  data: object,
  headers: Record<string, string>,
) {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: method === 'GET' ? undefined : JSON.stringify(data),
  })
    .then((response) => {
      return response.json() as Promise<
        SentioResponse<HistoricSetExpirationCall>
      >;
    })
    .catch((error) => {
      // Handle the error
      console.error('Error:', error);
    });
}

type SentioResponse<T> = {
  syncSqlResponse: {
    runtimeCost: string;
    result: {
      columns: (keyof T)[];
      columnTypes: Record<string, string>;
      rows: T[];
      generatedAt: string; // ISO 8601
    };
    computeStats: {
      computedAt: string; // ISO 8601
      computeCostMs: string;
      binaryVersionHash: string;
      computedBy: string;
    };
  };
};
