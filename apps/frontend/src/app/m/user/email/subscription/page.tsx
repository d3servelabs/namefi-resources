import { poweredByNamefiRedirect } from '@/lib/utils/dynamic-redirect';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  await poweredByNamefiRedirect(
    ({ redirectHostname }) =>
      `https://${redirectHostname}/profile?tab=contact-details&focus=email-subscription`,
    await searchParams,
  );
}
