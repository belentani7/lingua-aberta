import { useRef, type CompositionEvent, type CompositionEventHandler, type KeyboardEvent, type KeyboardEventHandler } from "react";
import { usePersistFn } from "./usePersistFn";

export interface UseCompositionOptions<
  T extends HTMLInputElement | HTMLTextAreaElement,
> {
  onKeyDown?: KeyboardEventHandler<T>;
  onCompositionStart?: CompositionEventHandler<T>;
  onCompositionEnd?: CompositionEventHandler<T>;
}

export interface UseCompositionReturn<
  T extends HTMLInputElement | HTMLTextAreaElement,
> {
  onCompositionStart: CompositionEventHandler<T>;
  onCompositionEnd: CompositionEventHandler<T>;
  onKeyDown: KeyboardEventHandler<T>;
  isComposing: () => boolean;
}

type TimerResponse = ReturnType<typeof setTimeout>;

/**
 * Gestiona la composicion IME de forma que Enter y Escape no se interpreten
 * mientras el usuario esta escribiendo con un metodo de entrada no latino.
 *
 * Es lo que hace que un campo de texto con acentos, japones o portugues
 * funcione bien en `Input` y `Textarea`.
 */
export function useComposition<
  T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement,
>(options: UseCompositionOptions<T> = {}): UseCompositionReturn<T> {
  const {
    onKeyDown: originalOnKeyDown,
    onCompositionStart: originalOnCompositionStart,
    onCompositionEnd: originalOnCompositionEnd,
  } = options;

  const composing = useRef(false);
  const timer = useRef<TimerResponse | null>(null);
  const timer2 = useRef<TimerResponse | null>(null);

  const onCompositionStart = usePersistFn((e: CompositionEvent<T>) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (timer2.current) {
      clearTimeout(timer2.current);
      timer2.current = null;
    }
    composing.current = true;
    originalOnCompositionStart?.(e);
  });

  const onCompositionEnd = usePersistFn((e: CompositionEvent<T>) => {
    // Dos niveles de setTimeout: en Safari, compositionEnd se dispara antes
    // que onKeyDown, y hay que esperar a que el keydown ya haya pasado.
    timer.current = setTimeout(() => {
      timer2.current = setTimeout(() => {
        composing.current = false;
      });
    });
    originalOnCompositionEnd?.(e);
  });

  const onKeyDown = usePersistFn((e: KeyboardEvent<T>) => {
    // Durante la composicion, Escape y Enter (sin Shift) no deben propagarse:
    // el usuario esta confirmando un caracter, no enviando un formulario.
    if (
      composing.current &&
      (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey))
    ) {
      e.stopPropagation();
      return;
    }
    originalOnKeyDown?.(e);
  });

  const isComposing = usePersistFn(() => composing.current);

  return { onCompositionStart, onCompositionEnd, onKeyDown, isComposing };
}
