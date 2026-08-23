import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Admin UI Error Caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-sm max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6 text-sm">
              An unexpected error occurred in the Admin Dashboard. The system has prevented the crash from affecting the entire application.
            </p>
            
            {this.state.error && (
              <div className="bg-slate-100 p-4 rounded-xl text-left overflow-x-auto mb-6 border border-slate-200">
                <p className="text-xs font-mono text-red-600 font-semibold mb-1">
                  {this.state.error.toString()}
                </p>
                <p className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap leading-relaxed">
                  {this.state.errorInfo?.componentStack}
                </p>
              </div>
            )}
            
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition"
            >
              <RefreshCw size={16} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
