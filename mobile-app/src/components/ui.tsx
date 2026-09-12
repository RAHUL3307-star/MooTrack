import React from "react";
import { useESP32 } from "../context/ESP32Context";
import type { RiskLevel, Tab } from "../types/index";
import { t, LANG_FLAGS } from "../i18n/index";
import { SCREEN_SPEECH } from "../i18n/speech";
import { useReadAloud } from "../i18n/useReadAloud";

// ─── AudioEqualizerBars ───────────────────────────────────────────────────────
export function AudioEqualizerBars({
  active,
  color = "#2A5C1F",
}: {
  active: boolean;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 14 }}>
      {[0.6, 1, 0.75, 0.9, 0.5].map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: color,
            height: active ? `${h * 14}px` : "4px",
            transition: "height 0.3s ease",
            animation: active
              ? `equalizerBounce ${0.4 + i * 0.1}s ease-in-out infinite alternate`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── StatusBar (Removed fake mockup time & battery) ───────────────────────────
export function StatusBar() {
  return null;
}

// ─── ESP32TopBannerNotification ───────────────────────────────────────────────
export function ESP32TopBannerNotification({
  notification,
  onDismiss,
  onInspect,
}: {
  notification: {
    id: number;
    type: "connected" | "disconnected" | "rfid_scan";
    deviceId: string;
    source?: string;
    cowId?: string;
    temp?: number;
    conductivity?: number;
    message?: string;
  } | null;
  onDismiss: () => void;
  onInspect?: () => void;
}) {
  if (!notification) return null;

  const isConnected = notification.type === "connected";

  return (
    <div
      key={notification.id}
      style={{
        position: "absolute",
        top: 42,
        left: 10,
        right: 10,
        zIndex: 9999,
        background: isConnected
          ? "linear-gradient(135deg, #0B2912 0%, #031508 100%)"
          : "linear-gradient(135deg, #221A15 0%, #120D09 100%)",
        border: `2px solid ${isConnected ? "#22C55E" : "#D97706"}`,
        borderRadius: 16,
        padding: "12px 14px",
        boxShadow: isConnected
          ? "0 14px 40px rgba(0,0,0,0.7), 0 0 24px rgba(34, 197, 94, 0.4)"
          : "0 14px 40px rgba(0,0,0,0.7), 0 0 20px rgba(217, 119, 6, 0.3)",
        animation: "slideDownPop 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        color: "#FFFFFF",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: isConnected ? "#22C55E" : "#F59E0B",
              boxShadow: isConnected ? "0 0 10px #22C55E" : "0 0 8px #F59E0B",
              animation: isConnected ? "pulseGlowRing 1.5s infinite" : "none",
            }}
          />
          <span
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 15,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
            }}
          >
            {isConnected ? "ESP32 Live Connected" : "ESP32 Disconnected"}
          </span>
          <span
            style={{
              fontSize: 9,
              background: isConnected ? "rgba(34, 197, 94, 0.2)" : "rgba(217, 119, 6, 0.2)",
              color: isConnected ? "#4ADE80" : "#FBBF24",
              border: `1px solid ${isConnected ? "rgba(34, 197, 94, 0.4)" : "rgba(217, 119, 6, 0.4)"}`,
              borderRadius: 6,
              padding: "1px 6px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {isConnected ? "115200 BAUD" : "OFFLINE"}
          </span>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "none",
            color: "#CBD5E1",
            borderRadius: "50%",
            width: 22,
            height: 22,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            lineHeight: 1,
          }}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>

      {isConnected ? (
        <>
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "#CBD5E1",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span>Device: <strong style={{ color: "#F8FAFC" }}>{notification.deviceId || "ESP32-WROOM32"}</strong></span>
            <span>·</span>
            <span>Cow: <strong style={{ color: "#FCD34D" }}>{notification.cowId || "KA-001"}</strong></span>
            <span>·</span>
            <span style={{ color: "#86EFAC" }}>
              {notification.temp || 39.4}°C · {notification.conductivity || 6.85} mS/cm
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
              paddingTop: 6,
              borderTop: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <span style={{ fontSize: 10, color: "#94A3B8" }}>⚡ Telemetry syncing to Supabase</span>
            {onInspect && (
              <button
                onClick={() => {
                  onInspect();
                  onDismiss();
                }}
                style={{
                  background: "#22C55E",
                  color: "#052E16",
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                View Telemetry →
              </button>
            )}
          </div>
        </>
      ) : (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "#D6C7B8",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>{notification.message || "Hardware stream paused · Resilient local fallback active"}</span>
        </div>
      )}
    </div>
  );
}

// ─── RiskBadge ────────────────────────────────────────────────────────────────
const RISK_COLOR: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  none: { bg: "#E6F4E3", text: "#2D7A26", border: "#B8D9B5" },
  low: { bg: "#EEF4E6", text: "#5E9E2A", border: "#C5DCA4" },
  moderate: { bg: "#FFF3E0", text: "#C47A10", border: "#F9C96B" },
  high: { bg: "#FEECEB", text: "#B83220", border: "#F4B8B3" },
};

export { RISK_COLOR };

export function RiskBadge({
  level,
  risk,
  small,
  lang = "English",
}: {
  level?: RiskLevel;
  risk?: RiskLevel;
  small?: boolean;
  lang?: string;
}) {
  const actualLevel: RiskLevel = level || risk || "none";
  const c = RISK_COLOR[actualLevel] || RISK_COLOR.none;
  const icons: Record<RiskLevel, string> = { none: "✓", low: "↗", moderate: "⚠", high: "!" };
  const label = t(`risk_${actualLevel}`, lang);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: small ? "2px 8px" : "4px 10px",
        fontSize: small ? 10 : 11,
        fontWeight: 700,
        letterSpacing: "0.03em",
      }}
    >
      <span style={{ fontSize: small ? 9 : 10 }}>{icons[actualLevel] || "✓"}</span>
      {label}
    </span>
  );
}

// ─── TrendArrow ───────────────────────────────────────────────────────────────
export function TrendArrow({ dir }: { dir: "up" | "down" | "stable" }) {
  const map = {
    up: { sym: "↑", color: "#B83220" },
    down: { sym: "↓", color: "#2D7A26" },
    stable: { sym: "→", color: "#6B7A5C" },
  };
  const { sym, color } = map[dir];
  return <span style={{ color, fontWeight: 700, fontSize: 13 }}>{sym}</span>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        border: "1px solid #E0DAD0",
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: "#9BA88C",
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────
export function BottomNav({
  active,
  onChange,
  lang,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  lang: string;
}) {
  const tabs: { id: Tab; key: string; icon: string }[] = [
    { id: "home", key: "tab_home", icon: "⌂" },
    { id: "animals", key: "tab_animals", icon: "🐄" },
    { id: "location", key: "tab_location", icon: "📍" },
    { id: "alerts", key: "tab_alerts", icon: "🔔" },
    { id: "analytics", key: "tab_analytics", icon: "📊" },
    { id: "profile", key: "tab_profile", icon: "◎" },
  ];
  return (
    <div
      style={{
        display: "flex",
        borderTop: "1px solid #E0DAD0",
        background: "#FFFFFF",
        padding: "6px 0 18px",
      }}
    >
      {tabs.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 0",
            minHeight: 44,
          }}
        >
          <span style={{ fontSize: 18, opacity: active === item.id ? 1 : 0.4 }}>{item.icon}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: active === item.id ? 700 : 500,
              color: active === item.id ? "#2A5C1F" : "#9BA88C",
              letterSpacing: "0.02em",
            }}
          >
            {t(item.key, lang)}
          </span>
          {active === item.id && (
            <div
              style={{
                width: 16,
                height: 2,
                background: "#2A5C1F",
                borderRadius: 1,
                marginTop: 1,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── BackHeader ───────────────────────────────────────────────────────────────
export function BackHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid #E0DAD0",
        background: "#FFFFFF",
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px 10px 6px 0",
          fontSize: 18,
          color: "#2A5C1F",
          minWidth: 44,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
        }}
      >
        ←
      </button>
      <span
        style={{
          flex: 1,
          fontWeight: 600,
          fontSize: 16,
          color: "#1C2714",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {title}
      </span>
      {action}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({
  data,
  color,
  width = 80,
  height = 32,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * (height - 4) - 2,
  ]);
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// ─── DonutChart ───────────────────────────────────────────────────────────────
export function DonutChart({
  high,
  moderate,
  low,
  none: noRisk,
}: {
  high: number;
  moderate: number;
  low: number;
  none: number;
}) {
  const total = high + moderate + low + noRisk;
  const segs = [
    { v: high, c: "#B83220" },
    { v: moderate, c: "#C47A10" },
    { v: low, c: "#5E9E2A" },
    { v: noRisk, c: "#2D7A26" },
  ];
  let cumulative = 0;
  const r = 30,
    cx = 36,
    cy = 36,
    stroke = 10;
  const circ = 2 * Math.PI * r;
  const paths = segs.map((s) => {
    const pct = s.v / total;
    const dash = pct * circ;
    const offset = circ - cumulative * circ;
    cumulative += pct;
    return { ...s, dash, offset };
  });
  return (
    <svg width={72} height={72}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0EDE6" strokeWidth={stroke} />
      {paths.map((p, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={p.c}
          strokeWidth={stroke}
          strokeDasharray={`${p.dash} ${circ - p.dash}`}
          strokeDashoffset={p.offset}
          style={{
            transition: "all 0.4s ease",
            transform: "rotate(-90deg)",
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />
      ))}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={13}
        fontWeight={700}
        fill="#1C2714"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 13}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={7}
        fill="#6B7A5C"
      >
        animals
      </text>
    </svg>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────
export function BarChart({
  data,
  color = "#2A5C1F",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
        >
          <div
            style={{
              width: "100%",
              background: color,
              borderRadius: "3px 3px 0 0",
              height: `${(d.value / max) * 60}px`,
              opacity: i === data.length - 1 ? 1 : 0.55,
              transition: "height 0.4s ease",
            }}
          />
          <span style={{ fontSize: 9, color: "#9BA88C", fontWeight: 500 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ReadAloudFAB ─────────────────────────────────────────────────────────────
export function ReadAloudFAB({
  screen,
  lang,
  customText,
}: {
  screen: string;
  lang: string;
  customText?: string;
}) {
  const textFn = SCREEN_SPEECH[screen] || SCREEN_SPEECH["home"];
  const text = customText || (textFn ? textFn(lang) : "");
  const { speak, speaking, activeChunk, totalChunks } = useReadAloud(text, lang);
  const flag = LANG_FLAGS[lang] || "EN";

  return (
    <button
      onClick={speak}
      title={`${t("read_aloud_title", lang)} ${lang}`}
      style={{
        position: "absolute",
        bottom: 88,
        right: 14,
        zIndex: 200,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: speaking ? "#B83220" : "#2A5C1F",
        border: `2.5px solid ${speaking ? "#FCE8E5" : "#E6F0E2"}`,
        boxShadow: speaking
          ? "0 0 0 8px rgba(184,50,32,0.22), 0 6px 20px rgba(184,50,32,0.45)"
          : "0 6px 20px rgba(42,92,31,0.4)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        transition: "all 0.25s ease",
        animation: speaking ? "pulse-dot 1.2s ease-in-out infinite" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{speaking ? "⏹" : "🔊"}</span>
        {speaking && <AudioEqualizerBars active={speaking} color="#FFFFFF" />}
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: speaking ? "#FFD6D0" : "#A8D4A0",
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        {flag} {speaking && totalChunks > 1 ? `${activeChunk}/${totalChunks}` : ""}
      </span>
    </button>
  );
}
