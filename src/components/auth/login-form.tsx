/**
 * @file login-form.tsx
 * @description Login form component with validation and error handling
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Email and password fields
 * - Form validation with Zod
 * - Loading state during submission
 * - Error display
 * - Uses login server action
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/actions/auth.actions';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await login(formData);

      if (result && !result.success) {
        setError(result.error || 'An error occurred');
        toast({
          title: 'Login Failed',
          description: result.error || 'Please check your credentials',
          variant: 'destructive',
        });
      }
      // If successful, the server action will redirect
    } catch (err) {
      // The redirect from server action throws an error, which is expected
      // Check if it's a redirect error
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        return; // This is the successful redirect
      }
      setError('An unexpected error occurred');
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          disabled={isLoading}
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="********"
          disabled={isLoading}
        />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  );
}
