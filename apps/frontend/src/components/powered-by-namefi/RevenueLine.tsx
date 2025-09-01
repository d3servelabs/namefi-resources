'use client';
import { Line } from 'react-chartjs-2';
import { cn } from '@/lib/cn';

/**
 * !!Important!!
 * Chart.js components need to be registered in the parent component.
 */
export function RevenueLine({
  data,
  className,
}: {
  className?: string;
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
    <div className={cn('h-64', className)}>
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
