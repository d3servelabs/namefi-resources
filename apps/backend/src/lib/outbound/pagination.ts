import { z } from 'zod';

export const outboundLimitSchema = z.number().int().min(1).max(100).default(20);
export const outboundCursorSchema = z.string().min(1).max(2048).optional();

const offsetCursorSchema = z.object({
  offset: z.number().int().min(0).max(100_000),
});

export type OutboundPaginationInput = {
  cursor?: string;
  limit: number;
};

export function encodeOutboundCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64url');
}

export function decodeOutboundCursor(cursor: string | undefined): number {
  if (!cursor) {
    return 0;
  }

  const decoded = offsetCursorSchema.parse(
    JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')),
  );

  return decoded.offset;
}

export function paginateOutboundRows<T>(
  rows: T[],
  input: OutboundPaginationInput,
): { items: T[]; nextCursor: string | null } {
  const items = rows.slice(0, input.limit);
  const nextCursor =
    rows.length > input.limit
      ? encodeOutboundCursor(decodeOutboundCursor(input.cursor) + input.limit)
      : null;

  return { items, nextCursor };
}
