import type { ConfigInput } from '../schema';

const previewConfig: ConfigInput = {
  TYPE: 'preview',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
};

export default previewConfig;
