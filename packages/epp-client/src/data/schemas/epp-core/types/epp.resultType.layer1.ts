/**
 * Layer-1 XML JSON schema for type epp:resultType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { EppMsgTypeXml } from './epp.msgType.layer1.js';
import { EppErrValueTypeXml } from './epp.errValueType.layer1.js';
import { EppExtErrValueTypeXml } from './epp.extErrValueType.layer1.js';

const _base0 = z.object({
  'epp:msg': EppMsgTypeXml,
  '@_code': z.enum([
    '1000',
    '1001',
    '1300',
    '1301',
    '1500',
    '2000',
    '2001',
    '2002',
    '2003',
    '2004',
    '2005',
    '2100',
    '2101',
    '2102',
    '2103',
    '2104',
    '2105',
    '2106',
    '2200',
    '2201',
    '2202',
    '2300',
    '2301',
    '2302',
    '2303',
    '2304',
    '2305',
    '2306',
    '2307',
    '2308',
    '2400',
    '2500',
    '2501',
    '2502',
  ]),
});

export const EppResultTypeXml = z.union([
  zloosen(
    z.object({
      ..._base0.shape,
      'epp:value': EppErrValueTypeXml,
    }),
  ),
  zloosen(
    z.object({
      ..._base0.shape,
      'epp:extValue': EppExtErrValueTypeXml,
    }),
  ),
]);

export type EppResultTypeXml = z.infer<typeof EppResultTypeXml>;
