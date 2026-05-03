import { useEffect, useRef, useState } from "react";
import { Store } from "@tauri-apps/plugin-store";

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = Store.load("settings.json");
  }
  return storePromise;
}

export function useStored<T>(
  key: string,
  defaultValue: T
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValueState] = useState<T>(defaultValue);
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getStore()
      .then((s) => s.get<T>(key))
      .then((stored) => {
        if (cancelled) return;
        if (stored !== undefined && stored !== null) {
          setValueState(stored);
        }
        loadedRef.current = true;
      })
      .catch((err) => {
        console.warn(`useStored(${key}) load failed`, err);
        loadedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!loadedRef.current) return;
    getStore()
      .then((s) => s.set(key, value as never).then(() => s.save()))
      .catch((err) => console.warn(`useStored(${key}) save failed`, err));
  }, [key, value]);

  return [value, setValueState];
}
