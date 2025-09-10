import { fetchInfisicalSecretsIfConfigured } from './infisical';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  if (!process.env.INFISICAL_TOKEN && !process.env.INFISICAL_SERVICE_TOKEN) {
    process.stderr.write('no_infisical_token');
    process.exit(1);
  }
  const secrets = await fetchInfisicalSecretsIfConfigured();
  if (secrets) {
    process.stdout.write(JSON.stringify(secrets));
    process.exit(0);
  }
  process.stderr.write('not_found_in_infisical');
  process.exit(1);
}
