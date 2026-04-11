import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LLMCopyButton, ViewOptions } from '@/components/ai/page-actions';
import { APIPage } from '@/components/api-page';
import { getPageImage, source } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const gitConfig = {
    user: 'username',
    repo: 'repo',
    branch: 'main',
  };

  // for OpenAPI pages
  if (page.data.type === 'openapi') {
    return (
      <DocsPage full>
        <h1 className="text-[1.75em] font-semibold">{page.data.title}</h1>
        <a
          className="text-sm font-normal text-brand-primary underline"
          href="https://backend.astra.namefi.dev/v-next/doc"
        >
          <ExternalLink className="inline h-4 w-4" /> API Docs with browser
          client
        </a>
        <DocsBody>
          <APIPage {...page.data.getAPIPageProps()} />
        </DocsBody>
      </DocsPage>
    );
  }

  if (page.data.type !== 'docs' || !('body' in page.data)) notFound();

  const Mdx = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions
          markdownUrl={`${page.url}.mdx`}
          // update it to match your repo
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/docs/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        {Mdx ? (
          <Mdx
            components={getMDXComponents({
              // Work around the generic mismatch in `createRelativeLink` under Bun monorepos.
              // See fuma-nama/fumadocs#3027.
              a: ({ href, ...componentProps }) => {
                const Link = defaultMdxComponents.a;

                return (
                  <Link
                    href={href ? source.resolveHref(href, page) : href}
                    {...componentProps}
                  />
                );
              },
            })}
          />
        ) : (
          false
        )}
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/docs/[[...slug]]'>,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
