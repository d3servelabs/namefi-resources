import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const loadSyncEnv = ({
  allowEnvPassthrough = true,
  allowFail = false,
}: {
  allowEnvPassthrough?: boolean;
  allowFail?: boolean;
}) => {
  try {
    const dirname = fileURLToPath(new URL('.', import.meta.url));
    const secrets = execSync(`tsx ${path.join(dirname, 'get-env-sync.ts')}`, {
      env: {
        ...process.env,
        INFISICAL_TOKEN:
          process.env.INFISICAL_TOKEN || process.env.INFISICAL_SERVICE_TOKEN,
      },
    })
      .toString()
      .trim();
    const secretsObject = JSON.parse(secrets);
    for (const [secretKey, secretValue] of Object.entries(secretsObject)) {
      if (!secretKey || secretValue === null || secretValue === undefined)
        continue;
      if (allowEnvPassthrough && secretKey in process.env) continue;
      process.env[secretKey] = secretValue as string;
    }
  } catch (error) {
    if (!allowFail) {
      throw new Error('Failed to load sync env');
    }
    console.warn('Failed to load sync env');
  }
};
