import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'tenant_admin' | 'tenant_operator' | 'client_user' | 'admin' | 'user';
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export function useUsers(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'users'],
    queryFn: async () => {
      const r = await api.get<{ items: TenantUser[]; total: number }>(
        `/admin/tenants/${tenantId}/users`,
      );
      return r.items;
    },
    enabled: !!tenantId,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, email, role }: { tenantId: string; email: string; role: string }) =>
      api.post(`/admin/tenants/${tenantId}/users/invite`, { email, role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants', variables.tenantId, 'users'] });
    },
  });
}

export function useRemoveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, userId }: { tenantId: string; userId: string }) =>
      api.delete(`/admin/tenants/${tenantId}/users/${userId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants', variables.tenantId, 'users'] });
    },
  });
}
