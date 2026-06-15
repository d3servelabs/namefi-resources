// We define a structural interface for what this function needs.
// This avoids strict type conflicts with @privy-io/react-auth's User type
// when our app uses a richer customMetadata structure (containing objects).
export interface DisplayableUser {
  id?: string;
  email?: { address?: string };
  google?: { email?: string };
  wallet?: { address?: string };
  linkedAccounts?: { type?: string; address?: string }[];
  customMetadata?: {
    fullName?: string;
    [key: string]: unknown;
  };
}

function cleanDisplayValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

function getLinkedAccountAddress(
  user: DisplayableUser | null | undefined,
  type: 'email' | 'wallet',
): string | null {
  return (
    cleanDisplayValue(
      user?.linkedAccounts?.find(
        (account) => account.type === type && account.address,
      )?.address,
    ) ?? null
  );
}

export function getUserDisplaySafeIdentifier(
  user: DisplayableUser | null | undefined,
): string | null {
  if (!user) return null;

  return (
    cleanDisplayValue(user.customMetadata?.fullName) ||
    cleanDisplayValue(user.email?.address) ||
    getLinkedAccountAddress(user, 'email') ||
    cleanDisplayValue(user.google?.email) ||
    cleanDisplayValue(user.wallet?.address) ||
    getLinkedAccountAddress(user, 'wallet')
  );
}

export function getUserDisplaySafeIdentifierPair(
  user: DisplayableUser | null | undefined,
): { primary: string | null; secondary: string | null } {
  if (!user) return { primary: null, secondary: null };

  const email =
    cleanDisplayValue(user.email?.address) ||
    getLinkedAccountAddress(user, 'email') ||
    cleanDisplayValue(user.google?.email);
  const wallet =
    cleanDisplayValue(user.wallet?.address) ||
    getLinkedAccountAddress(user, 'wallet');
  const primary =
    wallet || email || cleanDisplayValue(user.customMetadata?.fullName);
  const secondary = primary === wallet ? email : wallet;

  return {
    primary,
    secondary: secondary && secondary !== primary ? secondary : null,
  };
}

export function getUserDisplayIdentifier(
  user: DisplayableUser | null | undefined,
): string | null {
  if (!user) return null;

  const displayableId = user.id && !user.id.startsWith('did:') ? user.id : null;

  return (
    getUserDisplaySafeIdentifier(user) ||
    cleanDisplayValue(displayableId) ||
    null
  );
}

/**
 * Legacy display helper. Do not use for auth/account identity surfaces because
 * it may fall back to internal app ids.
 */
export function getUserDisplayName(
  user: DisplayableUser | null | undefined,
): string {
  return getUserDisplayIdentifier(user) || 'Account';
}
