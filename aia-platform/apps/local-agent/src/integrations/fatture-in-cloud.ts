/**
 * Fatture in Cloud API v2 adapter — Sprint 5 entry point.
 *
 * Env:
 *   FATTURE_IN_CLOUD_TOKEN      — OAuth access token
 *   FATTURE_IN_CLOUD_COMPANY_ID — numeric company id
 *
 * Docs: https://developers.fattureincloud.it/
 */

const API_BASE = 'https://api-v2.fattureincloud.it';
const REQUEST_TIMEOUT_MS = 15_000;

export interface FicInvoice {
  id: number;
  number: string;
  date: string;
  dueDate: string;
  amountGross: number;
  currency: string;
  clientName: string;
  paymentState: string;
  daysOverdue: number;
}

export interface FicListOverdueResult {
  invoices: FicInvoice[];
  total: number;
}

interface FicApiListResponse {
  data?: Array<{
    id?: number;
    number?: number | string;
    date?: string;
    due_date?: string;
    amount_gross?: number;
    currency?: { id?: string; symbol?: string };
    entity?: { name?: string };
    payments_list?: Array<{ status?: string; due_date?: string }>;
    payment_state?: string;
  }>;
}

function getConfig(): { token: string; companyId: string } | null {
  const token = process.env['FATTURE_IN_CLOUD_TOKEN']?.trim();
  const companyId = process.env['FATTURE_IN_CLOUD_COMPANY_ID']?.trim();
  if (!token || !companyId) return null;
  return { token, companyId };
}

export function isFattureInCloudConfigured(): boolean {
  return getConfig() !== null;
}

function daysBetween(isoDate: string, now = new Date()): number {
  const due = new Date(isoDate);
  if (Number.isNaN(due.getTime())) return 0;
  const diffMs = now.getTime() - due.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

async function ficFetch<T>(path: string, token: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Fatture in Cloud HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Lists issued invoices with due date in the past and not fully paid.
 */
export async function listOverdueInvoices(limit = 20): Promise<FicListOverdueResult> {
  const cfg = getConfig();
  if (!cfg) {
    return { invoices: [], total: 0 };
  }

  const qs = new URLSearchParams({
    type: 'invoice',
    per_page: String(Math.min(limit, 50)),
    sort: '-due_date',
  });

  const payload = await ficFetch<FicApiListResponse>(
    `/c/${cfg.companyId}/issued_documents?${qs}`,
    cfg.token,
  );

  const now = new Date();
  const invoices: FicInvoice[] = [];

  for (const row of payload.data ?? []) {
    const dueDate = row.due_date ?? row.payments_list?.[0]?.due_date;
    if (!dueDate || !row.id) continue;

    const paymentState = row.payment_state ?? row.payments_list?.[0]?.status ?? 'not_paid';
    if (paymentState === 'paid') continue;

    const daysOverdue = daysBetween(dueDate, now);
    if (daysOverdue <= 0) continue;

    invoices.push({
      id: row.id,
      number: String(row.number ?? row.id),
      date: row.date ?? '',
      dueDate,
      amountGross: row.amount_gross ?? 0,
      currency: row.currency?.id ?? 'EUR',
      clientName: row.entity?.name ?? 'Cliente',
      paymentState,
      daysOverdue,
    });
  }

  return { invoices, total: invoices.length };
}
