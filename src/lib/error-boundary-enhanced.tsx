import React, { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class EnhancedErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Increment error count
    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));

    // Auto-reset after 30 seconds if error count is low
    if (this.state.errorCount < 3) {
      this.resetTimeout = setTimeout(() => {
        this.reset();
      }, 30000);
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#ffe0e0',
            color: '#c92a2a',
          }}
        >
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <button
            onClick={this.reset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#c92a2a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
              <summary>Error details</summary>
              {this.state.error.stack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export class ErrorRecoveryManager {
  private recoveryStrategies: Map<string, () => Promise<void>> = new Map();

  registerStrategy(errorType: string, strategy: () => Promise<void>): void {
    this.recoveryStrategies.set(errorType, strategy);
  }

  async recover(errorType: string): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(errorType);
    if (!strategy) {
      return false;
    }

    try {
      await strategy();
      return true;
    } catch {
      return false;
    }
  }

  static readonly strategies = {
    networkError: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },

    memoryError: async () => {
      if ('gc' in window) {
        (window as any).gc();
      }
    },

    renderError: async () => {
      window.location.reload();
    },
  };
}

export const errorRecoveryManager = new ErrorRecoveryManager();

export function useErrorHandler() {
  const handleError = (error: Error): void => {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  };

  return { handleError };
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
