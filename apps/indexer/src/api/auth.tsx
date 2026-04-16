import { type Context, Hono, type Next } from 'hono';
import { sign, verify } from 'hono/jwt';
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie';
import LoginPage from './views/LoginPage';
import EmailSentPage from './views/EmailSentPage';
import ErrorPage from './views/ErrorPage';
import { sendMail } from './mailer';
import { secrets, config } from '../lib/env';

const auth = new Hono();
const COOKIE_NAME = 'ponder-auth';

function isValidOrgEmail(email: string) {
  return email.endsWith('@d3serve.xyz') || email.endsWith('@namefi.io');
}

auth.get('/login', (c) => {
  const error = c.req.query('error');
  return c.html(<LoginPage error={error} />);
});

auth.post('/login', async (c) => {
  console.log('[login][post]');
  const body = await c.req.parseBody();
  console.log('[login][post] body', body);
  const email = body['email'] as string;
  console.log('[login][post] email', email);

  if (!isValidOrgEmail(email)) {
    console.log('[login][post] email not valid');
    return c.html(<LoginPage error="Only @d3serve.xyz emails allowed" />);
  }

  const token = await sign(
    {
      email,
      exp: Math.floor(Date.now() / 1000) + 60 * 10, // Token expires in 10 minutes
    },
    secrets.PONDER_JWT_SECRET,
  );
  const link = `${config.MAGIC_LINK_BASE_URL}/auth/callback?token=${encodeURIComponent(token)}`;
  console.log('[login][post] sending mail to', email);
  await sendMail({
    to: [email],
    subject: 'Your Namefi Magic Login Link',
    content: {
      plain: `Click here to log in: ${link}`,
      html: `<p><a href="${link}">Click here to log in</a> (expires in 10 minutes)</p>`,
    },
  });

  console.log('[login][post] email sent to', email);
  return c.html(<EmailSentPage email={email} />);
});

auth.get('/callback', async (c) => {
  const token = decodeURIComponent(c.req.query('token') || '');
  if (!token) return c.html(<ErrorPage message="Missing token" />);
  console.log('[callback] token', token);

  try {
    const payload = await verify(token, secrets.PONDER_JWT_SECRET);
    console.log('[callback] payload', payload);
    const newToken = await sign(
      {
        email: payload.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // Token expires in 7 days
      },
      secrets.PONDER_JWT_SECRET,
    );
    await setSignedCookie(
      c,
      COOKIE_NAME,
      newToken,
      secrets.PONDER_COOKIE_SECRET,
      {
        httpOnly: true,
        secure: true,
        path: '/',
        maxAge: 3600 * 24 * 7,
        sameSite: 'strict',
      },
    );
    console.log('[callback] setCookie', COOKIE_NAME, token);
    return c.html(<LoginPage success="Login successful" redirect="/graphql" />);
  } catch (error) {
    console.log('[callback] error', error);
    return c.html(<ErrorPage message="Invalid or expired token" />);
  }
});
auth.get('/logout', async (c) => {
  await deleteCookie(c, COOKIE_NAME, secrets.PONDER_COOKIE_SECRET);
  return c.html(<LoginPage error="Logged out" />);
});

export const requireAuth = async (c: Context, next: Next) => {
  const env = process.env.ENVIRONMENT;
  const isLocalDev = env === 'local' || env === 'development';
  if (isLocalDev) {
    console.warn('[requireAuth] Bypassing auth in local/dev mode');
    await next();
    return;
  }

  // Check for API key authentication (service-to-service)
  const apiKey = c.req.header('x-api-key') || c.req.header('X-API-Key');
  if (apiKey && secrets.PONDER_SERVICE_API_KEY) {
    if (apiKey === secrets.PONDER_SERVICE_API_KEY) {
      console.log('[requireAuth] Authenticated via API key');
      c.set('user', { type: 'service', authenticated: true });
      await next();
      return;
    }
    console.log('[requireAuth] Invalid API key');
    c.status(401);
    return c.json({ error: 'Invalid API key' });
  }

  let token: string | undefined | boolean;
  try {
    token = await getSignedCookie(c, secrets.PONDER_COOKIE_SECRET, COOKIE_NAME);
  } catch (error) {
    console.log('[requireAuth] error', error);
    return c.redirect('/auth/login');
  }

  const headerToken = c.req.header('Authorization')?.split(' ')[1];
  const foundToken = token || headerToken;

  if (!foundToken) {
    console.log('[requireAuth] no token or header token');
    c.status(401);
    return c.redirect('/auth/login');
  }

  try {
    const payload = await verify(foundToken, secrets.PONDER_JWT_SECRET);
    console.log('[requireAuth] payload', payload);
    c.set('user', payload);
    await next();
  } catch {
    return c.redirect('/auth/login');
  }
};

export default auth;
