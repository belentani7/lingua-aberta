import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

type UseAuthOptions = {
  /** Redirigir al login cuando no haya sesion. */
  redirectOnUnauthenticated?: boolean;
  /** Ruta a la que redirigir; si se omite, se lanza `startLogin()`. */
  redirectPath?: string;
};

/**
 * Estado de autenticacion del cliente.
 *
 * NOTA IMPORTANTE: en este repositorio la capa de API (`/api/trpc`) todavia
 * no esta implementada — `server/` solo contiene contenido estatico. Mientras
 * tanto la consulta `auth.me` falla y el estado es "sin autenticar", que es
 * exactamente el comportamiento correcto: `DashboardLayout` muestra el boton
 * "Sign in" y `startLogin()` lanza el flujo de identidad configurado.
 *
 * Este modulo faltaba en el repositorio y lo importan `DashboardLayout` y
 * `pages/Home`, por lo que el build no podia completarse.
 */
export function useAuth(options?: UseAuthOptions) {
  // `startLogin()` se llama desde el efecto, nunca durante el render: genera
  // un nonce de un solo uso y escribe la cookie de estado, asi que llamarlo en
  // cada render descuadraria el flujo en curso.
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") {
        return;
      }
      throw error;
    } finally {
      // Limpia el token de auto-login replicado en sessionStorage (Safari ITP
      // y WebView bloquean cookies de terceros). La cookie del backend la
      // borra la propia mutacion.
      try {
        sessionStorage.removeItem("manus-cookie");
      } catch {
        // sessionStorage no disponible
      }
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(
    () => ({
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    }),
    [
      meQuery.data,
      meQuery.error,
      meQuery.isLoading,
      logoutMutation.error,
      logoutMutation.isPending,
    ],
  );

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin();
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
