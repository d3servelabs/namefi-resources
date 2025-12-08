/**
 * Type definitions for EPP Contact commands.
 *
 * @see RFC 5733 - Extensible Provisioning Protocol (EPP) Contact Mapping
 */

import type { z } from 'zod';
import type {
  ContactCheckTypeXml,
  ContactInfoXml,
  ContactCreateTypeXml,
  ContactUpdateTypeXml,
} from '../../../data/schemas/epp-core';

// ============ Payload Types (for response parsing) ============

export type ContactCheckPayload = z.infer<typeof ContactCheckTypeXml>;
export type ContactInfoPayload = z.infer<typeof ContactInfoXml>;
export type ContactCreatePayload = z.infer<typeof ContactCreateTypeXml>;
export type ContactUpdatePayload = z.infer<typeof ContactUpdateTypeXml>;

// ============ Command Option Interfaces ============

/**
 * Postal information for a contact.
 */
export interface ContactPostalInfo {
  /** Type of postal info: "loc" for local, "int" for internationalized */
  type: 'loc' | 'int';

  /** Contact name */
  name: string;

  /** Organization name (optional) */
  org?: string;

  /** Address information */
  addr: {
    /** Street address lines (up to 3) */
    street?: string[];

    /** City */
    city: string;

    /** State/Province (optional) */
    sp?: string;

    /** Postal code (optional) */
    pc?: string;

    /** Two-letter ISO country code */
    cc: string;
  };
}

/**
 * Options for contact:info command.
 */
export interface ContactInfoOptions {
  /** Contact ID to query */
  id: string;

  /** Authorization info for contacts not sponsored by the client */
  authInfo?: string;
}

/**
 * Options for contact:create command.
 */
export interface ContactCreateOptions {
  /** Contact ID (3-64 characters) */
  id: string;

  /** Postal information (at least one required) */
  postalInfo: ContactPostalInfo[];

  /** Voice telephone number in E.164 format */
  voice?: { number: string; ext?: string };

  /** Fax number in E.164 format */
  fax?: { number: string; ext?: string };

  /** Email address */
  email: string;

  /** Authorization info (password) for the contact */
  authInfo: string;
}

/**
 * Client-settable contact status values.
 */
export type ContactStatus =
  | 'clientDeleteProhibited'
  | 'clientTransferProhibited'
  | 'clientUpdateProhibited';

/**
 * Options for contact:update command.
 */
export interface ContactUpdateOptions {
  /** Contact ID to update */
  id: string;

  /** Elements to add */
  add?: {
    statuses?: Array<{
      status: ContactStatus;
      lang?: string;
      text?: string;
    }>;
  };

  /** Elements to remove */
  rem?: {
    statuses?: Array<{
      status: ContactStatus;
      lang?: string;
      text?: string;
    }>;
  };

  /** Elements to change */
  chg?: {
    postalInfo?: ContactPostalInfo[];
    voice?: { number: string; ext?: string };
    fax?: { number: string; ext?: string };
    email?: string;
    authInfo?: string;
  };
}
