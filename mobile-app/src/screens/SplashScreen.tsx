import React, { useEffect } from "react";

export function SplashScreen({ onNext }: { onNext: () => void }) {
  useEffect(() => {
    // 1.2 second splash display for snappy experience
    const timer = setTimeout(onNext, 1200);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div
      style={{
        flex: 1,
        background: "linear-gradient(180deg, #1C4414 0%, #2A5C1F 60%, #1A3E12 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "48px 24px 36px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74, 222, 128, 0.18) 0%, rgba(42, 92, 31, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, zIndex: 1 }}>
        {/* Official MooTracker Vector Logo */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 32,
            background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            boxShadow: "0 16px 36px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
            boxSizing: "border-box",
          }}
        >
          <svg viewBox="0 0 160 160" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* WiFi / Telemetry Waves above cow */}
            <path
              d="M56 36C70 24 90 24 104 36"
              stroke="#4ADE80"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d="M66 48C74 40 86 40 94 48"
              stroke="#4ADE80"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.95"
            />
            <circle cx="80" cy="58" r="3" fill="#4ADE80" />

            {/* Stylized Cow Head Silhouette */}
            {/* Horns */}
            <path
              d="M50 78C46 66 38 60 30 62C34 72 44 80 50 82"
              fill="#FFFFFF"
              opacity="0.95"
            />
            <path
              d="M110 78C114 66 122 60 130 62C126 72 116 80 110 82"
              fill="#FFFFFF"
              opacity="0.95"
            />

            {/* Ears */}
            <path
              d="M48 88C34 88 24 96 22 102C32 105 44 98 48 92"
              fill="#FFFFFF"
              opacity="0.9"
            />
            <path
              d="M112 88C126 88 136 96 138 102C128 105 116 98 112 92"
              fill="#FFFFFF"
              opacity="0.9"
            />

            {/* Head Contour */}
            <path
              d="M54 78C62 74 98 74 106 78C108 86 104 98 102 110C98 126 92 136 80 138C68 136 62 126 58 110C56 98 52 86 54 78Z"
              fill="#FFFFFF"
            />

            {/* Muzzle */}
            <path
              d="M62 116C68 112 92 112 98 116C96 128 90 136 80 137C70 136 64 128 62 116Z"
              fill="#E8F5E9"
              opacity="0.8"
            />
            {/* Nostrils */}
            <ellipse cx="72" cy="126" rx="2.5" ry="3" fill="#2A5C1F" />
            <ellipse cx="88" cy="126" rx="2.5" ry="3" fill="#2A5C1F" />

            {/* ECG Pulse Heartbeat Line */}
            <path
              d="M20 144L56 144L64 136L72 154L80 128L88 156L96 140L104 144L140 144"
              stroke="#22C55E"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Brand Name & Subtitle */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 34,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            MooTracker
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#A7F3D0",
              fontWeight: 700,
              letterSpacing: "0.18em",
              marginTop: 6,
              textTransform: "uppercase",
            }}
          >
            AI · Smart Cattle Health
          </div>
        </div>

        {/* Shimmer progress bar */}
        <div
          style={{
            marginTop: 6,
            width: 140,
            height: 3,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #4ADE80, #FFFFFF)",
              borderRadius: 2,
              animation: "shimmer 1.2s ease forwards",
              width: "100%",
              transformOrigin: "left",
            }}
          />
        </div>
      </div>

      {/* Footer Tagline */}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.1em",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          Sense · Analyze · Predict · Prevent
        </div>
      </div>
    </div>
  );
}
