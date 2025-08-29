'use client';
import { Line } from 'react-chartjs-2';

/**
 * !!Important!!
 * Chart.js components need to be registered in the parent component.
 */
export function RevenueLine({
  data,
}: {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
      tension: number;
    }[];
  } | null;
}) {
  return data ? (
    <div className="h-64">
      <Line
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                maxTicksLimit: 10,
                callback: (value) => `${Number(value).toFixed(2)}$USD`,
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (ctx) => `${(ctx.parsed.y as number).toFixed(2)}$USD`,
              },
            },
          },
        }}
      />
    </div>
  ) : (
    <p className="text-muted-foreground text-sm">No data</p>
  );
}
