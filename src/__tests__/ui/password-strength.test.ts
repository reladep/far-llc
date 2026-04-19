import { describe, it, expect } from 'vitest';
import { scorePasswordStrength } from '@/components/ui/PasswordInput';

describe('scorePasswordStrength', () => {
  it('returns 0 for empty string', () => {
    const { score, label } = scorePasswordStrength('');
    expect(score).toBe(0);
    expect(label).toBe('');
  });

  it('returns 1 (weak) for 8-char lowercase-only', () => {
    const { score, label } = scorePasswordStrength('abcdefgh');
    expect(score).toBe(1);
    expect(label).toBe('Weak');
  });

  it('returns 2 (fair) for 12-char lowercase', () => {
    const { score, label } = scorePasswordStrength('abcdefghijkl');
    expect(score).toBe(2);
    expect(label).toBe('Fair');
  });

  it('returns 3 (good) for mixed case 12+ chars', () => {
    const { score, label } = scorePasswordStrength('abcdefGHijkl');
    expect(score).toBe(3);
    expect(label).toBe('Good');
  });

  it('returns 4 (strong) for mixed case + digit + symbol', () => {
    const { score, label } = scorePasswordStrength('aB3defghijkl!');
    expect(score).toBe(4);
    expect(label).toBe('Strong');
  });

  it('caps score at 4 even with very long complex passwords', () => {
    const { score } = scorePasswordStrength('aB3defghijklmnop!@#$%^&*()');
    expect(score).toBeLessThanOrEqual(4);
  });

  it('short password scores 0 regardless of complexity', () => {
    const { score, label } = scorePasswordStrength('aB1!');
    expect(score).toBe(0);
    expect(label).toBe('Too short');
  });
});
