'use client';
import { Bar } from 'react-chartjs-2';

export function RevenueBar({
  data,
}: {
  data: {
    labels: string[];
    datasets: { label: string; data: number[]; backgroundColor: string[] }[];
  } | null;
}) {
  return data ? (
    <div className="h-80">
      <Bar
        data={data}
        options={{
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `${Number(value).toFixed(2)}$USD`,
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (ctx) => `${(ctx.parsed.x as number).toFixed(2)}$USD`,
              },
            },
            legend: { display: false },
          },
        }}
      />
    </div>
  ) : (
    <p className="text-muted-foreground text-sm">No data</p>
  );
}
