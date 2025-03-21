import { DomainSearch } from '@/components/domainSearch';
import { ThemedButtons } from '@/components/themedButtons';

export default function HomePage() {
  return (
    <div className="p-4">
      <DomainSearch />
      <ThemedButtons />
    </div>
  );
}
