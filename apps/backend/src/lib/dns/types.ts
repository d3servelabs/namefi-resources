export interface DnsRecord {
  [key: number]: string;
}

export interface DnsTable {
  [domain: string]: DnsRecord;
}

export interface DnsResponse {
  RCODE?: number;
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
  Question?: Array<{
    name: string;
    type: number;
  }>;
}
