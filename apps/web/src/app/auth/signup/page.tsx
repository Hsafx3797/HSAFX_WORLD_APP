'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PasswordStrengthMeter, isPasswordValid } from '@/components/password-strength-meter';
import { trpc } from '@/lib/trpc';

/** Simple email format check (mirrors HTML type="email" behavior). */
function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email validation state
  const [emailTouched, setEmailTouched] = useState(false);
  const [debouncedEmail, setDebouncedEmail] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce email for availability check (500ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (email && isValidEmailFormat(email)) {
      debounceRef.current = setTimeout(() => setDebouncedEmail(email), 500);
    } else {
      setDebouncedEmail('');
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [email]);

  // tRPC query for email availability (only fires when debouncedEmail is valid)
  const emailCheck = trpc.user.checkEmailAvailability.useQuery(
    { email: debouncedEmail },
    { enabled: !!debouncedEmail && isValidEmailFormat(debouncedEmail), retry: false },
  );

  const emailFormatValid = !email || isValidEmailFormat(email);
  const emailTaken = emailCheck.data?.available === false;
  const emailAvailable = emailCheck.data?.available === true;

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (!emailTouched) setEmailTouched(true);
  }, [emailTouched]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      toast.error('Password does not meet all requirements');
      return;
    }
    if (!isValidEmailFormat(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (emailTaken) {
      toast.error('This email is already registered');
      return;
    }
    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });
      if (result.error) {
        const msg = result.error.message ?? 'Registration failed';
        if (result.error.status === 422) {
          toast.error('Invalid input. Please check your details and try again.');
        } else if (result.error.status === 429) {
          toast.error('Too many attempts. Please wait a moment and try again.');
        } else {
          toast.error(msg);
        }
        return;
      }
      toast.success('Account created! Please check your email to verify.');
      router.push('/auth/signin');
    } catch (error) {
      toast.error('Network error. Please check your connection.');
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'github' | 'facebook') => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
      });
    } catch (error) {
      toast.error(`Failed to sign in with ${provider}`);
      console.error('Social sign in error:', error);
    }
  };

  const canSubmit = isPasswordValid(password) && isValidEmailFormat(email) && !emailTaken && !isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md p-8 space-y-6 bg-card border rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-2">Get started with HSAFX World</p>
        </div>

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => setEmailTouched(true)}
              required
              className={`w-full px-3 py-2 border rounded-md bg-background transition-colors ${
                emailTouched && email
                  ? emailTaken
                    ? 'border-destructive focus:ring-destructive'
                    : !emailFormatValid
                      ? 'border-destructive focus:ring-destructive'
                      : emailAvailable
                        ? 'border-success focus:ring-success'
                        : ''
                  : ''
              }`}
              placeholder="you@example.com"
            />
            {/* Real-time email feedback */}
            {emailTouched && email && (
              <div className="mt-1.5 text-xs">
                {!emailFormatValid && (
                  <p className="text-destructive flex items-center gap-1">
                    <span>✗</span> Please enter a valid email address
                  </p>
                )}
                {emailFormatValid && emailTaken && (
                  <p className="text-destructive flex items-center gap-1">
                    <span>✗</span> This email is already registered
                  </p>
                )}
                {emailFormatValid && emailCheck.isLoading && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <span>○</span> Checking availability...
                  </p>
                )}
                {emailFormatValid && emailAvailable && (
                  <p className="text-success flex items-center gap-1">
                    <span>✓</span> Email available
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="••••••••"
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleSocialSignIn('google')}
            className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            Google
          </button>
          <button
            onClick={() => handleSocialSignIn('github')}
            className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            GitHub
          </button>
          <button
            onClick={() => handleSocialSignIn('facebook')}
            className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            Meta
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/auth/signin" className="font-medium text-primary hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
