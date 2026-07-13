import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle, Mail, Phone, MapPin } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="w-full py-16 md:py-24 lg:py-32 bg-black text-white">
          <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              {/* Error Message */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                  <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
                    {this.props.fallbackTitle || 'Something went wrong'}
                  </h2>
                </div>
                <p className="text-base md:text-lg font-paragraph text-white/70 mb-8 leading-relaxed">
                  {this.props.fallbackMessage || 'We encountered an error loading the contact form. Please reach out to us directly using the contact information below.'}
                </p>

                {/* Direct Contact Info */}
                <div className="space-y-6">
                  {[
                    { icon: Mail, label: 'Email', value: 'hello@red2studios.com', href: 'mailto:hello@red2studios.com' },
                    { icon: Phone, label: 'Phone', value: '+1 (310) 386-0405', href: 'tel:+13103860405' },
                    { icon: MapPin, label: 'Location', value: 'Los Angeles, CA & Worldwide', href: '#' },
                  ].map((contact, i) => {
                    const Icon = contact.icon;
                    return (
                      <div key={i} className="flex gap-4">
                        <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-1">
                            {contact.label}
                          </h3>
                          <a
                            href={contact.href}
                            className="text-base font-paragraph text-white hover:text-primary transition-colors duration-300"
                          >
                            {contact.value}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-6">
                  <h3 className="text-sm font-mono uppercase tracking-widest text-red-400 mb-4">
                    Error Details (Development)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-mono text-white/60 mb-2">Message:</p>
                      <p className="text-sm font-mono text-red-300 break-words">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-xs font-mono text-white/60 mb-2">Stack:</p>
                        <pre className="text-xs font-mono text-red-300 overflow-auto max-h-48 bg-black/50 p-3 rounded">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
