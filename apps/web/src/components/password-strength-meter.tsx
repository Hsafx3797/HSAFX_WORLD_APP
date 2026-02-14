'use client';

import { useMemo } from 'react';

/** Password complexity rules — shared between client UI and validation helpers. */
export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'maxLength', label: 'At most 128 characters', test: (p: string) => p.length <= 128 },
  { key: 'upper', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
  { key: 'special', label: 'One special character (!@#$…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

/** Returns true when ALL rules pass. */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}

/** Strength score 0-4 based on rules passed (ignoring maxLength for scoring). */
function getStrength(password: string): number {
  if (password.length === 0) return 0;
  const scoringRules = PASSWORD_RULES.filter((r) => r.key !== 'maxLength');
  const passed = scoringRules.filter((r) => r.test(password)).length;
  // Map 0-5 passed rules → 0-4 strength
  if (passed <= 1) return 0;
  if (passed <= 2) return 1;
  if (passed <= 3) return 2;
  if (passed <= 4) return 3;
  return 4;
}

const STRENGTH_CONFIG = [
  { label: 'Very Weak', color: 'bg-red-500' },
  { label: 'Weak', color: 'bg-orange-500' },
  { label: 'Fair', color: 'bg-yellow-500' },
  { label: 'Good', color: 'bg-lime-500' },
  { label: 'Strong', color: 'bg-green-500' },
] as const;

interface Props {
  password: string;
}

export function PasswordStrengthMeter({ password }: Props) {
  const results = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password],
  );

  const strength = useMemo(() => getStrength(password), [password]);
  const config = STRENGTH_CONFIG[strength]!;

  if (password.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Strength</span>
          <span className="font-medium">{config.label}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= strength - 1 ? config.color : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Rule checklist */}
      <ul className="space-y-1">
        {results
          .filter((r) => r.key !== 'maxLength') // Only show maxLength if violated
          .map((r) => (
            <li key={r.key} className="flex items-center gap-2 text-xs">
              <span className={r.passed ? 'text-green-500' : 'text-muted-foreground'}>
                {r.passed ? '✓' : '○'}
              </span>
              <span className={r.passed ? 'text-foreground' : 'text-muted-foreground'}>
                {r.label}
              </span>
            </li>
          ))}
        {/* Show maxLength error only when violated */}
        {password.length > 128 && (
          <li className="flex items-center gap-2 text-xs">
            <span className="text-red-500">✗</span>
            <span className="text-red-500">At most 128 characters</span>
          </li>
        )}
      </ul>
    </div>
  );
}
