import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases condicionales de Tailwind resolviendo los conflictos.
 *
 * Este modulo faltaba y lo importan 53 componentes de `components/ui/` mas
 * `AIChatBox`, `ErrorBoundary` y `Map`. Vite abortaba el build con
 * `Could not load client/src/lib/utils`.
 *
 * `clsx` y `tailwind-merge` ya estaban declarados en package.json.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
