import type { ConfigInput } from '../schema';

const previewConfig: ConfigInput = {
  TYPE: 'preview',
  BACKEND_URL: process.env.BACKEND_URL || 'https://backend.astra.namefi.dev',
};

export default previewConfig;
