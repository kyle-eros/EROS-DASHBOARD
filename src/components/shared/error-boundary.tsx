/**
 * @file error-boundary.tsx
 * @description React error boundary component
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Catches rendering errors
 * - Shows fallback UI
 * - Option to retry
 * - Error logging
 */

'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onReset?: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle>Something went wrong</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try again or contact support if the
          problem persists.
        </p>
        {error && process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 p-4 bg-muted rounded-md text-xs text-left overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
      </CardContent>
      {onReset && (
        <CardFooter className="justify-center">
          <Button onClick={onReset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
