import { DomainManagement } from '@/components/DomainAndDnsManagment/DomainManagement';

type Props = {
  params: Promise<{ domain: string }>;
};

export default async function DomainPage({ params }: Props) {
  const { domain } = await params;

  return (
    <div className="p-4 max-w-[1400px] mx-auto w-full">
      <DomainManagement domain={domain} />
    </div>
  );
}
