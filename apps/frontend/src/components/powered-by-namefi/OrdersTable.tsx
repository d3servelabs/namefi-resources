'use client';

export type OrderRow = {
  id: string;
  normalizedDomainName: string;
  amountInUSDCents: number;
  status: string;
  createdAt: string | Date;
};

export function OrdersTable({ items }: { items: OrderRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-2">Domain</th>
            <th className="py-2">Amount (USD)</th>
            <th className="py-2">Status</th>
            <th className="py-2">Created At</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((it) => (
            <tr key={it.id} className="border-t">
              <td className="py-2">{it.normalizedDomainName}</td>
              <td className="py-2">{(it.amountInUSDCents / 100).toFixed(2)}</td>
              <td className="py-2">{it.status}</td>
              <td className="py-2">
                {new Date(it.createdAt as any).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
