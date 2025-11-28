"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook simples para persistência de dados no localStorage
 * Substitui o useKV do @github/spark/hooks
 */
export function useKV<T>(
  key: string,
  initialValue: T
): [T | undefined, (value: T | ((prev: T | undefined) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar valor do localStorage no mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        setStoredValue(initialValue);
        window.localStorage.setItem(key, JSON.stringify(initialValue));
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      setStoredValue(initialValue);
    }
    setIsLoaded(true);
  }, [key, initialValue]);

  // Função para atualizar o valor
  const setValue = useCallback(
    (value: T | ((prev: T | undefined) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    },
    [key, storedValue]
  );

  return [isLoaded ? storedValue : undefined, setValue];
}

export default useKV;
