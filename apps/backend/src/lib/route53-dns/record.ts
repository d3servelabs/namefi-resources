import type { ResourceRecordSet } from '@aws-sdk/client-route-53';
import { assoc, filter, isNotNil, map, objOf, pluck } from 'ramda';

export enum RecordType {
  A = 'A',
  AAAA = 'AAAA',
  SOA = 'SOA',
  NS = 'NS',
  CNAME = 'CNAME',
  TXT = 'TXT',
  MX = 'MX',
  PTR = 'PTR',
  SRV = 'SRV',
}

export interface NamelessDnsRecordInfo {
  type: RecordType;
  data: string[];
  ttl: number;
}

export interface DnsRecord extends NamelessDnsRecordInfo {
  name: string;
}

export class RecordEntity implements DnsRecord {
  name: string;
  ttl: number;
  type: RecordType;
  data: string[];
  constructor({
    name,
    ttl,
    type,
    data,
  }: { name: string; ttl: number; type: RecordType; data: string[] }) {
    this.name = name;
    this.ttl = ttl;
    this.type = type;
    this.data = data;
  }

  static fromAwsRecordSet(record: ResourceRecordSet): RecordEntity {
    if (!(record.Name && record.TTL)) {
      throw new Error('invalid record set');
    }
    return new RecordEntity({
      name: record.Name,
      type: record.Type as any,
      ttl: record.TTL,
      data: nonNilArray(pluck('Value', record.ResourceRecords ?? [])),
    });
  }

  static toAwsRecordSet(record: RecordEntity): ResourceRecordSet {
    return {
      Name: record.name,
      Type: record.type,
      TTL: record.ttl,
      ResourceRecords: mapResourceRecords(record.data),
    };
  }
}

export const mapResourceRecords = map<string, Record<'Value', string>>(
  objOf('Value'),
);
export const withName = assoc('name');

function nonNilArray<T>(arr: (T | undefined | null)[]): T[] {
  return filter(isNotNil, arr) as T[];
}
