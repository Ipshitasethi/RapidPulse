import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-[#FF6B6B]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-[#A0A0B8] mb-6 leading-relaxed">
              This section ran into an unexpected error. Try refreshing the page.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-[#5A5A72] font-mono bg-black/30 rounded-lg p-3 mb-6 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-[#6C47FF] hover:bg-[#5A3BE0] text-white font-semibold text-sm rounded-xl transition-colors"
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
