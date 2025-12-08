/**
 * EPP Session commands.
 *
 * Session commands manage the EPP connection lifecycle:
 * - login: Establish a session
 * - logout: End a session
 * - poll: Retrieve/acknowledge service messages
 */

import type { z } from 'zod';
import type {
  EppLoginTypeXml,
  EppPollTypeXml,
} from '../../../data/schemas/epp-core';

// Payload types for response parsing
export type LoginPayload = z.infer<typeof EppLoginTypeXml>;
export type PollPayload = z.infer<typeof EppPollTypeXml>;

export { buildLoginCommand, type LoginOptions } from './login';
export { buildLogoutCommand } from './logout';
export { buildPollReqCommand, buildPollAckCommand } from './poll';
