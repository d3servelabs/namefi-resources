/**
 * EPP Poll command builders.
 *
 * The poll command is used to retrieve and acknowledge service messages
 * from the server's message queue.
 *
 * @see RFC 5730 Section 2.9.2.3
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';

/**
 * Builds an EPP poll request command.
 *
 * Requests the next message from the server's message queue.
 *
 * @example
 * const pollReqCmd = buildPollReqCommand();
 *
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildPollReqCommand(opts?: CommandOptions): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:poll': { '@_op': 'req' },
    },
    opts,
  ) as EppCommandTypeXml;
}

/**
 * Builds an EPP poll acknowledge command.
 *
 * Acknowledges a message from the server's message queue,
 * removing it from the queue.
 *
 * @example
 * const pollAckCmd = buildPollAckCommand("12345");
 *
 * @param msgId - The message ID to acknowledge
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildPollAckCommand(
  msgId: string,
  opts?: CommandOptions,
): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:poll': { '@_op': 'ack', '@_msgID': msgId },
    },
    opts,
  ) as EppCommandTypeXml;
}
