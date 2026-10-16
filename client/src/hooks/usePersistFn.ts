import { useRef } from "react";

type AnyFn = (...args: any[]) => any;

/**
 * Referencia estable a una funcion sin la carga cognitiva de `useCallback`.
 *
 * Devuelve siempre la MISMA identidad entre renders, pero siempre ejecuta la
 * version mas reciente de `fn`. Ideal para handlers que se pasan a hooks
 *VICE como `useComposition`.
 */
export function usePersistFn<T extends AnyFn>(fn: T): T {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T | null>(null);
  if (persistFn.current === null) {
    const stable = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
      return fnRef.current!.apply(this, args) as ReturnType<T>;
    };
    persistFn.current = stable as unknown as T;
  }

  return persistFn.current as T;
}
