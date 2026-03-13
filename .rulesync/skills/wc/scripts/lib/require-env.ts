export function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required in env to use the wc skill`);
  }
  return value;
}
