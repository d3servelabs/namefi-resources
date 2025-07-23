/** @jsx jsx */
import { jsx } from 'hono/jsx';
import { Layout } from './layout';

export default function EmailSentPage({ email }: { email: string }) {
  return (
    <Layout title="Email Sent">
      <div className="max-w-md w-full bg-neutral-900 p-8 rounded-xl shadow-md border border-neutral-800 text-center">
        <h1 className="text-xl font-semibold mb-4">Check your inbox</h1>
        <p className="text-neutral-300 mb-2">
          A magic link has been sent to{' '}
          <span className="text-white font-medium">{email}</span>
        </p>
        <p className="text-sm text-neutral-500">
          It will expire in 10 minutes.
        </p>
      </div>
    </Layout>
  );
}
