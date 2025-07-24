/** @jsx jsx */
import { jsx, Fragment } from 'hono/jsx';
import { Layout } from './layout';
import { html, raw } from 'hono/html';

export default function LoginPage({
  error,
  success,
  redirect,
  getRequest,
}: {
  error?: string;
  success?: string;
  redirect?: string;
  getRequest?: boolean;
}) {
  return (
    <Layout title="Login">
      <div className="w-full max-w-md bg-neutral-900 p-8 rounded-xl shadow-md border border-neutral-800">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Developer Login
        </h1>
        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}
        {success && (
          <p className="text-green-400 text-sm text-center mb-4">{success}</p>
        )}
        {redirect && <RedirectTo redirect={redirect} delayInSeconds={3} />}
        {!success ? (
          <Fragment>
            {!getRequest ? (
              <form method="post" action="/auth/login" className="space-y-4">
                <input
                  type="email"
                  name="email"
                  placeholder="you@d3serve.xyz"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-white transition"
                >
                  Send Magic Link
                </button>
              </form>
            ) : (
              <GetRequestForm />
            )}
          </Fragment>
        ) : undefined}
      </div>
    </Layout>
  );
}

function RedirectTo({
  redirect,
  delayInSeconds,
}: {
  redirect: string;
  delayInSeconds: number;
}) {
  return (
    <Fragment>
      <div>Redirecting to {redirect}...</div>
      <div>You will be redirected in {delayInSeconds} seconds...</div>
      <div>
        If you are not redirected, please click <a href={redirect}>here</a>
      </div>
      <script>{html`setTimeout(() => {window.location.href = '${redirect}';}, ${delayInSeconds * 1000});`}</script>
    </Fragment>
  );
}

function GetRequestForm() {
  return (
    <form
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get('email') as string;
        window.location.href = `/auth/loginz?email=${encodeURIComponent(email)}`;
      }}
    >
      <input type="email" name="email" placeholder="you@d3serve.xyz" required />
      <button type="submit">Send Magic Link</button>
    </form>
  );
}
