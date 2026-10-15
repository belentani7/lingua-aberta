/**
 * Flujo de inicio de sesion del cliente.
 *
 * Este modulo faltaba en el repositorio: tres ficheros lo importan
 * (`main.tsx`, `pages/Home.tsx`, `components/DashboardLayout.tsx`) y Vite
 * abortaba el build con:
 *
 *   Could not resolve "./const" from "client/src/main.tsx"
 *
 * `startLogin()` tiene EFECTOS SECUNDARIOS: construye la URL de autorizacion y
 * navega. No llamar durante el render (nada de `href={startLogin()}`): cada
 * llamada genera un nonce nuevo y descuadra el flujo en curso.
 *
 * Configuracion (variables de entorno de Vite, todas opcionales):
 *   VITE_OAUTH_PORTAL_URL   portal OAuth externo (flujo recomendado)
 *   VITE_APP_ID             identificador de la app en ese portal
 *   VITE_FRONTEND_FORGE_API_URL  API del frontend forge (flujo alternativo)
 */
import { COOKIE_NAME } from "@shared/const";

export { COOKIE_NAME } from "@shared/const";

export type LoginConfig = {
  portalUrl?: string;
  appId?: string;
  forgeApiUrl?: string;
};

const readConfig = (): LoginConfig => ({
  portalUrl: import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined,
  appId: import.meta.env.VITE_APP_ID as string | undefined,
  forgeApiUrl: import.meta.env.VITE_FRONTEND_FORGE_API_URL as string | undefined,
});

/**
 * Construye la URL de inicio de sesion, o devuelve `null` si la aplicacion
 * no tiene configurado ningun proveedor de identidad.
 */
export function buildLoginUrl(): string | null {
  const { portalUrl, appId, forgeApiUrl } = readConfig();
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  if (portalUrl && appId) {
    const url = new URL(`${portalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("type", "signIn");
    return url.toString();
  }

  if (forgeApiUrl) {
    const url = new URL(`${forgeApiUrl}/api/forge/oauth2/authorize`);
    if (appId) url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("type", "signIn");
    return url.toString();
  }

  return null;
}

/**
 * Inicia el flujo de inicio de sesion. Devuelve `false` si no hay proveedor
 * configurado, en cuyo caso solo avisa por consola: es preferible a navegar
 * a una URL inexistente y dejar al usuario en un 404.
 */
export function startLogin(): boolean {
  const url = buildLoginUrl();

  if (!url) {
    console.warn(
      "[auth] startLogin() sin proveedor configurado. Define VITE_OAUTH_PORTAL_URL y " +
        "VITE_APP_ID, o VITE_FRONTEND_FORGE_API_URL, en el entorno del cliente.",
    );
    return false;
  }

  window.location.href = url;
  return true;
}
