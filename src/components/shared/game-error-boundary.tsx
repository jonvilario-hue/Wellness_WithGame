'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import type { TelemetryEvent, ErrorEventPayload } from '@/lib/telemetry-events';

interface Props {
  children: ReactNode;
  logEvent: (event: TelemetryEvent) => void;
  onReset: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GameErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in game component:", error, errorInfo);
    
    // Log the error using the standardized telemetry system
    const errorPayload: ErrorEventPayload = {
        error: error.toString(),
        stack: errorInfo.componentStack,
        gameId: 'unknown', // This should be enriched by the parent component
        trialIndex: -1, // Indicates an error outside a specific trial
    };
    
    this.props.logEvent({
        type: 'error',
        payload: errorPayload,
    });
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="w-full max-w-lg text-center p-8 bg-destructive/10 rounded-lg border border-destructive">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-destructive-foreground">An Unexpected Error Occurred</h2>
            <p className="text-muted-foreground mt-2 mb-6">
                Sorry about that. Please restart the game to continue your session. Your progress so far has been saved.
            </p>
            <Button onClick={this.props.onReset}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Restart Game
            </Button>
             {process.env.NODE_ENV === 'development' && (
                <pre className="mt-8 p-4 bg-slate-900 text-red-400 text-xs rounded w-full max-w-lg overflow-auto text-left">
                    {this.state.error?.toString()}
                </pre>
             )}
        </div>
      );
    }

    return this.props.children;
  }
}
