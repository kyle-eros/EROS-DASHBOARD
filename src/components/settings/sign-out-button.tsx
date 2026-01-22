/**
 * @file sign-out-button.tsx
 * @description Sign out button component
 * @layer UI/Component
 * @status IMPLEMENTED
 */

'use client';

import * as React from 'react';
import { signOut } from 'next-auth/react';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function SignOutButton() {
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign Out</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? You will need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSignOut} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
