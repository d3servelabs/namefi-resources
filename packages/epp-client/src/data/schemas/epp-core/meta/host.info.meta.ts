/**
 * Static XmlMeta for info
 * Generated from: urn:ietf:params:xml:ns:host-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const HostInfoMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: { namespace: 'urn:ietf:params:xml:ns:host-1.0', localName: 'info' },
    fields: {
      'host:name': {
        kind: 'element',
        xmlName: 'host:name',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
    },
  },
};
