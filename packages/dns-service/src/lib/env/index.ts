import '@namefi-astra/env/preload';
import { loadSecrets } from '@namefi-astra/env';
import { configSchema, type ConfigInput, secretsSchema } from './schema';

const dnsServiceEnvironments = [
  'development',
  'local',
  'preview',
  'production',
  'test',
] as const;

type DnsServiceEnvironment = (typeof dnsServiceEnvironments)[number];
type ConfigModule = { default: ConfigInput };

const configLoaders = {
  development: () => import('./configs/development'),
  local: () => import('./configs/local'),
  preview: () => import('./configs/preview'),
  production: () => import('./configs/production'),
  test: () => import('./configs/test'),
} satisfies Record<DnsServiceEnvironment, () => Promise<ConfigModule>>;

function isDnsServiceEnvironment(
  value: string | undefined,
): value is DnsServiceEnvironment {
  return dnsServiceEnvironments.includes(value as DnsServiceEnvironment);
}

const environment = process.env.ENVIRONMENT;

if (!isDnsServiceEnvironment(environment)) {
  throw new Error(`No dns-service config found for ENVIRONMENT=${environment}`);
}

const { default: configInput } = await configLoaders[environment]();

export const config = configSchema.parse(configInput);

export const secrets = loadSecrets({
  secretsSchema,
});
