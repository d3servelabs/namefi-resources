import { NAMESPACES, type Locale } from './config';

/**
 * Assemble a locale's full message catalog by dynamically importing each
 * namespace JSON. Data-driven (iterates `NAMESPACES`), so there is no
 * hand-maintained per-locale import list — adding a language is just dropping
 * `messages/<locale>/*.json` files, and only the active locale is ever loaded.
 * Shared by the server runtime (request.ts) and Storybook (preview.tsx).
 */
export async function loadMessages(
  locale: Locale,
): Promise<Record<string, unknown>> {
  const modules = await Promise.all(
    NAMESPACES.map((ns) => import(`../../messages/${locale}/${ns}.json`)),
  );

  return Object.fromEntries(
    NAMESPACES.map((ns, index) => [ns, modules[index].default]),
  );
}
