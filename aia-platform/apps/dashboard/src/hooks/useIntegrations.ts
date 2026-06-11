import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiForTenant } from '@/lib/api';
import type {
  EmailAccount,
  AddEmailAccountPayload,
  TestEmailConnectionPayload,
  TestEmailConnectionResult,
  CrawlJob,
} from '@/types';

/**
 * Integration hooks — mapped to:
 *   Email:   /api/integrations/email/*   (tenant-scoped)
 *   Browser: /api/integrations/browser/* (tenant-scoped)
 *
 * For the consultant dashboard (cross-tenant view), we fall back to
 * aggregating per-tenant data or returning graceful empty arrays when the
 * endpoint doesn't support cross-tenant queries.
 */

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

export function useEmailAccounts(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['integrations', 'email-accounts', tenantId],
    queryFn: async () => {
      const r = await apiForTenant<{ items: EmailAccount[] }>(tenantId!, '/integrations/email/accounts');
      return r.items;
    },
    enabled: !!tenantId,
  });
}

export function useAllEmailAccounts() {
  return useQuery({
    queryKey: ['integrations', 'email-accounts'],
    queryFn: async (): Promise<EmailAccount[]> => {
      // Cross-tenant view: not supported by tenant-scoped routes.
      // Return empty until admin email management is added to the gateway.
      return [];
    },
  });
}

export function useAddEmailAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddEmailAccountPayload): Promise<EmailAccount> => {
      const { tenantId, ...payload } = data;
      const { getToken } = await import('@/lib/auth');
      const token = getToken();
      const res = await fetch('/api/integrations/email/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { detail?: string } | null;
        throw new Error(err?.detail || `Errore ${res.status}`);
      }
      return res.json() as Promise<EmailAccount>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'email-accounts', variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'email-accounts'] });
    },
  });
}

export function useTestEmailConnection() {
  return useMutation({
    mutationFn: async (data: TestEmailConnectionPayload): Promise<TestEmailConnectionResult> => {
      try {
        // Test endpoint is read-only — no tenant context needed, but gateway
        // requires auth. Use base api post.
        return await api.post<TestEmailConnectionResult>('/integrations/email/accounts/test', data);
      } catch {
        return { success: false, message: 'Impossibile testare la connessione' };
      }
    },
  });
}

export function useRemoveEmailAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api.delete(`/integrations/email/accounts/${accountId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'email-accounts'] });
    },
  });
}

export function useSyncEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api.post(`/integrations/email/accounts/${accountId}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'email-accounts'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Browser / Crawl
// ---------------------------------------------------------------------------

export function useCrawlJobs(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['integrations', 'crawl-jobs', tenantId],
    queryFn: async (): Promise<CrawlJob[]> => {
      try {
        const r = await apiForTenant<{ items: CrawlJob[] }>(tenantId!, '/integrations/browser/crawl-jobs');
        return r.items;
      } catch {
        return [];
      }
    },
    enabled: !!tenantId,
  });
}

export function useAllCrawlJobs() {
  return useQuery({
    queryKey: ['integrations', 'crawl-jobs'],
    queryFn: async (): Promise<CrawlJob[]> => {
      // Cross-tenant view not supported — return empty list.
      return [];
    },
  });
}

export function useStartCrawl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { tenantId: string; url: string; maxPages: number; addToKb: boolean }): Promise<CrawlJob> => {
      const { getToken } = await import('@/lib/auth');
      const token = getToken();
      const res = await fetch('/api/integrations/browser/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': data.tenantId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url: data.url, maxPages: data.maxPages, addToKb: data.addToKb }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Errore ${res.status}`);
      }
      return res.json() as Promise<CrawlJob>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'crawl-jobs', variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'crawl-jobs'] });
    },
  });
}

export function useAddCrawlToKb() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      api.post(`/integrations/browser/crawl-jobs/${jobId}/add-to-kb`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'crawl-jobs'] });
    },
  });
}
