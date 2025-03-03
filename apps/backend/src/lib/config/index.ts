import { createRequire } from "node:module";
import { config as loadEnv } from "dotenv";
import { parseEnv as parseWithZod } from "znv";
import { configSchema, envSchema } from "./schema";

loadEnv({ override: true });

const validatedEnv = parseWithZod(process.env, envSchema);

const require = createRequire(import.meta.url);

const { default: envConfig } = require(
	`./environments/${validatedEnv.ENVIRONMENT}`,
);

const validatedEnvConfig = parseWithZod(envConfig, configSchema);

export const config = {
	...validatedEnv,
	...validatedEnvConfig,
};
