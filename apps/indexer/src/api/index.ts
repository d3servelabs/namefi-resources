import { db } from 'ponder:api';
import schema from 'ponder:schema';
import { type Context, Hono, type Next } from 'hono';
import { client, graphql } from 'ponder';
import auth, { requireAuth } from './auth';

const app = new Hono();

app.use('/sql/*', requireAuth, client({ db, schema }));
app.use('/graphql', requireAuth, graphql({ db, schema }));

// Health check function (shared between endpoints)
const healthCheck = async (c: any) => {
  try {
    // Check if we can query the database and if tables exist
    // This is a simple check - we try to query the NamefiNft table
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = current_schema() 
        AND table_name = 'NamefiNft'
      ) as table_exists
    `);

    const tableExists = result.rows[0]?.table_exists;

    if (tableExists) {
      // Table exists, now check if it has data (indicates sync is working)
      const countResult = await db.execute(
        'SELECT COUNT(*) as count FROM "NamefiNft"',
      );
      const count = Number.parseInt(
        (countResult.rows[0]?.count as string) || '0',
      );

      // If we have data, consider it ready
      return c.text(count > 0 ? 'OK' : 'SYNCING');
    }
    return c.text('SYNCING');
  } catch (error) {
    console.error('Health check error:', error);
    return c.text('SYNCING');
  }
};

// Health check endpoints
app.get('/readyz', healthCheck);

// Schema information endpoint
app.get('/schema', async (c) => {
  try {
    const result = await db.execute('SELECT current_schema() as schema_name');
    let schemaName = result.rows[0]?.schema_name as string;
    let source = 'database';

    // If database returns 'public', use the one from process.env instead
    if (schemaName === 'public') {
      const envSchema = process.env.DATABASE_SCHEMA;
      console.log('Schema endpoint details:', {
        databaseSchema: schemaName,
        envSchema: envSchema,
        usingEnvSchema: !!envSchema,
      });

      if (envSchema) {
        schemaName = envSchema;
        source = 'environment';
      }
    }

    return c.json({
      currentSchema: schemaName,
      source: source,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Schema endpoint error:', error);
    return c.json({ error: 'Unable to determine current schema' }, 500);
  }
});

app.use('/', async (c) => c.redirect('/graphql'));

app.route('/auth', auth);

const logRequest = async (c: Context, next: Next) => {
  console.log('--- Incoming Request ---');
  console.log('Method:', c.req.raw.method);
  console.log('Path:', c.req.raw.url);

  // Log headers
  c.req.raw.headers.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });

  // Try to log body safely
  const contentType = c.req.header('content-type') || '';
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('application/json') ||
    contentType.startsWith('text/')
  ) {
    try {
      const clone = c.req.raw.clone();
      const bodyText = await clone.text();
      console.log('Body:', bodyText);
    } catch (err) {
      console.log('Body: [unreadable or stream already consumed]');
    }
  } else {
    console.log('Body: [skipped or binary]');
  }

  console.log('------------------------');

  await next();
};

if (process.env.NODE_ENV === 'development') {
  app.use('*', logRequest);
}

export default app;
