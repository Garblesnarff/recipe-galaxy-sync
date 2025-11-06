import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logError, getUserFriendlyMessage, categorizeError, ErrorCategory } from '@/lib/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCategory: ErrorCategory | null;
  showTechnicalDetails: boolean;
}

/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCategory: null,
      showTechnicalDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorCategory: categorizeError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console and monitoring service
    logError(error, {
      component: 'ErrorBoundary',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCategory: null,
      showTechnicalDetails: false,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = (): void => {
    window.location.href = '/dashboard';
  };

  toggleTechnicalDetails = (): void => {
    this.setState((prevState) => ({
      showTechnicalDetails: !prevState.showTechnicalDetails,
    }));
  };

  getErrorTitle(): string {
    const { errorCategory } = this.state;
    switch (errorCategory) {
      case ErrorCategory.NETWORK:
        return 'Connection Problem';
      case ErrorCategory.AUTH:
        return 'Authentication Error';
      case ErrorCategory.NOT_FOUND:
        return 'Not Found';
      case ErrorCategory.TIMEOUT:
        return 'Request Timeout';
      case ErrorCategory.SERVER:
        return 'Server Error';
      default:
        return 'Something Went Wrong';
    }
  }

  getErrorIcon(): ReactNode {
    return <AlertTriangle className="h-12 w-12 text-destructive" />;
  }

  render(): ReactNode {
    const { hasError, error, errorInfo, showTechnicalDetails } = this.state;
    const { children, fallback, showDetails = import.meta.env.DEV } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const userMessage = getUserFriendlyMessage(error);
      const errorTitle = this.getErrorTitle();

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">{this.getErrorIcon()}</div>
              <CardTitle className="text-2xl">{errorTitle}</CardTitle>
              <CardDescription className="text-base">{userMessage}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Technical details (dev mode only or when showDetails is true) */}
              {showDetails && error && (
                <div className="mt-6 space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.toggleTechnicalDetails}
                    className="w-full justify-between"
                  >
                    <span className="text-sm font-medium">Technical Details</span>
                    {showTechnicalDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {showTechnicalDetails && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>
                        <div className="space-y-3">
                          {/* Error message */}
                          <div>
                            <p className="font-semibold text-sm mb-1">Error Message:</p>
                            <code className="text-xs bg-black/10 p-2 rounded block overflow-x-auto">
                              {error.message}
                            </code>
                          </div>

                          {/* Error stack */}
                          {error.stack && (
                            <div>
                              <p className="font-semibold text-sm mb-1">Stack Trace:</p>
                              <pre className="text-xs bg-black/10 p-2 rounded overflow-x-auto max-h-40">
                                {error.stack}
                              </pre>
                            </div>
                          )}

                          {/* Component stack */}
                          {errorInfo?.componentStack && (
                            <div>
                              <p className="font-semibold text-sm mb-1">Component Stack:</p>
                              <pre className="text-xs bg-black/10 p-2 rounded overflow-x-auto max-h-40">
                                {errorInfo.componentStack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Help text */}
              <div className="text-center text-sm text-muted-foreground mt-6">
                <p>If this problem persists, please contact support.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook-based Error Boundary wrapper for functional components
 */
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps): ReactNode {
  const userMessage = getUserFriendlyMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle>Something Went Wrong</CardTitle>
          <CardDescription>{userMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={resetError} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          {import.meta.env.DEV && (
            <Alert variant="destructive">
              <AlertDescription>
                <code className="text-xs">{error.message}</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorBoundary;
