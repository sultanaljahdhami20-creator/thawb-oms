import { useCallback, useLayoutEffect, useRef } from 'react';

// Memoized rows retain handler identity while each event uses the latest app state.
export function useUIEvent(callback) {
  const callbackRef = useRef(callback);
  useLayoutEffect(() => { callbackRef.current = callback; }, [callback]);
  return useCallback((...args) => callbackRef.current(...args), []);
}
