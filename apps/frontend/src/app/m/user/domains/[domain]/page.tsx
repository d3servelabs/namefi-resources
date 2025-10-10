import { poweredByNamefiRedirect } from '@/lib/utils/dynamic-redirect';

type Props = {
  params: Promise<{ domain: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: Props) {
  const { domain } = await params;

  await poweredByNamefiRedirect(
    ({ redirectHostname }) => `https://${redirectHostname}/domains/${domain}`,
    await searchParams,
    { domain },
  );
}
