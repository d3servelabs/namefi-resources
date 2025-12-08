/**
 * Static XmlMeta for panData
 * Generated from: urn:ietf:params:xml:ns:host-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const HostPanDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:host-1.0',
      localName: 'panData',
    },
    fields: {
      'host:name': {
        kind: 'element',
        xmlName: 'host:name',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:host-1.0',
            localName: 'name',
          },
          fields: {
            paResult: {
              kind: 'attribute',
              xmlName: 'paResult',
              cardinality: 'one',
            },
          },
        },
      },
      'host:paTRID': {
        kind: 'element',
        xmlName: 'host:paTRID',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:host-1.0',
            localName: 'paTRID',
          },
          fields: {
            'epp:clTRID': {
              kind: 'element',
              xmlName: 'epp:clTRID',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
            'epp:svTRID': {
              kind: 'element',
              xmlName: 'epp:svTRID',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
          },
        },
      },
      'host:paDate': {
        kind: 'element',
        xmlName: 'host:paDate',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
    },
  },
};
