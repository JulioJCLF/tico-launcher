import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tico UI Crash Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#0d0e12] text-white flex flex-col items-center justify-center p-8 z-50 select-none">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Erro ao renderizar a interface</h1>
          <p className="text-zinc-400 text-sm max-w-md text-center mb-6">
            Ocorreu uma falha inesperada durante a inicialização dos componentes visuais do Tico.
          </p>
          <div className="max-w-xl w-full p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-red-300 break-words mb-6 overflow-auto max-h-48">
            {this.state.error?.message || 'Erro desconhecido'}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 cursor-pointer transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recarregar Aplicativo</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
