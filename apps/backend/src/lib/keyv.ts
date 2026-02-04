import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';
import { logger } from './logger';
import { secrets } from './env';

export const keyvPostgres = new KeyvPostgres({
  uri: secrets.DATABASE_URL,
  schema: '__keyv',
  table: 'default',
  useUnloggedTable: true,
});
export const defaultKeyv = new Keyv({ namespace: 'default' });

defaultKeyv.on('error', (error) => {
  logger.error({ error }, 'Keyv error');
});
