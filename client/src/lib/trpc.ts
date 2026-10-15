import { createTRPCReact } from "@trpc/react-query";

/**
 * Cliente tRPC del frontend.
 *
 * NOTA ARQUITECTONICA: la capa de API (`/api/trpc`) **todavia no esta
 * implementada** en este repositorio — `server/` solo contiene contenido
 * estatico. Por eso no existe un `AppRouter` real que importar
 * (el andamiaje original lo expone en `server/routers.ts`).
 *
 * Por que NO se escribe `type AppRouter = any` y se instancia con el:
 *
 *   error TS2339: Property 'createClient' does not exist on type
 *   '"The property 'useContext' in your router collides with a built-in
 *     method, rename this router or procedure on your backend."'
 *
 * Al pasar `any` como router, tRPC ejecuta su comprobacion de colisiones en
 * tiempo de tipos y **sustituye el tipo por el propio mensaje de error**. Ese
 * tipo se contagia a todo lo que consume `trpc`, y a partir de ahi cada
 * `trpc.algo` y cada callback pierde su tipado contextual (de ahi la ola de
 * `TS7006: implicitly has an 'any' type` en `Home.tsx`).
 *
 * La solucion es instanciar el proxy **sin router**, y|NS|declare el resultado
 * como `any` en un unico punto. Cuando exista la API, aqui se pasa a
 * `createTRPCReact<AppRouter>()` con el tipo real y el tipado vuelve entero.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCReact() as any;

export type TrpcClient = typeof trpc;
