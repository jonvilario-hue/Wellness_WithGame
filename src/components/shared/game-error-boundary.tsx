
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  logError: (error: Error, info: ErrorInfo) => void;
  onReset: () => void;
}

interface State {
  hasError: boolean;
}

export class GameErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in game component:", error, errorInfo);
    // Log the error to our telemetry service
    this.props.logError(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="w-full max-w-lg text-center p-8 bg-destructive/10 rounded-lg border border-destructive">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-destructive-foreground">An Unexpected Error Occurred</h2>
            <p className="text-muted-foreground mt-2 mb-6">
                Sorry about that. Please restart the game to continue your session. Your progress so far has been saved.
            </p>
            <Button onClick={this.props.onReset}>
                Restart Game
            </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
