import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { db, collection, addDoc, serverTimestamp } from "@/lib/firebase";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  // @ts-ignore
  constructor(props: Props) {
    super(props);
    // @ts-ignore
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Log to central system
    addDoc(collection(db, "error_logs"), {
      error: error.message,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      type: 'REACT_ERROR_BOUNDARY',
      timestamp: serverTimestamp()
    }).catch(e => console.error("Failed to log error to central system:", e));
  }

  render() {
    // @ts-ignore
    const { hasError, error } = this.state;
    // @ts-ignore
    const { children } = this.props;

    if (hasError) {
      let errorMessage = "An unexpected error occurred.";
      
      try {
        const firestoreError = JSON.parse(error?.message || "");
        if (firestoreError.error?.includes("Missing or insufficient permissions")) {
          errorMessage = "You don't have permission to perform this action. Please ensure your account is vetted.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="container flex items-center justify-center min-h-[400px]">
          <Card className="glass max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full rounded-full"
              >
                Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}
