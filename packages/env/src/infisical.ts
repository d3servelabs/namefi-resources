/**
 * Utilities for loading secrets from Infisical in a composable way.
 *
 * This module avoids a hard dependency on the SDK by using dynamic imports.
 * If the SDK is not available or not configured, functions will no-op.
 */

interface LoadInfisicalParams {
  token: string;
  projectId?: string;
  environmentSlug?: string;
  secretsPath?: string;
  /**
   * If true (default), do not override existing process.env values.
   * If false, fetched secrets will overwrite existing values.
   */
  allowEnvPassthrough?: boolean;
}

/**
 * Fetches Infisical secrets and merges them into process.env if not already present.
 * Non-fatal on error; writes minimal diagnostics to stderr.
 */
export async function fetchInfisicalSecrets(
  params: Omit<LoadInfisicalParams, 'allowEnvPassthrough'>,
) {
  try {
    const { InfisicalSDK } = await import('@infisical/sdk');
    const sdk = new InfisicalSDK();
    sdk.auth().accessToken(params.token);

    const secrets = await sdk.secrets().listSecretsWithImports({
      projectId: params.projectId ?? '',
      environment: params.environmentSlug ?? '',
      secretPath: params.secretsPath ?? '/',
    });

    const output: Record<string, string> = {};
    for (const { secretKey, secretValue } of secrets) {
      if (!secretKey || isNil(secretValue)) continue;
      output[secretKey] = secretValue;
    }
    return output;
  } catch (e) {
    process.stderr.write(
      `Infisical SDK failed to load secrets (non-fatal): ${
        e instanceof Error ? e.message : String(e)
      }\n`,
    );
  }
}

/**
 * Fetches Infisical secrets and merges them into process.env if not already present.
 * Non-fatal on error; writes minimal diagnostics to stderr.
 */
export async function fetchAndMergeInfisicalSecrets(
  params: LoadInfisicalParams,
) {
  try {
    const { InfisicalSDK } = await import('@infisical/sdk');
    const sdk = new InfisicalSDK();
    sdk.auth().accessToken(params.token);

    const secrets = await sdk.secrets().listSecretsWithImports({
      projectId: params.projectId ?? '',
      environment: params.environmentSlug ?? '',
      secretPath: params.secretsPath ?? '/',
    });

    const allowEnvPassthrough = params.allowEnvPassthrough ?? true;
    for (const { secretKey, secretValue } of secrets) {
      if (!secretKey || isNil(secretValue)) continue;
      if (allowEnvPassthrough && secretKey in process.env) continue;
      process.env[secretKey] = secretValue;
    }
  } catch (e) {
    process.stderr.write(
      `Infisical SDK failed to load secrets (non-fatal): ${
        e instanceof Error ? e.message : String(e)
      }\n`,
    );
  }
}

/**
 * Orchestrates loading Infisical secrets using only INFISICAL_TOKEN and
 * optionally provided project/environment/path variables.
 */
export async function loadInfisicalSecretsIfConfigured(options?: {
  allowEnvPassthrough?: boolean;
}) {
  const token =
    process.env.INFISICAL_SERVICE_TOKEN || process.env.INFISICAL_TOKEN;
  if (!token) return;

  await fetchAndMergeInfisicalSecrets({
    token,
    projectId: process.env.INFISICAL_PROJECT_ID,
    environmentSlug: process.env.INFISICAL_ENVIRONMENT,
    secretsPath: process.env.INFISICAL_SECRETS_PATH || '/',
    allowEnvPassthrough: options?.allowEnvPassthrough ?? true,
  });
}

/**
 * Orchestrates loading Infisical secrets using only INFISICAL_TOKEN and
 * optionally provided project/environment/path variables.
 */
export async function fetchInfisicalSecretsIfConfigured() {
  const token =
    process.env.INFISICAL_SERVICE_TOKEN || process.env.INFISICAL_TOKEN;
  if (!token) return;

  return fetchInfisicalSecrets({
    token,
    projectId: process.env.INFISICAL_PROJECT_ID,
    environmentSlug: process.env.INFISICAL_ENVIRONMENT,
    secretsPath: process.env.INFISICAL_SECRETS_PATH || '/',
  });
}

function isNil<T>(value: T): value is NonNullable<T> {
  return value === null || value === undefined;
}
