import { DNS } from '@google-cloud/dns';
import { logger } from '#lib/logger';
import { secrets } from '#lib/env';

export interface DnsRecord {
  name: string;
  type: string;
  ttl: number;
  rrdatas: string[];
}

export interface DnsRecordSet {
  name: string;
  type: string;
  ttl: number;
  rrdatas: string[];
}

/**
 * Thrown by `GoogleCloudDnsClient` methods when the target managed zone
 * cannot be found in the configured GCP project. Callers should translate
 * this to a user-facing "zone not configured" message rather than
 * surfacing the raw `@google-cloud/dns` error.
 */
export class GoogleDnsZoneNotFoundError extends Error {
  readonly zoneName: string;
  readonly projectId: string;

  constructor(zoneName: string, projectId: string, cause?: unknown) {
    super(
      `Google Cloud managed zone "${zoneName}" not found in project "${projectId}".`,
    );
    this.name = 'GoogleDnsZoneNotFoundError';
    this.zoneName = zoneName;
    this.projectId = projectId;
    if (cause) {
      (this as unknown as { cause?: unknown }).cause = cause;
    }
  }
}

/**
 * Ensures `recordName` is an absolute FQDN that ends with the zone's
 * `zoneDnsName` (always dot-terminated). Pure helper — exported for unit
 * tests.
 */
export function normalizeFqdnWithinZone(
  recordName: string,
  zoneDnsName: string,
): string {
  if (recordName.endsWith('.')) return recordName;
  const suffix = zoneDnsName.endsWith('.') ? zoneDnsName : `${zoneDnsName}.`;
  return `${recordName}.${suffix}`;
}

/**
 * Ensures a record target is dot-terminated. Pure helper.
 */
export function normalizeCnameTarget(target: string): string {
  return target.endsWith('.') ? target : `${target}.`;
}

/**
 * Extracts an HTTP-like status code from a caught error if present.
 * `@google-cloud/dns` surfaces a `code` numeric property for API errors.
 */
function getErrorStatusCode(error: unknown): number | undefined {
  const candidate = error as {
    code?: number | string;
    status?: number | string;
    statusCode?: number | string;
  };
  const raw = candidate?.code ?? candidate?.status ?? candidate?.statusCode;
  if (raw === undefined) return undefined;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export class GoogleCloudDnsClient {
  private readonly dns: DNS;
  private readonly projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.dns = new DNS({
      projectId,
      // Google Cloud credentials should be set via environment or service account
    });
  }

  /**
   * Get a managed zone by name. Throws {@link GoogleDnsZoneNotFoundError}
   * if the zone does not exist in this client's project.
   */
  async getZone(zoneName: string) {
    const zone = this.dns.zone(zoneName);
    try {
      const [metadata] = await zone.getMetadata();
      return { zone, metadata };
    } catch (error) {
      const status = getErrorStatusCode(error);
      if (status === 404) {
        logger.warn(
          { zoneName, projectId: this.projectId },
          'Google Cloud DNS zone not found',
        );
        throw new GoogleDnsZoneNotFoundError(zoneName, this.projectId, error);
      }
      logger.error(
        { error, zoneName, projectId: this.projectId },
        'Failed to get DNS zone',
      );
      throw error;
    }
  }

  /**
   * Create a CNAME record in the specified zone. Idempotent: if the same
   * record already exists with the same target, the existing record is
   * returned and no change is submitted.
   */
  async createCnameRecord(
    zoneName: string,
    recordName: string,
    target: string,
    ttl: number,
  ): Promise<DnsRecord> {
    try {
      const { zone } = await this.getZone(zoneName);

      const [zoneMetadata] = await zone.getMetadata();
      const zoneDnsName = zoneMetadata.dnsName;
      const fullRecordName = normalizeFqdnWithinZone(recordName, zoneDnsName);
      const fullTarget = normalizeCnameTarget(target);

      // Idempotent guard: if an identical CNAME is already present, skip
      // the create and return the existing record. Avoids GCP 409s and
      // lets callers re-run setup safely.
      const [existing] = await zone.getRecords({
        filterByTypes_: { CNAME: true },
      });
      const duplicate = existing.find((record) => {
        const recordData = record as unknown as {
          name?: string;
          data?: string[];
        };
        if (recordData.name !== fullRecordName) return false;
        const datas = recordData.data ?? [];
        return datas.some((d) => d === fullTarget);
      });
      if (duplicate) {
        logger.debug(
          { zoneName, recordName: fullRecordName, target: fullTarget },
          'CNAME already present in Google Cloud DNS; skipping create',
        );
        return {
          name: fullRecordName,
          type: 'CNAME',
          ttl,
          rrdatas: [fullTarget],
        };
      }

      const record = zone.record('CNAME', {
        name: fullRecordName,
        data: [fullTarget],
        ttl,
      });

      const [change] = await zone.createChange({
        add: record,
      });

      logger.debug(
        {
          zoneName,
          recordName: fullRecordName,
          target: fullTarget,
          changeId: change.id,
        },
        'Created CNAME record in Google Cloud DNS',
      );

      if (change.id) {
        await this.waitForChange(zoneName, change.id);
      }

      return {
        name: fullRecordName,
        type: 'CNAME',
        ttl,
        rrdatas: [fullTarget],
      };
    } catch (error) {
      if (error instanceof GoogleDnsZoneNotFoundError) throw error;
      logger.error(
        { error, zoneName, recordName, target },
        'Failed to create CNAME record',
      );
      throw error;
    }
  }

  /**
   * Delete a CNAME record from the specified zone
   */
  async deleteCnameRecord(
    zoneName: string,
    recordName: string,
    target: string,
    ttl: number,
  ): Promise<void> {
    try {
      const { zone } = await this.getZone(zoneName);

      const [zoneMetadata] = await zone.getMetadata();
      const zoneDnsName = zoneMetadata.dnsName;
      const fullRecordName = normalizeFqdnWithinZone(recordName, zoneDnsName);
      const fullTarget = normalizeCnameTarget(target);

      const record = zone.record('CNAME', {
        name: fullRecordName,
        data: [fullTarget],
        ttl,
        type: 'CNAME',
      });

      const [change] = await zone.createChange({
        delete: record,
      });

      logger.debug(
        {
          zoneName,
          recordName: fullRecordName,
          target: fullTarget,
          changeId: change.id,
        },
        'Deleted CNAME record from Google Cloud DNS',
      );

      if (change.id) {
        await this.waitForChange(zoneName, change.id);
      }
    } catch (error) {
      if (error instanceof GoogleDnsZoneNotFoundError) throw error;
      logger.error(
        { error, zoneName, recordName, target },
        'Failed to delete CNAME record',
      );
      throw error;
    }
  }

  /**
   * Check if a CNAME record exists
   */
  async recordExists(
    zoneName: string,
    recordName: string,
    recordType?: string,
  ): Promise<boolean> {
    try {
      const { zone } = await this.getZone(zoneName);
      const [records] = await zone.getRecords(
        recordType ? { filterByTypes_: { [recordType]: true } } : undefined,
      );

      const [zoneMetadata] = await zone.getMetadata();
      const zoneDnsName = zoneMetadata.dnsName;
      const fullRecordName = normalizeFqdnWithinZone(recordName, zoneDnsName);

      return records.some(
        (record) =>
          (record as unknown as { name?: string }).name === fullRecordName,
      );
    } catch (error) {
      if (error instanceof GoogleDnsZoneNotFoundError) {
        return false;
      }
      logger.error(
        { error, zoneName, recordName, recordType },
        'Failed to check if record exists',
      );
      return false;
    }
  }

  /**
   * List all records in a zone
   */
  async listRecords(
    zoneName: string,
    recordType?: string,
  ): Promise<DnsRecord[]> {
    try {
      const { zone } = await this.getZone(zoneName);
      const [records] = await zone.getRecords(
        recordType ? { filterByTypes_: { [recordType]: true } } : undefined,
      );

      return records.map((record) => {
        const raw = record as unknown as {
          name?: string;
          type?: string;
          ttl?: number;
          data?: string[];
        };
        return {
          name: raw.name || '',
          type: raw.type || '',
          ttl: raw.ttl ?? 300,
          rrdatas: raw.data || [],
        };
      });
    } catch (error) {
      logger.error(
        { error, zoneName, recordType },
        'Failed to list DNS records',
      );
      throw error;
    }
  }

  /**
   * Wait for a DNS change to be applied
   */
  private async waitForChange(
    zoneName: string,
    changeId: string,
    maxWaitTime = 60000,
  ): Promise<void> {
    const { zone } = await this.getZone(zoneName);
    const change = zone.change(changeId);

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const [metadata] = await change.getMetadata();
        if (metadata.status === 'done') {
          logger.debug({ zoneName, changeId }, 'DNS change completed');
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        logger.warn(
          { error, zoneName, changeId },
          'Error checking change status',
        );
        break;
      }
    }

    logger.warn(
      { zoneName, changeId, maxWaitTime },
      'DNS change may still be pending',
    );
  }
}

// Factory function to create Google Cloud DNS client with environment configuration
export function createGoogleCloudDnsClient(): GoogleCloudDnsClient {
  const projectId = secrets.GOOGLE_CLOUD_PROJECT_ID || 'd3serve-labs';
  return new GoogleCloudDnsClient(projectId);
}
