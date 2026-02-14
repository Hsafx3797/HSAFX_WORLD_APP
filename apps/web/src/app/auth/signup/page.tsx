'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PasswordStrengthMeter, isPasswordValid } from '@/components/password-strength-meter';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      toast.error('Password does not meet all requirements');
      return;
    }
    setIsLoading(true);

    try {
      await authClient.signUp.email({
        email,
        password,
        name,
      });
      toast.success('Account created! Please check your email to verify.');
      router.push('/auth/signin');
    } catch (error) {
      toast.error('Failed to create account. Please try again.');
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'github' | 'facebook') => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: '/tools',
      });
    } catch (error) {
      toast.error(`Failed to sign in with ${provider}`);
      console.error('Social sign in error:', error);
    }
  };

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
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="you@example.com"
            />
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
            disabled={isLoading || !isPasswordValid(password)}
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
