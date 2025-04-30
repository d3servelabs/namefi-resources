import { DomainManagement } from '@/components/DomainAndDnsManagment/DomainManagement';

type Props = {
  params: Promise<{ domain: string }>;
};

export default async function DomainPage({ params }: Props) {
  const { domain } = await params;

  return <DomainManagement domain={domain} className="p-4" />;
}
