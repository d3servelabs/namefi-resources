/** @jsx jsx */
import { jsx } from 'hono/jsx';
import { Layout } from './layout';

export default function ErrorPage({ message }: { message: string }) {
  return (
    <Layout title="Error">
      <div className="max-w-md w-full bg-red-900 p-8 rounded-xl text-white text-center border border-red-700">
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p>{message}</p>
        <a
          href="/auth/login"
          className="inline-block mt-4 text-sm underline hover:text-red-200"
        >
          Back to login
        </a>
      </div>
    </Layout>
  );
}
