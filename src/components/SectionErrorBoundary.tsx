import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  sectionName: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.sectionName} section:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="w-full py-16 md:py-20 lg:py-24 bg-black border-t border-white/10">
          <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
            <div className="rounded-lg bg-red-950/20 border border-red-900/50 p-6">
              <h3 className="text-lg font-heading font-bold text-red-400 mb-2">
                {this.props.sectionName} Section Error
              </h3>
              <p className="text-sm text-red-300/80">
                We encountered an issue loading this section. Please refresh the page to try again.
              </p>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
