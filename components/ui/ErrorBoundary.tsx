"use client";

import React from "react";
import { FONT_MONO } from "@/lib/constants";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: 16,
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: "#888",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ marginBottom: 4 }}>Something went wrong</div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                background: "none",
                border: "1px solid #444",
                borderRadius: 4,
                color: "#888",
                fontFamily: FONT_MONO,
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
            >
              retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
