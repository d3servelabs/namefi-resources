/**
 * Static XmlMeta for create
 * Generated from: urn:ietf:params:xml:ns:host-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const HostCreateMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:host-1.0',
      localName: 'create',
    },
    fields: {
      'host:name': {
        kind: 'element',
        xmlName: 'host:name',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
      'host:addr': {
        kind: 'element',
        xmlName: 'host:addr',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:host-1.0',
            localName: 'addr',
          },
          fields: {
            ip: {
              kind: 'attribute',
              xmlName: 'ip',
              cardinality: 'one',
            },
          },
        },
      },
    },
  },
};
