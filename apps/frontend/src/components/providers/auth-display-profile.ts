export type RuntimeAuthDisplayProfile = {
  displayName: string | null;
  email: string | null;
  walletAddress: string | null;
};

type RuntimeDisplayUser = {
  customMetadata?: {
    fullName?: unknown;
  };
  email?: {
    address?: unknown;
  };
  google?: {
    email?: unknown;
  };
  wallet?: {
    address?: unknown;
  };
  linkedAccounts?: unknown;
};

function cleanDisplayValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed || null;
}

function getRuntimeDisplayUser(
  user: unknown | null | undefined,
): RuntimeDisplayUser | null {
  if (!user || typeof user !== 'object') return null;
  return user as RuntimeDisplayUser;
}

function getLinkedAccountAddress(
  user: RuntimeDisplayUser,
  type: 'email' | 'wallet',
) {
  if (!Array.isArray(user.linkedAccounts)) return null;

  for (const account of user.linkedAccounts) {
    if (!account || typeof account !== 'object') continue;

    const candidate = account as { address?: unknown; type?: unknown };
    if (candidate.type !== type) continue;

    const address = cleanDisplayValue(candidate.address);
    if (address) return address;
  }

  return null;
}

export function getAuthContactEmailFromRuntimeUser(
  user: unknown | null | undefined,
): string | null {
  const displayUser = getRuntimeDisplayUser(user);
  if (!displayUser) return null;

  return cleanDisplayValue(displayUser.email?.address);
}

export function getAuthContactEmail({
  privyUser,
  unsafeDisplayProfile,
}: {
  privyUser: unknown | null | undefined;
  unsafeDisplayProfile?: RuntimeAuthDisplayProfile | null;
}): string | null {
  return (
    getAuthContactEmailFromRuntimeUser(privyUser) ??
    cleanDisplayValue(unsafeDisplayProfile?.email)
  );
}

export function getAuthDisplayProfileFromRuntimeUser(
  user: unknown | null | undefined,
): RuntimeAuthDisplayProfile | null {
  const displayUser = getRuntimeDisplayUser(user);
  if (!displayUser) return null;

  const profile = {
    displayName: cleanDisplayValue(displayUser.customMetadata?.fullName),
    email:
      getAuthContactEmailFromRuntimeUser(displayUser) ??
      getLinkedAccountAddress(displayUser, 'email') ??
      cleanDisplayValue(displayUser.google?.email),
    walletAddress:
      cleanDisplayValue(displayUser.wallet?.address) ??
      getLinkedAccountAddress(displayUser, 'wallet'),
  };

  return isUsefulAuthDisplayProfile(profile) ? profile : null;
}

export function isUsefulAuthDisplayProfile(
  profile: RuntimeAuthDisplayProfile | null | undefined,
): profile is RuntimeAuthDisplayProfile {
  return Boolean(
    profile?.displayName || profile?.email || profile?.walletAddress,
  );
}

export function mergeAuthDisplayProfiles(
  existing: RuntimeAuthDisplayProfile | null | undefined,
  incoming: RuntimeAuthDisplayProfile,
): RuntimeAuthDisplayProfile {
  return {
    displayName:
      incoming.displayName ?? cleanDisplayValue(existing?.displayName),
    email: incoming.email ?? cleanDisplayValue(existing?.email),
    walletAddress:
      incoming.walletAddress ?? cleanDisplayValue(existing?.walletAddress),
  };
}

export function areAuthDisplayProfilesEqual(
  left: RuntimeAuthDisplayProfile | null | undefined,
  right: RuntimeAuthDisplayProfile | null | undefined,
) {
  return (
    (left?.displayName ?? null) === (right?.displayName ?? null) &&
    (left?.email ?? null) === (right?.email ?? null) &&
    (left?.walletAddress ?? null) === (right?.walletAddress ?? null)
  );
}

export function getAuthDisplayProfileSafeIdentifier(
  profile: RuntimeAuthDisplayProfile | null | undefined,
): string | null {
  return (
    cleanDisplayValue(profile?.displayName) ??
    cleanDisplayValue(profile?.email) ??
    cleanDisplayValue(profile?.walletAddress)
  );
}
