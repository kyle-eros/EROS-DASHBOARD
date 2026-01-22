/**
 * @file profile-form.tsx
 * @description Profile update form component
 * @layer UI/Component
 * @status IMPLEMENTED
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/actions/user.actions';

interface ProfileFormProps {
  defaultValues: {
    name: string;
    email: string;
  };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;

    try {
      const result = await updateProfile(formData);

      if (result.success) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update profile',
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultValues.name}
          placeholder="Your name"
          disabled={isLoading}
        />
      </div>

      {/* Email (read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={defaultValues.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Contact an administrator to change your email address
        </p>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
