import { DomainDetail } from '@/components/hunt/domains/domain-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const domainName = decodeURIComponent(id);
  return <DomainDetail domainName={domainName} />;
}
