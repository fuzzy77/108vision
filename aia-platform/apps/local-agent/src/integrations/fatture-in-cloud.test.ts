import { describe, expect, it, vi, afterEach } from 'vitest';

import { isFattureInCloudConfigured, listOverdueInvoices } from './fatture-in-cloud.js';

describe('fatture-in-cloud', () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it('reports not configured without env', () => {
    delete process.env['FATTURE_IN_CLOUD_TOKEN'];
    delete process.env['FATTURE_IN_CLOUD_COMPANY_ID'];
    expect(isFattureInCloudConfigured()).toBe(false);
  });

  it('returns empty when not configured', async () => {
    delete process.env['FATTURE_IN_CLOUD_TOKEN'];
    const result = await listOverdueInvoices();
    expect(result.invoices).toEqual([]);
  });

  it('maps overdue invoices from API', async () => {
    process.env['FATTURE_IN_CLOUD_TOKEN'] = 'test-token';
    process.env['FATTURE_IN_CLOUD_COMPANY_ID'] = '123';

    const pastDue = new Date();
    pastDue.setDate(pastDue.getDate() - 5);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 99,
              number: '2026/01',
              date: '2026-01-01',
              due_date: pastDue.toISOString().slice(0, 10),
              amount_gross: 1500,
              currency: { id: 'EUR' },
              entity: { name: 'Acme Srl' },
              payment_state: 'not_paid',
            },
          ],
        }),
      }),
    );

    const result = await listOverdueInvoices();
    expect(result.total).toBe(1);
    expect(result.invoices[0]?.clientName).toBe('Acme Srl');
    expect(result.invoices[0]?.daysOverdue).toBeGreaterThan(0);
  });
});
