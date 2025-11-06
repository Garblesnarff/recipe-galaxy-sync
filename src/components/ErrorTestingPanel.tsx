import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  NetworkError,
  AuthError,
  ValidationError,
  NotFoundError,
  ServerError,
  TimeoutError,
  logError,
  getUserFriendlyMessage,
} from '@/lib/errors';
import { AlertCircle, Wifi, WifiOff, Clock, Shield, Search, Server, CheckCircle2 } from 'lucide-react';

/**
 * Error Testing Panel Component
 *
 * This component is for development/testing only.
 * It allows developers to test different error scenarios.
 *
 * To use:
 * 1. Import this component in a dev-only route
 * 2. Trigger different errors to see how they're handled
 * 3. Check console for error logs
 * 4. Verify toast notifications appear
 */
export function ErrorTestingPanel() {
  const [lastError, setLastError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleError = (error: Error, testName: string) => {
    // Log the error using our error utility
    logError(error, {
      component: 'ErrorTestingPanel',
      action: testName,
    });

    // Get user-friendly message
    const message = getUserFriendlyMessage(error);
    setLastError(message);
    setTestResult(`✓ ${testName} triggered successfully`);

    // Clear after 5 seconds
    setTimeout(() => {
      setLastError(null);
      setTestResult(null);
    }, 5000);
  };

  const throwNetworkError = () => {
    try {
      throw new NetworkError('Unable to connect to server');
    } catch (error) {
      handleError(error as Error, 'Network Error');
    }
  };

  const throwAuthError = () => {
    try {
      throw new AuthError('Invalid authentication token', 401);
    } catch (error) {
      handleError(error as Error, 'Auth Error');
    }
  };

  const throwValidationError = () => {
    try {
      throw new ValidationError('Form validation failed', {
        email: ['Invalid email format'],
        password: ['Password must be at least 8 characters'],
      });
    } catch (error) {
      handleError(error as Error, 'Validation Error');
    }
  };

  const throwNotFoundError = () => {
    try {
      throw new NotFoundError('Recipe not found in database');
    } catch (error) {
      handleError(error as Error, 'Not Found Error');
    }
  };

  const throwServerError = () => {
    try {
      throw new ServerError('Internal server error occurred', 500);
    } catch (error) {
      handleError(error as Error, 'Server Error');
    }
  };

  const throwTimeoutError = () => {
    try {
      throw new TimeoutError('Request exceeded 30 second timeout');
    } catch (error) {
      handleError(error as Error, 'Timeout Error');
    }
  };

  const throwComponentError = () => {
    // This will be caught by ErrorBoundary
    throw new Error('Simulated React component error');
  };

  const simulateOffline = () => {
    setTestResult('To test offline mode:');
    setLastError('1. Open DevTools → Network\n2. Select "Offline"\n3. Try loading data');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Error Handling Test Panel
          </CardTitle>
          <CardDescription>
            Test different error scenarios to verify error handling system.
            Check console for detailed logs and watch for toast notifications.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Test Results */}
          {testResult && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {testResult}
              </AlertDescription>
            </Alert>
          )}

          {/* Last Error Message */}
          {lastError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>User sees:</strong> {lastError}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={throwNetworkError}
              variant="outline"
              className="justify-start gap-2"
            >
              <WifiOff className="h-4 w-4" />
              Network Error
            </Button>

            <Button
              onClick={throwAuthError}
              variant="outline"
              className="justify-start gap-2"
            >
              <Shield className="h-4 w-4" />
              Auth Error
            </Button>

            <Button
              onClick={throwValidationError}
              variant="outline"
              className="justify-start gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Validation Error
            </Button>

            <Button
              onClick={throwNotFoundError}
              variant="outline"
              className="justify-start gap-2"
            >
              <Search className="h-4 w-4" />
              Not Found Error
            </Button>

            <Button
              onClick={throwServerError}
              variant="outline"
              className="justify-start gap-2"
            >
              <Server className="h-4 w-4" />
              Server Error
            </Button>

            <Button
              onClick={throwTimeoutError}
              variant="outline"
              className="justify-start gap-2"
            >
              <Clock className="h-4 w-4" />
              Timeout Error
            </Button>

            <Button
              onClick={throwComponentError}
              variant="destructive"
              className="justify-start gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Component Error (ErrorBoundary)
            </Button>

            <Button
              onClick={simulateOffline}
              variant="outline"
              className="justify-start gap-2"
            >
              <Wifi className="h-4 w-4" />
              Offline Mode (Manual)
            </Button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm space-y-2">
            <h3 className="font-semibold">Testing Instructions:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Click any button to trigger that error type</li>
              <li>Check the console for detailed error logs</li>
              <li>Watch for toast notifications (top-center)</li>
              <li>User-friendly message appears above</li>
              <li>Component Error will trigger ErrorBoundary</li>
              <li>Offline mode needs manual DevTools configuration</li>
            </ul>
          </div>

          {/* Expected Behaviors */}
          <div className="mt-4 p-4 border rounded-lg text-sm space-y-2">
            <h3 className="font-semibold">Expected Behaviors:</h3>
            <div className="space-y-1 text-muted-foreground">
              <p><strong>Network/Server/Timeout:</strong> Auto-retry 3x with exponential backoff</p>
              <p><strong>Auth/NotFound/Validation:</strong> No retry, show message only</p>
              <p><strong>Component Error:</strong> Caught by ErrorBoundary, shows fallback UI</p>
              <p><strong>Offline Mode:</strong> Shows banner, pauses queries, auto-resumes when online</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorTestingPanel;
