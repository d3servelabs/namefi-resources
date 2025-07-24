import { db } from 'ponder:api';
import schema from 'ponder:schema';
import { Hono } from 'hono';
import { client, graphql } from 'ponder';
import auth, { requireAuth } from './auth';

const app = new Hono();

app.use('*', async (c, next) => {
    console.log('--- Incoming Request ---');
    console.log('Method:', c.req.method);
    console.log('Path:', c.req.path);
  
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
  });

  
app.use('/sql/*', requireAuth, client({ db, schema }));
app.use('/graphql', requireAuth, graphql({ db, schema }));

app.use('/', async (c) => c.redirect('/graphql'));

app.route('/auth', auth);

export default app;
