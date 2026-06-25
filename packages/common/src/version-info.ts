export type VersionInfo = {
  // biome-ignore lint/style/useNamingConvention: Public version JSON uses snake_case keys.
  commit_date: string;
  // biome-ignore lint/style/useNamingConvention: Public version JSON uses snake_case keys.
  commit_hash: string;
  version: string;
};

export type VersionInfoInput = {
  commitDate?: string | null;
  commitHash?: string | null;
  version?: string | null;
};

const UNKNOWN = 'unknown';

function trimOrUnknown(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : UNKNOWN;
}

export function normalizeVersion(version?: string | null) {
  const trimmed = trimOrUnknown(version);
  if (trimmed === UNKNOWN) return UNKNOWN;
  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`;
}

export function normalizeCommitDate(
  commitDate?: string | null,
  fallback = new Date(),
) {
  const trimmed = commitDate?.trim();
  if (trimmed) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback.toISOString();
}

export function createVersionInfo({
  commitDate,
  commitHash,
  version,
}: VersionInfoInput): VersionInfo {
  return {
    commit_date: normalizeCommitDate(commitDate),
    commit_hash: trimOrUnknown(commitHash),
    version: normalizeVersion(version),
  };
}

export function shortCommitHash(commitHash: string, length = 6) {
  if (!commitHash || commitHash === UNKNOWN) return UNKNOWN;
  return commitHash.slice(0, length);
}

export function commitDateLabel(commitDate: string) {
  return commitDate.slice(0, 10);
}

export function formatVersionStamp(versionInfo: VersionInfo) {
  return `${versionInfo.version}-${shortCommitHash(
    versionInfo.commit_hash,
  )}-${commitDateLabel(versionInfo.commit_date)}`;
}
