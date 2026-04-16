import { dnsRecordSelectSchema } from '@namefi-astra/db';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { recordSchema } from '@namefi-astra/zod-dns';
import { z } from 'zod';
import { updateDomainConfig } from '#lib/domains/domain-preferences';
import {
  isDomainParked,
  parkDomain,
  toggleDomainParking,
} from '#services/dns/parking';
import {
  batchCreateRecords,
  batchDeleteRecords,
  batchUpdateRecords,
  createRecord,
  createRecordInputSchema,
  deleteRecord,
  getZoneRecordsWithManagedRecords,
  updateRecord,
  updateRecordInputSchema,
  validateZone,
} from '../../../services/dns/service';
import { toggleVercelAnycastRecords } from '../../../services/dns/vercel-anycast';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '../../base';
import { assertAuthenticatedUserIsDomainOwner } from '../../guards/assert-domain-owner';
import { orpcMetaWithEip712FromZodSchema } from '#lib/eip712/orpc-meta-from-zod-schemas';

// ============================================================================
// Output Schemas for OpenAPI
// ============================================================================

const successResponseSchema = z.object({
  success: z.boolean(),
});

const dnsRecord = dnsRecordSelectSchema.meta({
  name: 'DnsRecord',
  description: 'DnsRecord',
  eip712: { structName: 'DnsRecord' },
});
const createDnsRecord = createRecordInputSchema.meta({
  name: 'CreateDnsRecord',
  description: 'CreateDnsRecord',
  eip712: { structName: 'CreateDnsRecord' },
});
const updateDnsRecord = updateRecordInputSchema.meta({
  name: 'UpdateDnsRecord',
  description: 'UpdateDnsRecord',
  eip712: { structName: 'UpdateDnsRecord' },
});
const zoneSelect = z
  .object({
    zoneName: namefiNormalizedDomainSchema,
  })
  .meta({
    name: 'ZoneSelect',
    description: 'ZoneSelect',
    eip712: { structName: 'ZoneSelect' },
  });

const recordSelect = z
  .object({
    id: z.string(),
    zoneName: namefiNormalizedDomainSchema,
  })
  .meta({
    name: 'RecordSelect',
    description: 'RecordSelect',
    eip712: { structName: 'RecordSelect' },
  });
const UpdateZoneRecord = updateRecordInputSchema.omit({ zoneName: true }).meta({
  name: 'UpdateZoneRecord',
  description: 'UpdateZoneRecord',
  eip712: { structName: 'UpdateZoneRecord' },
});
const UpdateRecords = z
  .object({
    records: z.array(UpdateZoneRecord),
    zoneName: namefiNormalizedDomainSchema,
  })
  .meta({
    name: 'UpdateRecords',
    description: 'UpdateRecords',
    eip712: { structName: 'UpdateRecords' },
  });

const CreateRecords = z
  .object({
    records: z.array(recordSchema),
    zoneName: namefiNormalizedDomainSchema,
  })
  .meta({
    name: 'CreateRecords',
    description: 'CreateRecords',
    eip712: { structName: 'CreateRecords' },
  });

const DeleteRecords = z
  .object({
    recordsIds: z.array(z.string()),
    zoneName: namefiNormalizedDomainSchema,
  })
  .meta({
    name: 'DeleteRecords',
    description: 'DeleteRecords',
    eip712: { structName: 'DeleteRecords' },
  });

const ParkDomain = z
  .object({
    normalizedDomainName: namefiNormalizedDomainSchema,
    overrideExistingRecords: z.boolean().optional(),
  })
  .meta({
    name: 'ParkDomain',
    description: 'ParkDomain',
    eip712: { structName: 'ParkDomain' },
  });

const ToggleDomainParking = z
  .object({
    normalizedDomainName: namefiNormalizedDomainSchema,
    enableParking: z.boolean(),
    overrideExistingRecords: z.boolean().optional(),
  })
  .meta({
    name: 'ToggleDomainParking',
    description: 'ToggleDomainParking',
    eip712: { structName: 'ToggleDomainParking' },
  });

const ToggleForwarding = z
  .object({
    normalizedDomainName: namefiNormalizedDomainSchema,
    enableForwarding: z.boolean(),
    forwardTo: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    if (
      input.enableForwarding &&
      normalizeForwardTo(input.forwardTo) === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['forwardTo'],
        message: 'forwardTo is required when enabling forwarding',
      });
    }
  })
  .meta({
    name: 'ToggleForwarding',
    description: 'ToggleForwarding',
    eip712: { structName: 'ToggleForwarding' },
  });

const ToggleAutoEns = z
  .object({
    normalizedDomainName: namefiNormalizedDomainSchema,
    enableAutoEns: z.boolean(),
  })
  .meta({
    name: 'ToggleAutoEns',
    description: 'ToggleAutoEns',
    eip712: { structName: 'ToggleAutoEns' },
  });

const ToggleVercelAnyCastRecords = z
  .object({
    normalizedDomainName: namefiNormalizedDomainSchema,
    enableVercelAnyCastRecords: z.boolean(),
    overrideExistingRecords: z.boolean().optional(),
  })
  .meta({
    name: 'ToggleVercelAnyCastRecords',
    description: 'ToggleVercelAnyCastRecords',
    eip712: { structName: 'ToggleVercelAnyCastRecords' },
  });

function normalizeForwardTo(forwardTo: string | undefined) {
  const trimmed = forwardTo?.trim();
  return trimmed ? trimmed : null;
}

// ============================================================================
// Router Definition
// ============================================================================

export const dnsRecordsRouterOrpc = createTRPCRouter({
  /**
   * Get DNS records for a domain
   */
  getRecords: publicProcedure
    .meta({
      // ...getEip712MetaFromZodSchema([zoneSelect]),
      route: {
        path: '/dns/records',
        method: 'GET',
        tags: ['dns', 'EIP712'],
        operationId: 'getDnsRecords',
        summary: 'Get DNS records',
        description:
          'Retrieve all DNS records for a specified domain zone. Returns an array of DNS records including A, AAAA, CNAME, MX, TXT, and other record types.',
      },
    })
    .input(zoneSelect)
    .output(z.array(dnsRecord))
    .query(({ input }) => {
      return getZoneRecordsWithManagedRecords(input.zoneName);
    }),

  /**
   * Add a new DNS record
   */
  createDnsRecord: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([createDnsRecord], {
        route: {
          path: '/dns/records',
          method: 'POST',
          tags: ['dns', 'EIP712'],
          operationId: 'createDnsRecord',
          summary: 'Create DNS record',
          description:
            'Create a new DNS record for a domain. Requires domain ownership. The record will be validated against DNS zone rules before creation.',
        },
      }),
    )
    .input(createDnsRecord)
    .output(dnsRecord)
    .mutation(async ({ input, ctx }) => {
      const { zoneName } = input;

      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);

      return createRecord(input);
    }),

  /**
   * Update a DNS record by ID
   */
  updateRecord: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([updateDnsRecord], {
        route: {
          path: '/dns/record',
          method: 'PUT',
          tags: ['dns', 'EIP712'],
          operationId: 'updateDnsRecord',
          summary: 'Update DNS record',
          description:
            'Update an existing DNS record by its ID. Requires domain ownership. The updated record will be validated against DNS zone rules.',
        },
      }),
    )
    .input(updateDnsRecord)
    .output(dnsRecord)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);

      return updateRecord(input);
    }),

  /**
   * Delete a DNS record by ID
   */
  deleteRecord: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([recordSelect], {
        route: {
          path: '/dns/record',
          method: 'DELETE',
          tags: ['dns', 'EIP712'],
          operationId: 'deleteDnsRecord',
          summary: 'Delete DNS record',
          description:
            'Delete a DNS record by its ID. Requires domain ownership. The deletion will be validated to ensure zone integrity.',
        },
      }),
    )
    .input(recordSelect)
    .output(successResponseSchema)
    .mutation(
      async ({ input: { zoneName: normalizedDomainName, id }, ctx }) => {
        await assertAuthenticatedUserIsDomainOwner(
          normalizedDomainName,
          ctx.user,
        );

        await deleteRecord(id, normalizedDomainName);

        return { success: true };
      },
    ),

  /**
   * Update multiple DNS records
   */
  updateRecords: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([UpdateRecords], {
        route: {
          path: '/dns/records/batch',
          method: 'PUT',
          tags: ['dns', 'EIP712'],
          operationId: 'batchUpdateDnsRecords',
          summary: 'Batch update DNS records',
          description:
            'Update multiple DNS records in a single transaction. Requires domain ownership. All records must belong to the same zone and will be validated together.',
        },
      }),
    )
    .input(UpdateRecords)
    .output(z.array(dnsRecord))
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);
      const updatedRecords = await batchUpdateRecords(
        input.zoneName,
        input.records,
      );
      return updatedRecords as unknown as z.infer<
        typeof dnsRecordSelectSchema
      >[];
    }),

  /**
   * Create DNS records
   */
  createRecords: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([CreateRecords], {
        route: {
          path: '/dns/records/batch',
          method: 'POST',
          tags: ['dns', 'EIP712'],
          operationId: 'batchCreateDnsRecords',
          summary: 'Batch create DNS records',
          description:
            'Create multiple DNS records in a single transaction. Requires domain ownership. All records will be validated together against DNS zone rules.',
        },
      }),
    )
    .input(CreateRecords)
    .output(z.array(dnsRecord))
    .mutation(async ({ input: { zoneName, records }, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);
      return batchCreateRecords(zoneName, records);
    }),

  /**
   * Delete DNS records by IDs
   */
  deleteRecords: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([DeleteRecords], {
        route: {
          path: '/dns/records/batch',
          method: 'DELETE',
          tags: ['dns', 'EIP712'],
          operationId: 'batchDeleteDnsRecords',
          summary: 'Batch delete DNS records',
          description:
            'Delete multiple DNS records by their IDs in a single transaction. Requires domain ownership. The zone will be validated after deletion.',
        },
      }),
    )
    .input(DeleteRecords)
    .output(successResponseSchema)
    .mutation(async ({ input: { zoneName, recordsIds }, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);
      return batchDeleteRecords(zoneName, recordsIds);
    }),

  /**
   * Toggle forwarding managed records for a domain
   */
  toggleForwarding: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([ToggleForwarding], {
        route: {
          path: '/dns/forwarding',
          method: 'PUT',
          tags: ['dns', 'EIP712'],
          operationId: 'toggleForwarding',
          summary: 'Toggle domain forwarding',
          description:
            'Enable or disable managed forwarding DNS records for a domain. Enabling forwarding requires a destination URL and validates that the resulting DNS zone remains valid.',
        },
      }),
    )
    .input(ToggleForwarding)
    .output(successResponseSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );

      const forwardTo = input.enableForwarding
        ? normalizeForwardTo(input.forwardTo)
        : null;

      await validateZone(
        input.normalizedDomainName,
        {},
        {
          managedStateOverride: {
            forwardTo,
          },
        },
      );

      await updateDomainConfig(input.normalizedDomainName, {
        forwardTo: forwardTo ?? '',
      });

      return { success: true };
    }),

  /**
   * Toggle automatic ENS TXT records for a domain
   */
  toggleAutoEns: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([ToggleAutoEns], {
        route: {
          path: '/dns/auto-ens',
          method: 'PUT',
          tags: ['dns', 'EIP712'],
          operationId: 'toggleAutoEns',
          summary: 'Toggle automatic ENS records',
          description:
            'Enable or disable the managed ENS TXT record for a domain. The DNS zone is validated against the resulting managed-record state before the setting is updated.',
        },
      }),
    )
    .input(ToggleAutoEns)
    .output(successResponseSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );

      await validateZone(
        input.normalizedDomainName,
        {},
        {
          managedStateOverride: {
            autoEnsEnabled: input.enableAutoEns,
          },
        },
      );

      await updateDomainConfig(input.normalizedDomainName, {
        autoEnsEnabled: input.enableAutoEns,
      });

      return { success: true };
    }),

  /**
   * Toggle Vercel anycast DNS records for a domain
   */
  toggleVercelAnyCastRecords: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([ToggleVercelAnyCastRecords], {
        route: {
          path: '/dns/vercel-anycast',
          method: 'PUT',
          tags: ['dns', 'EIP712'],
          operationId: 'toggleVercelAnyCastRecords',
          summary: 'Toggle Vercel anycast DNS records',
          description:
            "Enable or disable Vercel anycast DNS records for a domain. Subdomains use an apex CNAME, traditional apex domains use Vercel's anycast A record plus parking-style CAA records.",
        },
      }),
    )
    .input(ToggleVercelAnyCastRecords)
    .output(successResponseSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );
      return toggleVercelAnycastRecords(input);
    }),

  /**
   * Park a domain
   */
  parkDomain: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([ParkDomain], {
        route: {
          path: '/dns/park',
          method: 'POST',
          tags: ['dns', 'EIP712'],
          operationId: 'parkDomain',
          summary: 'Park domain',
          description:
            'Park a domain by setting up default parking DNS records (A and AAAA records pointing to the parking server). Optionally override existing conflicting records.',
        },
      }),
    )
    .input(ParkDomain)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );

      try {
        await parkDomain(
          input.normalizedDomainName,
          input.overrideExistingRecords,
        );

        return { success: true };
      } catch (_e) {
        return { success: false };
      }
    }),
  /**
   * Park a domain
   */
  toggleDomainParking: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([ToggleDomainParking], {
        route: {
          path: '/dns/park',
          method: 'PUT',
          tags: ['dns', 'EIP712'],
          operationId: 'toggleDomainParking',
          summary: 'Toggle Domain Parking',
          description:
            'Park a domain by setting up default parking DNS records (A and AAAA records pointing to the parking server). Optionally override existing conflicting records.',
        },
      }),
    )
    .input(ToggleDomainParking)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );

      try {
        await toggleDomainParking(
          input.normalizedDomainName,
          input.enableParking,
          input.overrideExistingRecords,
        );

        return { success: true };
      } catch (_e) {
        return { success: false };
      }
    }),
  /**
   * Check if a domain is parked
   */
  isDomainParked: publicProcedure
    .meta({
      route: {
        path: '/dns/parked',
        method: 'GET',
        tags: ['dns'],
        operationId: 'isDomainParked',
        summary: 'Check if domain is parked',
        description:
          'Check whether a domain has the standard parking DNS records configured. Returns true if the domain is parked, false otherwise.',
      },
    })
    .input(z.object({ normalizedDomainName: namefiNormalizedDomainSchema }))
    .output(z.boolean())
    .query(({ input }) => isDomainParked(input.normalizedDomainName)),
});
