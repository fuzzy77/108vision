import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, login as authLogin, logout as authLogout, type AuthUser } from '@/lib/auth';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['auth', 'currentUser'],
    queryFn: () => getCurrentUser(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authLogin(email, password),
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'currentUser'], user);
    },
  });

  const logout = () => {
    queryClient.setQueryData(['auth', 'currentUser'], null);
    authLogout();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    loginError: loginMutation.error?.message,
    isLoggingIn: loginMutation.isPending,
    logout,
  };
}
