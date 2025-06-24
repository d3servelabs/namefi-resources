import { DomainDetail } from './components/DomainDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const domainName = decodeURIComponent(id);
  return <DomainDetail domainName={domainName} />;
}
