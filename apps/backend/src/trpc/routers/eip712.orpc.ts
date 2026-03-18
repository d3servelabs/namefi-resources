import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../base';
import { NAMEFI_EIP712_DOMAIN } from '#lib/auth/methods/eip712/api-key-eip712';
import { defaultEip712SchemaConverter } from '#lib/eip712/orpc-eip712-schema-converter';
import { getEip712MethodRegistry } from '#lib/eip712/orpc-meta-from-zod-schemas';

// ── Shared sub-schemas ───────────────────────────────────────────────

const typedDataParameterSchema = z
  .object({
    name: z.string().describe('Field name.'),
    type: z.string().describe('Solidity type (e.g. "address", "uint256").'),
  })
  .describe('A single EIP-712 typed-data field.');

const eip712TypesMapSchema = z
  .record(z.string(), z.array(typedDataParameterSchema))
  .describe(
    'Map of struct name to its typed-data fields (EIP-712 `types` object).',
  );

// ── Input schemas ────────────────────────────────────────────────────

const getEip712DomainInputSchema = z
  .object({
    chain: z
      .number()
      .int()
      .describe('EIP-155 chain ID to query the signing domain for.'),
  })
  .describe('Input for retrieving the EIP-712 signing domain.');

const getEip712TypesForMethodInputSchema = z
  .object({
    method: z
      .string()
      .min(1)
      .describe('API operation ID (e.g. "createDnsRecord", "registerDomain").'),
  })
  .describe('Input for retrieving EIP-712 types accepted by a method.');

// ── Output schemas ───────────────────────────────────────────────────

const eip712DomainOutputSchema = z
  .object({
    name: z.string().optional().describe('Human-readable signing domain name.'),
    version: z.string().optional().describe('Domain version string.'),
    chainId: z
      .number()
      .int()
      .optional()
      .describe(
        'EIP-155 chain ID bound to the domain, if chain-specific signing is used.',
      ),
    verifyingContract: z
      .string()
      .optional()
      .describe('Contract address bound to the domain, if applicable.'),
    salt: z.string().optional().describe('Disambiguation salt, if applicable.'),
  })
  .describe('EIP-712 typed-data domain separator.');

const getEip712TypesForMethodOutputSchema = z
  .object({
    found: z
      .boolean()
      .describe('Whether the method was found in the EIP-712 registry.'),
    acceptedPrimaryTypes: z
      .array(z.string())
      .optional()
      .describe(
        'Primary type names accepted by this method (sent via x-namefi-eip712-type header). Present when found is true.',
      ),
    types: eip712TypesMapSchema
      .optional()
      .describe(
        'EIP-712 type map for this method. Present when found is true.',
      ),
    availableMethods: z
      .array(z.string())
      .optional()
      .describe(
        'List of operation IDs that support EIP-712 authentication. Present when found is false.',
      ),
  })
  .describe('Result of looking up EIP-712 types for a specific API operation.');

// ── Router ───────────────────────────────────────────────────────────

export const eip712Router = createTRPCRouter({
  getEip712Domain: publicProcedure
    .meta({
      route: {
        path: '/eip712/domain',
        method: 'GET',
        tags: ['auth', 'eip712'],
        operationId: 'getEip712Domain',
        summary: 'Get EIP-712 signing domain',
        description:
          'Return the EIP-712 domain separator used for Namefi payload signing. ' +
          'The Namefi domain is chain-agnostic (chainId omitted) to allow cross-chain signatures.',
      },
    })
    .input(getEip712DomainInputSchema)
    .output(eip712DomainOutputSchema)
    .query(async ({ input }) => {
      return {
        name: NAMEFI_EIP712_DOMAIN.name ?? undefined,
        version: NAMEFI_EIP712_DOMAIN.version ?? undefined,
        chainId: NAMEFI_EIP712_DOMAIN.chainId
          ? Number(NAMEFI_EIP712_DOMAIN.chainId)
          : undefined,
        verifyingContract: NAMEFI_EIP712_DOMAIN.verifyingContract ?? undefined,
        salt: NAMEFI_EIP712_DOMAIN.salt ?? undefined,
      };
    }),

  getAllEip712Types: publicProcedure
    .meta({
      route: {
        path: '/eip712/types',
        method: 'GET',
        tags: ['auth', 'eip712'],
        operationId: 'getAllEip712Types',
        summary: 'Get all EIP-712 types',
        description:
          'Return every registered EIP-712 struct type used by the Namefi API.',
      },
    })
    .input(z.any())
    .output(eip712TypesMapSchema)
    .query(async () => {
      const types = defaultEip712SchemaConverter.getTypes();
      // Convert readonly TypedDataParameter[] to plain objects for serialisation
      if (!types) return {};
      const result: Record<string, { name: string; type: string }[]> = {};
      for (const [key, params] of Object.entries(types)) {
        result[key] = params.map((p) => ({ name: p.name, type: p.type }));
      }
      return result;
    }),

  getEip712TypesForMethod: publicProcedure
    .meta({
      route: {
        path: '/eip712/types-for-method',
        method: 'GET',
        tags: ['auth', 'eip712'],
        operationId: 'getEip712TypesForMethod',
        summary: 'Get EIP-712 types for a method',
        description:
          'Return the accepted primary types and full type map for a specific API operation that supports EIP-712 authentication.',
      },
    })
    .input(getEip712TypesForMethodInputSchema)
    .output(getEip712TypesForMethodOutputSchema)
    .query(async ({ input }) => {
      const registry = getEip712MethodRegistry();
      const entry = registry.get(input.method);

      if (!entry) {
        return {
          found: false,
          availableMethods: Array.from(registry.keys()),
        };
      }

      return {
        found: true,
        acceptedPrimaryTypes: entry.acceptedPrimaryTypes,
        types: entry.types as Record<string, { name: string; type: string }[]>,
      };
    }),
});
