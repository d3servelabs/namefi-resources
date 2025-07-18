import { DomainManagement } from '@/components/domain-and-dns-managment/domain-management';

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
