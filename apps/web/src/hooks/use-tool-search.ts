'use client';

import { keepPreviousData } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { useDebounce } from './use-utils';

/**
 * Server-side tool search using PostgreSQL full-text search (tsvector + GIN).
 * Falls back to disabled query when search is empty so the caller can
 * use the initial (unfiltered) page load.
 */
export function useToolSearch(opts: {
  search: string;
  categoryId?: string;
  group?: number;
  page?: number;
  pageSize?: number;
}) {
  const debouncedSearch = useDebounce(opts.search, 300);
  const hasQuery = debouncedSearch.trim().length > 0;

  const query = trpc.tools.list.useQuery(
    {
      search: debouncedSearch.trim(),
      categoryId: opts.categoryId,
      group: opts.group,
      page: opts.page ?? 1,
      pageSize: opts.pageSize ?? 48,
    },
    {
      enabled: hasQuery,
      placeholderData: keepPreviousData,
    },
  );

  return {
    /** True when the search query is non-empty and server results should be used */
    isServerSearch: hasQuery,
    /** The debounced search string actually sent to the server */
    debouncedSearch,
    data: query.data,
    isLoading: query.isLoading && hasQuery,
    isFetching: query.isFetching,
  };
}
