import type { ConfigInput } from '../schema';

const localConfig: ConfigInput = {
  SMTP_PORT: 2025,
  SMTP_HOST: 'smtp.mail.namefi.dev',
  SMTP_SECURE: false,
  MAGIC_LINK_BASE_URL: `http://localhost:${process.env.PORT || 3000}`,
};

export default localConfig;
