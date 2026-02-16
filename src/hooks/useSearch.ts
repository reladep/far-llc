'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Firm } from '@/types';
import {
  type SearchFilters,
  type SearchParams,
  EMPTY_FILTERS,
  serializeParams,
  deserializeParams,
  fetchSearch,
} from '@/lib/search';

interface SearchState {
  results: Firm[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abortRef = useRef<AbortController | null>(null);

  // Derive params from URL
  const params = deserializeParams(searchParams.toString());

  const [state, setState] = useState<SearchState>({
    results: [],
    total: 0,
    loading: false,
    error: null,
  });

  const updateURL = useCallback(
    (newParams: SearchParams) => {
      const qs = serializeParams(newParams);
      router.push(`/search${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router]
  );

  const setQuery = useCallback(
    (query: string) => updateURL({ ...params, query, page: 1 }),
    [params, updateURL]
  );

  const setFilters = useCallback(
    (filters: SearchFilters) => updateURL({ ...params, filters, page: 1 }),
    [params, updateURL]
  );

  const setSort = useCallback(
    (sort: SearchParams['sort']) => updateURL({ ...params, sort, page: 1 }),
    [params, updateURL]
  );

  const setPage = useCallback(
    (page: number) => updateURL({ ...params, page }),
    [params, updateURL]
  );

  const clearFilters = useCallback(
    () => updateURL({ ...params, filters: EMPTY_FILTERS, page: 1 }),
    [params, updateURL]
  );

  // Fetch when URL changes
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, loading: true, error: null }));

    fetchSearch(params)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({
            results: data.results,
            total: data.total,
            loading: false,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Search failed',
          }));
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return {
    ...state,
    ...params,
    setQuery,
    setFilters,
    setSort,
    setPage,
    clearFilters,
  };
}
