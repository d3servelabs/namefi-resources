/**
 * Static XmlMeta for create
 * Generated from: urn:ietf:params:xml:ns:launch-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const LaunchCreateMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:launch-1.0',
      localName: 'create',
    },
    fields: {
      type: {
        kind: 'attribute',
        xmlName: 'type',
        cardinality: 'one',
      },
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
      'launch:notice': {
        kind: 'element',
        xmlName: 'launch:notice',
        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:launch-1.0',
            localName: 'notice',
          },
          fields: {
            'launch:noticeID': {
              kind: 'element',
              xmlName: 'launch:noticeID',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'noticeID',
                },
                fields: {
                  validatorID: {
                    kind: 'attribute',
                    xmlName: 'validatorID',
                    cardinality: 'one',
                  },
                },
              },
            },
            'launch:notAfter': {
              kind: 'element',
              xmlName: 'launch:notAfter',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
            },
            'launch:acceptedDate': {
              kind: 'element',
              xmlName: 'launch:acceptedDate',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
            },
          },
        },
      },
      'launch:codeMark': {
        kind: 'element',
        xmlName: 'launch:codeMark',
        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:launch-1.0',
            localName: 'codeMark',
          },
          fields: {
            'launch:code': {
              kind: 'element',
              xmlName: 'launch:code',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'code',
                },
                fields: {
                  validatorID: {
                    kind: 'attribute',
                    xmlName: 'validatorID',
                    cardinality: 'one',
                  },
                },
              },
            },
            'mark:abstractMark': {
              kind: 'element',
              xmlName: 'mark:abstractMark',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
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
      },
      'smd:abstractSignedMark': {
        kind: 'element',
        xmlName: 'smd:abstractSignedMark',
        namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
            localName: 'abstractSignedMark',
          },
          fields: {},
        },
      },
      'smd:encodedSignedMark': {
        kind: 'element',
        xmlName: 'smd:encodedSignedMark',
        namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
            localName: 'encodedSignedMark',
          },
          fields: {
            encoding: {
              kind: 'attribute',
              xmlName: 'encoding',
              cardinality: 'one',
            },
          },
        },
      },
    },
  },
};
