'use client';

import { useState, useCallback, useEffect, createContext, useContext } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  undo?: () => void;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, opts?: { type?: 'success' | 'error' | 'info'; undo?: () => void; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

const CSS = `
  .toast-container {
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    z-index:9999; display:flex; flex-direction:column-reverse; gap:8px;
    pointer-events:none;
  }
  .toast-item {
    pointer-events:auto;
    display:flex; align-items:center; gap:10px;
    font-family:var(--sans,'Inter',sans-serif); font-size:13px; font-weight:500;
    padding:10px 16px; min-width:280px; max-width:440px;
    background:#0A1C2A; color:#fff; box-shadow:0 4px 20px rgba(0,0,0,.25);
    animation:toast-in .25s ease-out;
  }
  .toast-item.out { animation:toast-out .2s ease-in forwards; }
  .toast-dot {
    width:6px; height:6px; border-radius:50%; flex-shrink:0;
  }
  .toast-msg { flex:1; }
  .toast-undo {
    font-size:11px; font-weight:600; letter-spacing:.04em; text-transform:uppercase;
    background:none; border:1px solid rgba(255,255,255,.2); color:#2DBD74;
    padding:3px 10px; cursor:pointer; font-family:var(--sans); transition:all .12s;
    white-space:nowrap;
  }
  .toast-undo:hover { border-color:#2DBD74; }
  .toast-close {
    background:none; border:none; color:rgba(255,255,255,.4); cursor:pointer;
    font-size:14px; padding:0 2px; transition:color .12s;
  }
  .toast-close:hover { color:#fff; }
  @keyframes toast-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes toast-out { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(12px); } }
`;

const DOT_COLORS = {
  success: '#2DBD74',
  error: '#EF4444',
  info: '#F59E0B',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [exiting, setExiting] = useState<Set<number>>(new Set());

  const dismiss = useCallback((id: number) => {
    setExiting(prev => new Set(prev).add(id));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      setExiting(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 200);
  }, []);

  const toast = useCallback((message: string, opts?: { type?: 'success' | 'error' | 'info'; undo?: () => void; duration?: number }) => {
    const id = nextId++;
    const item: ToastItem = {
      id,
      message,
      type: opts?.type || 'success',
      undo: opts?.undo,
      duration: opts?.duration || 4000,
    };
    setToasts(prev => [...prev, item]);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const timers = toasts
      .filter(t => !exiting.has(t.id))
      .map(t => setTimeout(() => dismiss(t.id), t.duration));
    return () => timers.forEach(clearTimeout);
  }, [toasts, exiting, dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast-item${exiting.has(t.id) ? ' out' : ''}`}>
              <span className="toast-dot" style={{ background: DOT_COLORS[t.type] }} />
              <span className="toast-msg">{t.message}</span>
              {t.undo && (
                <button className="toast-undo" onClick={() => { t.undo?.(); dismiss(t.id); }}>
                  Undo
                </button>
              )}
              <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">✕</button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
