import { DomainItemSkeleton } from './domain-item-skeleton';
import { type Domain, DomainListItem } from './domain-list-item';

export const DomainList = ({
  domains,
  isLoading,
  isError,
}: {
  domains: Domain[];
  isLoading?: boolean;
  isError?: boolean;
}) => {
  return (
    <div className="divide-y divide-border">
      {isLoading && <DomainItemSkeleton />}
      {isError && (
        <div className="p-8 text-center text-red-500">
          Failed to load domains
        </div>
      )}

      {isLoading || isError ? null : domains.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No more domains, please try again later.
        </div>
      ) : (
        domains.map((domain) => (
          <DomainListItem key={domain.domainName} domain={domain} />
        ))
      )}
    </div>
  );
};
