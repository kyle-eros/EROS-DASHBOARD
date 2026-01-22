/**
 * @file password-form.tsx
 * @description Password change form component
 * @layer UI/Component
 * @status IMPLEMENTED
 */

'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { changePassword } from '@/actions/auth.actions';

export function PasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Client-side validation
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await changePassword(formData);

      if (result.success) {
        toast({
          title: 'Password Changed',
          description: 'Your password has been changed successfully.',
        });
        formRef.current?.reset();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to change password',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Current Password */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          placeholder="Enter your current password"
          disabled={isLoading}
        />
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          placeholder="Enter new password"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Minimum 8 characters
        </p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          placeholder="Confirm new password"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Password
      </Button>
    </form>
  );
}
