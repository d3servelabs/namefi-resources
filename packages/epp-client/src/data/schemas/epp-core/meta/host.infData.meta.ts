/**
 * Static XmlMeta for infData
 * Generated from: urn:ietf:params:xml:ns:host-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const HostInfDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:host-1.0',
      localName: 'infData',
    },
    fields: {
      'host:name': {
        kind: 'element',
        xmlName: 'host:name',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
      'host:roid': {
        kind: 'element',
        xmlName: 'host:roid',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
      'host:status': {
        kind: 'element',
        xmlName: 'host:status',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:host-1.0',
            localName: 'status',
          },
          fields: {
            s: {
              kind: 'attribute',
              xmlName: 's',
              cardinality: 'one',
            },
            lang: {
              kind: 'attribute',
              xmlName: 'lang',
              cardinality: 'one',
            },
          },
        },
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
      'host:clID': {
        kind: 'element',
        xmlName: 'host:clID',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
      'host:crID': {
        kind: 'element',
        xmlName: 'host:crID',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
      'host:crDate': {
        kind: 'element',
        xmlName: 'host:crDate',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
      'host:upID': {
        kind: 'element',
        xmlName: 'host:upID',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
      'host:upDate': {
        kind: 'element',
        xmlName: 'host:upDate',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
      'host:trDate': {
        kind: 'element',
        xmlName: 'host:trDate',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
    },
  },
};
