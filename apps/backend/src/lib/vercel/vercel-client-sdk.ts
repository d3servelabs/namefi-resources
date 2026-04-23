import { Vercel } from '@vercel/sdk';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { logger } from '#lib/logger';
import { secrets } from '#lib/env';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { GetProjectDomainResponseBody } from '@vercel/sdk/models/getprojectdomainop';
import type { AddProjectDomainResponseBody } from '@vercel/sdk/models/addprojectdomainop';
import type { GetDomainConfigResponseBody } from '@vercel/sdk/models/getdomainconfigop.js';
import {
  VercelNotApplicableError,
  isVercelProvisionable,
  vercelApplicabilityReason,
} from './applicability';

export interface VercelDomain {
  name: string;
  verified: boolean;
  verification: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  projectId?: string;
}

export interface DomainConfiguration {
  isAnycast: boolean;
  expectedRecords: Array<{
    type: 'A' | 'CNAME';
    name: string;
    value: string;
  }>;
  verificationRecords: Array<{
    type: string;
    domain: string;
    value: string;
  }>;
}

export const VERCEL_ANYCAST = {
  CNAME: 'cname.vercel-dns.com.',
  A: '76.76.21.21',
};

export const VERCEL_ANYCAST_TTL = 60;

export const VERCEL_ANYCAST_CAA_RECORDS = [
  {
    type: 'CAA' as const,
    name: '@' as const,
    rdata: '0 issue "letsencrypt.org"',
    ttl: VERCEL_ANYCAST_TTL,
  },
  {
    type: 'CAA' as const,
    name: '@' as const,
    rdata: '0 issue "zerossl.com"',
    ttl: VERCEL_ANYCAST_TTL,
  },
];

export type VercelAnycastDnsRecord = {
  name: '@';
  type: 'A' | 'CAA' | 'CNAME';
  ttl: number;
  rdata: string;
};

export type VercelAnycastRecordPlan = {
  apexRecordType: 'A' | 'CNAME';
  records: VercelAnycastDnsRecord[];
  overrideStrategy: 'replace-apex-address-records' | 'replace-all-apex-records';
};

export function getVercelAnycastRecordPlan(
  normalizedDomainName: NamefiNormalizedDomain,
): VercelAnycastRecordPlan {
  const parsedDomain = parseDomainName(normalizedDomainName);

  if (!parsedDomain.valid) {
    throw new Error(`Invalid domain name: ${normalizedDomainName}`);
  }

  if (parsedDomain.registryType === 'subdomain') {
    return {
      apexRecordType: 'CNAME',
      records: [
        {
          name: '@',
          type: 'CNAME',
          ttl: VERCEL_ANYCAST_TTL,
          rdata: VERCEL_ANYCAST.CNAME,
        },
      ],
      overrideStrategy: 'replace-all-apex-records',
    };
  }

  return {
    apexRecordType: 'A',
    records: [
      {
        name: '@',
        type: 'A',
        ttl: VERCEL_ANYCAST_TTL,
        rdata: VERCEL_ANYCAST.A,
      },
      ...VERCEL_ANYCAST_CAA_RECORDS,
    ],
    overrideStrategy: 'replace-apex-address-records',
  };
}

export class VercelClientSDK {
  private readonly vercel: Vercel;
  private readonly teamId?: string;

  constructor(apiToken: string, teamId?: string) {
    this.vercel = new Vercel({
      bearerToken: apiToken,
    });
    this.teamId = teamId;
  }

  async getProject() {
    return undefined;
  }

  async getProjectDomain(
    projectIdOrName: string,
    domainName: string,
  ): Promise<GetProjectDomainResponseBody> {
    const domain = await this.vercel.projects.getProjectDomain({
      idOrName: projectIdOrName,
      teamId: this.teamId,
      domain: domainName,
    });
    return domain;
  }

  /**
   * Add domain to project.
   *
   * Throws a {@link VercelNotApplicableError} before the network call when
   * `domain` cannot be a Vercel project domain (e.g. a TLD). Callers
   * should catch it specifically to render a "N/A" state in the UI.
   */
  async addDomainToProject(
    projectId: string,
    domain: string,
    customEnvironmentId?: string,
  ): Promise<AddProjectDomainResponseBody> {
    if (!isVercelProvisionable(domain)) {
      const reason = vercelApplicabilityReason(domain) ?? 'invalid-domain';
      logger.debug(
        { projectId, domain, reason },
        'Skipping addDomainToProject — domain is not Vercel-provisionable',
      );
      throw new VercelNotApplicableError(domain, reason);
    }
    try {
      const result = await this.vercel.projects.addProjectDomain({
        idOrName: projectId,
        teamId: this.teamId,
        requestBody: {
          name: domain,
          customEnvironmentId,
        },
      });

      return result;
    } catch (error) {
      logger.error(
        { error, projectId, domain },
        'Failed to add domain to Vercel project',
      );
      throw error;
    }
  }

  /**
   * Get domains for a project with pagination support
   */
  async getProjectDomains(
    projectIdOrName: string,
  ): Promise<GetProjectDomainResponseBody[]> {
    try {
      let allDomains: GetProjectDomainResponseBody[] = [];
      let next: number | null = null;

      do {
        const response = await this.vercel.projects.getProjectDomains({
          idOrName: projectIdOrName,
          teamId: this.teamId,
          limit: 100,
          ...(next && { since: next }),
        });

        allDomains = [...allDomains, ...response.domains];
        next = response.pagination?.next;
      } while (next);

      return allDomains;
    } catch (error) {
      logger.error(
        { error, projectIdOrName },
        'Failed to get Vercel project domains',
      );
      return [];
    }
  }

  /**
   * Check if domain is configured in project.
   *
   * Uses the single-domain lookup (`GET /projects/{id}/domains/{domain}`)
   * first for an O(1) existence check; falls back to the full-list scan
   * if the direct lookup fails for any reason other than a 404. Domains
   * that are not Vercel-provisionable (TLDs, invalid) are treated as
   * "not in project" without any network call.
   */
  async isDomainInProject(projectId: string, domain: string): Promise<boolean> {
    if (!isVercelProvisionable(domain)) {
      return false;
    }

    try {
      const found = await this.vercel.projects.getProjectDomain({
        idOrName: projectId,
        teamId: this.teamId,
        domain,
      });
      return Boolean(found);
    } catch (error) {
      const status =
        (error as { statusCode?: number; status?: number })?.statusCode ??
        (error as { status?: number })?.status;
      if (status === 404) {
        return false;
      }
      logger.warn(
        { error, projectId, domain },
        'Direct Vercel domain lookup failed; falling back to list scan',
      );
      try {
        const domains = await this.getProjectDomains(projectId);
        return domains.some(
          (d) => toPunycodeDomainName(d.name) === toPunycodeDomainName(domain),
        );
      } catch (fallbackError) {
        logger.error(
          { error: fallbackError, projectId, domain },
          'Failed to check if domain is in project',
        );
        return false;
      }
    }
  }

  /**
   * Remove domain from project
   */
  async removeDomainFromProject(
    projectId: string,
    domain: string,
  ): Promise<void> {
    try {
      await this.vercel.projects.removeProjectDomain({
        idOrName: projectId,
        domain,
        teamId: this.teamId,
      });
    } catch (error) {
      logger.error(
        { error, projectId, domain },
        'Failed to remove domain from Vercel project',
      );
      throw error;
    }
  }

  async getDomainConfiguration(
    domain: string,
  ): Promise<GetDomainConfigResponseBody> {
    const domainConfig = await this.vercel.domains.getDomainConfig({
      domain,
    });
    return domainConfig;
  }

  /**
   * Analyze domain configuration to determine if it uses anycast values
   */
  analyzeDomainConfiguration(
    domain: GetProjectDomainResponseBody,
  ): DomainConfiguration {
    const isAnycast = domain.verification?.some(
      (v) =>
        (v.type === 'CNAME' && v.value === VERCEL_ANYCAST.CNAME) ||
        (v.type === 'A' && v.value === VERCEL_ANYCAST.A),
    );

    const expectedRecords: Array<{
      type: 'A' | 'CNAME';
      name: string;
      value: string;
    }> = [];

    if (isAnycast) {
      // Anycast domains should have CNAME to cname.vercel-dns.com
      expectedRecords.push({
        type: 'CNAME',
        name: domain.name,
        value: VERCEL_ANYCAST.CNAME,
      });
    } else {
      // Custom IP domains should have A record with Vercel IP
      const aRecord = domain.verification?.find((v) => v.type === 'A');
      if (aRecord) {
        expectedRecords.push({
          type: 'A',
          name: domain.name,
          value: aRecord.value,
        });
      }
    }

    return {
      isAnycast: isAnycast || false,
      expectedRecords,
      verificationRecords: domain.verification || [],
    };
  }
}

// Factory function to create Vercel client with environment configuration
export function createVercelClientSDK(): VercelClientSDK {
  const apiToken = secrets.VERCEL_API_TOKEN;
  const teamId = secrets.VERCEL_TEAM_ID;

  if (!apiToken) {
    throw new Error('VERCEL_API_TOKEN is required');
  }

  return new VercelClientSDK(apiToken, teamId);
}
