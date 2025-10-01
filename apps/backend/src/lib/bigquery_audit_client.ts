import { BigQuery } from '@google-cloud/bigquery';
import { secrets } from './env';

export interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  tableId: string;
  credentials?: Record<string, unknown>;
  keyFilename?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
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
}

export interface ListAuditLogsResult extends BigQueryResponse {
  nextPageToken?: string;
}

export class BigQueryAuditClient {
  private client: BigQuery;
  private projectId: string;
  private datasetId: string;
  private tableId: string;
  private fullTableName: string;

  constructor(config: BigQueryConfig) {
    this.projectId = config.projectId;
    this.datasetId = config.datasetId;
    this.tableId = config.tableId;
    this.fullTableName = `${this.projectId}.${this.datasetId}.${this.tableId}`;

    this.client = new BigQuery({
      projectId: config.projectId,
      credentials: config.credentials,
      keyFilename: config.keyFilename,
      location: 'us-central1',
    });
  }

  private formatDateForBigQuery(dateStr: string): string {
    // Convert GA4 date format to BigQuery date format
    if (dateStr === 'today') {
      return 'CURRENT_DATE()';
    }
    if (dateStr === 'yesterday') {
      return 'DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)';
    }
    if (dateStr.endsWith('daysAgo')) {
      const days = Number.parseInt(dateStr.replace('daysAgo', ''));
      return `DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
    }
    // Assume YYYY-MM-DD format
    return `'${dateStr}'`;
  }

  private buildDateFilter(dateRange: DateRange): string {
    const startDate = this.formatDateForBigQuery(dateRange.startDate);
    const endDate = this.formatDateForBigQuery(dateRange.endDate);

    return `event_date BETWEEN ${startDate} AND ${endDate}`;
  }

  async executeQuery(query: string): Promise<BigQueryResponse> {
    const [job] = await this.client.createQueryJob({
      query,
      location: 'us-central1',
    });

    const [rows] = await job.getQueryResults();

    return {
      rows: rows,
      totalRows: rows.length,
    };
  }

  private buildWhereClause(
    filters?: AuditLogFilters,
    serviceNames?: string[],
  ): string {
    const conditions: string[] = [];

    // Filter by service names if provided
    if (serviceNames && serviceNames.length > 0) {
      const serviceList = serviceNames.map((s) => `'${s}'`).join(', ');
      conditions.push(`resource.labels.service_name IN (${serviceList})`);
    }

    // The audit payload is in jsonPayload as a STRUCT, access fields with dot notation
    if (!filters) return conditions.join(' AND ');

    if (filters.resourceType) {
      conditions.push(`jsonPayload.resourceType = '${filters.resourceType}'`);
    }
    if (filters.resourceId) {
      conditions.push(`jsonPayload.resourceId = '${filters.resourceId}'`);
    }
    if (filters.actorType) {
      conditions.push(`jsonPayload.actorType = '${filters.actorType}'`);
    }
    if (filters.actorId) {
      conditions.push(`jsonPayload.actorId = '${filters.actorId}'`);
    }
    if (filters.action) {
      conditions.push(`jsonPayload.action = '${filters.action}'`);
    }
    if (typeof filters.timestampGte === 'number') {
      conditions.push(
        `CAST(jsonPayload.timestamp AS INT64) >= ${filters.timestampGte}`,
      );
    }
    if (typeof filters.timestampLte === 'number') {
      conditions.push(
        `CAST(jsonPayload.timestamp AS INT64) <= ${filters.timestampLte}`,
      );
    }

    return conditions.join(' AND ');
  }

  async listAuditLogs(
    params: ListAuditLogsParams = {},
  ): Promise<ListAuditLogsResult> {
    const pageSize = Math.min(Math.max(params.pageSize ?? 50, 1), 1000);
    const orderBy = params.orderBy ?? 'timestamp_desc';

    // Use OFFSET as a simple cursor; encode/decode as base64 for transport
    const offset = params.pageToken
      ? Number.parseInt(
          Buffer.from(params.pageToken, 'base64').toString('utf8'),
        ) || 0
      : 0;

    const where = this.buildWhereClause(params.filters, params.serviceNames);
    const whereClause = where ? `WHERE ${where}` : '';

    // jsonPayload is a STRUCT with AuditRecord fields, use TO_JSON_STRING to preserve casing
    const query = `
      WITH base AS (
        SELECT
          resource.labels.service_name AS service_name,
          TO_JSON_STRING(jsonPayload) AS audit_payload_json,
          CAST(jsonPayload.timestamp AS INT64) AS ts,
          jsonPayload.id AS id
        FROM 
          \`${this.fullTableName}\`
        ${whereClause}
      )
      SELECT *
      FROM base
      ORDER BY ts ${orderBy === 'timestamp_desc' ? 'DESC' : 'ASC'}
      LIMIT ${pageSize + 1}
      OFFSET ${offset}
    `;

    const { rows } = await this.executeQuery(query);

    // Parse the JSON string and map lowercase fields back to camelCase
    const parsedRows = rows.map((row: any) => {
      let payload = null;

      if (row.audit_payload_json) {
        try {
          const parsed = JSON.parse(row.audit_payload_json);

          // Map lowercase BigQuery fields back to camelCase
          payload = {
            id: parsed.id || parsed.ID,
            actorType: parsed.actorType || parsed.actortype,
            actorId: parsed.actorId || parsed.actorid,
            actorExtraInfo: parsed.actorExtraInfo || parsed.actorextrainfo,
            resourceType: parsed.resourceType || parsed.resourcetype,
            resourceId: parsed.resourceId || parsed.resourceid,
            action: parsed.action,
            extraInput: parsed.extraInput || parsed.extrainput,
            timestamp: parsed.timestamp,
            metadata: parsed.metadata,
            audit_record: parsed.audit_record,
          };
        } catch (e) {
          console.error('Failed to parse audit_payload_json:', e);
          payload = null;
        }
      }

      return {
        ...row,
        audit_payload: payload,
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
    keyFilename: secrets.BIGQUERY_KEY_FILE_PATH,
  });
  return client;
}
