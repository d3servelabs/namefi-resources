import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const customConfig: ConfigInput = {
  SMTP_PORT: 2025,
  SMTP_HOST: 'smtp.mail.namefi.dev',
  SMTP_SECURE: false,
};

export default customConfig;
