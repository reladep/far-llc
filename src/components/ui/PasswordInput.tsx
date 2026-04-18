'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  /** Show a strength indicator bar under the input (use on signup/change). */
  showStrength?: boolean;
}

export function scorePasswordStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!password) return { score: 0, label: '' };
  // Minimum enforced length. Below this, no amount of complexity earns a passing grade.
  if (password.length < 8) return { score: 0, label: 'Too short' };

  let score = 1; // starting at 1 (Weak) once they hit the min length
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score: clamped, label: labels[clamped] };
}

const STRENGTH_COLORS = ['transparent', '#D24A4A', '#E7A33A', '#2DBD74', '#1A7A4A'];

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, id, showStrength, value, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || 'password';

    const passwordString = typeof value === 'string' ? value : '';
    const strength = showStrength ? scorePasswordStrength(passwordString) : null;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            value={value}
            className={cn(
              'h-10 w-full rounded-lg border border-border bg-bg-primary px-3 pr-16 text-sm text-text-primary placeholder:text-text-tertiary transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-error focus:ring-error-400',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              fontSize: 11,
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#5A7568',
              cursor: 'pointer',
            }}
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>

        {showStrength && strength && passwordString.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 4, height: 3 }}>
              {[1, 2, 3, 4].map((tick) => (
                <div
                  key={tick}
                  style={{
                    flex: 1,
                    background:
                      tick <= strength.score ? STRENGTH_COLORS[strength.score] : '#E5EBE7',
                    transition: 'background 0.15s',
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: 11,
                color: strength.score >= 3 ? '#1A7A4A' : '#5A7568',
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                marginTop: 4,
              }}
            >
              {strength.label || '\u00A0'}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
