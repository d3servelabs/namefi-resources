import { describe, expect, it } from 'vitest';
import { getOrderProcessedEmailContent } from './notify.activities';

/**
 * Tests for the getOrderProcessedEmailContent activity that determines the
 * content of the email we send to a user when their order items are processed
 */
describe('getOrderProcessedEmailContent', () => {
  const succeededItems0xCity = [
    { normalizedDomainName: 'succeeded1.0x.city' },
    { normalizedDomainName: 'succeeded2.0x.city' },
  ];
  const failedItems0xCity = [
    { normalizedDomainName: 'failed1.0x.city' },
    { normalizedDomainName: 'failed2.0x.city' },
  ];

  it('should throw an error for empty succeedItems and failedItems', async () => {
    let error: Error | null = null;
    try {
      const _result = await getOrderProcessedEmailContent({
        orderId: 'testOrderId',
        succeededItems: [],
        failedItems: [],
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).toBeInstanceOf(Error);
  });

  it('should return success template with plural language for multiple succeeded items and no failed items', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: succeededItems0xCity,
      failedItems: [],
    });
    const expected =
      'All items in your recent order were processed successfully.\nYour new domains: succeeded1.0x.city, succeeded2.0x.city.\nVisit https://0x.city/orders/testOrderId to see more details.';
    expect(result.content).toEqual(expected);
  });

  it('should return success template with singular language for one succeeded item and no failed items', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: succeededItems0xCity.slice(0, 1),
      failedItems: [],
    });
    const expected =
      'The domain (succeeded1.0x.city) in your recent order was processed successfully.\nVisit https://0x.city/orders/testOrderId to see more details.';
    expect(result.content).toEqual(expected);
  });

  it('should return failure template with plural language for multiple failed items and no succeeded items', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: [],
      failedItems: failedItems0xCity,
    });
    const expected =
      'The items in your recent order failed to process.\nFailed to process: failed1.0x.city, failed2.0x.city.\nVisit https://0x.city/orders/testOrderId to see more details.';
    expect(result.content).toEqual(expected);
  });

  it('should return failure template with singular language for one failed item and no succeeded items', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: [],
      failedItems: failedItems0xCity.slice(0, 1),
    });
    const expected =
      'The domain (failed1.0x.city) in your recent order failed to process.\nVisit https://0x.city/orders/testOrderId to see more details.';
    expect(result.content).toEqual(expected);
  });

  it('should return mixed template with plural language for multiple items failed and multiple items succeeded', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: succeededItems0xCity,
      failedItems: failedItems0xCity,
    });
    const expected =
      'Some items in your recent order failed to process.\nYour new domains: succeeded1.0x.city, succeeded2.0x.city.\nFailed to process: failed1.0x.city, failed2.0x.city.\nVisit https://0x.city/orders/testOrderId to see more details.';
    expect(result.content).toEqual(expected);
  });

  it('should return mixed template with plural language for succeeded items and singluar language for failed items for a single item failed and multiple items succeeded', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: succeededItems0xCity,
      failedItems: failedItems0xCity.slice(0, 1),
    });
    const expected =
      'An item in your recent order failed to process.\nYour new domains: succeeded1.0x.city, succeeded2.0x.city.\nFailed to process: failed1.0x.city.\nVisit https://0x.city/orders/testOrderId to see more details.';
    expect(result.content).toEqual(expected);
  });

  it('should return mixed template with singular language for succeeded items and singluar language for failed items for a single item failed and a single item succeeded', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: succeededItems0xCity.slice(0, 1),
      failedItems: failedItems0xCity.slice(0, 1),
    });
    const expected =
      'An item in your recent order failed to process.\nYour new domain: succeeded1.0x.city.\nFailed to process: failed1.0x.city.\nVisit https://0x.city/orders/testOrderId to see more details.';
    expect(result.content).toEqual(expected);
  });

  it('should return mixed template with singular language for succeeded items and plural language for failed items for multiple items failed and a single item succeeded', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: succeededItems0xCity.slice(0, 1),
      failedItems: failedItems0xCity,
    });
    const expected =
      'Some items in your recent order failed to process.\nYour new domain: succeeded1.0x.city.\nFailed to process: failed1.0x.city, failed2.0x.city.\nVisit https://0x.city/orders/testOrderId to see more details.';
    expect(result.content).toEqual(expected);
  });

  it('should return link to 0x.city if only has 0x.city items', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: succeededItems0xCity,
      failedItems: failedItems0xCity,
    });

    expect(result.content.includes('https://0x.city/orders/testOrderId')).toBe(
      true,
    );
  });

  it('should return link to defi.build if only has defi.build items', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: [
        { normalizedDomainName: 'succeeded1.defi.build' },
        { normalizedDomainName: 'succeeded2.defi.build' },
      ],
      failedItems: [
        { normalizedDomainName: 'failed1.defi.build' },
        { normalizedDomainName: 'failed2.defi.build' },
      ],
    });

    expect(
      result.content.includes('https://defi.build/orders/testOrderId'),
    ).toBe(true);
  });

  it('should return link to poweredby.namefi.io if it has items with multiple parent domains', async () => {
    const result = await getOrderProcessedEmailContent({
      orderId: 'testOrderId',
      succeededItems: [
        { normalizedDomainName: 'succeeded1.0x.city' },
        { normalizedDomainName: 'succeeded2.defi.build' },
      ],
      failedItems: [
        { normalizedDomainName: 'failed1.defi.build' },
        { normalizedDomainName: 'failed2.0x.city' },
      ],
    });

    expect(
      result.content.includes('https://poweredby.namefi.io/orders/testOrderId'),
    ).toBe(true);
  });
});
