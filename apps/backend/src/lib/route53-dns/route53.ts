import {
  ActivateKeySigningKeyCommand,
  type ActivateKeySigningKeyCommandInput,
  type Change,
  ChangeResourceRecordSetsCommand,
  type ChangeResourceRecordSetsCommandInput,
  CreateHostedZoneCommand,
  type CreateHostedZoneCommandInput,
  CreateKeySigningKeyCommand,
  type CreateKeySigningKeyCommandInput,
  DeactivateKeySigningKeyCommand,
  type DeactivateKeySigningKeyCommandInput,
  DeleteKeySigningKeyCommand,
  type DeleteKeySigningKeyCommandInput,
  DisableHostedZoneDNSSECCommand,
  type DisableHostedZoneDNSSECCommandInput,
  EnableHostedZoneDNSSECCommand,
  type EnableHostedZoneDNSSECCommandInput,
  GetChangeCommand,
  type GetChangeCommandInput,
  GetDNSSECCommand,
  type GetDNSSECCommandInput,
  GetHostedZoneCommand,
  ListHostedZonesByNameCommand,
  ListHostedZonesCommand,
  type ListHostedZonesCommandInput,
  ListResourceRecordSetsCommand,
  type ListResourceRecordSetsCommandInput,
  Route53Client,
} from '@aws-sdk/client-route-53';

import { assertNotNil } from '@namefi-astra/utils';
import punycode from 'punycode/';
import { secrets } from '#lib/env';
import type { RecordEntity } from '#lib/route53-dns/record';

// Singleton Route53 client instance
let route53Client: Route53Client | null = null;

/**
 * Gets or creates the singleton Route53 client instance
 * @returns The singleton Route53 client
 */
function getRoute53Client(): Route53Client {
  if (!route53Client) {
    route53Client = new Route53Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: secrets.AWS_ACCESS_KEY_ID,
        secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return route53Client;
}

/**
 * Get zones by name
 * @param args - Object containing zoneName
 * @returns Array of hosted zones matching the name
 */
export async function getZonesByName(args: { zoneName: string }) {
  const client = getRoute53Client();
  const zoneName = punycode.toASCII(args.zoneName);
  const response = await client.send(
    new ListHostedZonesByNameCommand({
      // ListHostedZonesByNameRequest
      DNSName: zoneName,
    }),
  );
  assertNotNil(response.HostedZones, 'HostedZones is not defined');
  return response.HostedZones.filter(
    ({ Name }) => Name?.toLowerCase() === `${zoneName.toLowerCase()}.`,
  );
}

/**
 * Get a single zone by name
 * @param args - Object containing zoneName
 * @returns The hosted zone matching the name
 */
export async function getZoneByName(args: { zoneName: string }) {
  const client = getRoute53Client();
  const zoneName = punycode.toASCII(args.zoneName);
  const response = await client.send(
    new ListHostedZonesByNameCommand({
      // ListHostedZonesByNameRequest
      DNSName: zoneName,
      MaxItems: 1,
    }),
  );
  assertNotNil(response.HostedZones, 'HostedZones is not defined');
  if (response.HostedZones[0].Name !== `${zoneName}.`) {
    throw new Error(`zone(${zoneName})-not-found`); //todo more sophisticated to account for all cases
  }
  return response.HostedZones[0];
}

/**
 * Get zone by ID
 * @param args - Object containing id
 * @returns The hosted zone details
 */
export async function getZoneById({ id }: { id: string }) {
  const client = getRoute53Client();
  const input = {
    // GetHostedZoneRequest
    Id: id, // required
  };
  const command = new GetHostedZoneCommand(input);
  return await client.send(command);
}

/**
 * Get zone records
 * @param input - ListResourceRecordSetsCommandInput
 * @returns The resource record sets
 */
export async function getZoneRecords(
  input: ListResourceRecordSetsCommandInput,
) {
  const client = getRoute53Client();
  const command = new ListResourceRecordSetsCommand(input);
  return await client.send(command);
}

/**
 * Change a single record set
 * @param args - Object containing zoneId, action, and record
 * @returns The change response
 */
export async function changeRecordSet({
  zoneId,
  action,
  record,
}: {
  zoneId: string;
  record: RecordEntity;
  action: Change['Action'];
}) {
  const client = getRoute53Client();
  const input: ChangeResourceRecordSetsCommandInput = {
    ChangeBatch: {
      Changes: [
        {
          Action: action,
          ResourceRecordSet: {
            Name: record.name,
            ResourceRecords: record.data.map((Value) => ({ Value })),
            TTL: record.ttl,
            Type: record.type,
            // SetIdentifier
          },
        },
      ],
    },
    HostedZoneId: zoneId,
  };
  const command = new ChangeResourceRecordSetsCommand(input);
  return await client.send(command);
}

/**
 * Change multiple resource record sets
 * @param args - Object containing zoneId and changes
 * @returns The change response
 */
export async function changeResourceRecordSets({
  zoneId,
  changes,
}: {
  zoneId: string;
  changes: Change[];
}) {
  const client = getRoute53Client();
  const input: ChangeResourceRecordSetsCommandInput = {
    ChangeBatch: {
      Changes: changes,
    },
    HostedZoneId: zoneId,
  };
  const command = new ChangeResourceRecordSetsCommand(input);
  return await client.send(command);
}

/**
 * Create a new hosted zone
 * @param args - Object containing domainName, delegationSetId, and callerReference
 * @returns The created hosted zone
 */
export async function createZone({
  domainName,
  delegationSetId,
  callerReference,
}: {
  domainName: string;
  delegationSetId?: string;
  callerReference?: string;
}) {
  const client = getRoute53Client();
  const input = {
    // CreateHostedZoneRequest
    Name: punycode.toASCII(domainName), // required
    CallerReference: callerReference || punycode.toASCII(domainName), // required
    DelegationSetId: delegationSetId,
    HostedZoneConfig: {
      Comment: domainName,
      PrivateZone: false,
    },
  } satisfies CreateHostedZoneCommandInput;
  const command = new CreateHostedZoneCommand(input);
  return await client.send(command);
}

/**
 * Get change details by change ID
 * @param args - Object containing changeId
 * @returns The change details
 */
export async function getChangeDetails({ changeId }: { changeId: string }) {
  const client = getRoute53Client();
  const input: GetChangeCommandInput = {
    Id: changeId,
  };
  const command = new GetChangeCommand(input);
  return await client.send(command);
}

/**
 * Enable DNSSEC for a hosted zone
 * @param args - Object containing hostedZoneId
 * @returns The enable DNSSEC response
 */
export async function enableHostedZoneDNSSECCommand({
  hostedZoneId,
}: {
  hostedZoneId: string;
}) {
  const client = getRoute53Client();
  const input: EnableHostedZoneDNSSECCommandInput = {
    // EnableHostedZoneDNSSECRequest
    HostedZoneId: hostedZoneId, // required
  };
  const command = new EnableHostedZoneDNSSECCommand(input);
  return await client.send(command);
}

/**
 * Disable DNSSEC for a hosted zone
 * @param args - Object containing hostedZoneId
 * @returns The disable DNSSEC response
 */
export async function disableHostedZoneDNSSECCommand({
  hostedZoneId,
}: {
  hostedZoneId: string;
}) {
  const client = getRoute53Client();
  const input: DisableHostedZoneDNSSECCommandInput = {
    HostedZoneId: hostedZoneId, // required
  };
  const command = new DisableHostedZoneDNSSECCommand(input);
  return await client.send(command);
}

/**
 * Get DNSSEC information for a hosted zone
 * @param args - Object containing hostedZoneId
 * @returns The DNSSEC information
 */
export async function getDNSSECCommand({
  hostedZoneId,
}: {
  hostedZoneId: string;
}) {
  const client = getRoute53Client();
  const input: GetDNSSECCommandInput = {
    HostedZoneId: hostedZoneId, // required
  };
  const command = new GetDNSSECCommand(input);
  return await client.send(command);
}

/**
 * Create a key signing key
 * @param args - Object containing hostedZoneId, name, callerReference, and status
 * @returns The created key signing key
 */
export async function createKeySigningKeyCommand({
  hostedZoneId,
  name,
  callerReference,
  status,
}: {
  hostedZoneId: string;
  name: string;
  callerReference?: string;
  status: 'ACTIVE' | 'INACTIVE';
}) {
  const client = getRoute53Client();
  const input: CreateKeySigningKeyCommandInput = {
    HostedZoneId: hostedZoneId, // required
    CallerReference: callerReference || crypto.randomUUID(), // required
    KeyManagementServiceArn: process.env.AWS_R53_DNSSEC_KMS_ARN, // required
    Name: name, // required
    Status: status, // required
  };
  const command = new CreateKeySigningKeyCommand(input);
  return await client.send(command);
}

/**
 * Activate a key signing key
 * @param args - Object containing hostedZoneId and name
 * @returns The activation response
 */
export async function activateKeySigningKeyCommand({
  hostedZoneId,
  name,
}: {
  hostedZoneId: string;
  name: string;
}) {
  const client = getRoute53Client();
  const input: ActivateKeySigningKeyCommandInput = {
    HostedZoneId: hostedZoneId, // required
    Name: name, // required
  };
  const command = new ActivateKeySigningKeyCommand(input);
  return await client.send(command);
}

/**
 * Deactivate a key signing key
 * @param args - Object containing hostedZoneId and name
 * @returns The deactivation response
 */
export async function deactivateKeySigningKeyCommand({
  hostedZoneId,
  name,
}: {
  hostedZoneId: string;
  name: string;
}) {
  const client = getRoute53Client();
  const input: DeactivateKeySigningKeyCommandInput = {
    HostedZoneId: hostedZoneId, // required
    Name: name, // required
  };
  const command = new DeactivateKeySigningKeyCommand(input);
  return await client.send(command);
}

/**
 * Delete a key signing key
 * @param args - Object containing hostedZoneId and name
 * @returns The deletion response
 */
export async function deleteKeySigningKeyCommand({
  hostedZoneId,
  name,
}: {
  hostedZoneId: string;
  name: string;
}) {
  const client = getRoute53Client();
  const input: DeleteKeySigningKeyCommandInput = {
    HostedZoneId: hostedZoneId, // required
    Name: name, // required
  };
  const command = new DeleteKeySigningKeyCommand(input);
  return await client.send(command);
}

/**
 * List hosted zones with optional filtering and pagination
 * @param args - Object containing delegationSetId, cursor, and pageSize
 * @returns The list of hosted zones
 */
export async function listHostedZones({
  delegationSetId,
  cursor,
  pageSize,
}: {
  delegationSetId?: string;
  pageSize?: number;
  cursor?: string;
}) {
  const client = getRoute53Client();
  const input: ListHostedZonesCommandInput = {
    DelegationSetId: delegationSetId,
    Marker: cursor,
    MaxItems: pageSize,
  };
  const command = new ListHostedZonesCommand(input);
  return await client.send(command);
}
