import { db } from 'ponder:api';
import schema from 'ponder:schema';
import { Hono } from 'hono';
import { client, graphql } from 'ponder';
import auth, { requireAuth } from './auth';

const app = new Hono();

app.use('/sql/*', requireAuth, client({ db, schema }));
app.use('/graphql', requireAuth, graphql({ db, schema }));

app.use('/', async (c) => c.redirect('/graphql'));

app.route('/auth', auth);

export default app;
