"use client";

import { useState, useCallback } from "react";

/**
 * Hook for managing search functionality
 */
export function useSearch(initialValue = "") {
  const [searchValue, setSearchValue] = useState(initialValue);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchValue("");
  }, []);

  return {
    searchValue,
    handleSearch,
    clearSearch,
  };
}
