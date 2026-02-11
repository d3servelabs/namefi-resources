import { Counter, Gauge } from 'prom-client';
import { register } from '../registry';

const metricsCollectErrorsTotal = new Counter({
  name: 'namefi_metrics_collect_errors_total',
  help: 'Total number of metric collection errors by metric name',
  labelNames: ['metric'],
  registers: [register],
});

const metricsLastSuccessTimestampSeconds = new Gauge({
  name: 'namefi_metrics_last_success_timestamp_seconds',
  help: 'Unix timestamp of the last successful metric collection',
  labelNames: ['metric'],
  registers: [register],
});

export function recordCollectorError(metric: string) {
  metricsCollectErrorsTotal.inc({ metric });
}

export function recordCollectorSuccess(metric: string, now: Date) {
  metricsLastSuccessTimestampSeconds.set(
    { metric },
    Math.floor(now.getTime() / 1000),
  );
}
