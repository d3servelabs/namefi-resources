import { createOpenAPI } from 'fumadocs-openapi/server';

export const openapi = createOpenAPI({
  // the OpenAPI schema, you can also give it an external URL or filepath.
  input: ['https://backend.astra.namefi.dev/v-next/openapi/doc.json'],
});
