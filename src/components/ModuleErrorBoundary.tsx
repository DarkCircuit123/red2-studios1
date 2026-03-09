/**
 * Global Error Boundary for Lazy-Loaded Components
 * Gracefully handles module loading failures with retry capability
 */

import React, { ReactNode, ReactElement } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class ModuleErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[ModuleErrorBoundary] Error in ${this.props.moduleName || 'module'}:`,
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[400px] flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-8">
          <div className="max-w-md text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
              Module Loading Error
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {this.props.moduleName && `Failed to load ${this.props.moduleName}. `}
              We encountered an issue loading this content. Please try again.
            </p>
            <details className="mb-6 text-left bg-white rounded p-3 border border-red-100">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </details>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Loading
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Go Home
              </button>
            </div>
            {this.state.retryCount > 0 && (
              <p className="text-xs text-gray-500 mt-4">
                Retry attempts: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModuleErrorBoundary;
