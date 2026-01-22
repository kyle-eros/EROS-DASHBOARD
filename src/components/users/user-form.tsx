/**
 * @file user-form.tsx
 * @description Form component for creating and editing users
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ROLE_CONFIG } from '@/lib/constants';
import type { UserRole } from '@prisma/client';

interface UserFormProps {
  defaultValues?: {
    name?: string;
    email?: string;
    role?: UserRole;
  };
  isEdit?: boolean;
  onSubmit: (data: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function UserForm({ defaultValues, isEdit = false, onSubmit }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string || undefined,
      role: formData.get('role') as UserRole,
    };

    // Client-side validation
    if (!data.name || !data.email || !data.role) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (!isEdit && (!data.password || data.password.length < 8)) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const result = await onSubmit(data);

      if (result.success) {
        toast({
          title: isEdit ? 'User Updated' : 'User Created',
          description: isEdit
            ? 'The user has been updated successfully.'
            : 'The user has been created successfully.',
        });
        router.push('/users');
        router.refresh();
      } else {
        setError(result.error || 'An error occurred');
        toast({
          title: 'Error',
          description: result.error || 'An error occurred',
          variant: 'destructive',
        });
      }
    } catch (err) {
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
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit User' : 'New User'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update user information' : 'Enter the details for the new user'}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              required
              defaultValue={defaultValues?.name}
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
              required
              defaultValue={defaultValues?.email}
              placeholder="john@example.com"
              disabled={isLoading || isEdit}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Email cannot be changed after creation
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required={!isEdit}
              placeholder={isEdit ? '(unchanged)' : 'Min 8 characters'}
              disabled={isLoading}
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue={defaultValues?.role || 'CHATTER'}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex flex-col">
                      <span>{config.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {config.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update User' : 'Create User'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/users')}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
