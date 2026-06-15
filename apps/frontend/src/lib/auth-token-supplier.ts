'use client';

type AuthTokenSupplier = () => Promise<string | null>;

let authTokenSupplier: AuthTokenSupplier | null = null;

export function registerAuthTokenSupplier(supplier: AuthTokenSupplier) {
  authTokenSupplier = supplier;
}

export async function getRegisteredAuthToken() {
  return authTokenSupplier?.() ?? null;
}
