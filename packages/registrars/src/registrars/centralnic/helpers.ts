/** biome-ignore-all lint/correctness/useParseIntRadix: x */
/** biome-ignore-all lint/suspicious/noExplicitAny: x */
import type { z } from 'zod';
import { toPunycodeFqdn, type PunycodeDomainName } from '#lib/data/validations';
import {
  DomainAvailability,
  type DomainPricingDetails,
  type DomainRegistration,
  DomainOwnershipOperation,
  type PricingDetails,
  type RdapDomainStatus,
  OperationStatus,
  OperationType,
  type DnssecKey,
  type Nameservers,
  type DomainContacts,
  singleYearPricingTemplate,
  RenewOption,
  type DomainContactsPrivacy,
  DomainContactPrivacyEnum,
  type DnssecAlgorithms,
  type DnssecDigestType,
  type DnssecFlags,
  type PendingTransferInfo,
  type TransferStatus,
} from '#lib/data';
import type {
  DomainQueryResult,
  LongRunningOperationResult,
} from '#lib/abstract-registrar/types';
import type {
  EppResponseTypeXml,
  EppResultCode,
  Result,
  SendResult,
} from '@namefi-astra/epp-client';
import {
  // Zod schemas for validation
  DomainChkDataTypeXml,
  DomainInfDataTypeXml,
  DomainCreDataTypeXml,
  DomainRenDataTypeXml,
  DomainTrnDataTypeXml,
  FeeChkDataTypeXml,
  type EppEnvelopeXml,
  EppError,
  EppUnknownError,
  EppTransportError,
  EppObjectNotFoundError,
  createEppError,
  EppValidationError,
} from '@namefi-astra/epp-client';
import { isEppSuccessCode, EPP_NAMESPACES } from './types';
import { noCase } from 'change-case';

// ============ Type Definitions from Schemas ============

type DomainChkData = z.infer<typeof DomainChkDataTypeXml>;
type DomainInfData = z.infer<typeof DomainInfDataTypeXml>;
type DomainCreData = z.infer<typeof DomainCreDataTypeXml>;
type DomainRenData = z.infer<typeof DomainRenDataTypeXml>;
type DomainTrnData = z.infer<typeof DomainTrnDataTypeXml>;
type FeeChkData = z.infer<typeof FeeChkDataTypeXml>;

// ============ Text Value Extraction Helpers ============

/**
 * Extract text value from a field that can be either a string or { '#text': string }.
 * This is a common pattern in XML->JSON conversion.
 */
function extractText<S extends string>(
  value: S | { '#text': S } | undefined,
): S | undefined {
  if (value === undefined || value === null) return undefined;
  return typeof value === 'object' && '#text' in value ? value['#text'] : value;
}

/**
 * Safely parse a value from a union of string | object with default.
 */
function extractOptionalText<S extends string, D extends string>(
  value: S | { '#text': S } | undefined,
  defaultValue: D = '' as D,
): S | D {
  return extractText<S>(value) ?? defaultValue;
}

// ============ EPP Response Structure Helpers ============

/**
 * Get the EPP response object from a SendResult.
 * Handles the standardized namespace-prefixed structure.
 */
function getEppResponse(
  data: SendResult<EppEnvelopeXml>,
): EppResponseTypeXml | undefined {
  const response = data.response;
  const eppRoot = response?.['epp:epp'];
  return eppRoot && 'epp:response' in eppRoot
    ? eppRoot['epp:response']
    : undefined;
}

/**
 * Extract the result code from an EPP response.
 */
export function getResultCode(
  data: SendResult<EppEnvelopeXml>,
): EppResultCode | undefined {
  const response = getEppResponse(data);
  const results = response?.['epp:result'] as Array<Record<string, unknown>>;
  const result = results?.[0];
  if (!result) return undefined;

  const code = result['@_code'];
  if (!code) return undefined;
  const parsed = Number.parseInt(String(code), 10);
  return Number.isFinite(parsed) ? (parsed as EppResultCode) : undefined;
}

/**
 * Extract the result message from an EPP response.
 */
export function getResultMessage(data: SendResult<EppEnvelopeXml>): string {
  const response = getEppResponse(data);
  const results = response?.['epp:result'];
  const result = results?.[0];
  if (!result) return 'Unknown EPP error';

  const msg = result['epp:msg'] as { '#text': string } | undefined;
  return extractOptionalText(msg, 'EPP error');
}

/**
 * Extract resData from an EPP response.
 */
export function getResData(data: SendResult<EppEnvelopeXml>) {
  const response = getEppResponse(data);
  return response?.['epp:resData'];
}

/**
 * Extract extension data from an EPP response.
 */
function getExtensionData(data: SendResult<EppEnvelopeXml>) {
  const response = getEppResponse(data);
  return response?.['epp:extension'];
}

// ============ Operation ID Generation ============

const RADIX = 32;
const ID_SEP = ':::';

/**
 * Generate a random nonce of specified length.
 */
function getNonce(length: number): string {
  return new Array(length)
    .fill(0)
    .map(() => Math.round(Math.random() * 9))
    .join('');
}

type ExtraData = Record<OperationType, any> & {};

/**
 * Generate a deterministic, parsable operation ID.
 * Format: operationType:::domainName:::timestamp(base32):::nonce:::extraData(base64)
 */
export function generateOperationId(
  operationType: OperationType,
  domainName: PunycodeDomainName,
  extraData?: NoInfer<ExtraData[OperationType]>,
): string {
  return Buffer.from(
    [
      operationType,
      domainName,
      Date.now().toString(RADIX),
      getNonce(4),
      Buffer.from(JSON.stringify(extraData ?? {})).toString('base64'),
    ].join(ID_SEP),
  ).toString('base64');
}

/**
 * Parse an operation ID into its components.
 */
export function parseOperationId(operationId: string): {
  operationType: OperationType;
  domainName: string;
  timestamp: number;
  nonce: string;
  extraData: NoInfer<ExtraData[OperationType]> | null;
} {
  const utf8 = Buffer.from(operationId, 'base64').toString('utf-8');
  const parts = utf8.split(ID_SEP);
  if (parts.length !== 5) {
    throw new Error('Invalid operation ID format');
  }

  let extraData: Record<string, unknown> | null = null;
  try {
    extraData = JSON.parse(Buffer.from(parts[4], 'base64').toString('utf-8'));
  } catch {
    // Invalid JSON, leave as null
  }

  return {
    operationType: parts[0] as OperationType,
    domainName: parts[1],
    timestamp: Number.parseInt(parts[2], RADIX),
    nonce: parts[3],
    extraData,
  };
}

/**
 * Validate if a string is a valid operation ID.
 */
export function isValidOperationId(operationId: string): boolean {
  try {
    parseOperationId(operationId);
    return true;
  } catch {
    return false;
  }
}

// ============ Result Handling ============

/**
 * Wrap an EPP result and handle errors uniformly.
 */
export function handleEppResult<T>(
  result: Result<SendResult<EppEnvelopeXml>, string | undefined>,
  parser: (data: SendResult<EppEnvelopeXml>) => T,
): T {
  if (!result.ok) {
    const msg = result.error?.message ?? 'EPP request failed';
    const reason = result.error?.reason ?? 'unknown';
    const cause = result.error?.cause;
    // The transport layer wraps socket failures in typed EppErrors; rethrow
    // them so the registrar error factory can classify by type instead of
    // string-matching the message.
    if (cause instanceof EppError) {
      throw cause;
    }
    if (reason === 'transport') {
      throw new EppTransportError(`EPP error (${reason}): ${msg}`, cause);
    }
    throw new EppUnknownError(`EPP error (${reason}): ${msg}`, result.error);
  }

  const code = getResultCode(result.data);

  if (code !== undefined && !isEppSuccessCode(code)) {
    const message = getResultMessage(result.data);

    throw createEppError({
      message,
      resultCode: code,
    });
  }

  return parser(result.data);
}

// ============ Fee Extension Helpers ============

/**
 * Parse fee extension check data using FeeChkDataTypeXml schema.
 */
function parseFeeCheckData(
  extensionData: Record<string, unknown> | undefined,
  query: string,
): DomainPricingDetails | null {
  if (!extensionData) return null;

  const feeChkData = extensionData['fee:chkData'];
  if (!feeChkData) return null;

  const parsed = FeeChkDataTypeXml.safeParse(feeChkData);
  if (!parsed.success) {
    return null;
  }

  const cdList = parsed.data['fee:cd'];
  const cdItem = cdList.find((cd) => {
    const objId = cd['fee:objID'];
    const name = extractText(objId);
    return name?.toLowerCase() === query.toLowerCase();
  });

  if (!cdItem) return null;

  const commands = cdItem['fee:command'] ?? [];
  const prices: Record<string, number> = {};

  for (const cmd of commands) {
    const cmdName = cmd['@_name'];
    const fees = cmd['fee:fee'] ?? [];
    const total = fees.reduce((sum, fee) => {
      const amount = extractText(fee);
      return sum + (Number.parseFloat(amount ?? '') || 0);
    }, 0);
    prices[cmdName] = total;
  }

  return {
    registrationPrice: singleYearPricingTemplate(prices.create ?? 0),
    renewalPrice: singleYearPricingTemplate(prices.renew ?? 0),
    importPrice: singleYearPricingTemplate(prices.transfer ?? 0),
  };
}

// ============ Domain Check Response Parsing ============

/**
 * Parse domain:check response using DomainChkDataTypeXml schema.
 */
export function parseDomainCheckResponse(
  data: SendResult<EppEnvelopeXml>,
  query: string,
): DomainQueryResult {
  const resData = getResData(data);
  const extensionData = getExtensionData(data);

  const defaultResult: DomainQueryResult = {
    domainName: query as PunycodeDomainName,
    available: DomainAvailability.UNAVAILABLE,
    price: null,
    isPremium: false,
    supported: true,
  };

  if (!resData) return defaultResult;
  if (!('domain:chkData' in resData)) {
    return defaultResult;
  }

  const chkData = resData['domain:chkData'];
  if (!chkData) return defaultResult;

  const parsed = DomainChkDataTypeXml.safeParse(chkData);
  if (!parsed.success) {
    return defaultResult;
  }

  // Find the matching domain in the cd array
  const cdList = parsed.data['domain:cd'];
  const cdItem = cdList.find((cd) => {
    const nameField = cd['domain:name'];
    const domainName = extractText(nameField);
    return domainName?.toLowerCase() === query.toLowerCase();
  });

  if (!cdItem) return defaultResult;

  // Extract availability from the @_avail attribute
  const nameField = cdItem['domain:name'];
  const avail =
    typeof nameField === 'object' ? nameField['@_avail'] : undefined;
  const isAvailable = avail === '1' || avail === 'true';

  // Parse fee extension data if present
  const pricing = parseFeeCheckData(extensionData, query);

  return {
    domainName: query as PunycodeDomainName,
    available: isAvailable
      ? DomainAvailability.AVAILABLE
      : DomainAvailability.UNAVAILABLE,
    price: pricing,
    isPremium: false,
    supported: true,
  };
}

/**
 * Parse domain:check response for multiple domains.
 */
export function parseMultipleDomainCheckResponse(
  data: SendResult<EppEnvelopeXml>,
  queries: string[],
): DomainQueryResult[] {
  return queries.map((query) => parseDomainCheckResponse(data, query));
}

// ============ Domain Info Response Parsing ============

/**
 * Create an empty DomainContacts structure.
 */
function createEmptyContacts(): DomainContacts {
  return {
    registrantContact: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      addressLines: [],
      city: '',
      state: '',
      zipCode: '',
      countryCode: 'US',
    },
  };
}

/**
 * Create default contacts privacy.
 */
function createDefaultPrivacy(): DomainContactsPrivacy {
  return {
    registrantContact: DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
  };
}

/**
 * Parse domain:info response using DomainInfDataTypeXml schema.
 */
export function parseDomainInfoResponse(
  data: SendResult<EppEnvelopeXml>,
  ownerToValidate?: string,
): DomainRegistration {
  const resData = getResData(data);
  const response = getEppResponse(data);
  if (!resData) {
    throw new EppValidationError(
      'Invalid domain:info response - missing resData',
    );
  }

  const infData = safePropAccess('domain:infData', resData);

  if (ownerToValidate) {
    assertOwner(ownerToValidate, infData);
  }
  const extData = safePropAccess('epp:extension', response);
  const secData = safePropAccess('secDNS:infData', extData);
  const dsData = safePropAccess('secDNS:dsData', secData);
  if (!infData) {
    throw new EppValidationError(
      'Invalid domain:info response - missing infData',
    );
  }

  const parsed = DomainInfDataTypeXml.safeParse(infData);
  if (!parsed.success) {
    throw new EppValidationError(
      `Invalid domain:info response - schema validation failed: ${parsed.error.message}`,
    );
  }

  const info = parsed.data;

  // Extract domain name
  const name = extractText(info['domain:name']);

  // Extract dates
  const crDate = extractOptionalText(info['domain:crDate']);
  const exDate = extractOptionalText(info['domain:exDate']);

  // Parse nameservers from domain:ns (handles union of hostObj or hostAttr variants)
  const ns = info['domain:ns'];
  let nameservers: Nameservers = [];
  if (ns && 'domain:hostObj' in ns) {
    const hostObjs = ns['domain:hostObj'];
    nameservers = hostObjs.map((h: string | { '#text': string }) =>
      toPunycodeFqdn(extractOptionalText(h)),
    );
  }

  return {
    domainName: name as PunycodeDomainName,
    expirationTime: exDate ? new Date(exDate) : new Date(),
    creationTime: crDate ? new Date(crDate) : new Date(),
    autoRenewOption: RenewOption.MANUAL,
    nameservers,
    contacts: createEmptyContacts(),
    contactsPrivacy: createDefaultPrivacy(),
    supportsDnssec: true,
    dnssecKeys: dsData?.map((ds) => ({
      flags: Number.parseInt(
        extractOptionalText(ds['secDNS:keyData']?.['secDNS:flags']),
      ) as DnssecFlags,
      algorithm: Number.parseInt(
        extractOptionalText(ds['secDNS:alg']),
      ) as DnssecAlgorithms,
      digestType: Number.parseInt(
        extractOptionalText(ds['secDNS:digestType']),
      ) as DnssecDigestType,
      digest: extractOptionalText(ds['secDNS:digest']),
      keyTag: Number.parseInt(extractOptionalText(ds['secDNS:keyTag'])),
      publicKey: extractOptionalText(ds['secDNS:keyData']?.['secDNS:pubKey']),
    })),
  };
}

/**
 * Extract raw EPP statuses from domain info response.
 */
export function extractEppStatuses(data: SendResult<EppEnvelopeXml>): string[] {
  const resData = getResData(data);
  if (!resData) return [];

  const infData = safePropAccess('domain:infData', resData);
  if (!infData) return [];

  const parsed = DomainInfDataTypeXml.safeParse(infData);
  if (!parsed.success) return [];

  const statusList = parsed.data['domain:status'] ?? [];
  return statusList
    .map((s) => (typeof s === 'object' ? s['@_s'] : String(s)))
    .filter((s): s is string => s !== undefined && s !== null);
}

/**
 * Extract authInfo from domain info response.
 */
export function extractAuthInfo(data: SendResult<EppEnvelopeXml>): string {
  const resData = getResData(data);
  if (!resData) return '';

  const infData = safePropAccess('domain:infData', resData);
  if (!infData) return '';

  const parsed = DomainInfDataTypeXml.safeParse(infData);
  if (!parsed.success) return '';

  const authInfo = parsed.data['domain:authInfo'];
  if (!authInfo) return '';

  // authInfo can be either { 'domain:pw': ... } or { 'domain:ext': ... }
  if ('domain:pw' in authInfo) {
    const pw = authInfo['domain:pw'];
    return extractOptionalText(pw);
  }
  return '';
}

/**
 * Map EPP domain statuses to RDAP status format (string array).
 */
export function mapEppStatusToRdap(statuses: string[]): RdapDomainStatus {
  return statuses.map((status) => noCase(status));
}

// ============ Operation Response Parsers ============

/**
 * Map DomainOwnershipOperation to fee command name.
 */
export function mapOperationToFeeCommand(op: DomainOwnershipOperation) {
  switch (op) {
    case DomainOwnershipOperation.REGISTER:
      return 'create';
    case DomainOwnershipOperation.RENEW:
      return 'renew';
    case DomainOwnershipOperation.TRANSFER:
      return 'transfer';
    default:
      return 'create';
  }
}

/**
 * Parse create response using DomainCreDataTypeXml schema.
 */
export function parseCreateResponse(
  data: SendResult<EppEnvelopeXml>,
  type: OperationType,
  domainName: PunycodeDomainName,
): LongRunningOperationResult {
  const code = getResultCode(data);
  if (!code || !isEppSuccessCode(code)) {
    return {
      operationId: generateOperationId(type, domainName),
      status: OperationStatus.FAILED,
      type,
      message: getResultMessage(data),
      response: null,
    };
  }

  const isPending = code === 1001;

  const resData = getResData(data);
  const creData = safePropAccess('domain:creData', resData);

  let response: DomainCreData | null = null;
  if (creData) {
    const parsed = DomainCreDataTypeXml.safeParse(creData);
    if (parsed.success) {
      response = parsed.data;
    }
  }

  return {
    operationId: generateOperationId(type, domainName),
    status: isPending
      ? OperationStatus.IN_PROGRESS
      : OperationStatus.SUCCESSFUL,
    type,
    message: getResultMessage(data),
    response,
  };
}

/**
 * Parse renew response using DomainRenDataTypeXml schema.
 */
export function parseRenewResponse(
  data: SendResult<EppEnvelopeXml>,
  domainName: PunycodeDomainName,
): LongRunningOperationResult {
  const code = getResultCode(data);
  const isPending = code === 1001;
  const success = code ? isEppSuccessCode(code) : false;
  const status = success
    ? isPending
      ? OperationStatus.IN_PROGRESS
      : OperationStatus.SUCCESSFUL
    : OperationStatus.FAILED;

  const resData = getResData(data);
  const renData = safePropAccess('domain:renData', resData);

  let response: DomainRenData | null = null;
  if (renData) {
    const parsed = DomainRenDataTypeXml.safeParse(renData);
    if (parsed.success) {
      response = parsed.data;
    }
  }

  return {
    operationId: generateOperationId(OperationType.RENEW_DOMAIN, domainName, {
      status,
    }),
    status,
    type: OperationType.RENEW_DOMAIN,
    message: getResultMessage(data),
    response,
  };
}

/**
 * Parse transfer response using DomainTrnDataTypeXml schema.
 */
export function parseTransferResponse(
  data: SendResult<EppEnvelopeXml>,
  domainName: PunycodeDomainName,
): LongRunningOperationResult {
  const code = getResultCode(data);
  const isPending = code === 1001;

  const resData = getResData(data);
  const trnData = safePropAccess('domain:trnData', resData);

  let response: DomainTrnData | null = null;
  if (trnData) {
    const parsed = DomainTrnDataTypeXml.safeParse(trnData);
    if (parsed.success) {
      response = parsed.data;
    }
  }

  return {
    operationId: generateOperationId(
      OperationType.TRANSFER_IN_DOMAIN,
      domainName,
    ),
    status: isPending
      ? OperationStatus.IN_PROGRESS
      : OperationStatus.SUCCESSFUL,
    type: OperationType.TRANSFER_IN_DOMAIN,
    message: getResultMessage(data),
    response,
  };
}

/**
 * Parse transfer response using DomainTrnDataTypeXml schema.
 */
export function parseTransferQueryResponse(data: SendResult<EppEnvelopeXml>) {
  const code = getResultCode(data);
  //todo
  const resData = getResData(data);
  const trnData = safePropAccess('domain:trnData', resData);

  let response: DomainTrnData | null = null;
  if (trnData) {
    const parsed = DomainTrnDataTypeXml.safeParse(trnData);
    if (parsed.success) {
      response = parsed.data;
    }
  }
  if (!response) throw new EppValidationError('Invalid response');

  const status = extractOptionalText(response['domain:trStatus']);
  const isPending = status === 'pending';
  const approved = status === 'clientApproved' || status === 'serverApproved';
  const rejected = status === 'clientRejected' || status === 'serverRejected';

  return {
    isPending,
    isApproved: approved,
    isRejected: rejected,
    message: getResultMessage(data),
    response,
  };
}

/**
 * Parse transfer query response into PendingTransferInfo.
 * Returns null if no transfer data or if transfer is not pending.
 */
export function parsePendingTransferInfo(
  data: SendResult<EppEnvelopeXml>,
  domainName: string,
): PendingTransferInfo | null {
  const resData = getResData(data);
  const trnData = safePropAccess('domain:trnData', resData);

  if (!trnData) {
    return null;
  }

  const parsed = DomainTrnDataTypeXml.safeParse(trnData);
  if (!parsed.success) {
    return null;
  }

  const response = parsed.data;
  const status = extractOptionalText(
    response['domain:trStatus'],
  ) as TransferStatus;

  // Extract dates and registrar IDs
  const requestingRegistrarId = extractOptionalText(response['domain:reID']);
  const requestDateStr = extractOptionalText(response['domain:reDate']);
  const actionRegistrarId = extractOptionalText(response['domain:acID']);
  const actionDateStr = extractOptionalText(response['domain:acDate']);
  const expirationDateStr = extractOptionalText(response['domain:exDate']);

  return {
    domainName,
    status,
    requestingRegistrarId,
    requestDate: new Date(requestDateStr),
    actionRegistrarId,
    actionDate: new Date(actionDateStr),
    expirationDate: expirationDateStr ? new Date(expirationDateStr) : undefined,
  };
}

/**
 * Parse update response (no specific response data schema, just status).
 */
export function parseUpdateResponse(
  data: SendResult<EppEnvelopeXml>,
  type: OperationType,
  domainName: PunycodeDomainName,
): LongRunningOperationResult {
  const code = getResultCode(data);
  const isPending = code === 1001;

  return {
    operationId: generateOperationId(type, domainName),
    status: isPending
      ? OperationStatus.IN_PROGRESS
      : OperationStatus.SUCCESSFUL,
    type,
    message: getResultMessage(data),
    response: null,
  };
}

/**
 * Parse fee extension response for pricing.
 */
export function parseFeeResponse(
  data: SendResult<EppEnvelopeXml>,
  operation: DomainOwnershipOperation,
): PricingDetails {
  const extensionData = getExtensionData(data);
  if (!extensionData) {
    return singleYearPricingTemplate(0);
  }

  const feeChkData = safePropAccess('fee:chkData', extensionData);
  if (!feeChkData) {
    return singleYearPricingTemplate(0);
  }

  const parsed = FeeChkDataTypeXml.safeParse(feeChkData);
  if (!parsed.success) {
    return singleYearPricingTemplate(0);
  }

  const cdList = parsed.data['fee:cd'];
  const cd = cdList[0];
  if (!cd) {
    return singleYearPricingTemplate(0);
  }

  const cmdName = mapOperationToFeeCommand(operation);
  const commands = cd['fee:command'] ?? [];

  for (const cmd of commands) {
    if (cmd['@_name'] === cmdName || cmd['@_name'].includes(cmdName)) {
      const fees = cmd['fee:fee'] ?? [];
      const total = fees.reduce((sum, fee) => {
        const amount = extractOptionalText(fee);
        return sum + (Number.parseFloat(amount) || 0);
      }, 0);
      return singleYearPricingTemplate(total);
    }
  }

  return singleYearPricingTemplate(0);
}

// ============ Auth Code Generation ============

function _randomPick<S extends string | any[]>(
  source: S,
): S extends string ? string : any {
  if (Array.isArray(source)) {
    return source[Math.floor(Math.random() * source.length)];
  }
  return source.charAt(Math.floor(Math.random() * source.length));
}

/**
 * Generate a random auth code for domain creation/transfer.
 */
export function generateAuthCode(): string {
  const length = 16;
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numericChars = '0123456789';
  const specialChars = '!@#$%^&*';
  const chars = upperChars + lowerChars + numericChars + specialChars;
  // guarantee at least one of each type
  let result =
    _randomPick(upperChars) +
    _randomPick(lowerChars) +
    _randomPick(numericChars) +
    _randomPick(specialChars);

  while (result.length < length) {
    result += _randomPick(chars);
  }
  return result;
}

function safePropAccess<P extends KeysOfUnion<O>, O>(
  prop: P,
  obj: O,
): O extends {
  [key in P]?: infer T;
}
  ? T
  : never {
  if (obj && typeof obj === 'object' && prop in obj) {
    return (obj as any)[prop as any] as unknown as any;
  }
  return undefined as any;
}

type KeysOfUnion<T> = T extends T ? keyof T : never;

function getCurrentOwner(obj: DomainInfDataTypeXml): string | undefined {
  return extractText(safePropAccess('domain:clID', obj));
}

export function assertOwner(
  challengingOwner: string,
  obj: DomainInfDataTypeXml,
): string {
  const owner = getCurrentOwner(obj);
  if (!owner) {
    throw new EppUnknownError('Domain owner not found');
  }
  if (owner !== challengingOwner) {
    // `owner` here is the registry/ICANN-level sponsoring registrar, not one of
    // our end users. A mismatch means the domain is sponsored elsewhere and
    // outside our control, so we surface it as "not found" (2303) rather than
    // leaking that it exists under another sponsor.
    const domainName = extractOptionalText(
      safePropAccess('domain:name', obj),
      'unknown',
    );
    throw new EppObjectNotFoundError('domain', domainName, {
      resultCode: 2303,
    });
  }
  return owner;
}
