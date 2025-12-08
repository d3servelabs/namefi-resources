import type {
  EppResult,
  EppResultCode,
  EppTransactionId,
} from '../protocol/core/types';

export type Result<T, Raw = unknown> = Ok<T, Raw> | Err<Raw>;

export interface Ok<T, Raw = unknown> {
  ok: true;
  data: T;
  raw: Raw;
}

export interface Err<Raw = unknown> {
  ok: false;
  error: EppCommandError;
  raw?: Raw;
}

export type ErrorReason = 'transport' | 'protocol' | 'result';

export interface EppCommandError {
  reason: ErrorReason;
  message: string;
  cause?: unknown;
  resultCode?: EppResultCode;
  results?: EppResult[];
  trID?: EppTransactionId;
}

export function ok<T, Raw = unknown>(data: T, raw: Raw): Ok<T, Raw> {
  return { ok: true, data, raw };
}

export function err<Raw = unknown>(
  error: EppCommandError,
  raw?: Raw,
): Err<Raw> {
  return { ok: false, error, raw };
}
