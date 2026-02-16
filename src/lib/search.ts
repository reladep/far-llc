import type { Firm } from '@/types';

export interface SearchFilters {
  feeTypes: string[];
  aumRange: [number, number] | null;
  states: string[];
  specialties: string[];
}

export interface SearchParams {
  query: string;
  filters: SearchFilters;
  sort: 'relevance' | 'aum' | 'fees' | 'rating';
  page: number;
}

export interface SearchResponse {
  results: Firm[];
  total: number;
  page: number;
  pageSize: number;
}

export const EMPTY_FILTERS: SearchFilters = {
  feeTypes: [],
  aumRange: null,
  states: [],
  specialties: [],
};

/** Serialize search params to URL query string */
export function serializeParams(params: SearchParams): string {
  const sp = new URLSearchParams();

  if (params.query) sp.set('q', params.query);
  if (params.sort !== 'relevance') sp.set('sort', params.sort);
  if (params.page > 1) sp.set('page', String(params.page));

  const { filters } = params;
  if (filters.feeTypes.length) sp.set('fees', filters.feeTypes.join(','));
  if (filters.aumRange) sp.set('aum', `${filters.aumRange[0]}-${filters.aumRange[1]}`);
  if (filters.states.length) sp.set('states', filters.states.join(','));
  if (filters.specialties.length) sp.set('specialties', filters.specialties.join(','));

  return sp.toString();
}

/** Deserialize URL query string to search params */
export function deserializeParams(search: string): SearchParams {
  const sp = new URLSearchParams(search);

  const aumRaw = sp.get('aum');
  let aumRange: [number, number] | null = null;
  if (aumRaw) {
    const [min, max] = aumRaw.split('-').map(Number);
    if (!isNaN(min) && !isNaN(max)) aumRange = [min, max];
  }

  return {
    query: sp.get('q') || '',
    sort: (sp.get('sort') as SearchParams['sort']) || 'relevance',
    page: Math.max(1, Number(sp.get('page')) || 1),
    filters: {
      feeTypes: sp.get('fees')?.split(',').filter(Boolean) || [],
      aumRange,
      states: sp.get('states')?.split(',').filter(Boolean) || [],
      specialties: sp.get('specialties')?.split(',').filter(Boolean) || [],
    },
  };
}

/** Fetch search results from API */
export async function fetchSearch(params: SearchParams): Promise<SearchResponse> {
  const qs = serializeParams(params);
  const res = await fetch(`/api/search?${qs}`);
  if (!res.ok) throw new Error('Search request failed');
  return res.json();
}
