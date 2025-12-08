/**
 * EPP Host Update command builder.
 *
 * The host update command is used to modify attributes of an existing host object.
 * It supports adding/removing IP addresses and statuses, and renaming the host.
 *
 * @see RFC 5732 Section 3.2.3
 */

import type { z } from 'zod';
import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import {
  HostUpdateTypeXml,
  EppUpdateCommandTypeXml,
} from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { HOST_NS } from '../helpers/namespaces';
import type { HostUpdateOptions } from './types';

/**
 * Builds an EPP host update command.
 *
 * @example
 * // Add an IP address
 * const addIpCmd = buildHostUpdateCommand({
 *   name: "ns1.example.com",
 *   add: {
 *     addr: [{ ip: "v4", addr: "192.0.2.2" }],
 *   },
 * });
 *
 * @example
 * // Rename a host
 * const renameCmd = buildHostUpdateCommand({
 *   name: "ns1.example.com",
 *   chg: {
 *     name: "ns3.example.com",
 *   },
 * });
 *
 * @example
 * // Add a status
 * const addStatusCmd = buildHostUpdateCommand({
 *   name: "ns1.example.com",
 *   add: {
 *     statuses: [{ status: "clientDeleteProhibited" }],
 *   },
 * });
 *
 * @param update - Host update options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildHostUpdateCommand(
  update: HostUpdateOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  const hostUpdate: z.infer<typeof HostUpdateTypeXml> & {
    '@_xmlns:host': string;
  } = {
    '@_xmlns:host': HOST_NS,
    'host:name': {
      '#text': update.name,
    },
  };

  if (update.add) {
    hostUpdate['host:add'] = {};
    if (update.add.addr?.length) {
      hostUpdate['host:add']['host:addr'] = update.add.addr.map((a) => ({
        '@_ip': a.ip,
        '#text': a.addr,
      }));
    }
    if (update.add.statuses?.length) {
      hostUpdate['host:add']['host:status'] = update.add.statuses.map((s) => ({
        '@_s': s.status,
        '@_lang': s.lang ?? 'en',
        '#text': s.text ?? '',
      }));
    }
  }

  if (update.rem) {
    hostUpdate['host:rem'] = {};
    if (update.rem.addr?.length) {
      hostUpdate['host:rem']['host:addr'] = update.rem.addr.map((a) => ({
        '@_ip': a.ip,
        '#text': a.addr,
      }));
    }
    if (update.rem.statuses?.length) {
      hostUpdate['host:rem']['host:status'] = update.rem.statuses.map((s) => ({
        '@_s': s.status,
        '@_lang': s.lang ?? 'en',
        '#text': s.text ?? '',
      }));
    }
  }

  if (update.chg?.name) {
    hostUpdate['host:chg'] = {
      'host:name': {
        '#text': update.chg.name,
      },
    };
  }

  return withEppBaseFields(
    {
      'epp:update': EppUpdateCommandTypeXml.parse({
        'host:update': HostUpdateTypeXml.parse(hostUpdate),
      }),
    },
    opts,
  ) as EppCommandTypeXml;
}
