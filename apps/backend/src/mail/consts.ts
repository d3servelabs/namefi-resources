import { config } from '#lib/env';

export const getEmailsBaseUrl = () => {
  const scheme = config.APP_URL.includes('localhost') ? 'http://' : 'https://';

  return new URL(scheme + config.APP_URL).toString();
};
