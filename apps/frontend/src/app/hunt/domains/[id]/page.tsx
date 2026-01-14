import { DomainDetail } from '@/components/hunt/domains/domain-detail';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const domainName = namefiNormalizedDomainSchema.safeParse(
    decodeURIComponent(id),
  );

  if (!domainName.success) {
    return notFound();
  }

  return <DomainDetail domainName={domainName.data} />;
}
