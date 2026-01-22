/**
 * @file register-form.tsx
 * @description Registration form component with validation and error handling
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Name, email, password, confirm password fields
 * - Form validation with Zod
 * - Password confirmation matching
 * - Loading state during submission
 * - Error display
 * - Uses register server action
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { register } from '@/actions/auth.actions';
import { useToast } from '@/hooks/use-toast';

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    // Client-side password match check
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register(formData);

      if (result.success) {
        toast({
          title: 'Account Created',
          description: 'Your account has been created successfully.',
        });
        router.push('/dashboard');
      } else {
        setError(result.error || 'An error occurred');
        toast({
          title: 'Registration Failed',
          description: result.error || 'Please check your input',
          variant: 'destructive',
        });
      }
    } catch (err) {
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

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="John Doe"
          disabled={isLoading}
        />
      </div>

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
          autoComplete="new-password"
          required
          placeholder="********"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Minimum 8 characters
        </p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder="********"
          disabled={isLoading}
        />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
}
