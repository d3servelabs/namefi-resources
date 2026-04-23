import {
  db,
  poweredbyNamefiDomainsTable,
  dnsRecordsTable,
  type DnsRecordSelect,
  type DnsRecordInsert,
  type PoweredByNamefiDomainUpdate,
} from '@namefi-astra/db';
import { resolve, type NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminPoweredByNamefiContract } from '@namefi-astra/common/contract/admin/admin-powered-by-namefi-contract';
import { Permission } from '@namefi-astra/utils';
import { logger } from '#lib/logger';
import { createVercelClientSDK } from '#lib/vercel/vercel-client-sdk';
import {
  VercelNotApplicableError,
  isVercelProvisionable,
} from '#lib/vercel/applicability';
import {
  computeDefaultAdditionalAllowedHostnames,
  invalidatePoweredByNamefi3PDomainsCache,
} from '#lib/namefi-registry';
import type { GetDomainConfigResponseBody } from '@vercel/sdk/models/getdomainconfigop';
import type { GetProjectDomainResponseBody } from '@vercel/sdk/models/getprojectdomainop';
import { indexBy, prop, sum } from 'ramda';
import { config } from '#lib/env';
import {
  toPunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';

// Project constants
const NAMEFI_IO_ZONE = 'namefi-io';
const NAMEFI_DEV_ZONE = 'namefi-dev';
const NAMEFI_IO_ZONE_SUFFIX_REGEX = /astra.namefi.io\.?$/;
const NAMEFI_DEV_ZONE_SUFFIX_REGEX = /astra.namefi.dev\.?$/;
const VERCEL_ANYCAST = {
  CNAME: 'cname.vercel-dns.com.',
  A: '76.76.21.21',
};

// Comprehensive domain validation function with detailed breakdown
async function validateDomainsSetup(
  normalizedDomainNames: NamefiNormalizedDomain[],
) {
  try {
    // Check Google Cloud DNS for subdomains
    const { createGoogleCloudDnsClient } = await import(
      '#lib/google-cloud/dns-client'
    );

    const dnsClient = createGoogleCloudDnsClient();
    const vercelClient = createVercelClientSDK();
    const allDomainNames = normalizedDomainNames.flatMap(
      (normalizedDomainName) => [
        normalizedDomainName,
        `${normalizedDomainName}.astra.namefi.io`,
        `${normalizedDomainName}.astra.namefi.dev`,
      ],
    );

    const [vercelDomains, ioRecords, devRecords, dnsRecords, vercelConfigs] =
      await Promise.all([
        vercelClient.getProjectDomains(config.VERCEL_PROJECT_ID),
        dnsClient.listRecords(NAMEFI_IO_ZONE, 'CNAME'),
        dnsClient.listRecords(NAMEFI_DEV_ZONE, 'CNAME'),
        db.query.dnsRecordsTable.findMany({
          where: (table, { and, inArray }) =>
            and(
              inArray(
                table.zoneName,
                normalizedDomainNames as NamefiNormalizedDomain[],
              ),
              inArray(table.type, ['A', 'CNAME']),
            ),
        }),
        Promise.all(
          allDomainNames.map(async (domain) => ({
            domain,
            ...(await vercelClient.getDomainConfiguration(domain)),
          })),
        ).then((configs) => indexBy(prop('domain'), configs)),
      ]);

    return normalizedDomainNames.map((normalizedDomainName) => {
      const apexVercelDomain = vercelDomains.find(
        (d) =>
          toPunycodeDomainName(d.name) ===
          toPunycodeDomainName(normalizedDomainName),
      );
      const ioVercelDomain = vercelDomains.find(
        (d) =>
          toPunycodeDomainName(d.name) ===
          toPunycodeDomainName(`${normalizedDomainName}.astra.namefi.io`),
      );
      const devVercelDomain = vercelDomains.find(
        (d) =>
          toPunycodeDomainName(d.name) ===
          toPunycodeDomainName(`${normalizedDomainName}.astra.namefi.dev`),
      );

      const apexRecords = dnsRecords.filter(
        (r) =>
          r.zoneName === normalizedDomainName &&
          r.name === '@' &&
          r.type === 'A',
      );
      const ioSubdomainRecord = ioRecords.find(
        (r) =>
          toPunycodeDomainName(r.name) ===
          toPunycodeDomainName(`${normalizedDomainName}.astra.namefi.io`),
      );

      const devSubdomainRecord = devRecords.find(
        (r) =>
          toPunycodeDomainName(r.name) ===
          toPunycodeDomainName(`${normalizedDomainName}.astra.namefi.dev`),
      );

      // Validate apex domain setup
      const apexDomainValidation = validateDomainVercelSetup(
        normalizedDomainName,
        apexVercelDomain,
        apexRecords,
        'A',
        vercelConfigs[normalizedDomainName],
      );

      // Validate namefi.io subdomain setup
      const namefiIoValidation = validateDomainVercelSetup(
        `${normalizedDomainName}.astra.namefi.io` as NamefiNormalizedDomain,
        ioVercelDomain,
        ioSubdomainRecord?.rrdatas.map((rdata) => ({
          name: `${normalizedDomainName}.astra`,
          type: 'CNAME',
          rdata,
          zoneName: 'namefi.io' as NamefiNormalizedDomain,
        })) ?? [],
        'CNAME',
        vercelConfigs[`${normalizedDomainName}.astra.namefi.io`],
      );

      // Validate namefi.dev subdomain setup
      const namefiDevValidation = validateDomainVercelSetup(
        `${normalizedDomainName}.astra.namefi.dev` as NamefiNormalizedDomain,
        devVercelDomain,
        devSubdomainRecord?.rrdatas.map((rdata) => ({
          name: `${normalizedDomainName}.astra`,
          type: 'CNAME',
          rdata,
          zoneName: 'namefi.dev' as NamefiNormalizedDomain,
        })) ?? [],
        'CNAME',
        vercelConfigs[`${normalizedDomainName}.astra.namefi.dev`],
      );

      // Overall summary
      const summary = {
        overallStatus: determineOverallStatus([
          apexDomainValidation,
          namefiIoValidation,
          namefiDevValidation,
        ]),
        notice:
          apexDomainValidation.dnsRecordIsAnycast ||
          namefiIoValidation.dnsRecordIsAnycast ||
          namefiDevValidation.dnsRecordIsAnycast
            ? "This domain uses Vercel's anycast values"
            : null,
        recommendations: [
          apexDomainValidation,
          namefiIoValidation,
          namefiDevValidation,
        ].flatMap(generateRecommendations),
      };

      // Vercel's Domains API rejects single-label names (TLDs). Callers
      // (including the admin UI) use this flag to hide / disable the
      // "Setup Vercel & DNS" affordance and explain why.
      const vercelApplicable = isVercelProvisionable(normalizedDomainName);

      return {
        apexDomain: apexDomainValidation,
        namefiIoSubdomain: namefiIoValidation,
        namefiDevSubdomain: namefiDevValidation,
        summary,
        vercelApplicable,
      };
    });
  } catch (error) {
    logger.error(
      { error, normalizedDomainNames },
      'Failed to validate domain setup',
    );
    return null;
  }
}

// Helper function to validate apex domain
function validateDomainVercelSetup(
  domainName: NamefiNormalizedDomain,
  vercelDomain: GetProjectDomainResponseBody | undefined,
  dnsRecords: Pick<DnsRecordSelect, 'name' | 'type' | 'rdata' | 'zoneName'>[],
  recordType: 'A' | 'CNAME',
  vercelConfig: GetDomainConfigResponseBody | undefined,
) {
  const _dnsRecords = dnsRecords.map((r) => ({
    ...r,
    fullName: [r.name === '@' ? undefined : r.name, r.zoneName]
      .filter(Boolean)
      .join('.'),
  }));

  const vercelIsSetup = !!vercelDomain;
  const dnsRecord = _dnsRecords.find(
    (r) => r.fullName === domainName && r.type === recordType,
  );

  const dnsRecordIsAnycast = dnsRecord?.rdata === VERCEL_ANYCAST.A;
  const configRecords: {
    type: 'A' | 'CNAME';
    name: string;
    value: string[];
    rank: number;
  }[] = [];
  if (recordType === 'A') {
    configRecords.push(
      ...(vercelConfig?.recommendedIPv4 || []).map((r) => ({
        type: 'A' as const,
        name: domainName,
        value: r.value,
        rank: r.rank,
      })),
    );
  } else {
    configRecords.push(
      ...(vercelConfig?.recommendedCNAME || []).map((r) => ({
        type: 'CNAME' as const,
        name: domainName,
        value: [r.value],
        rank: r.rank,
      })),
    );
  }

  const vercelIsVerified = !!vercelDomain?.verified; // when verified is true, the verification array is empty
  const recordsAreSetup =
    dnsRecordIsAnycast ||
    (!!dnsRecord &&
      !!vercelDomain &&
      configRecords.some((r) => {
        // it's an array if it's IPv4
        return r.value.some((v) => {
          if (r.type === 'A') {
            return v === dnsRecord.rdata;
          }
          return toPunycodeFqdn(v) === toPunycodeFqdn(dnsRecord.rdata);
        });
      }));

  let message = 'Domain fully configured';
  if (!vercelIsSetup) {
    message = 'Domain not found in Vercel project';
  } else if (!vercelIsVerified) {
    message = 'Domain not verified in Vercel';
  } else if (!recordsAreSetup) {
    message = 'DNS records not correctly configured';
  }
  const canSetup = !vercelIsSetup || !recordsAreSetup;

  return {
    domain: domainName,
    message,
    recordsAreSetup,
    vercelIsSetup,
    vercelIsVerified,
    canSetup,
    records: dnsRecords,
    expectedRecords: configRecords,
    dnsRecordIsAnycast,
  };
}
type DomainValidation = ReturnType<typeof validateDomainVercelSetup>;

// Helper function to determine overall status
function determineOverallStatus(validations: DomainValidation[]) {
  const score = sum(
    validations.map((v) => Number(v.vercelIsSetup) + Number(v.recordsAreSetup)),
  );

  if (score === 0) return 'error';
  if (score === 6) return 'fully_configured';
  return 'partial';
}

// Helper function to generate recommendations
function generateRecommendations(validation: DomainValidation): string[] {
  const recommendations: string[] = [];

  if (validation.canSetup) {
    recommendations.push(
      `Set up record for ${validation.domain} pointing to ${validation.expectedRecords[0]?.value}`,
    );
  } else if (validation.vercelIsSetup && !validation.recordsAreSetup) {
    recommendations.push(
      `Fix DNS configuration for ${validation.domain}: ${validation.message}`,
    );
  } else if (!validation.vercelIsSetup && validation.recordsAreSetup) {
    recommendations.push(`Add domain to Vercel project: ${validation.message}`);
  }

  return recommendations;
}

export const poweredByNamefiRouter = createContractTRPCRouter<
  typeof adminPoweredByNamefiContract
>({
  // Get paginated list of poweredByNamefi domains
  getPoweredByNamefiDomains: adminProcedureWithPermissions(Permission.READ_PBN)
    .input(adminPoweredByNamefiContract.getPoweredByNamefiDomains.input)
    .output(adminPoweredByNamefiContract.getPoweredByNamefiDomains.output)
    .query(async ({ input }) => {
      const { page, limit, sortBy, sortOrder, searchTerm } = input;
      const offset = (page - 1) * limit;

      // Build base query
      const baseQuery = db.select().from(poweredbyNamefiDomainsTable);
      const baseCountQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(poweredbyNamefiDomainsTable);

      // Build filters
      const filters = [];

      if (searchTerm) {
        filters.push(
          sql`${poweredbyNamefiDomainsTable.normalizedDomainName} ILIKE ${'%' + searchTerm + '%'}`,
        );
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const query = whereClause ? baseQuery.where(whereClause) : baseQuery;
      const countQuery = whereClause
        ? baseCountQuery.where(whereClause)
        : baseCountQuery;

      // Apply sorting
      let orderByClause: SQL<unknown>;
      switch (sortBy) {
        case 'normalizedDomainName':
          orderByClause =
            sortOrder === 'asc'
              ? asc(poweredbyNamefiDomainsTable.normalizedDomainName)
              : desc(poweredbyNamefiDomainsTable.normalizedDomainName);
          break;
        case 'createdAt':
          orderByClause =
            sortOrder === 'asc'
              ? asc(poweredbyNamefiDomainsTable.createdAt)
              : desc(poweredbyNamefiDomainsTable.createdAt);
          break;
        case 'updatedAt':
          orderByClause =
            sortOrder === 'asc'
              ? asc(poweredbyNamefiDomainsTable.updatedAt)
              : desc(poweredbyNamefiDomainsTable.updatedAt);
          break;
        default:
          orderByClause =
            sortOrder === 'asc'
              ? asc(poweredbyNamefiDomainsTable.normalizedDomainName)
              : desc(poweredbyNamefiDomainsTable.normalizedDomainName);
      }

      // Execute queries
      const [results, countResult] = await Promise.all([
        query.orderBy(orderByClause).limit(limit).offset(offset),
        countQuery,
      ]);

      const totalCount = countResult[0]?.count ?? 0;

      return {
        data: results,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    }),

  // Get comprehensive status of a specific poweredByNamefi domain
  getPoweredByNamefiDomainStatus: adminProcedureWithPermissions(
    Permission.READ_PBN,
  )
    .input(adminPoweredByNamefiContract.getPoweredByNamefiDomainStatus.input)
    .output(adminPoweredByNamefiContract.getPoweredByNamefiDomainStatus.output)
    .query(async ({ input }) => {
      const { normalizedDomainName } = input;

      // Get the domain record
      const domain = await db.query.poweredbyNamefiDomainsTable.findFirst({
        where: eq(
          poweredbyNamefiDomainsTable.normalizedDomainName,
          normalizedDomainName,
        ),
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Powered by Namefi domain not found',
        });
      }

      // Get comprehensive domain validation
      const validationResult = await validateDomainsSetup([
        normalizedDomainName,
      ]);

      return {
        domain,
        setupStatus: validationResult,
      };
    }),

  // Create a new poweredByNamefi domain
  createPoweredByNamefiDomain: auditedAdminProcedureWithPermissions(
    Permission.WRITE_PBN,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: input.normalizedDomainName,
      action: 'create_domain',
      extraInput: input,
    }),
  )
    .input(adminPoweredByNamefiContract.createPoweredByNamefiDomain.input)
    .output(adminPoweredByNamefiContract.createPoweredByNamefiDomain.output)
    .mutation(async ({ input }) => {
      const {
        normalizedDomainName,
        additionalAllowedHostnames,
        additionalReservedNames,
        durationConstraints,
        costPerYearInUsdCents,
        metadata,
        ownerId,
      } = input;

      // When the caller leaves `additionalAllowedHostnames` empty, seed it
      // with the namefi-hosted mirrors derived from
      // `config.NAMEFI_FIRST_PARTY_HOSTNAMES`. This mirrors the behavior
      // of the hardcoded 3P domains in `namefi-registry.ts` so DB-created
      // PBN rows get the same default hostname coverage.
      const resolvedAdditionalAllowedHostnames =
        additionalAllowedHostnames && additionalAllowedHostnames.length > 0
          ? additionalAllowedHostnames
          : computeDefaultAdditionalAllowedHostnames(
              normalizedDomainName,
              config.NAMEFI_FIRST_PARTY_HOSTNAMES,
            );

      try {
        const newDomain = await db
          .insert(poweredbyNamefiDomainsTable)
          .values({
            normalizedDomainName,
            additionalAllowedHostnames: resolvedAdditionalAllowedHostnames,
            additionalReservedNames,
            durationConstraints,
            costPerYearInUsdCents,
            metadata: metadata || {},
            ownerId: ownerId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        await invalidatePoweredByNamefi3PDomainsCache();

        return {
          success: true,
          domain: newDomain[0],
        };
      } catch (error: any) {
        if (error.code === '23505') {
          // Unique constraint violation
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Domain already exists in powered by Namefi domains',
          });
        }
        logger.error(
          { error, input },
          'Failed to create powered by Namefi domain',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create powered by Namefi domain',
        });
      }
    }),

  // Update an existing poweredByNamefi domain
  updatePoweredByNamefiDomain: auditedAdminProcedureWithPermissions(
    Permission.WRITE_PBN,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: input.normalizedDomainName,
      action: 'update_domain',
      extraInput: input,
    }),
  )
    .input(adminPoweredByNamefiContract.updatePoweredByNamefiDomain.input)
    .output(adminPoweredByNamefiContract.updatePoweredByNamefiDomain.output)
    .mutation(async ({ input }) => {
      const {
        normalizedDomainName,
        additionalAllowedHostnames,
        additionalReservedNames,
        durationConstraints,
        costPerYearInUsdCents,
        metadata,
        ownerId,
      } = input;

      try {
        const updateData: Partial<PoweredByNamefiDomainUpdate> = {
          updatedAt: new Date(),
        };

        if (additionalAllowedHostnames !== undefined) {
          updateData.additionalAllowedHostnames = additionalAllowedHostnames;
        }
        if (additionalReservedNames !== undefined) {
          updateData.additionalReservedNames = additionalReservedNames;
        }
        if (durationConstraints !== undefined) {
          updateData.durationConstraints = durationConstraints;
        }
        if (costPerYearInUsdCents !== undefined) {
          updateData.costPerYearInUsdCents = costPerYearInUsdCents;
        }
        if (metadata !== undefined) {
          updateData.metadata = metadata;
        }
        if (ownerId !== undefined) {
          updateData.ownerId = ownerId;
        }

        const updatedDomain = await db
          .update(poweredbyNamefiDomainsTable)
          .set(updateData)
          .where(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              normalizedDomainName,
            ),
          )
          .returning();

        if (updatedDomain.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Powered by Namefi domain not found',
          });
        }

        await invalidatePoweredByNamefi3PDomainsCache();

        return {
          success: true,
          domain: updatedDomain[0],
        };
      } catch (error) {
        logger.error(
          { error, input },
          'Failed to update powered by Namefi domain',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update powered by Namefi domain',
        });
      }
    }),

  // Delete a poweredByNamefi domain
  deletePoweredByNamefiDomain: auditedAdminProcedureWithPermissions(
    Permission.WRITE_PBN,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: input.normalizedDomainName,
      action: 'delete_domain',
      extraInput: input,
    }),
  )
    .input(adminPoweredByNamefiContract.deletePoweredByNamefiDomain.input)
    .output(adminPoweredByNamefiContract.deletePoweredByNamefiDomain.output)
    .mutation(async ({ input }) => {
      const { normalizedDomainName } = input;

      try {
        const deletedDomain = await db
          .delete(poweredbyNamefiDomainsTable)
          .where(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              normalizedDomainName,
            ),
          )
          .returning();

        if (deletedDomain.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Powered by Namefi domain not found',
          });
        }

        await invalidatePoweredByNamefi3PDomainsCache();

        return {
          success: true,
          domain: deletedDomain[0],
        };
      } catch (error) {
        logger.error(
          { error, input },
          'Failed to delete powered by Namefi domain',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete powered by Namefi domain',
        });
      }
    }),

  // Setup Vercel and DNS method (for backwards compatibility)
  setupVercelAndDns: auditedAdminProcedureWithPermissions(
    Permission.WRITE_PBN,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: input.normalizedDomainName,
      action: 'setup_vercel_dns',
      extraInput: input,
    }),
  )
    .input(adminPoweredByNamefiContract.setupVercelAndDns.input)
    .output(adminPoweredByNamefiContract.setupVercelAndDns.output)
    .mutation(async ({ input }) => {
      const { normalizedDomainName } = input;

      // Short-circuit for domains Vercel can't host (e.g. bare TLDs like
      // `nfi`). Vercel's Domains API rejects single-label names; surface
      // this to the caller as a structured skip rather than a 500 so the
      // admin UI can render a "Vercel N/A" state.
      if (!isVercelProvisionable(normalizedDomainName)) {
        return {
          success: true,
          message:
            'Skipped Vercel setup: TLDs cannot be provisioned as Vercel project domains. The namefi.{io,dev} subdomain mirrors remain available.',
          vercelSetup: false,
          vercelSkipped: true,
          vercelSkipReason: 'tld',
          dnsRecordCreated: false,
        };
      }

      try {
        const vercelClient = createVercelClientSDK();

        // Check if domain is already configured
        let [_err, vercelDomain] = await resolve(
          vercelClient.getProjectDomain(
            config.VERCEL_PROJECT_ID,
            normalizedDomainName,
          ),
        );

        if (!vercelDomain) {
          // Add domain to Vercel project
          vercelDomain = await vercelClient.addDomainToProject(
            config.VERCEL_PROJECT_ID,
            normalizedDomainName,
          );
        }

        const vercelConfig =
          await vercelClient.getDomainConfiguration(normalizedDomainName);

        const expectedRecords = vercelConfig?.recommendedIPv4.flatMap(
          (r) => r.value,
        );

        const recordsToCreate: DnsRecordInsert[] = [
          ...(expectedRecords?.map((r) => ({
            zoneName: normalizedDomainName as NamefiNormalizedDomain,
            name: '@',
            type: 'A' as DnsRecordSelect['type'],
            class: 'IN',
            ttl: 300,
            rdata: r,
            metadata: {
              setupBy: 'admin',
              vercelProject: config.VERCEL_PROJECT_ID,
            } as unknown as DnsRecordSelect['metadata'],
          })) ?? []),
        ];

        let dnsRecordCreated = false;
        // If IP address is provided, create the A record in DNS
        if (recordsToCreate.length > 0) {
          await db.transaction(async (tx) => {
            await tx
              .delete(dnsRecordsTable)
              .where(
                and(
                  eq(dnsRecordsTable.zoneName, normalizedDomainName),
                  eq(dnsRecordsTable.type, 'A'),
                  eq(dnsRecordsTable.name, '@'),
                ),
              );
            await tx.insert(dnsRecordsTable).values(recordsToCreate);

            dnsRecordCreated = true;
          });
        }

        return {
          success: true,
          message: 'Vercel and DNS setup completed',
          vercelSetup: true,
          vercelDomain,
          dnsRecordCreated,
        };
      } catch (error) {
        if (error instanceof VercelNotApplicableError) {
          // Defense-in-depth: the top-level `isVercelProvisionable` check
          // should have short-circuited already, but surface it cleanly if
          // reached.
          return {
            success: true,
            message: error.message,
            vercelSetup: false,
            vercelSkipped: true,
            vercelSkipReason: error.reason,
            dnsRecordCreated: false,
          };
        }
        logger.error({ error, input }, 'Failed to setup Vercel and DNS');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to setup Vercel and DNS',
        });
      }
    }),

  // Setup subdomain method (for backwards compatibility)
  setupNamefiIoSubdomain: auditedAdminProcedureWithPermissions(
    Permission.WRITE_PBN,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: input.normalizedDomainName,
      action: 'setup_namefi_io_subdomain',
      extraInput: input,
    }),
  )
    .input(adminPoweredByNamefiContract.setupNamefiIoSubdomain.input)
    .output(adminPoweredByNamefiContract.setupNamefiIoSubdomain.output)
    .mutation(async ({ input }) => {
      {
        const { normalizedDomainName } = input;

        try {
          const { createGoogleCloudDnsClient } = await import(
            '#lib/google-cloud/dns-client'
          );
          const dnsClient = createGoogleCloudDnsClient();

          const vercelClient = createVercelClientSDK();

          // Check if domain is already configured
          let [_err, vercelDomain] = await resolve(
            vercelClient.getProjectDomain(
              config.VERCEL_PROJECT_ID,
              `${normalizedDomainName}.astra.namefi.io`,
            ),
          );

          if (!vercelDomain) {
            // Add domain to Vercel project
            vercelDomain = await vercelClient.addDomainToProject(
              config.VERCEL_PROJECT_ID,
              `${normalizedDomainName}.astra.namefi.io`,
            );
          }

          const vercelConfig = await vercelClient.getDomainConfiguration(
            `${normalizedDomainName}.astra.namefi.io`,
          );

          const expectedRecord = vercelConfig?.recommendedCNAME[0];

          let record:
            | {
                name: string;
                type: string;
                rdata: string;
                zoneName: string;
              }
            | undefined;
          if (expectedRecord) {
            // Create CNAME record in namefi-io zone
            await dnsClient.createCnameRecord(
              NAMEFI_DEV_ZONE,
              `${normalizedDomainName}.astra`,
              expectedRecord.value,
              300,
            );
            record = {
              name: `${normalizedDomainName}.astra`,
              type: 'CNAME',
              rdata: expectedRecord.value.replace(
                NAMEFI_IO_ZONE_SUFFIX_REGEX,
                '',
              ),
              zoneName: 'namefi.io',
            };
          }

          return {
            success: true,
            message: `${normalizedDomainName}.astra.namefi.io CNAME setup completed`,
            subdomain: `${normalizedDomainName}.astra.namefi.io`,
            target: expectedRecord?.value,
            zone: NAMEFI_IO_ZONE,
            record,
          };
        } catch (error) {
          logger.error({ error, input }, 'Failed to setup namefi.io subdomain');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to setup namefi.io subdomain',
          });
        }
      }
    }),

  // Setup namefi.dev subdomain method (for backwards compatibility)
  setupNamefiDevSubdomain: auditedAdminProcedureWithPermissions(
    Permission.WRITE_PBN,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: input.normalizedDomainName,
      action: 'setup_namefi_dev_subdomain',
      extraInput: input,
    }),
  )
    .input(adminPoweredByNamefiContract.setupNamefiDevSubdomain.input)
    .output(adminPoweredByNamefiContract.setupNamefiDevSubdomain.output)
    .mutation(async ({ input }) => {
      {
        const { normalizedDomainName } = input;

        try {
          const { createGoogleCloudDnsClient } = await import(
            '#lib/google-cloud/dns-client'
          );
          const dnsClient = createGoogleCloudDnsClient();

          const vercelClient = createVercelClientSDK();

          // Check if domain is already configured
          let [_err, vercelDomain] = await resolve(
            vercelClient.getProjectDomain(
              config.VERCEL_PROJECT_ID,
              `${normalizedDomainName}.astra.namefi.dev`,
            ),
          );

          if (!vercelDomain) {
            // Add domain to Vercel project
            vercelDomain = await vercelClient.addDomainToProject(
              config.VERCEL_PROJECT_ID,
              `${normalizedDomainName}.astra.namefi.dev`,
              config.VERCEL_DEV_ENV_ID,
            );
          }

          const vercelConfig = await vercelClient.getDomainConfiguration(
            `${normalizedDomainName}.astra.namefi.dev`,
          );

          const expectedRecord = vercelConfig?.recommendedCNAME[0];

          let record:
            | {
                name: string;
                type: string;
                rdata: string;
                zoneName: string;
              }
            | undefined;
          if (expectedRecord) {
            // Create CNAME record in namefi-io zone
            await dnsClient.createCnameRecord(
              NAMEFI_DEV_ZONE,
              `${normalizedDomainName}.astra`,
              expectedRecord.value.replace(NAMEFI_DEV_ZONE_SUFFIX_REGEX, ''),
              300,
            );
            record = {
              name: `${normalizedDomainName}.astra`,
              type: 'CNAME',
              rdata: expectedRecord.value,
              zoneName: 'namefi.dev',
            };
          }

          return {
            success: true,
            message: `${normalizedDomainName}.astra.namefi.dev CNAME setup completed`,
            subdomain: `${normalizedDomainName}.astra.namefi.dev`,
            target: expectedRecord?.value,
            zone: NAMEFI_DEV_ZONE,
            record,
          };
        } catch (error) {
          logger.error(
            { error, input },
            'Failed to setup namefi.dev subdomain',
          );
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to setup namefi.dev subdomain',
          });
        }
      }
    }),

  // Toggle enable/disable status of a powered by namefi domain
  togglePoweredByNamefiDomainStatus: auditedAdminProcedureWithPermissions(
    Permission.WRITE_PBN,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: input.normalizedDomainName,
      action: input.enabled ? 'enable' : 'disable',
      extraInput: input,
    }),
  )
    .input(adminPoweredByNamefiContract.togglePoweredByNamefiDomainStatus.input)
    .output(
      adminPoweredByNamefiContract.togglePoweredByNamefiDomainStatus.output,
    )
    .mutation(async ({ input }) => {
      const { normalizedDomainName, enabled } = input;

      try {
        const updatedDomain = await db
          .update(poweredbyNamefiDomainsTable)
          .set({
            enabled,
            updatedAt: new Date(),
          })
          .where(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              normalizedDomainName,
            ),
          )
          .returning();

        if (updatedDomain.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Powered by Namefi domain not found',
          });
        }

        await invalidatePoweredByNamefi3PDomainsCache();

        return {
          success: true,
          domain: updatedDomain[0],
          message: `Domain ${enabled ? 'enabled' : 'disabled'} successfully`,
        };
      } catch (error) {
        logger.error('Error toggling domain status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to toggle domain status',
        });
      }
    }),

  // Start rollout for a powered by namefi domain
  startPoweredByNamefiDomainRollout: auditedAdminProcedureWithPermissions(
    Permission.WRITE_PBN,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: input.normalizedDomainName,
      action: 'start_domain_rollout',
      extraInput: input,
    }),
  )
    .input(adminPoweredByNamefiContract.startPoweredByNamefiDomainRollout.input)
    .output(
      adminPoweredByNamefiContract.startPoweredByNamefiDomainRollout.output,
    )
    .mutation(async ({ input }) => {
      const { normalizedDomainName } = input;

      try {
        const updatedDomain = await db
          .update(poweredbyNamefiDomainsTable)
          .set({
            startRolloutAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              normalizedDomainName,
            ),
          )
          .returning();

        if (updatedDomain.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Powered by Namefi domain not found',
          });
        }

        await invalidatePoweredByNamefi3PDomainsCache();

        return {
          success: true,
          domain: updatedDomain[0],
          message: 'Domain rollout started successfully',
        };
      } catch (error) {
        logger.error('Error starting domain rollout:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start domain rollout',
        });
      }
    }),

  // Update cost and duration constraints for a powered by namefi domain
  updatePoweredByNamefiDomainCostAndDuration:
    auditedAdminProcedureWithPermissions(
      Permission.WRITE_PBN,
      ({ ctx, input, auditActorExtraInfo }) => ({
        actorType: 'admin',
        actorId: ctx.user.id,
        actorExtraInfo: auditActorExtraInfo,
        resourceType: 'pbn_domain',
        resourceId: input?.normalizedDomainName ?? '',
        action: 'update_cost_and_duration',
        extraInput: input,
      }),
    )
      .input(
        adminPoweredByNamefiContract.updatePoweredByNamefiDomainCostAndDuration
          .input,
      )
      .output(
        adminPoweredByNamefiContract.updatePoweredByNamefiDomainCostAndDuration
          .output,
      )
      .mutation(async ({ input }) => {
        const {
          normalizedDomainName,
          costPerYearInUsdCents,
          durationConstraints,
        } = input;

        try {
          const updatedDomain = await db
            .update(poweredbyNamefiDomainsTable)
            .set({
              costPerYearInUsdCents,
              durationConstraints,
              updatedAt: new Date(),
            })
            .where(
              eq(
                poweredbyNamefiDomainsTable.normalizedDomainName,
                normalizedDomainName,
              ),
            )
            .returning();

          if (updatedDomain.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Powered by Namefi domain not found',
            });
          }

          await invalidatePoweredByNamefi3PDomainsCache();

          return {
            success: true,
            domain: updatedDomain[0],
            message: 'Domain cost and duration updated successfully',
          };
        } catch (error) {
          logger.error('Error updating domain cost and duration:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update domain cost and duration',
          });
        }
      }),
});
