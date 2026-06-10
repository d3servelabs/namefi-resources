This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## RSS Feed

The resources site now exposes an RSS 2.0 feed per locale at `/r/<locale>/rss.xml`. When running locally with `bun dev`, you can open [http://localhost:3002/r/en/rss.xml](http://localhost:3002/r/en/rss.xml) to confirm it is working.

## Content data

The content under `apps/resources/data` is a git submodule that points to `d3servelabs/namefi-resources`. Markdown/MDX files live inside the submodule’s `content/` directory.

- After cloning, run `git submodule update --init --recursive` to fetch content.
- Install submodule dependencies once with `bun run --cwd apps/resources data:install`.
- Validate or lint content locally via the submodule scripts:
  - `bun run --cwd apps/resources data:validate`
  - `bun run --cwd apps/resources lint:mdx`

## Publishing content

Content changes are authored in `d3servelabs/namefi-resources`. When a resources content PR is merged there, the resources repository dispatches the `sync-resources-data.yml` workflow in this repository. That workflow opens and auto-merges a PR that only bumps the `apps/resources/data` submodule pointer.

Main-branch pushes that only change `apps/resources/data` are treated as content-only updates and are deployed to the resources production target automatically. Main-branch pushes that touch any other resources app path still deploy to the dev target unless they are deployed manually with `environment=production` or through an `astra-resources/v*` release tag.
