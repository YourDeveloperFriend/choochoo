import { useEffect, useState } from "react";

export function useLocalStorage<T>(
  keyName: string,
): [T | undefined, (value?: T) => void] {
  const [value, setValue] = useState<T | undefined>(() =>
    getFromStorage(keyName),
  );

  useEffect(() => {
    if (value == null) {
      localStorage.removeItem(keyName);
      return;
    }
    localStorage.setItem(keyName, JSON.stringify(value));
  }, [value]);
  return [value, setValue];
}

function getFromStorage<T>(keyName: string): T | undefined {
  const value = localStorage.getItem(keyName);
  if (value == null) {
    return undefined;
  }
  try {
    return JSON.parse(value) as T;
  } catch (_) {
    return undefined;
  }
}
