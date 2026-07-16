import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UsageSummary, DashboardStats, ActivityEvent } from '@/types';
import { format, subDays } from 'date-fns';

// --- Gateway response shapes ---

interface GatewayUsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  totalCostUsd: number;
  startDate: string;
  endDate: string;
}

interface GatewayUsageByTenant {
  tenantId: string;
  tenantName: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
}

interface GatewayDailyPoint {
  date: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
}

interface GatewayByModel {
  model: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
}

// --- Dashboard stats: derived from usage summary + tenant count ---

export function useDashboardStats() {
  const now = new Date();
  const currentMonthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
  const currentMonthEnd = format(now, 'yyyy-MM-dd');
  const prevMonthStart = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM-dd');
  const prevMonthEnd = format(new Date(now.getFullYear(), now.getMonth(), 0), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [currentSummary, prevSummary, byTenantData] = await Promise.allSettled([
        api.get<GatewayUsageSummary>('/admin/usage/summary', {
          startDate: currentMonthStart,
          endDate: currentMonthEnd,
        }),
        api.get<GatewayUsageSummary>('/admin/usage/summary', {
          startDate: prevMonthStart,
          endDate: prevMonthEnd,
        }),
        api.get<{ items: GatewayUsageByTenant[] }>('/admin/usage/by-tenant', {
          startDate: currentMonthStart,
          endDate: currentMonthEnd,
        }),
      ]);

      const current = currentSummary.status === 'fulfilled' ? currentSummary.value : null;
      const prev = prevSummary.status === 'fulfilled' ? prevSummary.value : null;
      const byTenant = byTenantData.status === 'fulfilled' ? byTenantData.value.items : [];

      const totalRevenue = byTenant.reduce((acc, t) => acc + t.costUsd * 1.4, 0);
      const prevRevenue = prev ? prev.totalCostUsd * 1.4 : 0;

      const trend = (current: number, previous: number): number => {
        if (previous === 0) return 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      return {
        activeTenants: byTenant.length,
        conversationsThisMonth: current?.totalRequests ?? 0,
        llmCostThisMonth: current?.totalCostUsd ?? 0,
        revenueThisMonth: totalRevenue,
        tenantsTrend: 0, // no prev tenant count available from usage alone
        conversationsTrend: trend(current?.totalRequests ?? 0, prev?.totalRequests ?? 0),
        costTrend: trend(current?.totalCostUsd ?? 0, prev?.totalCostUsd ?? 0),
        revenueTrend: trend(totalRevenue, prevRevenue),
      };
    },
    staleTime: 60_000,
  });
}

// Recent activity: derive from daily usage points as a synthetic feed
export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: async (): Promise<ActivityEvent[]> => {
      const now = new Date();
      const startDate = format(subDays(now, 7), 'yyyy-MM-dd');
      const endDate = format(now, 'yyyy-MM-dd');

      const byTenant = await api
        .get<{ items: GatewayUsageByTenant[] }>('/admin/usage/by-tenant', { startDate, endDate })
        .catch(() => ({ items: [] as GatewayUsageByTenant[] }));

      // Synthesise activity events from per-tenant usage
      return byTenant.items.slice(0, limit).map((t, i) => ({
        id: `activity-${i}`,
        tenantId: t.tenantId,
        tenantName: t.tenantName,
        type: 'conversation_started' as const,
        description: `${t.requests} richieste (${(t.inputTokens + t.outputTokens).toLocaleString()} token)`,
        timestamp: new Date(Date.now() - i * 60_000 * 30).toISOString(),
      }));
    },
    staleTime: 30_000,
  });
}

// --- Full usage summary for Billing page ---

export function useUsageSummary(period?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['usage', 'summary', period],
    queryFn: async (): Promise<UsageSummary> => {
      const now = new Date();
      const startDate = period?.from ?? format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
      const endDate = period?.to ?? format(now, 'yyyy-MM-dd');

      const [summaryResult, byTenantResult, byModelResult, dailyResult] = await Promise.all([
        api.get<GatewayUsageSummary>('/admin/usage/summary', { startDate, endDate }),
        api.get<{ items: GatewayUsageByTenant[] }>('/admin/usage/by-tenant', { startDate, endDate }),
        api.get<{ items: GatewayByModel[] }>('/admin/usage/by-model', { startDate, endDate }),
        api.get<{ items: GatewayDailyPoint[] }>('/admin/usage/daily', { days: 30 }),
      ]);

      const totalTokens = summaryResult.totalInputTokens + summaryResult.totalOutputTokens;

      return {
        totalTokens,
        totalCost: summaryResult.totalCostUsd,
        totalConversations: summaryResult.totalRequests,
        totalMessages: summaryResult.totalRequests * 4, // estimate: ~4 messages per conversation
        byModel: byModelResult.items.map((m) => ({
          model: m.model,
          tokens: m.inputTokens + m.outputTokens,
          cost: m.costUsd,
        })),
        byDay: dailyResult.items.map((d) => ({
          date: d.date,
          tokens: d.inputTokens + d.outputTokens,
          cost: d.costUsd,
          conversations: d.requests,
        })),
        byTenant: byTenantResult.items.map((t) => ({
          tenantId: t.tenantId,
          tenantName: t.tenantName,
          tokens: t.inputTokens + t.outputTokens,
          cost: t.costUsd,
          revenue: t.costUsd * 1.4, // 40% margin placeholder
        })),
      };
    },
  });
}

// --- Per-tenant usage: from admin/tenants/:id/stats ---

interface GatewayTenantStats {
  tenantId: string;
  period: { startDate: string; endDate: string };
  summary: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalRequests: number;
    totalCostUsd: number;
  };
  byModel: GatewayByModel[];
  daily: GatewayDailyPoint[];
}

export function useTenantUsage(tenantId: string | undefined, period?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['usage', 'tenant', tenantId, period],
    queryFn: async (): Promise<UsageSummary> => {
      const now = new Date();
      const startDate = period?.from ?? format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
      const endDate = period?.to ?? format(now, 'yyyy-MM-dd');

      const stats = await api.get<GatewayTenantStats>(`/admin/tenants/${tenantId}/stats`, {
        startDate,
        endDate,
      });

      const totalTokens = stats.summary.totalInputTokens + stats.summary.totalOutputTokens;

      return {
        totalTokens,
        totalCost: stats.summary.totalCostUsd,
        totalConversations: stats.summary.totalRequests,
        totalMessages: stats.summary.totalRequests * 4,
        byModel: stats.byModel.map((m) => ({
          model: m.model,
          tokens: m.inputTokens + m.outputTokens,
          cost: m.costUsd,
        })),
        byDay: stats.daily.map((d) => ({
          date: d.date,
          tokens: d.inputTokens + d.outputTokens,
          cost: d.costUsd,
          conversations: d.requests,
        })),
        byTenant: [],
      };
    },
    enabled: !!tenantId,
  });
}

// --- Usage breakdown by source (chat, proxy_openai, proxy_anthropic, proxy_mcp) ---

interface GatewayBySource {
  source: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
}

export interface UsageBySourceItem {
  source: string;
  label: string;
  tokens: number;
  requests: number;
  cost: number;
}

const SOURCE_LABELS: Record<string, string> = {
  chat: 'Chat Web',
  chat_cached: 'Chat (cache)',
  proxy_openai: 'Proxy OpenAI (Cursor, Continue, aider...)',
  proxy_anthropic: 'Proxy Anthropic (Claude Code)',
  proxy_mcp: 'MCP Tools',
};

export function useUsageBySource(period?: { from: string; to: string }, tenantId?: string) {
  return useQuery({
    queryKey: ['usage', 'by-source', period, tenantId],
    queryFn: async (): Promise<UsageBySourceItem[]> => {
      const now = new Date();
      const startDate = period?.from ?? format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
      const endDate = period?.to ?? format(now, 'yyyy-MM-dd');

      const params: Record<string, string> = { startDate, endDate };
      if (tenantId) params['tenantId'] = tenantId;

      const result = await api.get<{ items: GatewayBySource[] }>('/admin/usage/by-source', params);

      return result.items.map((item) => ({
        source: item.source,
        label: SOURCE_LABELS[item.source] ?? item.source,
        tokens: item.inputTokens + item.outputTokens,
        requests: item.requests,
        cost: item.costUsd,
      }));
    },
  });
}
