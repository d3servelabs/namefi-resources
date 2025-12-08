/**
 * Static XmlMeta for data
 * Generated from: urn:ietf:params:xml:ns:idn-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const IdnDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: { namespace: 'urn:ietf:params:xml:ns:idn-1.0', localName: 'data' },
    fields: {
      'idn:table': {
        kind: 'element',
        xmlName: 'idn:table',
        namespace: 'urn:ietf:params:xml:ns:idn-1.0',
        cardinality: 'one',
      },
      'idn:uname': {
        kind: 'element',
        xmlName: 'idn:uname',
        namespace: 'urn:ietf:params:xml:ns:idn-1.0',
        cardinality: 'one',
      },
    },
  },
};
