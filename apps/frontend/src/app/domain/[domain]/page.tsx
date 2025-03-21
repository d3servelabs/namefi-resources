type Props = {
  params: Promise<{ domain: string }>;
};

export default async function DomainPage({ params }: Props) {
  const { domain } = await params;

  return <div className="p-4">Domain: {domain}</div>;
}
