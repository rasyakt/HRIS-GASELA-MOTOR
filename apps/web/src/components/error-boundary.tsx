'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-red-900">
                    Terjadi Kesalahan
                  </h3>
                  <p className="text-xs text-red-700">
                    Aplikasi mengalami kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
                  </p>
                  {this.state.error && (
                    <details className="text-xs text-red-600 mt-2">
                      <summary className="cursor-pointer hover:underline">
                        Detail Error
                      </summary>
                      <pre className="mt-2 p-2 bg-red-100 rounded text-[10px] overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                className="w-full gap-2"
              >
                <RefreshCw className="size-4" />
                Muat Ulang Halaman
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
