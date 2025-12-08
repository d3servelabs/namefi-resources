/**
 * Schema metadata for pack "epp-core".
 * Auto-generated from XSD. Do not edit manually.
 */

export const schemaPackName = 'epp-core';

export const namespaces = [
  { namespace: 'urn:ietf:params:xml:ns:epp-1.0', prefix: 'epp' },
  { namespace: 'urn:ietf:params:xml:ns:eppcom-1.0', prefix: 'eppcom' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', prefix: 'domain' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', prefix: 'contact' },
  { namespace: 'urn:ietf:params:xml:ns:host-1.0', prefix: 'host' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', prefix: 'fee' },
  { namespace: 'urn:ietf:params:xml:ns:secDNS-1.1', prefix: 'secDNS' },
  { namespace: 'urn:ietf:params:xml:ns:rgp-1.0', prefix: 'rgp' },
  { namespace: 'urn:ietf:params:xml:ns:idn-1.0', prefix: 'idn' },
  { namespace: 'urn:ietf:params:xml:ns:artRecord-0.2', prefix: 'artRecord' },
  { namespace: 'urn:ietf:params:xml:ns:launch-1.0', prefix: 'launch' },
  { namespace: 'urn:ietf:params:xml:ns:mark-1.0', prefix: 'mark' },
  { namespace: 'urn:ietf:params:xml:ns:signedMark-1.0', prefix: 'signedMark' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', prefix: 'xmldsig' },
] as const;

export interface QName {
  namespace: string;
  localName: string;
}

export const rootElements: QName[] = [
  { namespace: 'urn:ietf:params:xml:ns:epp-1.0', localName: 'epp' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'check' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'create' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'delete' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'info' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'renew' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'transfer' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'update' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'chkData' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'creData' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'infData' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'panData' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'renData' },
  { namespace: 'urn:ietf:params:xml:ns:domain-1.0', localName: 'trnData' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'check' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'create' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'delete' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'info' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'transfer' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'update' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'chkData' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'creData' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'infData' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'panData' },
  { namespace: 'urn:ietf:params:xml:ns:contact-1.0', localName: 'trnData' },
  { namespace: 'urn:ietf:params:xml:ns:host-1.0', localName: 'check' },
  { namespace: 'urn:ietf:params:xml:ns:host-1.0', localName: 'create' },
  { namespace: 'urn:ietf:params:xml:ns:host-1.0', localName: 'delete' },
  { namespace: 'urn:ietf:params:xml:ns:host-1.0', localName: 'info' },
  { namespace: 'urn:ietf:params:xml:ns:host-1.0', localName: 'update' },
  { namespace: 'urn:ietf:params:xml:ns:host-1.0', localName: 'chkData' },
  { namespace: 'urn:ietf:params:xml:ns:host-1.0', localName: 'creData' },
  { namespace: 'urn:ietf:params:xml:ns:host-1.0', localName: 'infData' },
  { namespace: 'urn:ietf:params:xml:ns:host-1.0', localName: 'panData' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'check' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'chkData' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'create' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'creData' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'renew' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'renData' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'transfer' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'trnData' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'update' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'updData' },
  { namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0', localName: 'delData' },
  { namespace: 'urn:ietf:params:xml:ns:secDNS-1.1', localName: 'create' },
  { namespace: 'urn:ietf:params:xml:ns:secDNS-1.1', localName: 'update' },
  { namespace: 'urn:ietf:params:xml:ns:secDNS-1.1', localName: 'infData' },
  { namespace: 'urn:ietf:params:xml:ns:rgp-1.0', localName: 'update' },
  { namespace: 'urn:ietf:params:xml:ns:rgp-1.0', localName: 'infData' },
  { namespace: 'urn:ietf:params:xml:ns:rgp-1.0', localName: 'upData' },
  { namespace: 'urn:ietf:params:xml:ns:idn-1.0', localName: 'data' },
  { namespace: 'urn:ietf:params:xml:ns:artRecord-0.2', localName: 'infData' },
  { namespace: 'urn:ietf:params:xml:ns:artRecord-0.2', localName: 'create' },
  { namespace: 'urn:ietf:params:xml:ns:artRecord-0.2', localName: 'update' },
  { namespace: 'urn:ietf:params:xml:ns:launch-1.0', localName: 'check' },
  { namespace: 'urn:ietf:params:xml:ns:launch-1.0', localName: 'info' },
  { namespace: 'urn:ietf:params:xml:ns:launch-1.0', localName: 'create' },
  { namespace: 'urn:ietf:params:xml:ns:launch-1.0', localName: 'update' },
  { namespace: 'urn:ietf:params:xml:ns:launch-1.0', localName: 'delete' },
  { namespace: 'urn:ietf:params:xml:ns:launch-1.0', localName: 'chkData' },
  { namespace: 'urn:ietf:params:xml:ns:launch-1.0', localName: 'creData' },
  { namespace: 'urn:ietf:params:xml:ns:launch-1.0', localName: 'infData' },
  { namespace: 'urn:ietf:params:xml:ns:mark-1.0', localName: 'abstractMark' },
  { namespace: 'urn:ietf:params:xml:ns:mark-1.0', localName: 'mark' },
  {
    namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
    localName: 'abstractSignedMark',
  },
  {
    namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
    localName: 'signedMark',
  },
  {
    namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
    localName: 'encodedSignedMark',
  },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'Signature' },
  {
    namespace: 'http://www.w3.org/2000/09/xmldsig#',
    localName: 'SignatureValue',
  },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'SignedInfo' },
  {
    namespace: 'http://www.w3.org/2000/09/xmldsig#',
    localName: 'CanonicalizationMethod',
  },
  {
    namespace: 'http://www.w3.org/2000/09/xmldsig#',
    localName: 'SignatureMethod',
  },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'Reference' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'Transforms' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'Transform' },
  {
    namespace: 'http://www.w3.org/2000/09/xmldsig#',
    localName: 'DigestMethod',
  },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'DigestValue' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'KeyInfo' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'KeyName' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'MgmtData' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'KeyValue' },
  {
    namespace: 'http://www.w3.org/2000/09/xmldsig#',
    localName: 'RetrievalMethod',
  },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'X509Data' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'PGPData' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'SPKIData' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'Object' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'Manifest' },
  {
    namespace: 'http://www.w3.org/2000/09/xmldsig#',
    localName: 'SignatureProperties',
  },
  {
    namespace: 'http://www.w3.org/2000/09/xmldsig#',
    localName: 'SignatureProperty',
  },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'DSAKeyValue' },
  { namespace: 'http://www.w3.org/2000/09/xmldsig#', localName: 'RSAKeyValue' },
];

/**
 * Information about nodes that are singular (maxOccurs=1) in certain contexts.
 * Used by isSingularNode() predicate for XML parsing array disambiguation.
 */
export interface SingularNodeInfo {
  /** Prefixed node name (e.g., "domain:name") */
  nodeName: string;
  /** Parent paths where this node is singular. If undefined, always singular. */
  parentPaths?: string[];
}

export const singularNodes: SingularNodeInfo[] = [
  { nodeName: 'epp:greeting', parentPaths: ['epp:epp'] },
  { nodeName: 'epp:svID', parentPaths: ['epp:epp.epp:greeting'] },
  { nodeName: 'epp:svDate', parentPaths: ['epp:epp.epp:greeting'] },
  { nodeName: 'epp:svcMenu', parentPaths: ['epp:epp.epp:greeting'] },
  {
    nodeName: 'epp:svcExtension',
    parentPaths: [
      'epp:epp.epp:greeting.epp:svcMenu',
      'epp:epp.epp:command.epp:login.epp:svcs',
    ],
  },
  { nodeName: 'epp:dcp', parentPaths: ['epp:epp.epp:greeting'] },
  { nodeName: 'epp:access', parentPaths: ['epp:epp.epp:greeting.epp:dcp'] },
  {
    nodeName: 'epp:all',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:access'],
  },
  {
    nodeName: 'epp:none',
    parentPaths: [
      'epp:epp.epp:greeting.epp:dcp.epp:access',
      'epp:epp.epp:greeting.epp:dcp.epp:statement.epp:retention',
    ],
  },
  {
    nodeName: 'epp:null',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:access'],
  },
  {
    nodeName: 'epp:other',
    parentPaths: [
      'epp:epp.epp:greeting.epp:dcp.epp:access',
      'epp:epp.epp:greeting.epp:dcp.epp:statement.epp:purpose',
      'epp:epp.epp:greeting.epp:dcp.epp:statement.epp:recipient',
    ],
  },
  {
    nodeName: 'epp:personal',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:access'],
  },
  {
    nodeName: 'epp:personalAndOther',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:access'],
  },
  {
    nodeName: 'epp:purpose',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement'],
  },
  {
    nodeName: 'epp:admin',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement.epp:purpose'],
  },
  {
    nodeName: 'epp:contact',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement.epp:purpose'],
  },
  {
    nodeName: 'epp:prov',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement.epp:purpose'],
  },
  {
    nodeName: 'epp:recipient',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement'],
  },
  {
    nodeName: 'epp:recDesc',
    parentPaths: [
      'epp:epp.epp:greeting.epp:dcp.epp:statement.epp:recipient.epp:ours',
    ],
  },
  {
    nodeName: 'epp:public',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement.epp:recipient'],
  },
  {
    nodeName: 'epp:same',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement.epp:recipient'],
  },
  {
    nodeName: 'epp:unrelated',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement.epp:recipient'],
  },
  {
    nodeName: 'epp:retention',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement'],
  },
  {
    nodeName: 'epp:business',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement.epp:retention'],
  },
  {
    nodeName: 'epp:indefinite',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement.epp:retention'],
  },
  {
    nodeName: 'epp:legal',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement.epp:retention'],
  },
  {
    nodeName: 'epp:stated',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:statement.epp:retention'],
  },
  { nodeName: 'epp:expiry', parentPaths: ['epp:epp.epp:greeting.epp:dcp'] },
  {
    nodeName: 'epp:absolute',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:expiry'],
  },
  {
    nodeName: 'epp:relative',
    parentPaths: ['epp:epp.epp:greeting.epp:dcp.epp:expiry'],
  },
  { nodeName: 'epp:hello', parentPaths: ['epp:epp'] },
  { nodeName: 'epp:command', parentPaths: ['epp:epp'] },
  {
    nodeName: 'epp:extension',
    parentPaths: ['epp:epp.epp:command', 'epp:epp.epp:response', 'epp:epp'],
  },
  {
    nodeName: 'fee:check',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'fee:currency',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.fee:check',
      'epp:epp.epp:command.epp:extension.fee:create',
      'epp:epp.epp:command.epp:extension.fee:renew',
      'epp:epp.epp:command.epp:extension.fee:transfer',
      'epp:epp.epp:command.epp:extension.fee:update',
      'epp:epp.epp:response.epp:extension.fee:chkData',
      'epp:epp.epp:response.epp:extension.fee:creData',
      'epp:epp.epp:response.epp:extension.fee:renData',
      'epp:epp.epp:response.epp:extension.fee:trnData',
      'epp:epp.epp:response.epp:extension.fee:updData',
      'epp:epp.epp:response.epp:extension.fee:delData',
      'epp:epp.epp:extension.fee:check',
      'epp:epp.epp:extension.fee:create',
      'epp:epp.epp:extension.fee:renew',
      'epp:epp.epp:extension.fee:transfer',
      'epp:epp.epp:extension.fee:update',
      'epp:epp.epp:extension.fee:chkData',
      'epp:epp.epp:extension.fee:creData',
      'epp:epp.epp:extension.fee:renData',
      'epp:epp.epp:extension.fee:trnData',
      'epp:epp.epp:extension.fee:updData',
      'epp:epp.epp:extension.fee:delData',
      'fee:check',
      'fee:chkData',
      'fee:create',
      'fee:creData',
      'fee:renew',
      'fee:renData',
      'fee:transfer',
      'fee:trnData',
      'fee:update',
      'fee:updData',
      'fee:delData',
    ],
  },
  {
    nodeName: 'fee:period',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.fee:check.fee:command',
      'epp:epp.epp:response.epp:extension.fee:creData',
      'epp:epp.epp:response.epp:extension.fee:renData',
      'epp:epp.epp:response.epp:extension.fee:trnData',
      'epp:epp.epp:response.epp:extension.fee:updData',
      'epp:epp.epp:response.epp:extension.fee:delData',
      'epp:epp.epp:extension.fee:check.fee:command',
      'epp:epp.epp:extension.fee:creData',
      'epp:epp.epp:extension.fee:renData',
      'epp:epp.epp:extension.fee:trnData',
      'epp:epp.epp:extension.fee:updData',
      'epp:epp.epp:extension.fee:delData',
      'fee:check.fee:command',
      'fee:creData',
      'fee:renData',
      'fee:trnData',
      'fee:updData',
      'fee:delData',
    ],
  },
  {
    nodeName: 'fee:create',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'fee:renew',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'fee:transfer',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'fee:update',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'secDNS:create',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'secDNS:maxSigLife',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:create',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:chg',
      'epp:epp.epp:response.epp:extension.secDNS:infData',
      'epp:epp.epp:extension.secDNS:create',
      'epp:epp.epp:extension.secDNS:update.secDNS:add',
      'epp:epp.epp:extension.secDNS:update.secDNS:chg',
      'epp:epp.epp:extension.secDNS:infData',
      'secDNS:create',
      'secDNS:update.secDNS:add',
      'secDNS:update.secDNS:chg',
      'secDNS:infData',
    ],
  },
  {
    nodeName: 'secDNS:keyTag',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:dsData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:create.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:dsData',
      'secDNS:create.secDNS:dsData',
      'secDNS:update.secDNS:rem.secDNS:dsData',
      'secDNS:update.secDNS:add.secDNS:dsData',
      'secDNS:infData.secDNS:dsData',
    ],
  },
  {
    nodeName: 'secDNS:alg',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:keyData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:dsData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:create.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:create.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:create.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:keyData',
      'secDNS:create.secDNS:dsData',
      'secDNS:create.secDNS:dsData.secDNS:keyData',
      'secDNS:create.secDNS:keyData',
      'secDNS:update.secDNS:rem.secDNS:dsData',
      'secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'secDNS:update.secDNS:rem.secDNS:keyData',
      'secDNS:update.secDNS:add.secDNS:dsData',
      'secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'secDNS:update.secDNS:add.secDNS:keyData',
      'secDNS:infData.secDNS:dsData',
      'secDNS:infData.secDNS:dsData.secDNS:keyData',
      'secDNS:infData.secDNS:keyData',
    ],
  },
  {
    nodeName: 'secDNS:digestType',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:dsData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:create.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:dsData',
      'secDNS:create.secDNS:dsData',
      'secDNS:update.secDNS:rem.secDNS:dsData',
      'secDNS:update.secDNS:add.secDNS:dsData',
      'secDNS:infData.secDNS:dsData',
    ],
  },
  {
    nodeName: 'secDNS:digest',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:dsData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:create.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:dsData',
      'secDNS:create.secDNS:dsData',
      'secDNS:update.secDNS:rem.secDNS:dsData',
      'secDNS:update.secDNS:add.secDNS:dsData',
      'secDNS:infData.secDNS:dsData',
    ],
  },
  {
    nodeName: 'secDNS:keyData',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:dsData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:create.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:dsData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:dsData',
      'secDNS:create.secDNS:dsData',
      'secDNS:update.secDNS:rem.secDNS:dsData',
      'secDNS:update.secDNS:add.secDNS:dsData',
      'secDNS:infData.secDNS:dsData',
    ],
  },
  {
    nodeName: 'secDNS:flags',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:keyData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:create.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:create.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:keyData',
      'secDNS:create.secDNS:dsData.secDNS:keyData',
      'secDNS:create.secDNS:keyData',
      'secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'secDNS:update.secDNS:rem.secDNS:keyData',
      'secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'secDNS:update.secDNS:add.secDNS:keyData',
      'secDNS:infData.secDNS:dsData.secDNS:keyData',
      'secDNS:infData.secDNS:keyData',
    ],
  },
  {
    nodeName: 'secDNS:protocol',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:keyData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:create.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:create.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:keyData',
      'secDNS:create.secDNS:dsData.secDNS:keyData',
      'secDNS:create.secDNS:keyData',
      'secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'secDNS:update.secDNS:rem.secDNS:keyData',
      'secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'secDNS:update.secDNS:add.secDNS:keyData',
      'secDNS:infData.secDNS:dsData.secDNS:keyData',
      'secDNS:infData.secDNS:keyData',
    ],
  },
  {
    nodeName: 'secDNS:pubKey',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:create.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:add.secDNS:keyData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:response.epp:extension.secDNS:infData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:create.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:create.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:update.secDNS:add.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:dsData.secDNS:keyData',
      'epp:epp.epp:extension.secDNS:infData.secDNS:keyData',
      'secDNS:create.secDNS:dsData.secDNS:keyData',
      'secDNS:create.secDNS:keyData',
      'secDNS:update.secDNS:rem.secDNS:dsData.secDNS:keyData',
      'secDNS:update.secDNS:rem.secDNS:keyData',
      'secDNS:update.secDNS:add.secDNS:dsData.secDNS:keyData',
      'secDNS:update.secDNS:add.secDNS:keyData',
      'secDNS:infData.secDNS:dsData.secDNS:keyData',
      'secDNS:infData.secDNS:keyData',
    ],
  },
  {
    nodeName: 'secDNS:update',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'secDNS:rem',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:update',
      'epp:epp.epp:extension.secDNS:update',
      'secDNS:update',
    ],
  },
  {
    nodeName: 'secDNS:all',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:update.secDNS:rem',
      'epp:epp.epp:extension.secDNS:update.secDNS:rem',
      'secDNS:update.secDNS:rem',
    ],
  },
  {
    nodeName: 'secDNS:add',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:update',
      'epp:epp.epp:extension.secDNS:update',
      'secDNS:update',
    ],
  },
  {
    nodeName: 'secDNS:chg',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.secDNS:update',
      'epp:epp.epp:extension.secDNS:update',
      'secDNS:update',
    ],
  },
  {
    nodeName: 'rgp:update',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'rgp:restore',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update',
      'epp:epp.epp:extension.rgp:update',
      'rgp:update',
    ],
  },
  {
    nodeName: 'rgp:report',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update.rgp:restore',
      'epp:epp.epp:extension.rgp:update.rgp:restore',
      'rgp:update.rgp:restore',
    ],
  },
  {
    nodeName: 'rgp:preData',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update.rgp:restore.rgp:report',
      'epp:epp.epp:extension.rgp:update.rgp:restore.rgp:report',
      'rgp:update.rgp:restore.rgp:report',
    ],
  },
  {
    nodeName: 'rgp:postData',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update.rgp:restore.rgp:report',
      'epp:epp.epp:extension.rgp:update.rgp:restore.rgp:report',
      'rgp:update.rgp:restore.rgp:report',
    ],
  },
  {
    nodeName: 'rgp:delTime',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update.rgp:restore.rgp:report',
      'epp:epp.epp:extension.rgp:update.rgp:restore.rgp:report',
      'rgp:update.rgp:restore.rgp:report',
    ],
  },
  {
    nodeName: 'rgp:resTime',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update.rgp:restore.rgp:report',
      'epp:epp.epp:extension.rgp:update.rgp:restore.rgp:report',
      'rgp:update.rgp:restore.rgp:report',
    ],
  },
  {
    nodeName: 'rgp:resReason',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update.rgp:restore.rgp:report',
      'epp:epp.epp:extension.rgp:update.rgp:restore.rgp:report',
      'rgp:update.rgp:restore.rgp:report',
    ],
  },
  {
    nodeName: 'rgp:other',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update.rgp:restore.rgp:report',
      'epp:epp.epp:extension.rgp:update.rgp:restore.rgp:report',
      'rgp:update.rgp:restore.rgp:report',
    ],
  },
  {
    nodeName: 'launch:check',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'launch:phase',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:check',
      'epp:epp.epp:command.epp:extension.launch:info',
      'epp:epp.epp:command.epp:extension.launch:create',
      'epp:epp.epp:command.epp:extension.launch:update',
      'epp:epp.epp:command.epp:extension.launch:delete',
      'epp:epp.epp:response.epp:extension.launch:chkData',
      'epp:epp.epp:response.epp:extension.launch:creData',
      'epp:epp.epp:response.epp:extension.launch:infData',
      'epp:epp.epp:extension.launch:check',
      'epp:epp.epp:extension.launch:info',
      'epp:epp.epp:extension.launch:create',
      'epp:epp.epp:extension.launch:update',
      'epp:epp.epp:extension.launch:delete',
      'epp:epp.epp:extension.launch:chkData',
      'epp:epp.epp:extension.launch:creData',
      'epp:epp.epp:extension.launch:infData',
      'launch:check',
      'launch:info',
      'launch:create',
      'launch:update',
      'launch:delete',
      'launch:chkData',
      'launch:creData',
      'launch:infData',
    ],
  },
  {
    nodeName: 'launch:info',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'launch:applicationID',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:info',
      'epp:epp.epp:command.epp:extension.launch:update',
      'epp:epp.epp:command.epp:extension.launch:delete',
      'epp:epp.epp:response.epp:extension.launch:creData',
      'epp:epp.epp:response.epp:extension.launch:infData',
      'epp:epp.epp:extension.launch:info',
      'epp:epp.epp:extension.launch:update',
      'epp:epp.epp:extension.launch:delete',
      'epp:epp.epp:extension.launch:creData',
      'epp:epp.epp:extension.launch:infData',
      'launch:info',
      'launch:update',
      'launch:delete',
      'launch:creData',
      'launch:infData',
    ],
  },
  {
    nodeName: 'launch:create',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'launch:notice',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:create',
      'epp:epp.epp:extension.launch:create',
      'launch:create',
    ],
  },
  {
    nodeName: 'launch:noticeID',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:create.launch:notice',
      'epp:epp.epp:extension.launch:create.launch:notice',
      'launch:create.launch:notice',
    ],
  },
  {
    nodeName: 'launch:notAfter',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:create.launch:notice',
      'epp:epp.epp:extension.launch:create.launch:notice',
      'launch:create.launch:notice',
    ],
  },
  {
    nodeName: 'launch:acceptedDate',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:create.launch:notice',
      'epp:epp.epp:extension.launch:create.launch:notice',
      'launch:create.launch:notice',
    ],
  },
  {
    nodeName: 'launch:code',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:create.launch:codeMark',
      'epp:epp.epp:extension.launch:create.launch:codeMark',
      'launch:create.launch:codeMark',
    ],
  },
  {
    nodeName: 'mark:abstractMark',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:create.launch:codeMark',
      'epp:epp.epp:extension.launch:create.launch:codeMark',
      'launch:create.launch:codeMark',
      'signedMark:signedMark',
    ],
  },
  {
    nodeName: 'launch:update',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'launch:delete',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'artRecord:create',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'artRecord:objectType',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.artRecord:create',
      'epp:epp.epp:command.epp:extension.artRecord:update',
      'epp:epp.epp:response.epp:extension.artRecord:infData',
      'epp:epp.epp:extension.artRecord:create',
      'epp:epp.epp:extension.artRecord:update',
      'epp:epp.epp:extension.artRecord:infData',
      'artRecord:infData',
      'artRecord:create',
      'artRecord:update',
    ],
  },
  {
    nodeName: 'artRecord:materialsAndTechniques',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.artRecord:create',
      'epp:epp.epp:command.epp:extension.artRecord:update',
      'epp:epp.epp:response.epp:extension.artRecord:infData',
      'epp:epp.epp:extension.artRecord:create',
      'epp:epp.epp:extension.artRecord:update',
      'epp:epp.epp:extension.artRecord:infData',
      'artRecord:infData',
      'artRecord:create',
      'artRecord:update',
    ],
  },
  {
    nodeName: 'artRecord:dimensions',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.artRecord:create',
      'epp:epp.epp:command.epp:extension.artRecord:update',
      'epp:epp.epp:response.epp:extension.artRecord:infData',
      'epp:epp.epp:extension.artRecord:create',
      'epp:epp.epp:extension.artRecord:update',
      'epp:epp.epp:extension.artRecord:infData',
      'artRecord:infData',
      'artRecord:create',
      'artRecord:update',
    ],
  },
  {
    nodeName: 'artRecord:title',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.artRecord:create',
      'epp:epp.epp:command.epp:extension.artRecord:update',
      'epp:epp.epp:response.epp:extension.artRecord:infData',
      'epp:epp.epp:extension.artRecord:create',
      'epp:epp.epp:extension.artRecord:update',
      'epp:epp.epp:extension.artRecord:infData',
      'artRecord:infData',
      'artRecord:create',
      'artRecord:update',
    ],
  },
  {
    nodeName: 'artRecord:dateOrPeriod',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.artRecord:create',
      'epp:epp.epp:command.epp:extension.artRecord:update',
      'epp:epp.epp:response.epp:extension.artRecord:infData',
      'epp:epp.epp:extension.artRecord:create',
      'epp:epp.epp:extension.artRecord:update',
      'epp:epp.epp:extension.artRecord:infData',
      'artRecord:infData',
      'artRecord:create',
      'artRecord:update',
    ],
  },
  {
    nodeName: 'artRecord:maker',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.artRecord:create',
      'epp:epp.epp:command.epp:extension.artRecord:update',
      'epp:epp.epp:response.epp:extension.artRecord:infData',
      'epp:epp.epp:extension.artRecord:create',
      'epp:epp.epp:extension.artRecord:update',
      'epp:epp.epp:extension.artRecord:infData',
      'artRecord:infData',
      'artRecord:create',
      'artRecord:update',
    ],
  },
  {
    nodeName: 'artRecord:subject',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.artRecord:create',
      'epp:epp.epp:command.epp:extension.artRecord:update',
      'epp:epp.epp:response.epp:extension.artRecord:infData',
      'epp:epp.epp:extension.artRecord:create',
      'epp:epp.epp:extension.artRecord:update',
      'epp:epp.epp:extension.artRecord:infData',
      'artRecord:infData',
      'artRecord:create',
      'artRecord:update',
    ],
  },
  {
    nodeName: 'artRecord:inscriptionsAndMarkings',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.artRecord:create',
      'epp:epp.epp:command.epp:extension.artRecord:update',
      'epp:epp.epp:response.epp:extension.artRecord:infData',
      'epp:epp.epp:extension.artRecord:create',
      'epp:epp.epp:extension.artRecord:update',
      'epp:epp.epp:extension.artRecord:infData',
      'artRecord:infData',
      'artRecord:create',
      'artRecord:update',
    ],
  },
  {
    nodeName: 'artRecord:features',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.artRecord:create',
      'epp:epp.epp:command.epp:extension.artRecord:update',
      'epp:epp.epp:response.epp:extension.artRecord:infData',
      'epp:epp.epp:extension.artRecord:create',
      'epp:epp.epp:extension.artRecord:update',
      'epp:epp.epp:extension.artRecord:infData',
      'artRecord:infData',
      'artRecord:create',
      'artRecord:update',
    ],
  },
  {
    nodeName: 'artRecord:reference',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.artRecord:create',
      'epp:epp.epp:command.epp:extension.artRecord:update',
      'epp:epp.epp:response.epp:extension.artRecord:infData',
      'epp:epp.epp:extension.artRecord:create',
      'epp:epp.epp:extension.artRecord:update',
      'epp:epp.epp:extension.artRecord:infData',
      'artRecord:infData',
      'artRecord:create',
      'artRecord:update',
    ],
  },
  {
    nodeName: 'artRecord:update',
    parentPaths: ['epp:epp.epp:command.epp:extension', 'epp:epp.epp:extension'],
  },
  {
    nodeName: 'epp:clTRID',
    parentPaths: [
      'epp:epp.epp:command',
      'epp:epp.epp:response.epp:resData.domain:panData.domain:paTRID',
      'epp:epp.epp:response.epp:resData.contact:panData.contact:paTRID',
      'epp:epp.epp:response.epp:resData.host:panData.host:paTRID',
      'epp:epp.epp:response.epp:trID',
      'domain:panData.domain:paTRID',
      'contact:panData.contact:paTRID',
      'host:panData.host:paTRID',
    ],
  },
  { nodeName: 'epp:check', parentPaths: ['epp:epp.epp:command'] },
  { nodeName: 'domain:check', parentPaths: ['epp:epp.epp:command.epp:check'] },
  { nodeName: 'contact:check', parentPaths: ['epp:epp.epp:command.epp:check'] },
  { nodeName: 'host:check', parentPaths: ['epp:epp.epp:command.epp:check'] },
  { nodeName: 'epp:create', parentPaths: ['epp:epp.epp:command'] },
  {
    nodeName: 'domain:create',
    parentPaths: ['epp:epp.epp:command.epp:create'],
  },
  {
    nodeName: 'domain:name',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create',
      'epp:epp.epp:command.epp:delete.domain:delete',
      'epp:epp.epp:command.epp:info.domain:info',
      'epp:epp.epp:command.epp:renew.domain:renew',
      'epp:epp.epp:command.epp:transfer.domain:transfer',
      'epp:epp.epp:command.epp:update.domain:update',
      'epp:epp.epp:response.epp:resData.domain:chkData.domain:cd',
      'epp:epp.epp:response.epp:resData.domain:creData',
      'epp:epp.epp:response.epp:resData.domain:infData',
      'epp:epp.epp:response.epp:resData.domain:panData',
      'epp:epp.epp:response.epp:resData.domain:renData',
      'epp:epp.epp:response.epp:resData.domain:trnData',
      'domain:create',
      'domain:delete',
      'domain:info',
      'domain:renew',
      'domain:transfer',
      'domain:update',
      'domain:chkData.domain:cd',
      'domain:creData',
      'domain:infData',
      'domain:panData',
      'domain:renData',
      'domain:trnData',
    ],
  },
  {
    nodeName: 'domain:period',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create',
      'epp:epp.epp:command.epp:renew.domain:renew',
      'epp:epp.epp:command.epp:transfer.domain:transfer',
      'domain:create',
      'domain:renew',
      'domain:transfer',
    ],
  },
  {
    nodeName: 'domain:ns',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create',
      'epp:epp.epp:command.epp:update.domain:update.domain:add',
      'epp:epp.epp:command.epp:update.domain:update.domain:rem',
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:create',
      'domain:update.domain:add',
      'domain:update.domain:rem',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:hostName',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create.domain:ns.domain:hostAttr',
      'epp:epp.epp:command.epp:update.domain:update.domain:add.domain:ns.domain:hostAttr',
      'epp:epp.epp:command.epp:update.domain:update.domain:rem.domain:ns.domain:hostAttr',
      'epp:epp.epp:response.epp:resData.domain:infData.domain:ns.domain:hostAttr',
      'domain:create.domain:ns.domain:hostAttr',
      'domain:update.domain:add.domain:ns.domain:hostAttr',
      'domain:update.domain:rem.domain:ns.domain:hostAttr',
      'domain:infData.domain:ns.domain:hostAttr',
    ],
  },
  {
    nodeName: 'domain:registrant',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create',
      'epp:epp.epp:command.epp:update.domain:update.domain:chg',
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:create',
      'domain:update.domain:chg',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:authInfo',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create',
      'epp:epp.epp:command.epp:info.domain:info',
      'epp:epp.epp:command.epp:transfer.domain:transfer',
      'epp:epp.epp:command.epp:update.domain:update.domain:chg',
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:create',
      'domain:info',
      'domain:transfer',
      'domain:update.domain:chg',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:pw',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create.domain:authInfo',
      'epp:epp.epp:command.epp:info.domain:info.domain:authInfo',
      'epp:epp.epp:command.epp:transfer.domain:transfer.domain:authInfo',
      'epp:epp.epp:command.epp:update.domain:update.domain:chg.domain:authInfo',
      'epp:epp.epp:response.epp:resData.domain:infData.domain:authInfo',
      'domain:create.domain:authInfo',
      'domain:info.domain:authInfo',
      'domain:transfer.domain:authInfo',
      'domain:update.domain:chg.domain:authInfo',
      'domain:infData.domain:authInfo',
    ],
  },
  {
    nodeName: 'domain:ext',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create.domain:authInfo',
      'epp:epp.epp:command.epp:info.domain:info.domain:authInfo',
      'epp:epp.epp:command.epp:transfer.domain:transfer.domain:authInfo',
      'epp:epp.epp:command.epp:update.domain:update.domain:chg.domain:authInfo',
      'epp:epp.epp:response.epp:resData.domain:infData.domain:authInfo',
      'domain:create.domain:authInfo',
      'domain:info.domain:authInfo',
      'domain:transfer.domain:authInfo',
      'domain:update.domain:chg.domain:authInfo',
      'domain:infData.domain:authInfo',
    ],
  },
  {
    nodeName: 'contact:create',
    parentPaths: ['epp:epp.epp:command.epp:create'],
  },
  {
    nodeName: 'contact:id',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create',
      'epp:epp.epp:command.epp:delete.contact:delete',
      'epp:epp.epp:command.epp:info.contact:info',
      'epp:epp.epp:command.epp:transfer.contact:transfer',
      'epp:epp.epp:command.epp:update.contact:update',
      'epp:epp.epp:response.epp:resData.contact:chkData.contact:cd',
      'epp:epp.epp:response.epp:resData.contact:creData',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'epp:epp.epp:response.epp:resData.contact:panData',
      'epp:epp.epp:response.epp:resData.contact:trnData',
      'contact:create',
      'contact:delete',
      'contact:info',
      'contact:transfer',
      'contact:update',
      'contact:chkData.contact:cd',
      'contact:creData',
      'contact:infData',
      'contact:panData',
      'contact:trnData',
    ],
  },
  {
    nodeName: 'contact:name',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:postalInfo',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:postalInfo',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:postalInfo',
      'contact:create.contact:postalInfo',
      'contact:update.contact:chg.contact:postalInfo',
      'contact:infData.contact:postalInfo',
    ],
  },
  {
    nodeName: 'contact:org',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:postalInfo',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:postalInfo',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:postalInfo',
      'contact:create.contact:postalInfo',
      'contact:update.contact:chg.contact:postalInfo',
      'contact:infData.contact:postalInfo',
    ],
  },
  {
    nodeName: 'contact:addr',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:postalInfo',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:postalInfo',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:postalInfo',
      'contact:create.contact:postalInfo',
      'contact:update.contact:chg.contact:postalInfo',
      'contact:infData.contact:postalInfo',
    ],
  },
  {
    nodeName: 'contact:city',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:postalInfo.contact:addr',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:postalInfo.contact:addr',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:postalInfo.contact:addr',
      'contact:create.contact:postalInfo.contact:addr',
      'contact:update.contact:chg.contact:postalInfo.contact:addr',
      'contact:infData.contact:postalInfo.contact:addr',
    ],
  },
  {
    nodeName: 'contact:sp',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:postalInfo.contact:addr',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:postalInfo.contact:addr',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:postalInfo.contact:addr',
      'contact:create.contact:postalInfo.contact:addr',
      'contact:update.contact:chg.contact:postalInfo.contact:addr',
      'contact:infData.contact:postalInfo.contact:addr',
    ],
  },
  {
    nodeName: 'contact:pc',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:postalInfo.contact:addr',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:postalInfo.contact:addr',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:postalInfo.contact:addr',
      'contact:create.contact:postalInfo.contact:addr',
      'contact:update.contact:chg.contact:postalInfo.contact:addr',
      'contact:infData.contact:postalInfo.contact:addr',
    ],
  },
  {
    nodeName: 'contact:cc',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:postalInfo.contact:addr',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:postalInfo.contact:addr',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:postalInfo.contact:addr',
      'contact:create.contact:postalInfo.contact:addr',
      'contact:update.contact:chg.contact:postalInfo.contact:addr',
      'contact:infData.contact:postalInfo.contact:addr',
    ],
  },
  {
    nodeName: 'contact:voice',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create',
      'epp:epp.epp:command.epp:create.contact:create.contact:disclose',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:disclose',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:disclose',
      'contact:create',
      'contact:create.contact:disclose',
      'contact:update.contact:chg',
      'contact:update.contact:chg.contact:disclose',
      'contact:infData',
      'contact:infData.contact:disclose',
    ],
  },
  {
    nodeName: 'contact:fax',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create',
      'epp:epp.epp:command.epp:create.contact:create.contact:disclose',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:disclose',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:disclose',
      'contact:create',
      'contact:create.contact:disclose',
      'contact:update.contact:chg',
      'contact:update.contact:chg.contact:disclose',
      'contact:infData',
      'contact:infData.contact:disclose',
    ],
  },
  {
    nodeName: 'contact:email',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create',
      'epp:epp.epp:command.epp:create.contact:create.contact:disclose',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:disclose',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:disclose',
      'contact:create',
      'contact:create.contact:disclose',
      'contact:update.contact:chg',
      'contact:update.contact:chg.contact:disclose',
      'contact:infData',
      'contact:infData.contact:disclose',
    ],
  },
  {
    nodeName: 'contact:authInfo',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create',
      'epp:epp.epp:command.epp:info.contact:info',
      'epp:epp.epp:command.epp:transfer.contact:transfer',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:create',
      'contact:info',
      'contact:transfer',
      'contact:update.contact:chg',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:pw',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:authInfo',
      'epp:epp.epp:command.epp:info.contact:info.contact:authInfo',
      'epp:epp.epp:command.epp:transfer.contact:transfer.contact:authInfo',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:authInfo',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:authInfo',
      'contact:create.contact:authInfo',
      'contact:info.contact:authInfo',
      'contact:transfer.contact:authInfo',
      'contact:update.contact:chg.contact:authInfo',
      'contact:infData.contact:authInfo',
    ],
  },
  {
    nodeName: 'contact:ext',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:authInfo',
      'epp:epp.epp:command.epp:info.contact:info.contact:authInfo',
      'epp:epp.epp:command.epp:transfer.contact:transfer.contact:authInfo',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:authInfo',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:authInfo',
      'contact:create.contact:authInfo',
      'contact:info.contact:authInfo',
      'contact:transfer.contact:authInfo',
      'contact:update.contact:chg.contact:authInfo',
      'contact:infData.contact:authInfo',
    ],
  },
  {
    nodeName: 'contact:disclose',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:create',
      'contact:update.contact:chg',
      'contact:infData',
    ],
  },
  { nodeName: 'host:create', parentPaths: ['epp:epp.epp:command.epp:create'] },
  {
    nodeName: 'host:name',
    parentPaths: [
      'epp:epp.epp:command.epp:create.host:create',
      'epp:epp.epp:command.epp:delete.host:delete',
      'epp:epp.epp:command.epp:info.host:info',
      'epp:epp.epp:command.epp:update.host:update',
      'epp:epp.epp:command.epp:update.host:update.host:chg',
      'epp:epp.epp:response.epp:resData.host:chkData.host:cd',
      'epp:epp.epp:response.epp:resData.host:creData',
      'epp:epp.epp:response.epp:resData.host:infData',
      'epp:epp.epp:response.epp:resData.host:panData',
      'host:create',
      'host:delete',
      'host:info',
      'host:update',
      'host:update.host:chg',
      'host:chkData.host:cd',
      'host:creData',
      'host:infData',
      'host:panData',
    ],
  },
  { nodeName: 'epp:delete', parentPaths: ['epp:epp.epp:command'] },
  {
    nodeName: 'domain:delete',
    parentPaths: ['epp:epp.epp:command.epp:delete'],
  },
  {
    nodeName: 'contact:delete',
    parentPaths: ['epp:epp.epp:command.epp:delete'],
  },
  { nodeName: 'host:delete', parentPaths: ['epp:epp.epp:command.epp:delete'] },
  { nodeName: 'epp:info', parentPaths: ['epp:epp.epp:command'] },
  { nodeName: 'domain:info', parentPaths: ['epp:epp.epp:command.epp:info'] },
  { nodeName: 'contact:info', parentPaths: ['epp:epp.epp:command.epp:info'] },
  { nodeName: 'host:info', parentPaths: ['epp:epp.epp:command.epp:info'] },
  { nodeName: 'epp:login', parentPaths: ['epp:epp.epp:command'] },
  { nodeName: 'epp:clID', parentPaths: ['epp:epp.epp:command.epp:login'] },
  { nodeName: 'epp:pw', parentPaths: ['epp:epp.epp:command.epp:login'] },
  { nodeName: 'epp:newPW', parentPaths: ['epp:epp.epp:command.epp:login'] },
  { nodeName: 'epp:options', parentPaths: ['epp:epp.epp:command.epp:login'] },
  {
    nodeName: 'epp:version',
    parentPaths: ['epp:epp.epp:command.epp:login.epp:options'],
  },
  {
    nodeName: 'epp:lang',
    parentPaths: ['epp:epp.epp:command.epp:login.epp:options'],
  },
  { nodeName: 'epp:svcs', parentPaths: ['epp:epp.epp:command.epp:login'] },
  { nodeName: 'epp:logout', parentPaths: ['epp:epp.epp:command'] },
  { nodeName: 'epp:poll', parentPaths: ['epp:epp.epp:command'] },
  { nodeName: 'epp:renew', parentPaths: ['epp:epp.epp:command'] },
  { nodeName: 'domain:renew', parentPaths: ['epp:epp.epp:command.epp:renew'] },
  {
    nodeName: 'domain:curExpDate',
    parentPaths: ['epp:epp.epp:command.epp:renew.domain:renew', 'domain:renew'],
  },
  { nodeName: 'epp:transfer', parentPaths: ['epp:epp.epp:command'] },
  {
    nodeName: 'domain:transfer',
    parentPaths: ['epp:epp.epp:command.epp:transfer'],
  },
  {
    nodeName: 'contact:transfer',
    parentPaths: ['epp:epp.epp:command.epp:transfer'],
  },
  { nodeName: 'epp:update', parentPaths: ['epp:epp.epp:command'] },
  {
    nodeName: 'domain:update',
    parentPaths: ['epp:epp.epp:command.epp:update'],
  },
  {
    nodeName: 'domain:add',
    parentPaths: [
      'epp:epp.epp:command.epp:update.domain:update',
      'domain:update',
    ],
  },
  {
    nodeName: 'domain:rem',
    parentPaths: [
      'epp:epp.epp:command.epp:update.domain:update',
      'domain:update',
    ],
  },
  {
    nodeName: 'domain:chg',
    parentPaths: [
      'epp:epp.epp:command.epp:update.domain:update',
      'domain:update',
    ],
  },
  {
    nodeName: 'domain:null',
    parentPaths: [
      'epp:epp.epp:command.epp:update.domain:update.domain:chg.domain:authInfo',
      'domain:update.domain:chg.domain:authInfo',
    ],
  },
  {
    nodeName: 'contact:update',
    parentPaths: ['epp:epp.epp:command.epp:update'],
  },
  {
    nodeName: 'contact:add',
    parentPaths: [
      'epp:epp.epp:command.epp:update.contact:update',
      'contact:update',
    ],
  },
  {
    nodeName: 'contact:rem',
    parentPaths: [
      'epp:epp.epp:command.epp:update.contact:update',
      'contact:update',
    ],
  },
  {
    nodeName: 'contact:chg',
    parentPaths: [
      'epp:epp.epp:command.epp:update.contact:update',
      'contact:update',
    ],
  },
  { nodeName: 'host:update', parentPaths: ['epp:epp.epp:command.epp:update'] },
  {
    nodeName: 'host:add',
    parentPaths: ['epp:epp.epp:command.epp:update.host:update', 'host:update'],
  },
  {
    nodeName: 'host:rem',
    parentPaths: ['epp:epp.epp:command.epp:update.host:update', 'host:update'],
  },
  {
    nodeName: 'host:chg',
    parentPaths: ['epp:epp.epp:command.epp:update.host:update', 'host:update'],
  },
  { nodeName: 'epp:response', parentPaths: ['epp:epp'] },
  {
    nodeName: 'epp:msg',
    parentPaths: [
      'epp:epp.epp:response.epp:result',
      'epp:epp.epp:response.epp:msgQ',
    ],
  },
  {
    nodeName: 'epp:value',
    parentPaths: [
      'epp:epp.epp:response.epp:result',
      'epp:epp.epp:response.epp:result.epp:extValue',
    ],
  },
  {
    nodeName: 'epp:extValue',
    parentPaths: ['epp:epp.epp:response.epp:result'],
  },
  {
    nodeName: 'epp:reason',
    parentPaths: ['epp:epp.epp:response.epp:result.epp:extValue'],
  },
  { nodeName: 'epp:msgQ', parentPaths: ['epp:epp.epp:response'] },
  { nodeName: 'epp:qDate', parentPaths: ['epp:epp.epp:response.epp:msgQ'] },
  { nodeName: 'epp:resData', parentPaths: ['epp:epp.epp:response'] },
  {
    nodeName: 'domain:chkData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'domain:reason',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:chkData.domain:cd',
      'domain:chkData.domain:cd',
    ],
  },
  {
    nodeName: 'domain:creData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'domain:crDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:creData',
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:creData',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:exDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:creData',
      'epp:epp.epp:response.epp:resData.domain:infData',
      'epp:epp.epp:response.epp:resData.domain:renData',
      'epp:epp.epp:response.epp:resData.domain:trnData',
      'domain:creData',
      'domain:infData',
      'domain:renData',
      'domain:trnData',
    ],
  },
  {
    nodeName: 'domain:infData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'domain:roid',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:clID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:crID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:upID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:upDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:trDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:panData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'domain:paTRID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:panData',
      'domain:panData',
    ],
  },
  {
    nodeName: 'epp:svTRID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:panData.domain:paTRID',
      'epp:epp.epp:response.epp:resData.contact:panData.contact:paTRID',
      'epp:epp.epp:response.epp:resData.host:panData.host:paTRID',
      'epp:epp.epp:response.epp:trID',
      'domain:panData.domain:paTRID',
      'contact:panData.contact:paTRID',
      'host:panData.host:paTRID',
    ],
  },
  {
    nodeName: 'domain:paDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:panData',
      'domain:panData',
    ],
  },
  {
    nodeName: 'domain:renData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'domain:trnData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'domain:trStatus',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:trnData',
      'domain:trnData',
    ],
  },
  {
    nodeName: 'domain:reID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:trnData',
      'domain:trnData',
    ],
  },
  {
    nodeName: 'domain:reDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:trnData',
      'domain:trnData',
    ],
  },
  {
    nodeName: 'domain:acID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:trnData',
      'domain:trnData',
    ],
  },
  {
    nodeName: 'domain:acDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:trnData',
      'domain:trnData',
    ],
  },
  {
    nodeName: 'contact:chkData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'contact:reason',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:chkData.contact:cd',
      'contact:chkData.contact:cd',
    ],
  },
  {
    nodeName: 'contact:creData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'contact:crDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:creData',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:creData',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:infData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'contact:roid',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:clID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:crID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:upID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:upDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:trDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:panData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'contact:paTRID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:panData',
      'contact:panData',
    ],
  },
  {
    nodeName: 'contact:paDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:panData',
      'contact:panData',
    ],
  },
  {
    nodeName: 'contact:trnData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'contact:trStatus',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:trnData',
      'contact:trnData',
    ],
  },
  {
    nodeName: 'contact:reID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:trnData',
      'contact:trnData',
    ],
  },
  {
    nodeName: 'contact:reDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:trnData',
      'contact:trnData',
    ],
  },
  {
    nodeName: 'contact:acID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:trnData',
      'contact:trnData',
    ],
  },
  {
    nodeName: 'contact:acDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:trnData',
      'contact:trnData',
    ],
  },
  {
    nodeName: 'host:chkData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'host:reason',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:chkData.host:cd',
      'host:chkData.host:cd',
    ],
  },
  {
    nodeName: 'host:creData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'host:crDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:creData',
      'epp:epp.epp:response.epp:resData.host:infData',
      'host:creData',
      'host:infData',
    ],
  },
  {
    nodeName: 'host:infData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'host:roid',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:infData',
      'host:infData',
    ],
  },
  {
    nodeName: 'host:clID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:infData',
      'host:infData',
    ],
  },
  {
    nodeName: 'host:crID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:infData',
      'host:infData',
    ],
  },
  {
    nodeName: 'host:upID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:infData',
      'host:infData',
    ],
  },
  {
    nodeName: 'host:upDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:infData',
      'host:infData',
    ],
  },
  {
    nodeName: 'host:trDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:infData',
      'host:infData',
    ],
  },
  {
    nodeName: 'host:panData',
    parentPaths: ['epp:epp.epp:response.epp:resData'],
  },
  {
    nodeName: 'host:paTRID',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:panData',
      'host:panData',
    ],
  },
  {
    nodeName: 'host:paDate',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:panData',
      'host:panData',
    ],
  },
  {
    nodeName: 'idn:data',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'idn:table',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.idn:data',
      'epp:epp.epp:extension.idn:data',
      'idn:data',
    ],
  },
  {
    nodeName: 'idn:uname',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.idn:data',
      'epp:epp.epp:extension.idn:data',
      'idn:data',
    ],
  },
  {
    nodeName: 'fee:chkData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'fee:objID',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.fee:chkData.fee:cd',
      'epp:epp.epp:extension.fee:chkData.fee:cd',
      'fee:chkData.fee:cd',
    ],
  },
  {
    nodeName: 'fee:class',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.fee:chkData.fee:cd',
      'epp:epp.epp:extension.fee:chkData.fee:cd',
      'fee:chkData.fee:cd',
    ],
  },
  {
    nodeName: 'fee:reason',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.fee:chkData.fee:cd.fee:command',
      'epp:epp.epp:response.epp:extension.fee:chkData.fee:cd',
      'epp:epp.epp:extension.fee:chkData.fee:cd.fee:command',
      'epp:epp.epp:extension.fee:chkData.fee:cd',
      'fee:chkData.fee:cd.fee:command',
      'fee:chkData.fee:cd',
    ],
  },
  {
    nodeName: 'fee:creData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'fee:balance',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.fee:creData',
      'epp:epp.epp:response.epp:extension.fee:renData',
      'epp:epp.epp:response.epp:extension.fee:trnData',
      'epp:epp.epp:response.epp:extension.fee:updData',
      'epp:epp.epp:response.epp:extension.fee:delData',
      'epp:epp.epp:extension.fee:creData',
      'epp:epp.epp:extension.fee:renData',
      'epp:epp.epp:extension.fee:trnData',
      'epp:epp.epp:extension.fee:updData',
      'epp:epp.epp:extension.fee:delData',
      'fee:creData',
      'fee:renData',
      'fee:trnData',
      'fee:updData',
      'fee:delData',
    ],
  },
  {
    nodeName: 'fee:creditLimit',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.fee:creData',
      'epp:epp.epp:response.epp:extension.fee:renData',
      'epp:epp.epp:response.epp:extension.fee:trnData',
      'epp:epp.epp:response.epp:extension.fee:updData',
      'epp:epp.epp:response.epp:extension.fee:delData',
      'epp:epp.epp:extension.fee:creData',
      'epp:epp.epp:extension.fee:renData',
      'epp:epp.epp:extension.fee:trnData',
      'epp:epp.epp:extension.fee:updData',
      'epp:epp.epp:extension.fee:delData',
      'fee:creData',
      'fee:renData',
      'fee:trnData',
      'fee:updData',
      'fee:delData',
    ],
  },
  {
    nodeName: 'fee:renData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'fee:trnData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'fee:updData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'fee:delData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'secDNS:infData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'rgp:infData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'rgp:upData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'launch:chkData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'launch:name',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.launch:chkData.launch:cd',
      'epp:epp.epp:extension.launch:chkData.launch:cd',
      'launch:chkData.launch:cd',
    ],
  },
  {
    nodeName: 'launch:claimKey',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.launch:chkData.launch:cd',
      'epp:epp.epp:extension.launch:chkData.launch:cd',
      'launch:chkData.launch:cd',
    ],
  },
  {
    nodeName: 'launch:creData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'launch:infData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  {
    nodeName: 'launch:status',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.launch:infData',
      'epp:epp.epp:extension.launch:infData',
      'launch:infData',
    ],
  },
  {
    nodeName: 'artRecord:infData',
    parentPaths: [
      'epp:epp.epp:response.epp:extension',
      'epp:epp.epp:extension',
    ],
  },
  { nodeName: 'epp:trID', parentPaths: ['epp:epp.epp:response'] },
  {
    nodeName: 'mark:id',
    parentPaths: [
      'mark:mark.mark:trademark',
      'mark:mark.mark:treatyOrStatute',
      'mark:mark.mark:court',
    ],
  },
  {
    nodeName: 'mark:markName',
    parentPaths: [
      'mark:mark.mark:trademark',
      'mark:mark.mark:treatyOrStatute',
      'mark:mark.mark:court',
    ],
  },
  {
    nodeName: 'mark:name',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder',
      'mark:mark.mark:trademark.mark:contact',
      'mark:mark.mark:treatyOrStatute.mark:holder',
      'mark:mark.mark:treatyOrStatute.mark:contact',
      'mark:mark.mark:court.mark:holder',
      'mark:mark.mark:court.mark:contact',
    ],
  },
  {
    nodeName: 'mark:org',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder',
      'mark:mark.mark:trademark.mark:contact',
      'mark:mark.mark:treatyOrStatute.mark:holder',
      'mark:mark.mark:treatyOrStatute.mark:contact',
      'mark:mark.mark:court.mark:holder',
      'mark:mark.mark:court.mark:contact',
    ],
  },
  {
    nodeName: 'mark:addr',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder',
      'mark:mark.mark:trademark.mark:contact',
      'mark:mark.mark:treatyOrStatute.mark:holder',
      'mark:mark.mark:treatyOrStatute.mark:contact',
      'mark:mark.mark:court.mark:holder',
      'mark:mark.mark:court.mark:contact',
    ],
  },
  {
    nodeName: 'mark:city',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder.mark:addr',
      'mark:mark.mark:trademark.mark:contact.mark:addr',
      'mark:mark.mark:treatyOrStatute.mark:holder.mark:addr',
      'mark:mark.mark:treatyOrStatute.mark:contact.mark:addr',
      'mark:mark.mark:court.mark:holder.mark:addr',
      'mark:mark.mark:court.mark:contact.mark:addr',
    ],
  },
  {
    nodeName: 'mark:sp',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder.mark:addr',
      'mark:mark.mark:trademark.mark:contact.mark:addr',
      'mark:mark.mark:treatyOrStatute.mark:holder.mark:addr',
      'mark:mark.mark:treatyOrStatute.mark:contact.mark:addr',
      'mark:mark.mark:court.mark:holder.mark:addr',
      'mark:mark.mark:court.mark:contact.mark:addr',
    ],
  },
  {
    nodeName: 'mark:pc',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder.mark:addr',
      'mark:mark.mark:trademark.mark:contact.mark:addr',
      'mark:mark.mark:treatyOrStatute.mark:holder.mark:addr',
      'mark:mark.mark:treatyOrStatute.mark:contact.mark:addr',
      'mark:mark.mark:court.mark:holder.mark:addr',
      'mark:mark.mark:court.mark:contact.mark:addr',
    ],
  },
  {
    nodeName: 'mark:cc',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder.mark:addr',
      'mark:mark.mark:trademark.mark:contact.mark:addr',
      'mark:mark.mark:treatyOrStatute.mark:holder.mark:addr',
      'mark:mark.mark:treatyOrStatute.mark:contact.mark:addr',
      'mark:mark.mark:treatyOrStatute.mark:protection',
      'mark:mark.mark:court.mark:holder.mark:addr',
      'mark:mark.mark:court.mark:contact.mark:addr',
      'mark:mark.mark:court',
    ],
  },
  {
    nodeName: 'mark:voice',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder',
      'mark:mark.mark:trademark.mark:contact',
      'mark:mark.mark:treatyOrStatute.mark:holder',
      'mark:mark.mark:treatyOrStatute.mark:contact',
      'mark:mark.mark:court.mark:holder',
      'mark:mark.mark:court.mark:contact',
    ],
  },
  {
    nodeName: 'mark:fax',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder',
      'mark:mark.mark:trademark.mark:contact',
      'mark:mark.mark:treatyOrStatute.mark:holder',
      'mark:mark.mark:treatyOrStatute.mark:contact',
      'mark:mark.mark:court.mark:holder',
      'mark:mark.mark:court.mark:contact',
    ],
  },
  {
    nodeName: 'mark:email',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder',
      'mark:mark.mark:trademark.mark:contact',
      'mark:mark.mark:treatyOrStatute.mark:holder',
      'mark:mark.mark:treatyOrStatute.mark:contact',
      'mark:mark.mark:court.mark:holder',
      'mark:mark.mark:court.mark:contact',
    ],
  },
  { nodeName: 'mark:jurisdiction', parentPaths: ['mark:mark.mark:trademark'] },
  {
    nodeName: 'mark:goodsAndServices',
    parentPaths: [
      'mark:mark.mark:trademark',
      'mark:mark.mark:treatyOrStatute',
      'mark:mark.mark:court',
    ],
  },
  { nodeName: 'mark:apId', parentPaths: ['mark:mark.mark:trademark'] },
  { nodeName: 'mark:apDate', parentPaths: ['mark:mark.mark:trademark'] },
  { nodeName: 'mark:regNum', parentPaths: ['mark:mark.mark:trademark'] },
  { nodeName: 'mark:regDate', parentPaths: ['mark:mark.mark:trademark'] },
  { nodeName: 'mark:exDate', parentPaths: ['mark:mark.mark:trademark'] },
  {
    nodeName: 'mark:region',
    parentPaths: ['mark:mark.mark:treatyOrStatute.mark:protection'],
  },
  {
    nodeName: 'mark:refNum',
    parentPaths: ['mark:mark.mark:treatyOrStatute', 'mark:mark.mark:court'],
  },
  {
    nodeName: 'mark:proDate',
    parentPaths: ['mark:mark.mark:treatyOrStatute', 'mark:mark.mark:court'],
  },
  { nodeName: 'mark:title', parentPaths: ['mark:mark.mark:treatyOrStatute'] },
  {
    nodeName: 'mark:execDate',
    parentPaths: ['mark:mark.mark:treatyOrStatute'],
  },
  { nodeName: 'mark:courtName', parentPaths: ['mark:mark.mark:court'] },
  { nodeName: 'signedMark:id', parentPaths: ['signedMark:signedMark'] },
  { nodeName: 'signedMark:issuerInfo', parentPaths: ['signedMark:signedMark'] },
  {
    nodeName: 'signedMark:org',
    parentPaths: ['signedMark:signedMark.signedMark:issuerInfo'],
  },
  {
    nodeName: 'signedMark:email',
    parentPaths: ['signedMark:signedMark.signedMark:issuerInfo'],
  },
  {
    nodeName: 'signedMark:url',
    parentPaths: ['signedMark:signedMark.signedMark:issuerInfo'],
  },
  {
    nodeName: 'signedMark:voice',
    parentPaths: ['signedMark:signedMark.signedMark:issuerInfo'],
  },
  { nodeName: 'signedMark:notBefore', parentPaths: ['signedMark:signedMark'] },
  { nodeName: 'signedMark:notAfter', parentPaths: ['signedMark:signedMark'] },
  { nodeName: 'xmldsig:Signature', parentPaths: ['signedMark:signedMark'] },
  {
    nodeName: 'xmldsig:SignedInfo',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature',
      'xmldsig:Signature',
    ],
  },
  {
    nodeName: 'xmldsig:CanonicalizationMethod',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo',
      'xmldsig:Signature.xmldsig:SignedInfo',
      'xmldsig:SignedInfo',
    ],
  },
  {
    nodeName: 'xmldsig:SignatureMethod',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo',
      'xmldsig:Signature.xmldsig:SignedInfo',
      'xmldsig:SignedInfo',
    ],
  },
  {
    nodeName: 'xmldsig:HMACOutputLength',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo.xmldsig:SignatureMethod',
      'xmldsig:Signature.xmldsig:SignedInfo.xmldsig:SignatureMethod',
      'xmldsig:SignedInfo.xmldsig:SignatureMethod',
      'xmldsig:SignatureMethod',
    ],
  },
  {
    nodeName: 'xmldsig:Transforms',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference',
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:RetrievalMethod',
      'xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:RetrievalMethod',
      'xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:Reference',
      'xmldsig:KeyInfo.xmldsig:RetrievalMethod',
      'xmldsig:RetrievalMethod',
      'xmldsig:Manifest.xmldsig:Reference',
    ],
  },
  {
    nodeName: 'xmldsig:XPath',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference.xmldsig:Transforms.xmldsig:Transform',
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:RetrievalMethod.xmldsig:Transforms.xmldsig:Transform',
      'xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference.xmldsig:Transforms.xmldsig:Transform',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:RetrievalMethod.xmldsig:Transforms.xmldsig:Transform',
      'xmldsig:SignedInfo.xmldsig:Reference.xmldsig:Transforms.xmldsig:Transform',
      'xmldsig:Reference.xmldsig:Transforms.xmldsig:Transform',
      'xmldsig:Transforms.xmldsig:Transform',
      'xmldsig:Transform',
      'xmldsig:KeyInfo.xmldsig:RetrievalMethod.xmldsig:Transforms.xmldsig:Transform',
      'xmldsig:RetrievalMethod.xmldsig:Transforms.xmldsig:Transform',
      'xmldsig:Manifest.xmldsig:Reference.xmldsig:Transforms.xmldsig:Transform',
    ],
  },
  {
    nodeName: 'xmldsig:DigestMethod',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:Reference',
      'xmldsig:Manifest.xmldsig:Reference',
    ],
  },
  {
    nodeName: 'xmldsig:DigestValue',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:Reference',
      'xmldsig:Manifest.xmldsig:Reference',
    ],
  },
  {
    nodeName: 'xmldsig:SignatureValue',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature',
      'xmldsig:Signature',
    ],
  },
  {
    nodeName: 'xmldsig:KeyInfo',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature',
      'xmldsig:Signature',
    ],
  },
  {
    nodeName: 'xmldsig:KeyName',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:KeyInfo',
    ],
  },
  {
    nodeName: 'xmldsig:KeyValue',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:KeyInfo',
    ],
  },
  {
    nodeName: 'xmldsig:DSAKeyValue',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue',
      'xmldsig:KeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:G',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:DSAKeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:Y',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:DSAKeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:J',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:DSAKeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:P',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:DSAKeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:Q',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:DSAKeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:Seed',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:DSAKeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:PgenCounter',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:KeyValue.xmldsig:DSAKeyValue',
      'xmldsig:DSAKeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:RSAKeyValue',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue',
      'xmldsig:KeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:Modulus',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:RSAKeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:RSAKeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:RSAKeyValue',
      'xmldsig:KeyValue.xmldsig:RSAKeyValue',
      'xmldsig:RSAKeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:Exponent',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:RSAKeyValue',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:RSAKeyValue',
      'xmldsig:KeyInfo.xmldsig:KeyValue.xmldsig:RSAKeyValue',
      'xmldsig:KeyValue.xmldsig:RSAKeyValue',
      'xmldsig:RSAKeyValue',
    ],
  },
  {
    nodeName: 'xmldsig:RetrievalMethod',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:KeyInfo',
    ],
  },
  {
    nodeName: 'xmldsig:X509Data',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:KeyInfo',
    ],
  },
  {
    nodeName: 'xmldsig:X509IssuerSerial',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:X509Data',
    ],
  },
  {
    nodeName: 'xmldsig:X509IssuerName',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data.xmldsig:X509IssuerSerial',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data.xmldsig:X509IssuerSerial',
      'xmldsig:KeyInfo.xmldsig:X509Data.xmldsig:X509IssuerSerial',
      'xmldsig:X509Data.xmldsig:X509IssuerSerial',
    ],
  },
  {
    nodeName: 'xmldsig:X509SerialNumber',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data.xmldsig:X509IssuerSerial',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data.xmldsig:X509IssuerSerial',
      'xmldsig:KeyInfo.xmldsig:X509Data.xmldsig:X509IssuerSerial',
      'xmldsig:X509Data.xmldsig:X509IssuerSerial',
    ],
  },
  {
    nodeName: 'xmldsig:X509SKI',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:X509Data',
    ],
  },
  {
    nodeName: 'xmldsig:X509SubjectName',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:X509Data',
    ],
  },
  {
    nodeName: 'xmldsig:X509Certificate',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:X509Data',
    ],
  },
  {
    nodeName: 'xmldsig:X509CRL',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:KeyInfo.xmldsig:X509Data',
      'xmldsig:X509Data',
    ],
  },
  {
    nodeName: 'xmldsig:PGPData',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:KeyInfo',
    ],
  },
  {
    nodeName: 'xmldsig:PGPKeyID',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:PGPData',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:PGPData',
      'xmldsig:KeyInfo.xmldsig:PGPData',
      'xmldsig:PGPData',
    ],
  },
  {
    nodeName: 'xmldsig:PGPKeyPacket',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:PGPData',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:PGPData',
      'xmldsig:KeyInfo.xmldsig:PGPData',
      'xmldsig:PGPData',
    ],
  },
  {
    nodeName: 'xmldsig:SPKIData',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:KeyInfo',
    ],
  },
  {
    nodeName: 'xmldsig:SPKISexp',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:SPKIData',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:SPKIData',
      'xmldsig:KeyInfo.xmldsig:SPKIData',
      'xmldsig:SPKIData',
    ],
  },
  {
    nodeName: 'xmldsig:MgmtData',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:KeyInfo',
    ],
  },
];

// Build a lookup map for efficient singular node checking
const singularNodeMap = new Map<string, Set<string>>();
for (const sn of singularNodes) {
  if (sn.parentPaths && sn.parentPaths.length > 0) {
    singularNodeMap.set(sn.nodeName, new Set(sn.parentPaths));
  }
}

/**
 * Check if a node is singular (should not be wrapped in array) at the given jpath.
 *
 * @param nodeName - The prefixed node name (e.g., "epp:command")
 * @param jpath - The full jpath from fast-xml-parser (e.g., "epp:epp.epp:command")
 * @returns true if the node is singular, false if it should be an array
 *
 * @example
 * // Configure fast-xml-parser with this predicate
 * const parser = new XMLParser({
 *   isArray: (name, jpath) => !isSingularNode(name, jpath)
 * });
 */
export const isSingularNode = (nodeName: string, jpath: string): boolean => {
  const entry = singularNodeMap.get(nodeName);
  if (!entry) {
    // Not in singular list - treat as array
    return false;
  }

  // Extract parent path from jpath by removing the last segment (nodeName)
  // jpath format: "epp:epp.epp:command" -> parent is "epp:epp"
  const lastDotIndex = jpath.lastIndexOf('.');
  const parentPath = lastDotIndex > 0 ? jpath.substring(0, lastDotIndex) : '';

  // Check if the parentPath matches any of the singular paths
  return entry.has(parentPath);
};

/**
 * Information about nodes that have attributes defined in the XSD.
 * Used by doesNodeHaveAttributes() predicate for XML parsing value handling.
 */
export interface NodeWithAttributesInfo {
  /** Prefixed node name (e.g., "domain:name") */
  nodeName: string;
  /** Parent paths where this node has attributes. If undefined, always has attributes. */
  parentPaths?: string[];
}

export const nodesWithAttributes: NodeWithAttributesInfo[] = [
  {
    nodeName: 'fee:command',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.fee:check',
      'epp:epp.epp:response.epp:extension.fee:chkData.fee:cd',
      'epp:epp.epp:extension.fee:check',
      'epp:epp.epp:extension.fee:chkData.fee:cd',
      'fee:check',
      'fee:chkData.fee:cd',
    ],
  },
  {
    nodeName: 'fee:period',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.fee:check.fee:command',
      'epp:epp.epp:response.epp:extension.fee:creData',
      'epp:epp.epp:response.epp:extension.fee:renData',
      'epp:epp.epp:response.epp:extension.fee:trnData',
      'epp:epp.epp:response.epp:extension.fee:updData',
      'epp:epp.epp:response.epp:extension.fee:delData',
      'epp:epp.epp:extension.fee:check.fee:command',
      'epp:epp.epp:extension.fee:creData',
      'epp:epp.epp:extension.fee:renData',
      'epp:epp.epp:extension.fee:trnData',
      'epp:epp.epp:extension.fee:updData',
      'epp:epp.epp:extension.fee:delData',
      'fee:check.fee:command',
      'fee:creData',
      'fee:renData',
      'fee:trnData',
      'fee:updData',
      'fee:delData',
    ],
  },
  {
    nodeName: 'fee:fee',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.fee:create',
      'epp:epp.epp:command.epp:extension.fee:renew',
      'epp:epp.epp:command.epp:extension.fee:transfer',
      'epp:epp.epp:command.epp:extension.fee:update',
      'epp:epp.epp:response.epp:extension.fee:chkData.fee:cd.fee:command',
      'epp:epp.epp:response.epp:extension.fee:creData',
      'epp:epp.epp:response.epp:extension.fee:renData',
      'epp:epp.epp:response.epp:extension.fee:trnData',
      'epp:epp.epp:response.epp:extension.fee:updData',
      'epp:epp.epp:response.epp:extension.fee:delData',
      'epp:epp.epp:extension.fee:create',
      'epp:epp.epp:extension.fee:renew',
      'epp:epp.epp:extension.fee:transfer',
      'epp:epp.epp:extension.fee:update',
      'epp:epp.epp:extension.fee:chkData.fee:cd.fee:command',
      'epp:epp.epp:extension.fee:creData',
      'epp:epp.epp:extension.fee:renData',
      'epp:epp.epp:extension.fee:trnData',
      'epp:epp.epp:extension.fee:updData',
      'epp:epp.epp:extension.fee:delData',
      'fee:chkData.fee:cd.fee:command',
      'fee:create',
      'fee:creData',
      'fee:renew',
      'fee:renData',
      'fee:transfer',
      'fee:trnData',
      'fee:update',
      'fee:updData',
      'fee:delData',
    ],
  },
  {
    nodeName: 'fee:credit',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.fee:create',
      'epp:epp.epp:command.epp:extension.fee:renew',
      'epp:epp.epp:command.epp:extension.fee:transfer',
      'epp:epp.epp:command.epp:extension.fee:update',
      'epp:epp.epp:response.epp:extension.fee:chkData.fee:cd.fee:command',
      'epp:epp.epp:response.epp:extension.fee:creData',
      'epp:epp.epp:response.epp:extension.fee:renData',
      'epp:epp.epp:response.epp:extension.fee:trnData',
      'epp:epp.epp:response.epp:extension.fee:updData',
      'epp:epp.epp:response.epp:extension.fee:delData',
      'epp:epp.epp:extension.fee:create',
      'epp:epp.epp:extension.fee:renew',
      'epp:epp.epp:extension.fee:transfer',
      'epp:epp.epp:extension.fee:update',
      'epp:epp.epp:extension.fee:chkData.fee:cd.fee:command',
      'epp:epp.epp:extension.fee:creData',
      'epp:epp.epp:extension.fee:renData',
      'epp:epp.epp:extension.fee:trnData',
      'epp:epp.epp:extension.fee:updData',
      'epp:epp.epp:extension.fee:delData',
      'fee:chkData.fee:cd.fee:command',
      'fee:create',
      'fee:creData',
      'fee:renew',
      'fee:renData',
      'fee:transfer',
      'fee:trnData',
      'fee:update',
      'fee:updData',
      'fee:delData',
    ],
  },
  {
    nodeName: 'secDNS:update',
    parentPaths: [
      'epp:epp.epp:command.epp:extension',
      'epp:epp.epp:extension',
      '',
    ],
  },
  {
    nodeName: 'rgp:restore',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update',
      'epp:epp.epp:extension.rgp:update',
      'rgp:update',
    ],
  },
  {
    nodeName: 'rgp:resReason',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update.rgp:restore.rgp:report',
      'epp:epp.epp:extension.rgp:update.rgp:restore.rgp:report',
      'rgp:update.rgp:restore.rgp:report',
    ],
  },
  {
    nodeName: 'rgp:statement',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.rgp:update.rgp:restore.rgp:report',
      'epp:epp.epp:extension.rgp:update.rgp:restore.rgp:report',
      'rgp:update.rgp:restore.rgp:report',
    ],
  },
  {
    nodeName: 'launch:check',
    parentPaths: [
      'epp:epp.epp:command.epp:extension',
      'epp:epp.epp:extension',
      '',
    ],
  },
  {
    nodeName: 'launch:phase',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:check',
      'epp:epp.epp:command.epp:extension.launch:info',
      'epp:epp.epp:command.epp:extension.launch:create',
      'epp:epp.epp:command.epp:extension.launch:update',
      'epp:epp.epp:command.epp:extension.launch:delete',
      'epp:epp.epp:response.epp:extension.launch:chkData',
      'epp:epp.epp:response.epp:extension.launch:creData',
      'epp:epp.epp:response.epp:extension.launch:infData',
      'epp:epp.epp:extension.launch:check',
      'epp:epp.epp:extension.launch:info',
      'epp:epp.epp:extension.launch:create',
      'epp:epp.epp:extension.launch:update',
      'epp:epp.epp:extension.launch:delete',
      'epp:epp.epp:extension.launch:chkData',
      'epp:epp.epp:extension.launch:creData',
      'epp:epp.epp:extension.launch:infData',
      'launch:check',
      'launch:info',
      'launch:create',
      'launch:update',
      'launch:delete',
      'launch:chkData',
      'launch:creData',
      'launch:infData',
    ],
  },
  {
    nodeName: 'launch:info',
    parentPaths: [
      'epp:epp.epp:command.epp:extension',
      'epp:epp.epp:extension',
      '',
    ],
  },
  {
    nodeName: 'launch:create',
    parentPaths: [
      'epp:epp.epp:command.epp:extension',
      'epp:epp.epp:extension',
      '',
    ],
  },
  {
    nodeName: 'launch:noticeID',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:create.launch:notice',
      'epp:epp.epp:extension.launch:create.launch:notice',
      'launch:create.launch:notice',
    ],
  },
  {
    nodeName: 'launch:code',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:create.launch:codeMark',
      'epp:epp.epp:extension.launch:create.launch:codeMark',
      'launch:create.launch:codeMark',
    ],
  },
  {
    nodeName: 'signedMark:encodedSignedMark',
    parentPaths: [
      'epp:epp.epp:command.epp:extension.launch:create',
      'epp:epp.epp:extension.launch:create',
      'launch:create',
      '',
    ],
  },
  {
    nodeName: 'domain:period',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create',
      'epp:epp.epp:command.epp:renew.domain:renew',
      'epp:epp.epp:command.epp:transfer.domain:transfer',
      'domain:create',
      'domain:renew',
      'domain:transfer',
    ],
  },
  {
    nodeName: 'domain:hostAddr',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create.domain:ns.domain:hostAttr',
      'epp:epp.epp:command.epp:update.domain:update.domain:add.domain:ns.domain:hostAttr',
      'epp:epp.epp:command.epp:update.domain:update.domain:rem.domain:ns.domain:hostAttr',
      'epp:epp.epp:response.epp:resData.domain:infData.domain:ns.domain:hostAttr',
      'domain:create.domain:ns.domain:hostAttr',
      'domain:update.domain:add.domain:ns.domain:hostAttr',
      'domain:update.domain:rem.domain:ns.domain:hostAttr',
      'domain:infData.domain:ns.domain:hostAttr',
    ],
  },
  {
    nodeName: 'domain:contact',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create',
      'epp:epp.epp:command.epp:update.domain:update.domain:add',
      'epp:epp.epp:command.epp:update.domain:update.domain:rem',
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:create',
      'domain:update.domain:add',
      'domain:update.domain:rem',
      'domain:infData',
    ],
  },
  {
    nodeName: 'domain:pw',
    parentPaths: [
      'epp:epp.epp:command.epp:create.domain:create.domain:authInfo',
      'epp:epp.epp:command.epp:info.domain:info.domain:authInfo',
      'epp:epp.epp:command.epp:transfer.domain:transfer.domain:authInfo',
      'epp:epp.epp:command.epp:update.domain:update.domain:chg.domain:authInfo',
      'epp:epp.epp:response.epp:resData.domain:infData.domain:authInfo',
      'domain:create.domain:authInfo',
      'domain:info.domain:authInfo',
      'domain:transfer.domain:authInfo',
      'domain:update.domain:chg.domain:authInfo',
      'domain:infData.domain:authInfo',
    ],
  },
  {
    nodeName: 'contact:postalInfo',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:create',
      'contact:update.contact:chg',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:voice',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:create',
      'contact:update.contact:chg',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:fax',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:create',
      'contact:update.contact:chg',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:pw',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:authInfo',
      'epp:epp.epp:command.epp:info.contact:info.contact:authInfo',
      'epp:epp.epp:command.epp:transfer.contact:transfer.contact:authInfo',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:authInfo',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:authInfo',
      'contact:create.contact:authInfo',
      'contact:info.contact:authInfo',
      'contact:transfer.contact:authInfo',
      'contact:update.contact:chg.contact:authInfo',
      'contact:infData.contact:authInfo',
    ],
  },
  {
    nodeName: 'contact:disclose',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:create',
      'contact:update.contact:chg',
      'contact:infData',
    ],
  },
  {
    nodeName: 'contact:name',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:disclose',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:disclose',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:disclose',
      'contact:create.contact:disclose',
      'contact:update.contact:chg.contact:disclose',
      'contact:infData.contact:disclose',
    ],
  },
  {
    nodeName: 'contact:org',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:disclose',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:disclose',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:disclose',
      'contact:create.contact:disclose',
      'contact:update.contact:chg.contact:disclose',
      'contact:infData.contact:disclose',
    ],
  },
  {
    nodeName: 'contact:addr',
    parentPaths: [
      'epp:epp.epp:command.epp:create.contact:create.contact:disclose',
      'epp:epp.epp:command.epp:update.contact:update.contact:chg.contact:disclose',
      'epp:epp.epp:response.epp:resData.contact:infData.contact:disclose',
      'contact:create.contact:disclose',
      'contact:update.contact:chg.contact:disclose',
      'contact:infData.contact:disclose',
    ],
  },
  {
    nodeName: 'host:addr',
    parentPaths: [
      'epp:epp.epp:command.epp:create.host:create',
      'epp:epp.epp:command.epp:update.host:update.host:add',
      'epp:epp.epp:command.epp:update.host:update.host:rem',
      'epp:epp.epp:response.epp:resData.host:infData',
      'host:create',
      'host:update.host:add',
      'host:update.host:rem',
      'host:infData',
    ],
  },
  {
    nodeName: 'domain:name',
    parentPaths: [
      'epp:epp.epp:command.epp:info.domain:info',
      'epp:epp.epp:response.epp:resData.domain:chkData.domain:cd',
      'epp:epp.epp:response.epp:resData.domain:panData',
      'domain:info',
      'domain:chkData.domain:cd',
      'domain:panData',
    ],
  },
  { nodeName: 'epp:poll', parentPaths: ['epp:epp.epp:command'] },
  { nodeName: 'epp:transfer', parentPaths: ['epp:epp.epp:command'] },
  {
    nodeName: 'domain:status',
    parentPaths: [
      'epp:epp.epp:command.epp:update.domain:update.domain:add',
      'epp:epp.epp:command.epp:update.domain:update.domain:rem',
      'epp:epp.epp:response.epp:resData.domain:infData',
      'domain:update.domain:add',
      'domain:update.domain:rem',
      'domain:infData',
    ],
  },
  {
    nodeName: 'contact:status',
    parentPaths: [
      'epp:epp.epp:command.epp:update.contact:update.contact:add',
      'epp:epp.epp:command.epp:update.contact:update.contact:rem',
      'epp:epp.epp:response.epp:resData.contact:infData',
      'contact:update.contact:add',
      'contact:update.contact:rem',
      'contact:infData',
    ],
  },
  {
    nodeName: 'host:status',
    parentPaths: [
      'epp:epp.epp:command.epp:update.host:update.host:add',
      'epp:epp.epp:command.epp:update.host:update.host:rem',
      'epp:epp.epp:response.epp:resData.host:infData',
      'host:update.host:add',
      'host:update.host:rem',
      'host:infData',
    ],
  },
  { nodeName: 'epp:result', parentPaths: ['epp:epp.epp:response'] },
  {
    nodeName: 'epp:msg',
    parentPaths: [
      'epp:epp.epp:response.epp:result',
      'epp:epp.epp:response.epp:msgQ',
    ],
  },
  {
    nodeName: 'epp:reason',
    parentPaths: ['epp:epp.epp:response.epp:result.epp:extValue'],
  },
  { nodeName: 'epp:msgQ', parentPaths: ['epp:epp.epp:response'] },
  {
    nodeName: 'domain:reason',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.domain:chkData.domain:cd',
      'domain:chkData.domain:cd',
    ],
  },
  {
    nodeName: 'contact:id',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:chkData.contact:cd',
      'epp:epp.epp:response.epp:resData.contact:panData',
      'contact:chkData.contact:cd',
      'contact:panData',
    ],
  },
  {
    nodeName: 'contact:reason',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.contact:chkData.contact:cd',
      'contact:chkData.contact:cd',
    ],
  },
  {
    nodeName: 'host:name',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:chkData.host:cd',
      'epp:epp.epp:response.epp:resData.host:panData',
      'host:chkData.host:cd',
      'host:panData',
    ],
  },
  {
    nodeName: 'host:reason',
    parentPaths: [
      'epp:epp.epp:response.epp:resData.host:chkData.host:cd',
      'host:chkData.host:cd',
    ],
  },
  {
    nodeName: 'fee:cd',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.fee:chkData',
      'epp:epp.epp:extension.fee:chkData',
      'fee:chkData',
    ],
  },
  {
    nodeName: 'fee:objID',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.fee:chkData.fee:cd',
      'epp:epp.epp:extension.fee:chkData.fee:cd',
      'fee:chkData.fee:cd',
    ],
  },
  {
    nodeName: 'fee:reason',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.fee:chkData.fee:cd.fee:command',
      'epp:epp.epp:response.epp:extension.fee:chkData.fee:cd',
      'epp:epp.epp:extension.fee:chkData.fee:cd.fee:command',
      'epp:epp.epp:extension.fee:chkData.fee:cd',
      'fee:chkData.fee:cd.fee:command',
      'fee:chkData.fee:cd',
    ],
  },
  {
    nodeName: 'rgp:rgpStatus',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.rgp:infData',
      'epp:epp.epp:response.epp:extension.rgp:upData',
      'epp:epp.epp:extension.rgp:infData',
      'epp:epp.epp:extension.rgp:upData',
      'rgp:infData',
      'rgp:upData',
    ],
  },
  {
    nodeName: 'launch:name',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.launch:chkData.launch:cd',
      'epp:epp.epp:extension.launch:chkData.launch:cd',
      'launch:chkData.launch:cd',
    ],
  },
  {
    nodeName: 'launch:claimKey',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.launch:chkData.launch:cd',
      'epp:epp.epp:extension.launch:chkData.launch:cd',
      'launch:chkData.launch:cd',
    ],
  },
  {
    nodeName: 'launch:status',
    parentPaths: [
      'epp:epp.epp:response.epp:extension.launch:infData',
      'epp:epp.epp:extension.launch:infData',
      'launch:infData',
    ],
  },
  {
    nodeName: 'mark:holder',
    parentPaths: [
      'mark:mark.mark:trademark',
      'mark:mark.mark:treatyOrStatute',
      'mark:mark.mark:court',
    ],
  },
  {
    nodeName: 'mark:voice',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder',
      'mark:mark.mark:trademark.mark:contact',
      'mark:mark.mark:treatyOrStatute.mark:holder',
      'mark:mark.mark:treatyOrStatute.mark:contact',
      'mark:mark.mark:court.mark:holder',
      'mark:mark.mark:court.mark:contact',
    ],
  },
  {
    nodeName: 'mark:fax',
    parentPaths: [
      'mark:mark.mark:trademark.mark:holder',
      'mark:mark.mark:trademark.mark:contact',
      'mark:mark.mark:treatyOrStatute.mark:holder',
      'mark:mark.mark:treatyOrStatute.mark:contact',
      'mark:mark.mark:court.mark:holder',
      'mark:mark.mark:court.mark:contact',
    ],
  },
  {
    nodeName: 'mark:contact',
    parentPaths: [
      'mark:mark.mark:trademark',
      'mark:mark.mark:treatyOrStatute',
      'mark:mark.mark:court',
    ],
  },
  { nodeName: 'signedMark:signedMark', parentPaths: [''] },
  { nodeName: 'signedMark:issuerInfo', parentPaths: ['signedMark:signedMark'] },
  {
    nodeName: 'signedMark:voice',
    parentPaths: ['signedMark:signedMark.signedMark:issuerInfo'],
  },
  { nodeName: 'xmldsig:Signature', parentPaths: ['signedMark:signedMark', ''] },
  {
    nodeName: 'xmldsig:SignedInfo',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature',
      'xmldsig:Signature',
      '',
    ],
  },
  {
    nodeName: 'xmldsig:CanonicalizationMethod',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo',
      'xmldsig:Signature.xmldsig:SignedInfo',
      'xmldsig:SignedInfo',
      '',
    ],
  },
  {
    nodeName: 'xmldsig:SignatureMethod',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo',
      'xmldsig:Signature.xmldsig:SignedInfo',
      'xmldsig:SignedInfo',
      '',
    ],
  },
  {
    nodeName: 'xmldsig:Reference',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo',
      'xmldsig:Signature.xmldsig:SignedInfo',
      'xmldsig:SignedInfo',
      '',
      'xmldsig:Manifest',
    ],
  },
  {
    nodeName: 'xmldsig:Transform',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference.xmldsig:Transforms',
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo.xmldsig:RetrievalMethod.xmldsig:Transforms',
      'xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference.xmldsig:Transforms',
      'xmldsig:Signature.xmldsig:KeyInfo.xmldsig:RetrievalMethod.xmldsig:Transforms',
      'xmldsig:SignedInfo.xmldsig:Reference.xmldsig:Transforms',
      'xmldsig:Reference.xmldsig:Transforms',
      'xmldsig:Transforms',
      '',
      'xmldsig:KeyInfo.xmldsig:RetrievalMethod.xmldsig:Transforms',
      'xmldsig:RetrievalMethod.xmldsig:Transforms',
      'xmldsig:Manifest.xmldsig:Reference.xmldsig:Transforms',
    ],
  },
  {
    nodeName: 'xmldsig:DigestMethod',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:Signature.xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:SignedInfo.xmldsig:Reference',
      'xmldsig:Reference',
      '',
      'xmldsig:Manifest.xmldsig:Reference',
    ],
  },
  {
    nodeName: 'xmldsig:SignatureValue',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature',
      'xmldsig:Signature',
      '',
    ],
  },
  {
    nodeName: 'xmldsig:KeyInfo',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature',
      'xmldsig:Signature',
      '',
    ],
  },
  {
    nodeName: 'xmldsig:RetrievalMethod',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:Signature.xmldsig:KeyInfo',
      'xmldsig:KeyInfo',
      '',
    ],
  },
  {
    nodeName: 'xmldsig:Object',
    parentPaths: [
      'signedMark:signedMark.xmldsig:Signature',
      'xmldsig:Signature',
      '',
    ],
  },
  { nodeName: 'xmldsig:Manifest', parentPaths: [''] },
  { nodeName: 'xmldsig:SignatureProperties', parentPaths: [''] },
  {
    nodeName: 'xmldsig:SignatureProperty',
    parentPaths: ['xmldsig:SignatureProperties', ''],
  },
];

// Build a lookup map for efficient attribute checking
const nodesWithAttributesMap = new Map<string, Set<string>>();
for (const na of nodesWithAttributes) {
  if (na.parentPaths && na.parentPaths.length > 0) {
    nodesWithAttributesMap.set(na.nodeName, new Set(na.parentPaths));
  }
}

/**
 * Check if a node has attributes defined in the XSD at the given jpath.
 *
 * This is useful for configuring XML parsers to know when to expect an object
 * vs a simple string value for text-only elements.
 *
 * @param nodeName - The prefixed node name (e.g., "domain:name")
 * @param jpath - The full jpath from fast-xml-parser (e.g., "epp:epp.domain:name")
 * @returns true if the node has attributes defined, false otherwise
 *
 * @example
 * // Use with fast-xml-parser configuration
 * // When doesNodeHaveAttributes returns true, expect: { "#text": "value", "@_attr": "..." }
 * // When it returns false, expect just: "value"
 */
export const doesNodeHaveAttributes = (
  nodeName: string,
  jpath: string,
): boolean => {
  const entry = nodesWithAttributesMap.get(nodeName);
  if (!entry) {
    // Not in the list - no attributes defined
    return false;
  }

  // Extract parent path from jpath by removing the last segment (nodeName)
  // jpath format: "epp:epp.domain:name" -> parent is "epp:epp"
  const lastDotIndex = jpath.lastIndexOf('.');
  const parentPath = lastDotIndex > 0 ? jpath.substring(0, lastDotIndex) : '';

  // Check if the parentPath matches any of the paths where this node has attributes
  return entry.has(parentPath);
};
