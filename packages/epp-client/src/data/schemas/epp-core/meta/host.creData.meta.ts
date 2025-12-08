/**
 * Static XmlMeta for creData
 * Generated from: urn:ietf:params:xml:ns:host-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const HostCreDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:host-1.0',
      localName: 'creData',
    },
    fields: {
      'host:name': {
        kind: 'element',
        xmlName: 'host:name',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
      'host:crDate': {
        kind: 'element',
        xmlName: 'host:crDate',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
    },
  },
};
