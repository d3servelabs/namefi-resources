/**
 * Static XmlMeta for infData
 * Generated from: urn:ietf:params:xml:ns:launch-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const LaunchInfDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:launch-1.0',
      localName: 'infData',
    },
    fields: {
      'launch:phase': {
        kind: 'element',
        xmlName: 'launch:phase',
        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:launch-1.0',
            localName: 'phase',
          },
          fields: {
            name: {
              kind: 'attribute',
              xmlName: 'name',
              cardinality: 'one',
            },
          },
        },
      },
      'launch:applicationID': {
        kind: 'element',
        xmlName: 'launch:applicationID',
        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
        cardinality: 'one',
      },
      'launch:status': {
        kind: 'element',
        xmlName: 'launch:status',
        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:launch-1.0',
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
            name: {
              kind: 'attribute',
              xmlName: 'name',
              cardinality: 'one',
            },
          },
        },
      },
      'mark:abstractMark': {
        kind: 'element',
        xmlName: 'mark:abstractMark',
        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:mark-1.0',
            localName: 'abstractMark',
          },
          fields: {},
        },
      },
    },
  },
};
