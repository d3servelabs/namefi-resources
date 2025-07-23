/** @jsx jsx */
import { jsx, JSXNode } from 'hono/jsx';

export function Layout({ children, title }: { children: any; title?: string }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Namefi Dev Tools'}</title>
        <script src="https://cdn.tailwindcss.com" />
      </head>
      <body className="bg-gradient-to-br from-neutral-900 to-black text-white min-h-screen flex items-center justify-center font-sans">
        {children}
      </body>
    </html>
  );
}
