import { PrivyClient } from '@privy-io/server-auth';
import { config, secrets } from '#lib/env';

export const privyClient = new PrivyClient(
  config.PRIVY_APP_ID,
  secrets.PRIVY_APP_SECRET,
);
