import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const localConfig: ConfigInput = {
  SMTP_PORT: 2025,
  SMTP_HOST: 'smtp.mail.namefi.dev',
  SMTP_SECURE: false,
  MAGIC_LINK_BASE_URL: `http://localhost:${process.env.PORT}`,
};

export default localConfig;
