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
   * Get a managed zone by name
   */
  async getZone(zoneName: string) {
    try {
      const zone = this.dns.zone(zoneName);
      const [metadata] = await zone.getMetadata();
      return { zone, metadata };
    } catch (error) {
      logger.error(
        { error, zoneName, projectId: this.projectId },
        'Failed to get DNS zone',
      );
      throw error;
    }
  }

  /**
   * Create a CNAME record in the specified zone
   */
  async createCnameRecord(
    zoneName: string,
    recordName: string,
    target: string,
    ttl: number,
  ): Promise<DnsRecord> {
    try {
      const { zone } = await this.getZone(zoneName);

      // Ensure record name ends with zone's DNS name
      const [zoneMetadata] = await zone.getMetadata();
      const zoneDnsName = zoneMetadata.dnsName;
      const fullRecordName = recordName.endsWith('.')
        ? recordName
        : `${recordName}.${zoneDnsName}`;
      const fullTarget = target.endsWith('.') ? target : `${target}.`;

      // Create the record using zone.record()
      const record = zone.record('CNAME', {
        name: fullRecordName,
        data: [fullTarget],
        ttl,
      });

      // Create the record
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

      // Wait for change to be applied
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

      // Ensure record name ends with zone's DNS name
      const [zoneMetadata] = await zone.getMetadata();
      const zoneDnsName = zoneMetadata.dnsName;
      const fullRecordName = recordName.endsWith('.')
        ? recordName
        : `${recordName}.${zoneDnsName}`;
      const fullTarget = target.endsWith('.') ? target : `${target}.`;

      // Create the record using zone.record()
      const record = zone.record('CNAME', {
        name: fullRecordName,
        data: [fullTarget],
        ttl,
        type: 'CNAME',
      });

      // Delete the record
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

      // Wait for change to be applied
      if (change.id) {
        await this.waitForChange(zoneName, change.id);
      }
    } catch (error) {
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

      // Ensure record name ends with zone's DNS name for comparison
      const [zoneMetadata] = await zone.getMetadata();
      const zoneDnsName = zoneMetadata.dnsName;
      const fullRecordName = recordName.endsWith('.')
        ? recordName
        : `${recordName}.${zoneDnsName}`;

      return records.some((record) => (record as any).name === fullRecordName);
    } catch (error) {
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

      return records.map((record: any) => ({
        name: record.name || '',
        type: record.type || '',
        ttl: record.ttl || 300,
        rrdatas: record.data || [],
      }));
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

        // Wait 2 seconds before checking again
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
