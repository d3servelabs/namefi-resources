// Core EPP (RFC 5730) TypeScript types - minimal subset actually used by the client.

// ---------- Transport layer ----------

// Common "length-prefixed XML frame" container (TCP layer)
export interface EppFrame {
  length: number; // 32-bit length including this field
  xml: string; // UTF-8 XML
}

export interface EppConnectionOptions {
  host: string;
  port?: number; // default 700
  tls: boolean;
  onConnectionEnd?: () => Promise<void>;
}

// ---------- Result types ----------

// RFC 5730 Section 6.2 Result codes
export type EppResultCode =
  // 1xxx: success
  | 1000 // Command completed successfully
  | 1001 // Command completed successfully; action pending
  | 1300 // [success with notifications, etc. – vendor-specific usage varies]
  | 1500 // Logout
  // 2xxx: client / protocol / policy errors
  | 2000 // Unknown command
  | 2001 // Command syntax error
  | 2002 // Command use error
  | 2003 // Required parameter missing
  | 2004 // Parameter value range error
  | 2005 // Parameter value syntax error
  | 2100 // Unimplemented protocol version
  | 2101 // Unimplemented command
  | 2102 // Unimplemented option
  | 2103 // Unimplemented extension
  | 2104 // Billing failure
  | 2105 // Object not eligible for renewal
  | 2106 // Object not eligible for transfer
  | 2200 // Authentication error
  | 2201 // Authorization error
  | 2202 // Invalid authorization information
  | 2300 // Object pending transfer
  | 2301 // Object not pending transfer
  | 2302 // Object exists
  | 2303 // Object does not exist
  | 2304 // Object status prohibits operation
  | 2305 // Object association prohibits operation
  | 2306 // Parameter value policy error
  | 2307 // Unimplemented object service
  | 2308 // Data management policy violation
  // 24xx / 25xx: server errors
  | 2400 // Command failed (server error; session continues)
  | 2500 // Command failed; server closing connection
  | 2501 // Authentication error; server closing connection
  | 2502; // Session limit exceeded; server closing connection

export interface EppResult {
  code: EppResultCode;
  msg: string;
  lang?: string; // xml:lang
  values?: string[]; // values from <value> elements (simplified)
  extValues?: string[]; // from <extValue> (simplified)
}

export interface EppTransactionId {
  clTRID?: string; // client transaction ID (echoed)
  svTRID?: string; // server transaction ID
}

// ---------- Client configuration ----------

export interface EppLoginServices {
  objURIs: string[]; // object namespaces
  extURIs?: string[]; // extension namespaces
}

export interface EppCredentials {
  clID: string;
  pw: string;
  newPW?: string;
}

export interface EppSessionConfig {
  lang?: string; // default 'en'
  version?: string; // default '1.0'
  services: EppLoginServices;
}
