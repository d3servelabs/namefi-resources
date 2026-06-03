import { randomUUID } from 'node:crypto';
import { logger } from './logger';
import superjson from 'superjson';

/**
 * Audit record actor classification.
 */
export type AuditActorType = 'admin' | 'system' | 'user';

/**
 * Audit record actor extra information.
 */
export type AuditActorExtraInfo = {
  /** The ip address of the actor */
  ipAddress: string;
  /** The user agent of the actor */
  userAgent: string;
  /** The referer of the actor */
  referer: string;
  /** The url of the actor */
  url: string;
  /** The method of the actor */
  method: string;
  /** The request id of the actor */
  requestId?: string;
} & {
  type: 'user';
  /** The session id of the actor */
  sessionId?: string;
  /** The user id of the actor */
  userId?: string;
} & Record<string, unknown>;

export const ResourceType = {
  USER: 'user',
  DOMAIN: 'domain',
  ORDER: 'order',
  TRANSACTION: 'transaction',
  WORKFLOW: 'workflow',
  SCHEDULED_WORKFLOW: 'scheduled_workflow',
  PBN_DOMAIN: 'pbn_domain',
  FREE_CLAIM: 'free_domain_claim',
  CART: 'cart',
  CART_ITEM: 'cart_item',
  ORDER_ITEM: 'order_item',
  DNS_RECORD: 'dns_record',
  PAYMENT_METHOD: 'payment_method',
  LINK_SHARE: 'link_share',
  NFSC: 'nfsc',
  BULK_BURN: 'bulk_burn',
  EPP_TESTING: 'epp_testing',
  DOMAIN_EXPORT: 'domain_export',
  DNS_CACHE: 'dns_cache',
  AI_CREDIT_AWARD: 'ai_credit_award',
  ANNOUNCEMENT: 'announcement',
  OTHER: 'other',
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

/**
 * Canonical audit record captured for compliance and analytics.
 *
 * id: A stable, sortable identifier in the form `nowInMicroseconds_uuid`.
 *   - Creation method: `${epochMicroseconds}_${uuidV4}`
 *   - Normalization: epoch time is derived from system clock in microseconds; UUID is RFC4122 v4.
 * timestamp: Unix epoch time in microseconds for easier cross-system ordering.
 */
export type AuditRecord = {
  /** `nowInMicroseconds_uuid` */
  id: string;
  /** The type of actor that performed the action */
  actorType: AuditActorType;
  /** The id of the actor that performed the action */
  actorId: string;
  /** Extra information about the actor */
  actorExtraInfo?: AuditActorExtraInfo;
  /** Domain-specific resource type, e.g. "domain", "user", "order" */
  resourceType: ResourceType;
  /** Unique identifier of the resource in the source system */
  resourceId: string;
  /** Action performed, e.g. "create", "update", "delete" */
  action: string;
  /** Arbitrary extra input related to the action (non-sensitive where possible) */
  extraInput: any;
  /** Unix epoch time in microseconds */
  timestamp: number;
};

/**
 * JSON log payload shape emitted when `audit_record: true` is present.
 * The `metadata` field is intended to carry all existing log bindings/data
 * (request ids, session info, feature flags, etc.).
 */
export type AuditLogJsonPayload = AuditRecord & {
  audit_record: true;
} & {
  metadata: Record<string, unknown>;
};

/**
 * Returns current Unix epoch time in microseconds.
 */
export function getNowInMicroseconds(): number {
  return Math.trunc(Date.now() * 1000);
}

/**
 * Generates an audit id in the form `nowInMicroseconds_uuid`.
 * Creation method: `${getNowInMicroseconds()}_${randomUUID()}`.
 */
export function generateAuditId(): string {
  return `${getNowInMicroseconds()}_${randomUUID()}`;
}

export type CreateAuditRecordParams = Omit<AuditRecord, 'id' | 'timestamp'> & {
  id?: string;
  timestamp?: number;
};
/**
 * Builds a canonical `AuditRecord`, generating id and timestamp if omitted.
 */
export function createAuditRecord(
  params: CreateAuditRecordParams,
): AuditRecord {
  const id = params.id ?? generateAuditId();
  const timestamp = params.timestamp ?? getNowInMicroseconds();
  return {
    id,
    actorType: params.actorType,
    actorId: params.actorId,
    actorExtraInfo: _onlyRecordType<AuditRecord['actorExtraInfo']>(
      _safeJson(params.actorExtraInfo),
    ),
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    action: params.action,
    extraInput: _onlyRecordType(_safeJson(params.extraInput)),
    timestamp,
  };
}

/**
 * Shapes an `AuditRecord` into the log payload expected by sinks/consumers.
 * Provide `metadata` to include current logger bindings or request context.
 */
export function asAuditLogPayload(
  record: AuditRecord,
  metadata: Record<string, unknown> = {},
): AuditLogJsonPayload {
  return {
    ...record,
    audit_record: true,
    metadata: _safeJson(metadata),
  };
}

/**
 * Emits an audit log entry to the logger sink. Prefer this over direct logger usage.
 * Returns the record for convenience (e.g., tests, chaining).
 */
export function audit(
  record: AuditRecord,
  metadata: Record<string, unknown> = {},
): AuditRecord {
  logger.info(asAuditLogPayload(record, metadata));
  logger.info({
    ...record,
    extraInput: JSON.stringify(_safeJson(record.extraInput)),
    actorExtraInfo: JSON.stringify(_safeJson(record.actorExtraInfo)),
    metadata: JSON.stringify(_safeJson(metadata)),
    stringified_audit_record: true,
  });
  return record;
}

function _safeJson(value: any) {
  if (value === undefined || value === null) {
    return '';
  }
  let result: any = null;
  try {
    result = JSON.parse(JSON.stringify(value));

    if (typeof value === 'object' && Array.isArray(value)) {
      result = { array: result }; // due to bigquery error `Array specified for non-repeated field: extrainput.`
    }
  } catch (error) {
    console.warn('Error serializing value to JSON', error);
  }

  if (!result) {
    try {
      result = superjson.serialize(value).json;
    } catch (error) {
      console.warn('Error serializing value to SuperJSON', error);
    }
  }

  return result ?? { error: 'unserializable', value: String(value) };
}

function _onlyRecordType<T extends Record<string, unknown> | undefined>(
  value: any,
): T {
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return { type: 'array', array: value } as unknown as T;
    }
    return Object.keys(value).length > 0 ? value : ({} as T);
  }
  return { type: typeof value, value } as unknown as T;
}
