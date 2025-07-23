import * as chains from 'viem/chains';
import type { ConfigInput } from '../schema';

const productionConfig: ConfigInput = {
  SMTP_SECURE: true,
  SMTP_HOST: 'email-smtp.us-east-1.amazonaws.com',
  SMTP_PORT: 587,
};

export default productionConfig;
