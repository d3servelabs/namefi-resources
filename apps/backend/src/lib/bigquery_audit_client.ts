import { BigQuery } from '@google-cloud/bigquery';
import { secrets } from './env';

export interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  tableId: string;
  useTableSuffix?: boolean;
  credentials?: Record<string, unknown>;
  keyFilename?: string;
}

export interface BigQueryResponse {
  rows: Array<{
    [key: string]: unknown;
  }>;
  totalRows: number;
}

export interface AuditLogFilters {
  resourceType?: string;
  resourceId?: string;
  actorType?: string;
  actorId?: string;
  action?: string;
  /** Inclusive lower bound (microseconds since epoch) */
  timestampGte?: number;
  /** Inclusive upper bound (microseconds since epoch) */
  timestampLte?: number;
}

export interface ListAuditLogsParams {
  filters?: AuditLogFilters;
  pageSize?: number; // max rows per page
  pageToken?: string; // base64-encoded offset cursor
  orderBy?: 'timestamp_desc' | 'timestamp_asc';
  serviceNames?: string[]; // filter by service names
  tableSuffixStart?: string; // YYYYMMDD, for wildcard audit log tables
  tableSuffixEnd?: string; // YYYYMMDD, for wildcard audit log tables
}

export interface ListAuditLogsResult extends BigQueryResponse {
  nextPageToken?: string;
}

type QueryParams = Record<string, unknown>;
type AuditPayloadRecord = Record<string, unknown>;

const DEFAULT_WILDCARD_LOOKBACK_DAYS = 7;
const MICROSECONDS_PER_MILLISECOND = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TABLE_SUFFIX_PATTERN = /^\d{8}$/;
const AUDIT_LOG_TABLE_PREFIX_PATTERN = /_$/;

function formatUtcTableSuffix(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function isRecord(value: unknown): value is AuditPayloadRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStringifiedJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return value;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function getFirstValue(record: AuditPayloadRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) {
      return record[key];
    }
  }

  return undefined;
}

function normalizeAuditTableId(tableId: string): string {
  if (tableId.includes('*')) {
    return tableId;
  }

  return AUDIT_LOG_TABLE_PREFIX_PATTERN.test(tableId) ? `${tableId}*` : tableId;
}

function jsonPayloadExpression(): string {
  return 'TO_JSON(jsonPayload)';
}

function jsonPayloadScalarExpression(keys: string[]): string {
  const payloadExpression = jsonPayloadExpression();
  const expressions = keys.map(
    (key) => `JSON_VALUE(${payloadExpression}, '$.${key}')`,
  );

  return expressions.length === 1
    ? expressions[0]
    : `COALESCE(${expressions.join(', ')})`;
}

function jsonPayloadValueExpression(keys: string[]): string {
  const payloadExpression = jsonPayloadExpression();
  const expressions = keys.map(
    (key) => `JSON_QUERY(${payloadExpression}, '$.${key}')`,
  );

  return expressions.length === 1
    ? expressions[0]
    : `COALESCE(${expressions.join(', ')})`;
}

function parsedJsonPayloadFieldExpression(keys: string[]): string {
  return `COALESCE(SAFE.PARSE_JSON(${jsonPayloadScalarExpression(
    keys,
  )}), ${jsonPayloadValueExpression(keys)})`;
}

function auditPayloadJsonExpression(): string {
  const payloadExpression = jsonPayloadExpression();

  return `TO_JSON_STRING(JSON_SET(
    ${payloadExpression},
    '$.actorextrainfo', ${parsedJsonPayloadFieldExpression([
      'actorExtraInfo',
      'actorextrainfo',
    ])},
    '$.extrainput', ${parsedJsonPayloadFieldExpression([
      'extraInput',
      'extrainput',
    ])},
    '$.metadata', ${parsedJsonPayloadFieldExpression(['metadata'])},
    '$.audit_record', ${parsedJsonPayloadFieldExpression(['audit_record'])}
  ))`;
}

function timestampExpression(): string {
  return `LAX_INT64(${jsonPayloadValueExpression(['timestamp'])})`;
}

function normalizeAuditPayload(value: unknown): AuditPayloadRecord | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(String(value)) as unknown;
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const decodedPayload: AuditPayloadRecord = {};
  for (const [key, fieldValue] of Object.entries(parsed)) {
    decodedPayload[key] =
      key.toLowerCase() === 'conninfo'
        ? fieldValue
        : parseStringifiedJson(fieldValue);
  }

  return {
    ...decodedPayload,
    id: getFirstValue(decodedPayload, ['id', 'ID']),
    actorType: getFirstValue(decodedPayload, ['actorType', 'actortype']),
    actorId: getFirstValue(decodedPayload, ['actorId', 'actorid']),
    actorExtraInfo: getFirstValue(decodedPayload, [
      'actorExtraInfo',
      'actorextrainfo',
    ]),
    resourceType: getFirstValue(decodedPayload, [
      'resourceType',
      'resourcetype',
    ]),
    resourceId: getFirstValue(decodedPayload, ['resourceId', 'resourceid']),
    action: getFirstValue(decodedPayload, ['action']),
    extraInput: getFirstValue(decodedPayload, ['extraInput', 'extrainput']),
    timestamp: getFirstValue(decodedPayload, ['timestamp']),
    metadata: getFirstValue(decodedPayload, ['metadata']),
    audit_record: getFirstValue(decodedPayload, ['audit_record']),
    conninfo: getFirstValue(decodedPayload, ['conninfo', 'connInfo']),
  };
}

export class BigQueryAuditClient {
  private client: BigQuery;
  private projectId: string;
  private datasetId: string;
  private useTableSuffix: boolean;
  private queryTableId: string;
  private fullTableName: string;

  constructor(config: BigQueryConfig) {
    this.projectId = config.projectId;
    this.datasetId = config.datasetId;
    this.useTableSuffix = config.useTableSuffix ?? false;
    this.queryTableId = this.useTableSuffix
      ? normalizeAuditTableId(config.tableId)
      : config.tableId;
    this.fullTableName = `${this.projectId}.${this.datasetId}.${this.queryTableId}`;

    this.client = new BigQuery({
      projectId: config.projectId,
      credentials: config.credentials,
      keyFilename: config.keyFilename,
      location: 'us-central1',
    });
  }

  isUsingTableSuffix(): boolean {
    return this.useTableSuffix && this.queryTableId.includes('*');
  }

  async executeQuery(
    query: string,
    params?: QueryParams,
  ): Promise<BigQueryResponse> {
    const [job] = await this.client.createQueryJob({
      query,
      params,
      location: 'us-central1',
    });

    const [rows] = await job.getQueryResults();

    return {
      rows: rows,
      totalRows: rows.length,
    };
  }

  private buildTableSuffixRange(params: ListAuditLogsParams): {
    start: string;
    end: string;
  } {
    const now = startOfUtcDay(new Date());
    const defaultStart = new Date(
      now.getTime() - (DEFAULT_WILDCARD_LOOKBACK_DAYS - 1) * DAY_MS,
    );
    let start = formatUtcTableSuffix(defaultStart);
    let end = formatUtcTableSuffix(now);

    if (
      params.tableSuffixStart &&
      TABLE_SUFFIX_PATTERN.test(params.tableSuffixStart)
    ) {
      start = params.tableSuffixStart;
    }
    if (
      params.tableSuffixEnd &&
      TABLE_SUFFIX_PATTERN.test(params.tableSuffixEnd)
    ) {
      end = params.tableSuffixEnd;
    }

    const timestampGte = params.filters?.timestampGte;
    const timestampLte = params.filters?.timestampLte;

    if (!params.tableSuffixStart && typeof timestampGte === 'number') {
      start = formatUtcTableSuffix(
        new Date(Math.floor(timestampGte / MICROSECONDS_PER_MILLISECOND)),
      );
    }
    if (!params.tableSuffixEnd && typeof timestampLte === 'number') {
      end = formatUtcTableSuffix(
        new Date(Math.floor(timestampLte / MICROSECONDS_PER_MILLISECOND)),
      );
    }

    if (
      !params.tableSuffixStart &&
      !params.tableSuffixEnd &&
      typeof timestampLte === 'number' &&
      typeof timestampGte !== 'number'
    ) {
      const endDate = new Date(
        Math.floor(timestampLte / MICROSECONDS_PER_MILLISECOND),
      );
      start = formatUtcTableSuffix(
        new Date(
          startOfUtcDay(endDate).getTime() -
            (DEFAULT_WILDCARD_LOOKBACK_DAYS - 1) * DAY_MS,
        ),
      );
    }

    return { start, end };
  }

  private buildWhereClause(params: ListAuditLogsParams): {
    where: string;
    queryParams: QueryParams;
  } {
    const { filters, serviceNames } = params;
    const conditions: string[] = [];
    const queryParams: QueryParams = {};

    if (this.isUsingTableSuffix()) {
      const suffixRange = this.buildTableSuffixRange(params);
      conditions.push(
        `_TABLE_SUFFIX BETWEEN '${suffixRange.start}' AND '${suffixRange.end}'`,
      );
    }

    if (serviceNames && serviceNames.length > 0) {
      conditions.push('resource.labels.service_name IN UNNEST(@serviceNames)');
      queryParams.serviceNames = serviceNames;
    }

    // The audit payload is in jsonPayload as a STRUCT, access fields with dot notation
    if (!filters) {
      return { where: conditions.join(' AND '), queryParams };
    }

    if (filters.resourceType) {
      conditions.push(
        `${jsonPayloadScalarExpression([
          'resourceType',
          'resourcetype',
        ])} = @resourceType`,
      );
      queryParams.resourceType = filters.resourceType;
    }
    if (filters.resourceId) {
      conditions.push(
        `${jsonPayloadScalarExpression(['resourceId', 'resourceid'])} = @resourceId`,
      );
      queryParams.resourceId = filters.resourceId;
    }
    if (filters.actorType) {
      conditions.push(
        `${jsonPayloadScalarExpression(['actorType', 'actortype'])} = @actorType`,
      );
      queryParams.actorType = filters.actorType;
    }
    if (filters.actorId) {
      conditions.push(
        `${jsonPayloadScalarExpression(['actorId', 'actorid'])} = @actorId`,
      );
      queryParams.actorId = filters.actorId;
    }
    if (filters.action) {
      conditions.push(`${jsonPayloadScalarExpression(['action'])} = @action`);
      queryParams.action = filters.action;
    }
    if (typeof filters.timestampGte === 'number') {
      conditions.push(`${timestampExpression()} >= @timestampGte`);
      queryParams.timestampGte = filters.timestampGte;
    }
    if (typeof filters.timestampLte === 'number') {
      conditions.push(`${timestampExpression()} <= @timestampLte`);
      queryParams.timestampLte = filters.timestampLte;
    }

    return { where: conditions.join(' AND '), queryParams };
  }

  async listAuditLogs(
    params: ListAuditLogsParams = {},
  ): Promise<ListAuditLogsResult> {
    const pageSize = Math.min(Math.max(params.pageSize ?? 50, 1), 1000);
    const orderBy = params.orderBy ?? 'timestamp_desc';

    // Use OFFSET as a simple cursor; encode/decode as base64 for transport
    const parsedOffset = params.pageToken
      ? Number.parseInt(
          Buffer.from(params.pageToken, 'base64').toString('utf8'),
          10,
        )
      : 0;
    const offset = Number.isFinite(parsedOffset)
      ? Math.max(parsedOffset, 0)
      : 0;

    const { where, queryParams } = this.buildWhereClause(params);
    const whereClause = where ? `WHERE ${where}` : '';

    // jsonPayload is a STRUCT with AuditRecord fields, use TO_JSON_STRING to preserve casing
    const query = `
      WITH base AS (
        SELECT
            resource.labels.service_name AS service_name,
            ${auditPayloadJsonExpression()} AS audit_payload_json,
            ${timestampExpression()} AS ts,
            ${jsonPayloadScalarExpression(['id', 'ID'])} AS id
        FROM 
          \`${this.fullTableName}\`
        ${whereClause}
      )
       SELECT *
       FROM base
       ORDER BY ts ${orderBy === 'timestamp_desc' ? 'DESC' : 'ASC'}, id ${
         orderBy === 'timestamp_desc' ? 'DESC' : 'ASC'
       }
       LIMIT ${pageSize + 1}
       OFFSET ${offset}
     `;

    const { rows } = await this.executeQuery(query, queryParams);

    // Parse the JSON string and map lowercase fields back to camelCase.
    const parsedRows = rows.map((row) => {
      return {
        ...row,
        audit_payload: row.audit_payload_json
          ? normalizeAuditPayload(row.audit_payload_json)
          : null,
      };
    });

    const hasMore = parsedRows.length > pageSize;
    const slicedRows = hasMore ? parsedRows.slice(0, pageSize) : parsedRows;
    const nextOffset = hasMore ? offset + pageSize : undefined;

    return {
      rows: slicedRows,
      totalRows: slicedRows.length,
      nextPageToken:
        typeof nextOffset === 'number'
          ? Buffer.from(String(nextOffset), 'utf8').toString('base64')
          : undefined,
    };
  }
}

const createBigQueryAuditClient = (
  config: BigQueryConfig,
): BigQueryAuditClient => {
  return new BigQueryAuditClient(config);
};

let client: ReturnType<typeof createBigQueryAuditClient> | undefined;

export function getBigQueryAuditClient() {
  if (client) return client;

  const projectId = secrets.BIGQUERY_PROJECT_ID;
  const datasetId = secrets.BIGQUERY_AUDIT_DATASET_ID;
  const tableId = secrets.BIGQUERY_AUDIT_TABLE_ID;

  if (!projectId || !datasetId || !tableId) {
    throw new Error(
      'Missing BigQuery Audit configuration. Set BIGQUERY_AUDIT_* or base BIGQUERY_* vars.',
    );
  }

  client = createBigQueryAuditClient({
    projectId,
    datasetId,
    tableId,
    useTableSuffix: secrets.BIGQUERY_AUDIT_USE_TABLE_SUFFIX,
    keyFilename: secrets.BIGQUERY_KEY_FILE_PATH,
  });
  return client;
}
