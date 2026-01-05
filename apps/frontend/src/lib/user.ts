// We define a structural interface for what this function needs.
// This avoids strict type conflicts with @privy-io/react-auth's User type
// when our app uses a richer customMetadata structure (containing objects).
export interface DisplayableUser {
  id?: string;
  email?: { address?: string };
  google?: { email?: string };
  wallet?: { address?: string };
  customMetadata?: {
    fullName?: string;
    [key: string]: any;
  };
}

export function getUserDisplayName(
  user: DisplayableUser | null | undefined,
): string {
  if (!user) return 'ME';

  return (
    user.customMetadata?.fullName ||
    user.email?.address ||
    user.google?.email ||
    user.wallet?.address ||
    user.id ||
    'ME'
  );
}
