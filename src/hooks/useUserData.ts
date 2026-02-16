'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Firm, UserComparison, UserAlert } from '@/types';

interface UserData {
  savedFirms: Firm[];
  comparisons: UserComparison[];
  alerts: UserAlert[];
  loading: boolean;
  error: string | null;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function useUserData() {
  const [data, setData] = useState<UserData>({
    savedFirms: [],
    comparisons: [],
    alerts: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setData((d) => ({ ...d, loading: true, error: null }));
    try {
      const [savedFirms, comparisons, alerts] = await Promise.all([
        apiFetch<Firm[]>('/api/user/saved-firms'),
        apiFetch<UserComparison[]>('/api/user/comparisons'),
        apiFetch<UserAlert[]>('/api/user/alerts'),
      ]);
      setData({ savedFirms, comparisons, alerts, loading: false, error: null });
    } catch (err) {
      setData((d) => ({
        ...d,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Saved firms
  const removeSavedFirm = useCallback(async (crd: number) => {
    await apiFetch(`/api/user/saved-firms/${crd}`, { method: 'DELETE' });
    setData((d) => ({ ...d, savedFirms: d.savedFirms.filter((f) => f.crd !== crd) }));
  }, []);

  // Comparisons
  const deleteComparison = useCallback(async (id: string) => {
    await apiFetch(`/api/user/comparisons/${id}`, { method: 'DELETE' });
    setData((d) => ({ ...d, comparisons: d.comparisons.filter((c) => c.id !== id) }));
  }, []);

  const createComparison = useCallback(async (name: string, firmCrds: number[]) => {
    const comparison = await apiFetch<UserComparison>('/api/user/comparisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, firm_crds: firmCrds }),
    });
    setData((d) => ({ ...d, comparisons: [...d.comparisons, comparison] }));
    return comparison;
  }, []);

  // Alerts
  const deleteAlert = useCallback(async (id: string) => {
    await apiFetch(`/api/user/alerts/${id}`, { method: 'DELETE' });
    setData((d) => ({ ...d, alerts: d.alerts.filter((a) => a.id !== id) }));
  }, []);

  const createAlert = useCallback(async (alert: Omit<UserAlert, 'id' | 'user_id'>) => {
    const created = await apiFetch<UserAlert>('/api/user/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    setData((d) => ({ ...d, alerts: [...d.alerts, created] }));
    return created;
  }, []);

  return {
    ...data,
    refresh,
    removeSavedFirm,
    deleteComparison,
    createComparison,
    deleteAlert,
    createAlert,
  };
}
