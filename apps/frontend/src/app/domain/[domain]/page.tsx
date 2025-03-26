import { DnsManagement } from '@/components/DNS/DnsManagement';

type Props = {
  params: Promise<{ domain: string }>;
};

export default async function DomainPage({ params }: Props) {
  const { domain } = await params;

  return <DnsManagement domain={domain} className="p-4" />;
}
