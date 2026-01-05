import { loadInfisicalSecretsIfConfigured } from './infisical';
import { config as loadBaseEnv } from 'dotenv';
loadBaseEnv({ override: true });

await loadInfisicalSecretsIfConfigured({ allowEnvPassthrough: true });
