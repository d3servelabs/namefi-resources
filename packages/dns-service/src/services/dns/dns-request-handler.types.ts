import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { DnsResponse } from '#lib/dns/types';
import type { Logger } from '#lib/logger';
import type { DnsStringRecordTypeCode } from '#lib/dns/record-type-codes';

export interface DnsQuestion {
  rawName: string;
  rawType: number;
  recordName: NamefiNormalizedDomain;
  recordType: DnsStringRecordTypeCode;
  wildcard: boolean;
}

export interface DnsRequestMeta {
  heartbeat: boolean;
  useMockDnsTable: boolean;
}

export interface DnsRequestContext {
  question: DnsQuestion;
  result: DnsResponse;
  meta: DnsRequestMeta;
  logger: Logger;
}

export type DnsRequestNext = () => Promise<DnsResponse>;

export type DnsRequestLink = (
  context: DnsRequestContext,
  next: DnsRequestNext,
) => Promise<DnsResponse>;

export interface DnsRequestHandler {
  handle(question: DnsQuestion): Promise<DnsResponse>;
}

export interface CreateDnsRequestHandlerOptions {
  links?: DnsRequestLink[];
  createInitialContext?: (question: DnsQuestion) => DnsRequestContext;
}

export interface DnsQuestionParseError {
  statusCode: 412;
  message: string;
}

export type ParseDnsQuestionResult =
  | {
      ok: true;
      question: DnsQuestion;
    }
  | {
      ok: false;
      kind: 'error';
      error: DnsQuestionParseError;
    }
  | {
      ok: false;
      kind: 'response';
      response: DnsResponse;
    };

export interface DnsRequestQuery {
  name: string;
  type: string;
}

export type DnsAnswerResolver = (
  recordName: NamefiNormalizedDomain,
  recordType: DnsStringRecordTypeCode,
) => Promise<DnsResponse | null>;
