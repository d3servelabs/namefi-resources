import {
  type EppExtCommandTypeXml,
  type FeeCommandTypeXml,
  FeeCheckXml,
} from '../../../../data/schemas/epp-core';
import { xmlTextNode } from '../../helpers/xml-utils';
/**
 * Build fee:check extension for domain check command.
 */
export function buildFeeCheckExtension(
  commands: FeeCommandTypeXml['@_name'][] = [
    'create',
    'transfer',
    'renew',
  ] as const,
  currency = 'USD',
): EppExtCommandTypeXml {
  return {
    'fee:check': FeeCheckXml.parse({
      'fee:currency': xmlTextNode(currency),
      'fee:command': commands.map((name) => ({ '@_name': name })),
    } satisfies FeeCheckXml),
  };
}
