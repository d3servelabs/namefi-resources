/**
 * Helper utilities for building EPP commands.
 */

export { xmlTextNode, withNamespaces } from './xml-utils';
export { withEppBaseFields, type CommandOptions } from './base-fields';
export {
  EPP_NS,
  DOMAIN_NS,
  CONTACT_NS,
  HOST_NS,
  FEE_NS,
  SECDNS_NS,
  RGP_NS,
  IDN_NS,
  LAUNCH_NS,
  type EppEnvelopeXml,
} from './namespaces';
