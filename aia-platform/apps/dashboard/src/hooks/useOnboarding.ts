import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OnboardingData, Tenant } from '@/types';
import type { ModelTier } from '@/lib/constants';
import { getToken } from '@/lib/auth';

/**
 * Onboarding wizard — maps the 6-step wizard data to the multi-step
 * gateway API at /api/admin/onboarding/*.
 *
 * Steps:
 *   1. POST /admin/onboarding/start        — create tenant
 *   2. POST /admin/onboarding/:id/agents   — install agent templates (skip if no templates selected)
 *   3. POST /admin/onboarding/:id/kb/crawl — queue URL crawls
 *   4. POST /admin/onboarding/:id/invite   — invite users
 *   5. POST /admin/onboarding/:id/activate — activate tenant
 *   6. Upload documents via multipart (tenant-scoped /knowledge/documents/upload)
 */
export function useCreateOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OnboardingData): Promise<Tenant> => {
      // Step 1: Create tenant
      const startResult = await api.post<{
        tenantId: string;
        slug: string;
        message: string;
      }>('/admin/onboarding/start', {
        name: data.company.name,
        slug: data.company.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 100) || `tenant-${Date.now()}`,
        sector: data.company.sector || undefined,
        size: mapCompanySize(data.company.size),
      });

      const tenantId = startResult.tenantId;

      // Step 2: Queue URL crawls for KB (fire & forget — don't block activation on this)
      for (const url of data.crawlUrls) {
        await api
          .post(`/admin/onboarding/${tenantId}/kb/crawl`, { url })
          .catch(() => {
            // Non-blocking: crawl errors don't fail the whole onboarding
          });
      }

      // Step 3: Invite users
      if (data.users.length > 0) {
        await api
          .post(`/admin/onboarding/${tenantId}/invite`, {
            invitations: data.users.map((u) => ({
              email: u.email,
              role: u.role === 'admin' ? 'tenant_admin' : 'client_user',
            })),
          })
          .catch(() => {
            // Non-blocking: invitation errors don't fail activation
          });
      }

      // Step 4: Upload documents if any (multipart, tenant-scoped endpoint)
      if (data.documents.length > 0) {
        const formData = new FormData();
        data.documents.forEach((file) => {
          formData.append('files', file);
        });

        const token = getToken();
        await fetch('/api/knowledge/documents/upload', {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'X-Tenant-ID': tenantId,
          },
          body: formData,
        }).catch(() => {
          // Non-blocking: document upload errors don't fail activation
        });
      }

      // Step 5: Activate tenant
      await api.post(`/admin/onboarding/${tenantId}/activate`);

      // Return minimal Tenant object from the tenantId we have
      // (full tenant details will be loaded via useTenant when navigating to /tenants/:id)
      return {
        id: tenantId,
        name: data.company.name,
        sector: data.company.sector,
        plan: 'starter',
        status: 'active',
        contactName: data.company.contactName,
        contactEmail: data.company.contactEmail,
        agentsCount: 0,
        documentsCount: data.documents.length,
        conversationsThisMonth: 0,
        monthlyCost: 0,
        monthlyRevenue: 0,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        config: {
          allowedModels: ['fast', 'balanced'] as ModelTier[],
          maxTokensPerMonth: 100_000,
        },
      } as Tenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Map dashboard company size labels to gateway enum values.
 */
function mapCompanySize(
  size: string,
): 'micro' | 'small' | 'medium' | 'large' | undefined {
  const map: Record<string, 'micro' | 'small' | 'medium' | 'large'> = {
    '1-5': 'micro',
    '6-20': 'small',
    '21-50': 'small',
    '51-200': 'medium',
    '200+': 'large',
  };
  return map[size];
}
