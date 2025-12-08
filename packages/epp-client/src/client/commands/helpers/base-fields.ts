/**
 * Base field utilities for EPP commands.
 *
 * Provides common functionality for adding optional fields like
 * client transaction IDs and extensions to EPP commands.
 */

import {
  EppCommandTypeXml,
  type EppExtCommandTypeXml,
} from '../../../data/schemas/epp-core';

/**
 * Options that can be added to any EPP command.
 */
export interface CommandOptions {
  /**
   * Client transaction ID - a unique identifier for the command.
   * Used to correlate commands with responses.
   */
  clTRID?: string;

  /**
   * Command-level extension data.
   * Used for extensions like fee, secDNS, rgp, etc.
   */
  extension?: EppExtCommandTypeXml;
}

/**
 * Adds optional base fields (clTRID, extension) to an EPP command.
 *
 * @param command - The base EPP command object
 * @param opts - Optional fields to add
 * @returns The command with optional fields added
 */
export function withEppBaseFields(
  command: EppCommandTypeXml,
  opts?: CommandOptions,
  validate = true,
): EppCommandTypeXml {
  const result = { ...command };

  if (opts?.clTRID) {
    result['epp:clTRID'] = {
      '#text': opts.clTRID,
    };
  }
  if (opts?.extension) {
    result['epp:extension'] = opts.extension;
  }
  if (validate) {
    EppCommandTypeXml.parse(result);
  }
  return result;
}
