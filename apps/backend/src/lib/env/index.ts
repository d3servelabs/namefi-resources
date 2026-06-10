import '@namefi-astra/env/preload';
import { loadSecrets } from '@namefi-astra/env';
import { configSchema, type ConfigInput, secretsSchema } from './schema';

const backendEnvironments = [
  'development',
  'local',
  'preview',
  'production',
  'test',
] as const;

type BackendEnvironment = (typeof backendEnvironments)[number];
type ConfigModule = { default: ConfigInput };

const configLoaders = {
  development: () => import('./configs/development'),
  local: () => import('./configs/local'),
  preview: () => import('./configs/preview'),
  production: () => import('./configs/production'),
  test: () => import('./configs/test'),
} satisfies Record<BackendEnvironment, () => Promise<ConfigModule>>;

function isBackendEnvironment(
  value: string | undefined,
): value is BackendEnvironment {
  return backendEnvironments.includes(value as BackendEnvironment);
}

const environment = process.env.ENVIRONMENT;

if (!isBackendEnvironment(environment)) {
  throw new Error(`No backend config found for ENVIRONMENT=${environment}`);
}

const { default: configInput } = await configLoaders[environment]();

export const config = configSchema.parse(configInput);

export const secrets = loadSecrets({
  secretsSchema,
});
