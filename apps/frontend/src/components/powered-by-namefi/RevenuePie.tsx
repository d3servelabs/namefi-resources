'use client';
import { Pie } from 'react-chartjs-2';

/**
 * !!Important!!
 * Chart.js components need to be registered in the parent component.
 */
export function RevenuePie({
  data,
  totalInUsdCents,
}: {
  data: {
    labels: string[];
    datasets: { label: string; data: number[]; backgroundColor: string[] }[];
  } | null;
  totalInUsdCents: number;
}) {
  return (
    <div>
      <div className="text-sm text-muted-foreground mb-2">
        Total: {((totalInUsdCents ?? 0) / 100).toFixed(2)} USD
      </div>
      {data ? (
        <div className="h-80">
          <Pie
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              borderColor: '#CCCCCCAA',
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${(ctx.parsed as number).toFixed(2)}$USD`,
                  },
                },
                legend: { position: 'right' },
              },
            }}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No data</p>
      )}
    </div>
  );
}
