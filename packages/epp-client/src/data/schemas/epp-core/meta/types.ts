/**
 * XmlMeta Types
 * @generated - Do not edit manually
 */

/**
 * Qualified Name: namespace + localName.
 */
export interface QName {
  namespace?: string;
  localName: string;
}

/**
 * Root metadata for Layer 2 encoding/decoding.
 */
export interface XmlMeta {
  strategyId: string;
  root: XmlNodeMeta;
}

/**
 * Metadata for a single XML element.
 */
export interface XmlNodeMeta {
  qname: QName;
  value?: XmlValueMeta;
  fields: Record<string, XmlFieldMeta>;
}

/** Common fields for field metadata. */
export interface XmlFieldBaseMeta {
  xmlName: string;
  namespace?: string;
  cardinality: 'one' | 'many';
  typeHint?: string;
}

/** Attribute field metadata. */
export interface XmlAttributeFieldMeta extends XmlFieldBaseMeta {
  kind: 'attribute';
}

/** Element field metadata. */
export interface XmlElementFieldMeta extends XmlFieldBaseMeta {
  kind: 'element';
  nodeMeta?: XmlNodeMeta;
}

/** Value metadata for text content. */
export interface XmlValueMeta extends XmlFieldBaseMeta {
  kind: 'value';
}

/** Union of field metadata types. */
export type XmlFieldMeta = XmlAttributeFieldMeta | XmlElementFieldMeta;
