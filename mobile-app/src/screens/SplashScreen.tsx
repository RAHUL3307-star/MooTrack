import React, { useEffect } from "react";
import { StatusBar } from "../components/ui";

export function SplashScreen({ onNext }: { onNext: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onNext, 2000);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div
      style={{
        flex: 1,
        background: "#2A5C1F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}
    >
      <StatusBar light />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            background: "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 52,
          }}
        >
          🐄
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            MastiGuard
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
              letterSpacing: "0.15em",
              marginTop: 6,
            }}
          >
            AI · MASTITIS PREDICTION
          </div>
        </div>
        <div
          style={{
            marginTop: 8,
            width: 160,
            height: 2,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "#FFFFFF",
              borderRadius: 1,
              animation: "shimmer 2s ease forwards",
              width: "100%",
              transformOrigin: "left",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
            fontWeight: 500,
            marginTop: 4,
          }}
        >
          SENSE → ANALYZE → PREDICT → ACT
        </div>
      </div>
      <div style={{ padding: "0 0 48px", textAlign: "center" }}>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.08em",
          }}
        >
          Powered by ICAR-NRC · v2.4.1
        </div>
      </div>
    </div>
  );
}
