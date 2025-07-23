/** @jsx jsx */
import { jsx } from 'hono/jsx';
import { Layout } from './layout';

export default function ProtectedPage({ email }: { email: string }) {
  return (
    <Layout title="Welcome">
      <div className="max-w-md w-full bg-neutral-900 p-8 rounded-xl shadow-md border border-neutral-800 text-center">
        <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
        <p className="text-neutral-300">
          You are logged in as{' '}
          <span className="text-white font-medium">{email}</span>.
        </p>
        <a
          href="/logout"
          className="inline-block mt-6 text-sm text-indigo-400 hover:text-indigo-300 underline"
        >
          Logout
        </a>
      </div>
    </Layout>
  );
}
