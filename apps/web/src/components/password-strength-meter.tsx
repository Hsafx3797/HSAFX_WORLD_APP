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

/** Estimate crack time based on character pool size and password length.
 *  Assumes 10 billion guesses/second (modern GPU cluster). */
function estimateCrackTime(password: string): string {
  if (password.length === 0) return '';

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/\d/.test(password)) poolSize += 10;
  if (/[^A-Za-z0-9]/.test(password)) poolSize += 33;
  if (poolSize === 0) poolSize = 26; // fallback

  // Entropy in bits
  const entropy = password.length * Math.log2(poolSize);
  // Guesses = 2^entropy / 2 (average case)
  const guesses = Math.pow(2, entropy) / 2;
  // 10 billion guesses per second (realistic GPU cluster)
  const seconds = guesses / 1e10;

  if (seconds < 0.001) return 'Instantly';
  if (seconds < 1) return 'Less than a second';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 86400 * 30) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 86400 * 365) return `${Math.round(seconds / (86400 * 30))} months`;
  const years = seconds / (86400 * 365);
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1000)}k years`;
  if (years < 1e9) return `${Math.round(years / 1e6)}M years`;
  if (years < 1e12) return `${Math.round(years / 1e9)}B years`;
  return `${Math.round(years / 1e12)}T+ years`;
}

const STRENGTH_CONFIG = [
  { label: 'Very Weak', color: 'bg-destructive' },
  { label: 'Weak', color: 'bg-warning' },
  { label: 'Fair', color: 'bg-warning' },
  { label: 'Good', color: 'bg-info' },
  { label: 'Strong', color: 'bg-success' },
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
  const crackTime = useMemo(() => estimateCrackTime(password), [password]);
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

      {/* Crack time estimate */}
      {crackTime && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Time to crack</span>
          <span className={`font-medium ${strength >= 3 ? 'text-success' : strength >= 2 ? 'text-warning' : 'text-destructive'}`}>
            {crackTime}
          </span>
        </div>
      )}

      {/* Rule checklist */}
      <ul className="space-y-1">
        {results
          .filter((r) => r.key !== 'maxLength') // Only show maxLength if violated
          .map((r) => (
            <li key={r.key} className="flex items-center gap-2 text-xs">
              <span className={r.passed ? 'text-success' : 'text-muted-foreground'}>
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
            <span className="text-destructive">✗</span>
            <span className="text-destructive">At most 128 characters</span>
          </li>
        )}
      </ul>
    </div>
  );
}
