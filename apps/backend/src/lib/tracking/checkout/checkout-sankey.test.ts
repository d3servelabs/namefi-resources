import { describe, expect, it } from 'vitest';
import { buildSankeyGraphDomainAcquisition } from './checkout-sankey';
import { createEmptyCheckoutFlowEventsParsed } from './parse-checkout-flow-raw-report';

describe('checkout Sankey graphs', () => {
  it('keeps the domain acquisition success path when GA has event counts without outcome rows', () => {
    const events = createEmptyCheckoutFlowEventsParsed();
    events.domain_acquisition_started.count = 10;
    events.domain_acquisition_finished.count = 8;
    events.dns_records_propagated.count = 6;
    events.parking_finished.count = 5;

    const graph = buildSankeyGraphDomainAcquisition({ events });

    expect(graph.links).toEqual(
      expect.arrayContaining([
        {
          source: 'domain_acquisition_started',
          target: 'domain_acquisition_finished',
          value: 8,
        },
        {
          source: 'domain_acquisition_finished',
          target: 'dns_records_propagated',
          value: 6,
        },
        {
          source: 'dns_records_propagated',
          target: 'parking_finished',
          value: 5,
        },
      ]),
    );
  });

  it('does not route explicit failure-only acquisition outcomes into the success path', () => {
    const events = createEmptyCheckoutFlowEventsParsed();
    events.domain_acquisition_started.count = 10;
    events.domain_acquisition_finished.count = 5;
    events.domain_acquisition_finished.breakdown.outcome = [
      { outcome: 'FAILURE', count: 5 },
    ];
    events.dns_records_propagated.count = 5;
    events.parking_finished.count = 5;

    const graph = buildSankeyGraphDomainAcquisition({ events });

    expect(graph.links).toEqual(
      expect.arrayContaining([
        {
          source: 'domain_acquisition_started',
          target: 'domain_acquisition_finished__FAILURE',
          value: 5,
        },
      ]),
    );
    expect(graph.links).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'domain_acquisition_finished__FAILURE',
          target: 'dns_records_propagated',
        }),
      ]),
    );
  });
});
