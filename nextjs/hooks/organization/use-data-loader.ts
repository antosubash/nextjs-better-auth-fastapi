"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Generic data loading hook with loading and error states
 */
export function useDataLoader<T>(loadFn: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await loadFn();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [loadFn]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Note: Biome cannot statically verify dynamic dependency arrays, this is expected for generic hooks
    // biome-ignore lint/correctness/useExhaustiveDependencies: Generic hook requires dynamic dependency array
  }, dependencies);

  const reload = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    error,
    reload,
  };
}
