/**
 * @file page.tsx
 * @description User settings page for profile and password management
 * @layer UI
 * @status IMPLEMENTED
 *
 * Server Component that renders profile settings and password change forms.
 * All authenticated users can access their own settings.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProfileForm } from '@/components/settings/profile-form';
import { PasswordForm } from '@/components/settings/password-form';
import { SignOutButton } from '@/components/settings/sign-out-button';
import { getInitials } from '@/lib/utils';
import { ROLE_CONFIG } from '@/lib/constants';
import type { UserRole } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account settings',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user;
  const roleConfig = ROLE_CONFIG[user.role as UserRole];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {/* {user.image && (
                <AvatarImage src={user.image} alt={user.name || ''} />
              )} */}
              <AvatarFallback className="text-lg">
                {getInitials(user.name || user.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{user.name || 'No name set'}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="mt-1">
                {roleConfig?.label || user.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>Change your display name</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultValues={{
              name: user.name || '',
              email: user.email || '',
            }}
          />
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">
                Sign out of your account on this device
              </p>
            </div>
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
