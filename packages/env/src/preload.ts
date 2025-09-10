import { loadInfisicalSecretsIfConfigured } from './infisical';

await loadInfisicalSecretsIfConfigured({ allowEnvPassthrough: true });
