import Link from 'next/link';
import type { Locale } from '@/i18n-config';
import { localeDateLocales, localeLabels } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getAuthorNames, getPostsForLocale } from '@/lib/content';

export const dynamic = 'error';

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const posts = getPostsForLocale(locale);
  const dateLocale = localeDateLocales[locale] ?? localeDateLocales.en;
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'long',
  });

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 md:px-10 lg:px-12">
      {posts.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border/60 bg-card/70 p-10 text-center text-sm text-muted-foreground">
          {dictionary.blog.indexEmpty}
        </p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => {
            const authorNames = getAuthorNames(
              locale,
              post.frontmatter.authors,
            );
            const href = `/r/${locale}/blog/${post.slug}`;
            return (
              <article
                key={`${post.slug}-${post.sourceLanguage}`}
                className="surface-card transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/15"
              >
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                    <time dateTime={post.frontmatter.date}>
                      {dictionary.blog.detailPublishedOn}{' '}
                      {dateFormatter.format(post.publishedAt)}
                    </time>
                    {authorNames.length > 0 && (
                      <span>
                        {dictionary.blog.detailBy} {authorNames.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Link
                      href={href}
                      className="group inline-flex flex-col gap-3"
                    >
                      <span className="text-xl font-semibold text-foreground transition group-hover:text-brand-primary md:text-2xl">
                        {post.frontmatter.title}
                      </span>
                      {post.frontmatter.summary && (
                        <p className="text-sm text-muted-foreground">
                          {post.frontmatter.summary}
                        </p>
                      )}
                    </Link>
                    {post.frontmatter.tags.length > 0 && (
                      <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {post.frontmatter.tags.map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full border border-border/60 px-3 py-1"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                    {post.requestedLanguage !== post.sourceLanguage && (
                      <span className="text-xs text-muted-foreground">
                        {dictionary.blog.detailSourceLanguage}:{' '}
                        {localeLabels[post.sourceLanguage] ??
                          post.sourceLanguage.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <Link
                      href={href}
                      className="inline-flex items-center text-xs font-medium text-brand-primary transition hover:underline"
                    >
                      {dictionary.blog.homeCta}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
