/**
 * Static XmlMeta for infData
 * Generated from: urn:ietf:params:xml:ns:rgp-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const RgpInfDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
      localName: 'infData',
    },
    fields: {
      'rgp:rgpStatus': {
        kind: 'element',
        xmlName: 'rgp:rgpStatus',
        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
            localName: 'rgpStatus',
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
    },
  },
};
