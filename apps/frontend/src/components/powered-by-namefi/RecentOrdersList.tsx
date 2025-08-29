'use client';

export function RecentOrdersList({
  items,
}: {
  items: Array<{
    id: string;
    normalizedDomainName: string;
    amountInUSDCents: number;
    createdAt: string | Date;
    status: string;
    promoGroupOrCampaignKey?: string | null;
    promoReason?: string | null;
  }>;
}) {
  return (
    <div className="space-y-2">
      {items?.map((it) => (
        <div
          key={it.id}
          className="flex items-center justify-between border rounded px-3 py-2"
        >
          <div>
            <div className="text-sm font-medium">{it.normalizedDomainName}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(it.createdAt as any).toLocaleString()}
            </div>
            {(it.promoGroupOrCampaignKey || it.promoReason) && (
              <div className="text-xs text-muted-foreground">
                Promo: {it.promoGroupOrCampaignKey}{' '}
                {it.promoReason ? `- ${it.promoReason}` : ''}
              </div>
            )}
          </div>
          <div className="text-sm">
            {(it.amountInUSDCents / 100).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
