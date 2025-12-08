/**
 * Zod-based EPP codec using auto-generated schemas.
 * Provides type-safe encoding (JSON -> XML) and decoding (XML -> JSON).
 */
import { z, type ZodSchema, type ZodString } from 'zod';
import {
  type X2jOptions,
  XMLParser,
  XMLBuilder,
  type XmlBuilderOptions,
} from 'fast-xml-parser';
import {
  EppEppXml,
  EppCommandTypeXml,
  EppResponseTypeXml,
  EppGreetingTypeXml,
  EppLoginTypeXml,
  EppCredsOptionsTypeXml,
  EppLoginSvcTypeXml,
  EppTrIDTypeXml,
  type EppEppTypeXml,
  type EppCommandTypeXml as EppCommandType,
  type EppResponseTypeXml as EppResponseType,
  type EppGreetingTypeXml as EppGreetingType,
  namespaces,
} from '../data/schemas/epp-core';
import { zloosen } from '../utils/zod';
import util from 'node:util';

// Re-export types for convenience
export type { EppEppTypeXml, EppCommandType, EppResponseType, EppGreetingType };

// XML parser/builder configuration
const parserOptions: X2jOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  ignoreDeclaration: true,
  trimValues: true,
  // isArray: (tagName, jPath, isLeafNode, isAttribute) => {
  //   if (tagName === "epp:epp") return false;
  //   if (isAttribute) return false;
  //   console.log(
  //     tagName,
  //     jPath,
  //     isLeafNode,
  //     isAttribute,
  //     isSingularNode(tagName, jPath),
  //   );
  //   return !isSingularNode(tagName, jPath);
  // },
  updateTag: (tagName, jPath, attrs) => {
    if (tagName.includes(':')) {
      return tagName;
    }
    return `epp:${tagName}`;
  },
};

const builderOptions: XmlBuilderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  suppressEmptyNode: false,
  format: true,
  preserveOrder: false,
};

export const parser = new XMLParser(parserOptions);
export const builder = new XMLBuilder(builderOptions);

/**
 * Create a Zod codec for bidirectional XML <-> JSON transformation.
 */
export function createXmlCodec<S extends ZodSchema>(schema: S) {
  return {
    schema,
    /**
     * Encode JSON object to XML string (validates against schema first).
     */
    encode(value: z.infer<S>): string {
      const validated = schema.safeParse(value);
      if (!validated.success) {
        console.log(value, validated.error);
        throw new Error('Validation failed');
      }
      // intentionally not using builder.build(validated.data) to preserveOrder
      return builder.build(value);
    },
    /**
     * Decode XML string to validated JSON object.
     */
    decode(xml: string): z.infer<S> {
      const parsed = parser.parse(xml);
      // console.log(util.inspect(parsed, { depth: null }));
      // return schema.parse(parsed);
      return parsed;
    },
    /**
     * Safe decode - returns result object instead of throwing.
     */
    safeDecode(
      xml: string,
    ):
      | { success: true; data: z.infer<S> }
      | { success: false; error: z.ZodError } {
      try {
        const parsed = parser.parse(xml);
        const result = schema.safeParse(parsed);
        if (!result.success) {
          return { success: false, error: result.error };
        }
        return { success: true, data: result.data };
      } catch (error) {
        return {
          success: false,
          error: new z.ZodError([
            { code: 'custom', message: String(error), path: [] },
          ]),
        };
      }
    },
    /**
     * Safe encode - returns result object instead of throwing.
     */
    safeEncode(
      value: unknown,
    ): { success: true; data: string } | { success: false; error: z.ZodError } {
      const result = schema.safeParse(value);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      return { success: true, data: builder.build(result.data) };
    },
  };
}

// Pre-built codecs for common EPP structures
export const EppCodec = createXmlCodec(EppEppXml);
export const EppEnvelopeCodec = createXmlCodec(
  zloosen(
    z.object({
      'epp:epp': EppEppXml,
    }),
  ),
);
export const EppCommandCodec = createXmlCodec(EppCommandTypeXml);
export const EppResponseCodec = createXmlCodec(EppResponseTypeXml);
export const EppGreetingCodec = createXmlCodec(EppGreetingTypeXml);
export const EppLoginCodec = createXmlCodec(EppLoginTypeXml);
export const EppCredsOptionsCodec = createXmlCodec(EppCredsOptionsTypeXml);
export const EppLoginSvcCodec = createXmlCodec(EppLoginSvcTypeXml);
export const EppTrIDCodec = createXmlCodec(EppTrIDTypeXml);

// Namespace constants from schema-meta
export const EPP_NS = 'urn:ietf:params:xml:ns:epp-1.0';
export const DOMAIN_NS = 'urn:ietf:params:xml:ns:domain-1.0';
export const CONTACT_NS = 'urn:ietf:params:xml:ns:contact-1.0';
export const HOST_NS = 'urn:ietf:params:xml:ns:host-1.0';
export const FEE_NS = 'urn:ietf:params:xml:ns:epp:fee-1.0';
export const SECDNS_NS = 'urn:ietf:params:xml:ns:secDNS-1.1';
export const RGP_NS = 'urn:ietf:params:xml:ns:rgp-1.0';
export const IDN_NS = 'urn:ietf:params:xml:ns:idn-1.0';
export const LAUNCH_NS = 'urn:ietf:params:xml:ns:launch-1.0';

export { namespaces };

/**
 * Helper to wrap a command in an EPP envelope with namespace declarations.
 */
export function wrapInEppEnvelope(
  command: EppCommandType,
): Record<string, unknown> {
  return {
    'epp:epp': {
      '@_xmlns': EPP_NS,
      '@_xmlns:domain': DOMAIN_NS,
      '@_xmlns:contact': CONTACT_NS,
      '@_xmlns:host': HOST_NS,
      'epp:command': command,
    },
  };
}

/**
 * Helper to create a hello envelope.
 */
export function createHelloEnvelope(): Record<string, unknown> {
  return {
    'epp:epp': {
      '@_xmlns': EPP_NS,
      'epp:hello': '',
    },
  };
}

/**
 * Parse raw XML to detect message type.
 */
export type EppMessageType =
  | 'greeting'
  | 'hello'
  | 'command'
  | 'response'
  | 'unknown';

export function detectMessageType(xml: string): EppMessageType {
  const parsed = parser.parse(xml) as { 'epp:epp'?: Record<string, unknown> };
  const epp = parsed?.['epp:epp'];
  if (!epp) return 'unknown';

  if ('epp:greeting' in epp || 'greeting' in epp) return 'greeting';
  if ('epp:hello' in epp || 'hello' in epp) return 'hello';
  if ('epp:command' in epp || 'command' in epp) return 'command';
  if ('epp:response' in epp || 'response' in epp) return 'response';

  return 'unknown';
}

/**
 * Extract the inner content from an EPP envelope.
 */
export function extractFromEppEnvelope(xml: string): {
  type: EppMessageType;
  content: unknown;
  raw: Record<string, unknown>;
} {
  const parsed = parser.parse(xml) as { ['epp:epp']?: Record<string, unknown> };
  const epp = parsed?.['epp:epp'];
  if (!epp) {
    return { type: 'unknown', content: null, raw: parsed };
  }

  // Handle both prefixed and non-prefixed keys
  if ('epp:greeting' in epp) {
    return { type: 'greeting', content: epp['epp:greeting'], raw: parsed };
  }
  if ('greeting' in epp) {
    return { type: 'greeting', content: epp.greeting, raw: parsed };
  }
  if ('epp:hello' in epp) {
    return { type: 'hello', content: epp['epp:hello'], raw: parsed };
  }
  if ('hello' in epp) {
    return { type: 'hello', content: epp.hello, raw: parsed };
  }
  if ('epp:command' in epp) {
    return { type: 'command', content: epp['epp:command'], raw: parsed };
  }
  if ('command' in epp) {
    return { type: 'command', content: epp.command, raw: parsed };
  }
  if ('epp:response' in epp) {
    return { type: 'response', content: epp['epp:response'], raw: parsed };
  }
  if ('response' in epp) {
    return { type: 'response', content: epp.response, raw: parsed };
  }

  return { type: 'unknown', content: null, raw: parsed };
}
