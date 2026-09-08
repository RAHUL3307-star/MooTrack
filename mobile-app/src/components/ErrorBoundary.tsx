import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#F7F4EE",
            fontFamily: "'Outfit', system-ui, sans-serif",
            color: "#1C2714",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
            }}
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#B83220",
              marginBottom: "8px",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#6B7A5C",
              maxWidth: "400px",
              marginBottom: "20px",
              lineHeight: 1.5,
            }}
          >
            {this.state.error?.message || "An unexpected error occurred in the application."}
          </p>

          {this.state.error?.stack && (
            <pre
              style={{
                background: "#FFFFFF",
                border: "1px solid #E0DAD0",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "11px",
                textAlign: "left",
                maxWidth: "90%",
                maxHeight: "180px",
                overflow: "auto",
                color: "#6B7A5C",
                marginBottom: "20px",
              }}
            >
              {this.state.error.stack}
            </pre>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#2A5C1F",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
            <button
              onClick={this.handleReset}
              style={{
                background: "#FFFFFF",
                color: "#B83220",
                border: "1px solid #B83220",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear Cache & Reset
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
