import { dnsRcodes, type DnsStringRCode } from '#lib/dns/rcodes';
import type { DnsResponse } from '#lib/dns/types';
type DnsStringRCodeAndNodata = DnsStringRCode | 'NODATA';

export const isEmptyAnswer = (result: DnsResponse) => !result.Answer?.length;
export const hasAnswer = (result: DnsResponse) => !!result.Answer?.length;

export const isEmptyAuthority = (result: DnsResponse) =>
  !!result.Authority?.length;

const _isNodata = (result: DnsResponse) =>
  0 === result.RCODE && isEmptyAnswer(result);

export const is = (result: DnsResponse, code: DnsStringRCodeAndNodata) =>
  code === 'NODATA' ? _isNodata(result) : dnsRcodes.get(code) === result.RCODE;
export const isAny = (
  result: DnsResponse,
  ...codes: DnsStringRCodeAndNodata[]
) => codes.some((code) => is(result, code));
export const isNotAny = (
  result: DnsResponse,
  ...codes: DnsStringRCodeAndNodata[]
) => !isAny(result, ...codes);

export const isNeitherNxdomainOrNoerror = (result: DnsResponse) =>
  !(is(result, 'NOERROR') || is(result, 'NXDOMAIN'));

export const isResultNoErrorWithData = (result: DnsResponse) =>
  is(result, 'NOERROR') && hasAnswer(result);
