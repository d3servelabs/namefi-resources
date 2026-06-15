'use client';

export const PRIVY_ACCESS_TOKEN_COOKIE_NAME = 'privy-token';

export type DecodedPrivyAccessToken = {
  privyUserId: string | null;
};

export function decodePrivyAccessToken(
  accessToken: string,
): DecodedPrivyAccessToken {
  const [, payload] = accessToken.split('.');
  if (!payload || typeof atob === 'undefined') {
    return { privyUserId: null };
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      '=',
    );
    const claims = JSON.parse(atob(paddedPayload)) as { sub?: unknown };
    const privyUserId =
      typeof claims.sub === 'string' && claims.sub ? claims.sub : null;

    return { privyUserId };
  } catch {
    return { privyUserId: null };
  }
}

export function readPrivyAccessTokenCookie() {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PRIVY_ACCESS_TOKEN_COOKIE_NAME}=`));
  if (!cookie) return null;

  const value = cookie.slice(PRIVY_ACCESS_TOKEN_COOKIE_NAME.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
