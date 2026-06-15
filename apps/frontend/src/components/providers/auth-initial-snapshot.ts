import type { AppRouterOutput } from '@/lib/trpc';
import superjson from 'superjson';

type InitialAuthSessionSnapshot = {
  session: AppRouterOutput['users']['getSessionSnapshot'];
  resolvedAtMs: number;
};

export type SerializedInitialAuthSessionSnapshot = ReturnType<
  typeof serializeInitialAuthSessionSnapshot
>;

export function serializeInitialAuthSessionSnapshot(
  snapshot: InitialAuthSessionSnapshot | null,
) {
  return snapshot ? superjson.serialize(snapshot) : null;
}

export function deserializeInitialAuthSessionSnapshot(
  snapshot: SerializedInitialAuthSessionSnapshot,
): InitialAuthSessionSnapshot | null {
  if (!snapshot) return null;

  try {
    return superjson.deserialize<InitialAuthSessionSnapshot>(snapshot);
  } catch {
    return null;
  }
}
