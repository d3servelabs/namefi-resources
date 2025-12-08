/**
 * EPP Host Create command builder.
 *
 * The host create command is used to create a new host object.
 * IP addresses are required for internal hosts (hosts subordinate to a domain
 * managed by the same registry).
 *
 * @see RFC 5732 Section 3.2.1
 */

import type { z } from 'zod';
import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import {
  HostCreateTypeXml,
  EppCreateCommandTypeXml,
} from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { HOST_NS } from '../helpers/namespaces';
import type { HostCreateOptions } from './types';

/**
 * Builds an EPP host create command.
 *
 * @example
 * // External host (no IP addresses needed)
 * const externalHostCmd = buildHostCreateCommand({
 *   name: "ns1.otherdomain.net",
 * });
 *
 * @example
 * // Internal host (IP addresses required)
 * const internalHostCmd = buildHostCreateCommand({
 *   name: "ns1.example.com",
 *   addr: [
 *     { ip: "v4", addr: "192.0.2.1" },
 *     { ip: "v6", addr: "2001:db8::1" },
 *   ],
 * });
 *
 * @param create - Host create options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildHostCreateCommand(
  create: HostCreateOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  const hostCreate: z.infer<typeof HostCreateTypeXml> & {
    '@_xmlns:host': string;
  } = {
    '@_xmlns:host': HOST_NS,
    'host:name': {
      '#text': create.name,
    },
  };

  if (create.addr?.length) {
    hostCreate['host:addr'] = create.addr.map((a) => ({
      '@_ip': a.ip,
      '#text': a.addr,
    }));
  }

  return withEppBaseFields(
    {
      'epp:create': EppCreateCommandTypeXml.parse({
        'host:create': HostCreateTypeXml.parse(hostCreate),
      }),
    },
    opts,
  ) as EppCommandTypeXml;
}
