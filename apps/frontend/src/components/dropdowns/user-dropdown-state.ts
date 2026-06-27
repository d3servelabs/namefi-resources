import { shortage } from '@/lib/string';

const MAX_VISIBLE_FIRST_NAME_LENGTH = 6;
const WALLET_ADDRESS_RE = /^0x[a-fA-F0-9]{8,}$/;
const WHITESPACE_RE = /\s+/;

export function shouldShowUserDropdownLoading({
  hasDisplayName,
  isAuthenticated,
  isDbUserLoading,
  isPrivyUserLoading,
}: {
  hasDisplayName: boolean;
  isAuthenticated: boolean;
  isDbUserLoading: boolean;
  isPrivyUserLoading: boolean;
}) {
  return (
    isDbUserLoading ||
    (isAuthenticated && !hasDisplayName && isPrivyUserLoading)
  );
}

function shortenFirstName(firstName: string) {
  const chars = Array.from(firstName);
  return chars.length > MAX_VISIBLE_FIRST_NAME_LENGTH
    ? `${chars.slice(0, MAX_VISIBLE_FIRST_NAME_LENGTH).join('')}...`
    : firstName;
}

function isNonNameIdentifier(value: string) {
  return value.includes('@') || WALLET_ADDRESS_RE.test(value);
}

export function formatCompactUserDropdownAccountLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (isNonNameIdentifier(trimmed)) {
    return shortage(trimmed, 11);
  }

  const [firstName, ...rest] = trimmed.split(WHITESPACE_RE);
  if (!firstName) return trimmed;

  const shortenedFirstName = shortenFirstName(firstName);
  if (shortenedFirstName !== firstName) {
    return shortenedFirstName;
  }

  const lastName = rest.at(-1);
  const lastInitial = lastName ? Array.from(lastName)[0] : null;

  return lastInitial ? `${firstName} ${lastInitial.toUpperCase()}.` : firstName;
}

export function formatDefaultUserDropdownAccountLabel(value: string) {
  return shortage(value, 11);
}
