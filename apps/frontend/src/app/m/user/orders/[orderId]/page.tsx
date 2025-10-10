import { poweredByNamefiRedirect } from '@/lib/utils/dynamic-redirect';

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: Props) {
  const { orderId } = await params;

  await poweredByNamefiRedirect(
    ({ redirectHostname }) => `https://${redirectHostname}/orders/${orderId}`,
    await searchParams,
    { orderId },
  );
}
