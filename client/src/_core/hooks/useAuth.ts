import { trpc } from "@/lib/trpc";

/** Auth state hook. Reads the current session user and exposes logout. */
export function useAuth() {
  const meQuery = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => meQuery.refetch(),
  });

  return {
    user: meQuery.data ?? null,
    loading: meQuery.isLoading,
    isAuthenticated: Boolean(meQuery.data),
    logout: () => logoutMutation.mutate(),
  };
}
