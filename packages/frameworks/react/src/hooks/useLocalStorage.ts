import { useCallback, useState } from 'react';
import { useLocalStorage } from '@mirrorworld/mirage.utils';

export function useLocalStorageState<T>(
  key: string,
  defaultState?: T
): [T, (key: string) => void] {
  const localStorage = useLocalStorage();
  const [state, setState] = useState(() => {
    console.debug('Querying local storage', key);
    const storedState = localStorage.getItem(key);
    console.debug('Retrieved local storage', storedState);
    if (storedState) {
      return JSON.parse(storedState);
    }
    return defaultState;
  });

  const setLocalStorageState = useCallback(
    (newState) => {
      const changed = state !== newState;
      if (!changed) {
        return;
      }
      setState(newState);
      if (newState === null) {
        localStorage.removeItem(key);
      } else {
        try {
          localStorage.setItem(key, JSON.stringify(newState));
        } catch {
          // ignore
        }
      }
    },
    [state, key]
  );

  return [state, setLocalStorageState];
}
