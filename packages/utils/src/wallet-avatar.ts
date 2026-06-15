const ENSDATA_AVATAR_BASE_URL = 'https://api.ensdata.net/media/avatar/';

export function getEnsDataAvatarUrl(identity?: string | null): string | null {
  const normalizedIdentity = identity?.trim();
  if (!normalizedIdentity) return null;

  return `${ENSDATA_AVATAR_BASE_URL}${encodeURIComponent(normalizedIdentity)}`;
}
