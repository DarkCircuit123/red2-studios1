import { useEffect, useRef } from 'react';

/**
 * Generic hook for attaching an event listener to any EventTarget.
 * Saves the handler in a ref so the effect does not have to re-run when the
 * callback identity changes, preventing unnecessary add/remove cycles.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (event: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
  element: EventTarget = window
) {
  const saved = useRef(listener);

  // keep ref up to date
  useEffect(() => {
    saved.current = listener;
  }, [listener]);

  useEffect(() => {
    const eventHandler = (event: Event) => {
      // delegate to the latest listener stored in ref
      saved.current(event as any);
    };

    element.addEventListener(type, eventHandler, options);
    return () => {
      element.removeEventListener(type, eventHandler, options);
    };
  }, [type, element, options]);
}
