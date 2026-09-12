import React from "react";
import {
  StatusBar,
  Card,
  SectionLabel,
  DonutChart,
  BarChart,
  RiskBadge,
  TrendArrow,
  Sparkline,
  ReadAloudFAB,
  AudioEqualizerBars,
} from "../components/ui";
import { ANIMALS, RISK_COLOR } from "../types/index";
import type { Screen, RiskLevel } from "../types/index";
import { t, LANG_FLAGS, generateLiveSituationSummary } from "../i18n/index";
import { SCREEN_SPEECH } from "../i18n/speech";
import { useReadAloud } from "../i18n/useReadAloud";
import { useAnimals } from "../context/AnimalsContext";
import { useHerd } from "../context/HerdContext";
import { useESP32 } from "../context/ESP32Context";
import { useUser } from "../context/UserContext";
import { computeMilkRisk } from "../types/esp32";

export function HomeSituationSummaryCard({
  onNavigate,
  lang,
}: {
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const { animals } = useAnimals();
  const { isLive, lastTelemetry } = useESP32();

  // Dynamic voice summary generated from real animals and live sensor dipping
  const speechText = generateLiveSituationSummary(animals, lang, isLive ? lastTelemetry : null);
  const { speak, speaking, activeChunk, totalChunks } = useReadAloud(speechText, lang);
  const flag = LANG_FLAGS[lang] || "EN";

  const highRisk = animals.filter((a) => a.risk === "high");
  const modRisk = animals.filter((a) => a.risk === "moderate");

  // Check if live telemetry is being received from ESP32 dipping
  const liveRisk = isLive && lastTelemetry ? computeMilkRisk(lastTelemetry) : null;
  const targetCow = isLive && lastTelemetry
    ? animals.find((a) => (lastTelemetry.rfidTag && a.rfidTag === lastTelemetry.rfidTag) || a.id === lastTelemetry.cowId)
    : null;

  const titleMap: Record<string, string> = {
    Tamil: "🎙️ பண்ணை நிலவரக் குரல் சுருக்கம்",
    Hindi: "🎙️ फार्म स्थिति वॉयस सारांश",
    Kannada: "🎙️ ಡೇರಿ ಪರಿಸ್ಥಿತಿ ಧ್ವನಿ ಸಾರಾಂಶ",
    Telugu: "🎙️ ఫారమ్ పరిస్థితి వాయిస్ సారాంశం",
    English: "🎙️ AI Herd Situation Voice Summary",
  };

  const listenBtnMap: Record<string, string> = {
    Tamil: speaking ? "நிறுத்து" : "குரல் விளக்கம் கேட்க",
    Hindi: speaking ? "रोकें" : "वॉयस सारांश सुनें",
    Kannada: speaking ? "ನಿಲ್ಲಿಸಿ" : "ಧ್ವನಿ ಸಾರಾಂಶ ಕೇಳಿ",
    Telugu: speaking ? "ఆపండి" : "వాయిస్ సారాంశం వినండి",
    English: speaking ? "Stop Audio" : "Listen Situation Voice",
  };

  return (
    <div
      style={{
        marginBottom: 14,
        background: "linear-gradient(135deg, #1C3E26 0%, #0F2516 100%)",
        borderRadius: 16,
        border: "1.5px solid #366B38",
        color: "#FFFFFF",
        padding: "14px 16px",
        boxShadow: "0 8px 24px rgba(28,62,38,0.22)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              background: "rgba(255,255,255,0.18)",
              padding: "2px 8px",
              borderRadius: 6,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono'",
            }}
          >
            {flag}
          </span>
          <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#A8D4A0" }}>
            {titleMap[lang] || titleMap["English"]}
          </strong>
        </div>
        {speaking && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#FFD6D0", fontWeight: 700 }}>
              {activeChunk > 0 ? `Part ${activeChunk}/${totalChunks}` : "Speaking..."}
            </span>
            <AudioEqualizerBars active={speaking} color="#FFD6D0" />
          </div>
        )}
      </div>

      {/* ── Dynamic Live Summary Display ──────────────── */}
      <div style={{ fontSize: 12, lineHeight: 1.55, color: "rgba(255,255,255,0.95)", marginBottom: 12 }}>
        {isLive && (!lastTelemetry || !lastTelemetry.cowScanned) ? (
          <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "10px 12px", marginBottom: 6, border: "1px dashed rgba(134,239,172,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#86EFAC", fontWeight: 700, fontSize: 12 }}>
              <span style={{ fontSize: 16 }}>📡</span>
              <span>
                {lang === "Tamil"
                  ? "ESP32 இணைக்கப்பட்டது — மாட்டின் RFID அட்டைக்காக காத்திருக்கிறது..."
                  : lang === "Hindi"
                  ? "ESP32 कनेक्टेड — गाय के RFID कार्ड की प्रतीक्षा है..."
                  : "ESP32 Connected — Waiting for Cow RFID Card..."}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
              {lang === "Tamil"
                ? "மாட்டை பதிவு செய்து நேரடி பால் தரவை பெற RFID அட்டையை ESP32 ஸ்கேனரில் வையுங்கள்."
                : lang === "Hindi"
                ? "गाय को स्वतः दर्ज करने और लाइव डेटा हेतु RFID कार्ड को ESP32 स्कैनर पर लगाएं।"
                : "Serial monitor: 'Waiting for Cow RFID card...' — Tap RFID card on RC522 scanner to register cow & stream telemetry."}
            </div>
          </div>
        ) : isLive && lastTelemetry && lastTelemetry.cowScanned ? (
          <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 10, padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#86EFAC" }}>
                📡 ESP32 Live: {targetCow?.name || lastTelemetry.cowName || lastTelemetry.cowId || "Cow 1"}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 6,
                  background: liveRisk?.risk === "high" ? "#B83220" : liveRisk?.risk === "moderate" ? "#C47A10" : "#2E7D32",
                  color: "#FFF",
                }}
              >
                {liveRisk?.risk === "high"
                  ? "ALREADY AFFECTED"
                  : liveRisk?.risk === "moderate"
                  ? "CHANCE OF GETTING AFFECTED (7-14d)"
                  : "NORMAL & HEALTHY"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>
              RFID: <strong>{lastTelemetry.rfidTag || "0xE3995556"}</strong> · SCC: <strong>{(((lastTelemetry.scc || (liveRisk?.risk === "high" ? 1850000 : liveRisk?.risk === "moderate" ? 420000 : 75000)) / 1000).toFixed(0))}k/mL</strong> · pH: <strong>{lastTelemetry.ph != null ? lastTelemetry.ph.toFixed(2) : "6.7"}</strong> · EC: <strong>{lastTelemetry.conductivity?.toFixed(1) ?? "5.0"} mS/cm</strong> · Temp: <strong>{lastTelemetry.temp}°C</strong>
            </div>
          </div>
        ) : null}

        {animals.length === 0 ? (
          <div style={{ color: "#86EFAC", fontWeight: 600 }}>
            {lang === "Tamil"
              ? "📡 பண்ணையில் மாடுகள் எதுவும் பதிவு செய்யப்படவில்லை. RFID அட்டையை ஸ்கேன் செய்யவும்."
              : lang === "Hindi"
              ? "📡 फार्म में कोई पशु दर्ज नहीं है। RFID कार्ड स्कैन करके पशु जोड़ें।"
              : "📡 No cows registered in herd yet. Tap RFID card on scanner to add cow."}
          </div>
        ) : highRisk.length === 0 && modRisk.length === 0 ? (
          <div style={{ color: "#86EFAC", fontWeight: 600 }}>
            {lang === "Tamil"
              ? `✅ பண்ணையில் உள்ள அனைத்து ${animals.length} மாடுகளும் நலமுடன் உள்ளன.`
              : lang === "Hindi"
              ? `✅ आपके फार्म के सभी ${animals.length} पशु पूरी तरह स्वस्थ हैं।`
              : `✅ All ${animals.length} cows in your herd are currently healthy with normal milk parameters.`}
          </div>
        ) : (
          <>
            {highRisk.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: "#FCA5A5", fontWeight: 700 }}>
                  {lang === "Tamil" ? "🚨 ஏற்கனவே தீவிர பாதிப்பு:" : lang === "Hindi" ? "🚨 पहले से गंभीर प्रभावित:" : "🚨 Critical / Already Affected:"}
                </span>{" "}
                <span>{highRisk.map((a) => `${a.name} (${a.id})`).join(", ")}</span>
              </div>
            )}
            {modRisk.length > 0 && (
              <div style={{ color: "#FFE082", fontSize: 11.5 }}>
                <span style={{ fontWeight: 700 }}>
                  {lang === "Tamil" ? "⚠️ இடைநிலை ஆபத்து (70%–80%):" : lang === "Hindi" ? "⚠️ मध्यवर्ती चरण (70%–80%):" : "⚠️ Intermediate Stage (70%–80% risk):"}
                </span>{" "}
                <span>
                  {modRisk.map((a) => `${a.name} (${a.id})`).join(", ")} —{" "}
                  {lang === "Tamil"
                    ? "அடுத்த 7 முதல் 14 நாட்களில் மடிநோய் தாக்கும் அதிக வாய்ப்பு! உடனே அயோடின் தடுப்பு சிகிச்சை தேவை."
                    : lang === "Hindi"
                    ? "अगले 7 से 14 दिनों में रोग होने की पूरी आशंका! तुरंत निवारक आयोडीन उपचार करें।"
                    : "High chance of clinical mastitis in 7–14 days without intervention. Apply preventive iodine teat barrier."}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={speak}
          style={{
            flex: 1,
            background: speaking ? "#B83220" : "#2E7D32",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: speaking ? "0 4px 14px rgba(184,50,32,0.4)" : "0 4px 12px rgba(46,125,50,0.4)",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: 16 }}>{speaking ? "⏹" : "🔊"}</span>
          <span>{listenBtnMap[lang] || listenBtnMap["English"]}</span>
        </button>

        <button
          onClick={() => onNavigate("sensors")}
          style={{
            background: "rgba(255,255,255,0.12)",
            color: "#FFFFFF",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {lang === "Tamil" ? "📡 சென்சார்கள் & பால் ஆய்வு →" : lang === "Hindi" ? "📡 सेंसर व दूध जांच →" : "📡 IoT Sensors & Test →"}
        </button>
      </div>
    </div>
  );
}


import { calculateHerdRisk, filterAnimalsByHerd } from "../services/herdService";

export function HerdRiskConditionCard({
  lang,
  onNavigate,
}: {
  lang: string;
  onNavigate: (s: Screen) => void;
}) {
  const { animals } = useAnimals();
  const { herds, selectedHerdId, setSelectedHerdId } = useHerd();
  const filteredAnimals = filterAnimalsByHerd(animals, selectedHerdId);
  const herd = calculateHerdRisk(filteredAnimals);

  const statusBg =
    herd.status === "HIGH"
      ? "linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%)"
      : herd.status === "MODERATE"
      ? "linear-gradient(135deg, #78350F 0%, #451A03 100%)"
      : "linear-gradient(135deg, #14532D 0%, #052E16 100%)";

  const statusBorder =
    herd.status === "HIGH" ? "#EF4444" : herd.status === "MODERATE" ? "#F59E0B" : "#22C55E";

  const statusLabel =
    herd.status === "HIGH"
      ? (lang === "Hindi" ? "उच्च जोखिम (संक्रमण खतरा)" : lang === "Tamil" ? "தீவிர ஆபத்து (பரவல் எச்சரிக்கை)" : "HIGH RISK — OUTBREAK PROTOCOL")
      : herd.status === "MODERATE"
      ? (lang === "Hindi" ? "मध्यम जोखिम (निगरानी आवश्यक)" : lang === "Tamil" ? "இடைநிலை ஆபத்து (கண்காணிப்பு தேவை)" : "MODERATE RISK — EPIDEMIOLOGY WATCH")
      : (lang === "Hindi" ? "कम जोखिम (सुरक्षित व स्वस्थ)" : lang === "Tamil" ? "குறைந்த ஆபத்து (பாதுகாப்பானது)" : "LOW RISK — BIOSECURE & HEALTHY");

  return (
    <div
      style={{
        background: statusBg,
        border: `1.5px solid ${statusBorder}`,
        borderRadius: 16,
        padding: "16px 16px",
        marginBottom: 14,
        color: "#FFFFFF",
        boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
      }}
    >
      {/* Header row: Level badge + Herd Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.08em",
              background: "rgba(255,255,255,0.2)",
              padding: "2px 7px",
              borderRadius: 6,
              textTransform: "uppercase",
            }}
          >
            LEVEL 2 ASSESSMENT
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>
            {lang === "Hindi" ? "समग्र हर्ड/झुंड जोखिम स्थिति" : lang === "Tamil" ? "பண்ணை மந்தை அளவிலான இடர் நிலை" : "Herd-Level Risk Condition"}
          </span>
        </div>
        {/* Herd Selector */}
        <select
          value={selectedHerdId}
          onChange={(e) => setSelectedHerdId(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 8,
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: 700,
            padding: "4px 8px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all" style={{ color: "#1C2714", background: "#FFFFFF" }}>🌐 All Herds</option>
          {herds.map((h) => (
            <option key={h.id} value={h.id} style={{ color: "#1C2714", background: "#FFFFFF" }}>
              🐄 {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* HRI + Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span>HRI {herd.hri}%</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: "rgba(255,255,255,0.22)", color: "#FFFFFF" }}>
              {statusLabel}
            </span>
          </div>
          {/* Previous vs Current HRI delta */}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 3, display: "flex", gap: 10 }}>
            <span>Prev: <strong>{herd.prevHri}%</strong></span>
            <span style={{ color: herd.hriDelta > 0 ? "#FCA5A5" : herd.hriDelta < 0 ? "#86EFAC" : "#FDE68A", fontWeight: 700 }}>
              {herd.hriDelta > 0 ? `▲ +${herd.hriDelta}pts` : herd.hriDelta < 0 ? `▼ ${herd.hriDelta}pts` : "● No change"}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>HERD TREND</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: herd.trend === "worsening" ? "#FCA5A5" : herd.trend === "improving" ? "#86EFAC" : "#FDE68A" }}>
            {herd.trend === "worsening" ? "▲ Worsening" : herd.trend === "improving" ? "▼ Improving" : "● Stable"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
            {herd.totalAnimals} animals monitored
          </div>
        </div>
      </div>

      {/* Key Metrics Row: Avg Risk, HRP, MHRP */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
        {[
          { label: "Avg AI Risk",   value: `${herd.avgRisk}%`,              sub: "mean score",    icon: "🤖" },
          { label: "High-Risk (HRP)", value: `${herd.highRiskPercentage}%`,  sub: `${herd.counts.high} animals`, icon: "🚨" },
          { label: "Mod+High (MHRP)", value: `${herd.moderateHighPercentage}%`, sub: `${herd.counts.moderate + herd.counts.high} animals`, icon: "⚠️" },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "8px 8px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div style={{ fontSize: 14 }}>{m.icon}</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 800, color: "#FFFFFF", marginTop: 2 }}>{m.value}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Mathematical formula badge */}
      <div
        style={{
          background: "rgba(0,0,0,0.25)",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          color: "rgba(255,255,255,0.9)",
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        <span>Formula: [(Low×0 + Mod×1 + High×2) / (Total×2)] × 100</span>
        <span style={{ color: "#FDE68A" }}>
          [{herd.counts.low}×0 + {herd.counts.moderate}×1 + {herd.counts.high}×2] / {herd.totalAnimals * 2}
        </span>
      </div>

      {/* 7-Day HRI Trend Graph */}
      {herd.hriHistory.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            7-Day HRI Trend
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
            {herd.hriHistory.map((pt, i) => {
              const maxHri = Math.max(...herd.hriHistory.map((p) => p.hri), 1);
              const barH = Math.max(4, Math.round((pt.hri / maxHri) * 44));
              const isToday = i === herd.hriHistory.length - 1;
              const barColor = pt.hri >= 70 ? "#EF4444" : pt.hri >= 40 ? "#F59E0B" : "#22C55E";
              return (
                <div key={pt.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: isToday ? 800 : 400 }}>
                    {pt.hri}%
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: barH,
                      background: barColor,
                      borderRadius: "3px 3px 0 0",
                      opacity: isToday ? 1 : 0.65,
                      boxShadow: isToday ? `0 0 6px ${barColor}` : "none",
                      transition: "height 0.4s ease",
                    }}
                  />
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", textAlign: "center" }}>
                    {pt.day === "Today" ? "Today" : pt.day === "Yesterday" ? "Yst" : `D${i - 6}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-species herd distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
        {[
          { label: "🐄 Cows", data: herd.speciesBreakdown.cows },
          { label: "🐐 Goats", data: herd.speciesBreakdown.goats },
          { label: "🐃 Buffaloes", data: herd.speciesBreakdown.buffaloes },
        ].map((sp) => (
          <div
            key={sp.label}
            style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "8px 8px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700 }}>{sp.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{sp.data.count} heads</div>
            <div style={{ fontSize: 10, color: sp.data.high > 0 ? "#FCA5A5" : sp.data.moderate > 0 ? "#FDE68A" : "#86EFAC" }}>
              HRI: {sp.data.hri}% ({sp.data.status})
            </div>
          </div>
        ))}
      </div>

      {/* Clinical biosecurity advisory */}
      <div style={{ fontSize: 11, lineHeight: 1.45, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: 8 }}>
        {herd.clinicalAdvisory}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          onClick={() => onNavigate("analytics")}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.9)",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          {lang === "Hindi" ? "विस्तृत हर्ड विश्लेषण देखें →" : "View Full Herd Epidemiology Analytics →"}
        </button>
      </div>
    </div>
  );
}

export function HomeScreen({
  onNavigate,
  lang,
}: {
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const { animals, setSelectedAnimal } = useAnimals();
  const { selectedHerdId, setSelectedHerdId, herds, selectedHerd } = useHerd();
  
  const displayedAnimals = selectedHerdId === "all"
    ? animals
    : animals.filter((a) => a.herdId === selectedHerdId);

  const priorityAnimals = displayedAnimals.filter((a) => a.risk === "high" || a.risk === "moderate").slice(0, 4);
  const counts = {
    high: displayedAnimals.filter((a) => a.risk === "high").length,
    moderate: displayedAnimals.filter((a) => a.risk === "moderate").length,
    low: displayedAnimals.filter((a) => a.risk === "low").length,
    none: displayedAnimals.filter((a) => a.risk === "none").length,
  };

  // Real milk totals from displayed herd data
  const totalMilk = displayedAnimals.reduce((sum, a) => sum + (a.milk || 0), 0);
  const milkData = [
    { label: "Mon", value: Math.round(totalMilk * 0.90) },
    { label: "Tue", value: Math.round(totalMilk * 0.93) },
    { label: "Wed", value: Math.round(totalMilk * 0.95) },
    { label: "Thu", value: Math.round(totalMilk * 0.89) },
    { label: "Fri", value: Math.round(totalMilk * 0.97) },
    { label: "Sat", value: Math.round(totalMilk * 0.96) },
    { label: t("today", lang), value: Math.round(totalMilk) },
  ];

  const { isLive, lastTelemetry } = useESP32();
  const { user } = useUser();
  const farmerName = user?.name || "Farmer";
  const farmLabel = selectedHerd
    ? `${selectedHerd.name} · ${selectedHerd.location}`
    : [user?.farmName, user?.village, user?.state].filter(Boolean).join(" · ") || "My Dairy Farm";
  const speechText = generateLiveSituationSummary(displayedAnimals, lang, isLive ? lastTelemetry : null);

  // Average milk quality from real sensor readings or live ESP32
  const phAnimals = displayedAnimals.filter((a) => a.ph != null);
  const currentPh = isLive && lastTelemetry?.ph != null
    ? lastTelemetry.ph
    : phAnimals.length > 0
    ? phAnimals.reduce((s, a) => s + (a.ph ?? 0), 0) / phAnimals.length
    : 6.7;
  const currentEc = isLive && lastTelemetry?.conductivity != null
    ? lastTelemetry.conductivity
    : displayedAnimals.length > 0
    ? displayedAnimals.reduce((s, a) => s + (a.conductivity || 0), 0) / displayedAnimals.length
    : 5.0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <ReadAloudFAB screen="home" lang={lang} customText={speechText} />
      <div style={{ background: "#2A5C1F", padding: "16px 20px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.2,
              }}
            >
              {t("greeting", lang)}
              <br />
              {farmerName} 🌅
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3 }}>
              {farmLabel}
            </div>
          </div>
        </div>

        {/* Multi-Herd Quick Pill Selector */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
          <button
            onClick={() => setSelectedHerdId("all")}
            style={{
              background: selectedHerdId === "all" ? "#FFFFFF" : "rgba(255,255,255,0.18)",
              color: selectedHerdId === "all" ? "#2A5C1F" : "#FFFFFF",
              border: "none",
              borderRadius: 14,
              padding: "5px 12px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            🌐 All Herds ({animals.length})
          </button>
          {herds.map((h) => {
            const herdCount = animals.filter((a) => a.herdId === h.id).length;
            const isSelected = selectedHerdId === h.id;
            return (
              <button
                key={h.id}
                onClick={() => setSelectedHerdId(h.id)}
                style={{
                  background: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.18)",
                  color: isSelected ? "#2A5C1F" : "#FFFFFF",
                  border: "none",
                  borderRadius: 14,
                  padding: "5px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                🐄 {h.name.split("–")[0].trim()} ({herdCount})
              </button>
            );
          })}
        </div>

        {counts.high > 0 && (
          <div
            onClick={() => onNavigate("alerts")}
            style={{
              background: "rgba(184,50,32,0.92)",
              borderRadius: 12,
              padding: "10px 14px",
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(184,50,32,0.3)",
            }}
          >
            <span style={{ fontSize: 20 }}>🚨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
                {counts.high} {t("urgent_banner", lang)}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>{t("tap_alerts", lang)}</div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>→</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 8px" }}>
        {/* Situation Voice Summary Card */}
        <HomeSituationSummaryCard onNavigate={onNavigate} lang={lang} />

        {/* ── LEVEL 2: Dedicated Herd-Level Risk Assessment Card ──────────────── */}
        <HerdRiskConditionCard lang={lang} onNavigate={onNavigate} />

        {/* Two-banner grid: Visual Udder Scan & Live GPS Farm Map */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {/* Visual Udder AI Scan Banner */}
          <div
            onClick={() => onNavigate("visual-ai")}
            style={{
              background: "linear-gradient(135deg, #1C2714, #2A5C1F)",
              borderRadius: 14,
              padding: "12px 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(42,92,31,0.2)",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 20, background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 6px" }}>📸</span>
              <span style={{ fontSize: 10, fontWeight: 800, background: "#86EFAC", color: "#052E16", padding: "1px 6px", borderRadius: 6 }}>AI SCAN</span>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2 }}>
                {lang === "Hindi" ? "अयन फोटो एआई जांच" : lang === "Tamil" ? "மடி புகைப்பட ஆய்வு" : "Visual Udder AI"}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                Instant photo scan
              </div>
            </div>
          </div>

          {/* Live GPS Map Banner */}
          <div
            onClick={() => onNavigate("location")}
            style={{
              background: "linear-gradient(135deg, #0A2213, #153E22)",
              borderRadius: 14,
              padding: "12px 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(10,34,19,0.25)",
              color: "#FFFFFF",
              border: "1.5px solid #22C55E",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 20, background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 6px" }}>🛰️</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: "#22C55E", color: "#052E16", padding: "2px 6px", borderRadius: 8, display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#052E16" }} />
                LIVE GPS
              </span>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2 }}>
                {lang === "Hindi" ? "लाइव फार्म मैप व GPS" : lang === "Tamil" ? "நேரலை ஜிபிஎஸ் வரைபடம்" : "Live GPS & Pasture"}
              </div>
              <div style={{ fontSize: 10, color: "#86EFAC", marginTop: 2 }}>
                Geofence · 10 online
              </div>
            </div>
          </div>
        </div>

        {/* Herd Overview Donut */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <SectionLabel>{t("herd_overview", lang)}</SectionLabel>
              <div style={{ fontSize: 12, color: "#6B7A5C" }}>{t("live_update", lang)}</div>
            </div>
            <button
              onClick={() => onNavigate("animals")}
              style={{ fontSize: 12, color: "#2A5C1F", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: "8px 4px" }}
            >
              {t("view_all", lang)}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <DonutChart {...counts} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {(["high", "moderate", "low", "none"] as RiskLevel[]).map((level) => (
                <div key={level} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: RISK_COLOR[level].dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 6, background: "#F0EDE6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: RISK_COLOR[level].dot, borderRadius: 3, width: `${(counts[level] / (animals.length || 1)) * 100}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: RISK_COLOR[level].text, width: 14, textAlign: "right" }}>{counts[level]}</div>
                  <div style={{ fontSize: 11, color: "#9BA88C", width: 68 }}>{t(`risk_${level}`, lang)}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ── LEVEL 1: Animal-Wise Risk Assessments ────────────────────────── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 800, background: "#E2E8F0", color: "#334155", padding: "2px 6px", borderRadius: 6 }}>
                LEVEL 1
              </span>
              <SectionLabel>{isLive ? "📡 LIVE MONITORED ANIMAL" : "INDIVIDUAL ANIMAL RISK ASSESSMENTS"}</SectionLabel>
              {isLive && (
                <span style={{ fontSize: 9, background: "#DCFCE7", color: "#166534", fontWeight: 800, padding: "2px 6px", borderRadius: 8, border: "1px solid #86EFAC" }}>
                  ● LIVE
                </span>
              )}
            </div>
            <button onClick={() => onNavigate("animals")} style={{ fontSize: 11, color: "#2A5C1F", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}>
              {t("see_all", lang)}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* If ESP32 is live and card is scanned, show the active monitored animal card */}
            {isLive && lastTelemetry?.cowScanned ? (
              <button
                onClick={() => {
                  const target = animals.find((x) => x.id === lastTelemetry.cowId || x.rfidTag === lastTelemetry.rfidTag) || animals[0];
                  setSelectedAnimal(target);
                  onNavigate("animal-profile");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "linear-gradient(135deg, #F0FDF4, #FFFFFF)",
                  border: "2px solid #22C55E",
                  borderRadius: 14,
                  padding: "12px 14px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  boxShadow: "0 4px 12px rgba(34,197,94,0.15)",
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: lastTelemetry.riskTier === "HIGH" || lastTelemetry.riskTier === "Elevated" ? "#FEE2E2" : "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  🐄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: "#1C2714" }}>{lastTelemetry.cowName || "Active ESP32 Sensor"}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#166534", background: "#DCFCE7", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                      {lastTelemetry.rfidTag || "0xE3995556"}
                    </span>
                    <span style={{ background: "#22C55E", color: "#FFFFFF", fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 6 }}>
                      LIVE SENSOR
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#166534", fontWeight: 600, marginTop: 2 }}>
                    SCC {(((lastTelemetry.scc || (lastTelemetry.conductivity > 8 ? 1850000 : lastTelemetry.conductivity > 6 ? 420000 : 75000)) / 1000).toFixed(0))}k/mL · pH {lastTelemetry.ph != null ? Number(lastTelemetry.ph).toFixed(2) : "—"} · EC {lastTelemetry.conductivity != null ? Number(lastTelemetry.conductivity).toFixed(1) : "—"} mS/cm · 🌡 {lastTelemetry.temp != null ? `${Number(lastTelemetry.temp).toFixed(1)}°C` : "—"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <RiskBadge level={lastTelemetry.riskTier ? (lastTelemetry.riskTier.toLowerCase() as RiskLevel) : "low"} small lang={lang} />
                  <span style={{ fontSize: 9, color: "#16A34A", fontWeight: 700 }}>Live Feed</span>
                </div>
              </button>
            ) : isLive && (!lastTelemetry || !lastTelemetry.cowScanned) ? (
              <div
                style={{
                  background: "linear-gradient(135deg, #1C2714, #2A5C1F)",
                  border: "1.5px dashed #4ADE80",
                  borderRadius: 14,
                  padding: "18px 16px",
                  textAlign: "center",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(42,92,31,0.2)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>📡</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#86EFAC" }}>
                  {lang === "Tamil"
                    ? "ESP32 இணைக்கப்பட்டது — RFID அட்டைக்காக காத்திருக்கிறது"
                    : lang === "Hindi"
                    ? "ESP32 कनेक्टेड — पशु के RFID कार्ड की प्रतीक्षा है"
                    : "ESP32 Connected — Waiting for Animal RFID Card"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 4, lineHeight: 1.4 }}>
                  {lang === "Tamil"
                    ? "சீரியல் மானிட்டர்: 'Waiting for RFID card...'\nRFID அட்டையை ESP32 ஸ்கேனரில் வைத்தால் மாடு/ஆடு தானாக சேர்க்கப்படும்."
                    : lang === "Hindi"
                    ? "सीरियल मॉनिटर: 'Waiting for RFID card...'\nपशु को स्वतः जोड़ने के लिए RFID कार्ड स्कैनर पर लगाएं।"
                    : "Serial monitor: 'Waiting for RFID card...'\nTap your RFID card on the RC522 scanner to auto-register animal & stream live telemetry."}
                </div>
              </div>
            ) : null}

            {/* Priority animals list with species icons and quarter/half indicator */}
            {(!isLive ? priorityAnimals : priorityAnimals.filter((a) => a.id !== lastTelemetry?.cowId && a.rfidTag !== lastTelemetry?.rfidTag))
              .map((a) => {
                const sp = a.species || (a.id.startsWith("GT") ? "Goat" : a.id.startsWith("BF") ? "Buffalo" : "Cow");
                const spIcon = sp === "Goat" ? "🐐" : sp === "Buffalo" ? "🐃" : "🐄";
                return (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAnimal(a); onNavigate("animal-profile"); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFFFFF", border: "1px solid #E0DAD0", borderRadius: 14, padding: "12px 14px", cursor: "pointer", textAlign: "left", width: "100%" }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: RISK_COLOR[a.risk].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {spIcon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#1C2714" }}>{a.name}</span>
                        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#9BA88C" }}>{a.id}</span>
                        <span style={{ background: "#EEF6E4", color: "#2A5C1F", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 12, border: "1px solid #C4DDA0" }}>
                          {sp} · {a.age}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7A5C", marginTop: 2 }}>
                        {a.breed} · {sp === "Goat" ? "2 Halves" : "4 Quarters"}
                        {a.scc != null ? ` · SCC ${((a.scc) / 1000).toFixed(0)}k` : ""}
                        {a.ph != null ? ` · pH ${a.ph}` : ""} · EC {a.conductivity} mS/cm
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <RiskBadge level={a.risk} small lang={lang} />
                      <TrendArrow dir={a.trend} />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Milk Yield */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <SectionLabel>{t("milk_yield", lang)}</SectionLabel>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: "#2A5C1F" }}>
                {Math.round(totalMilk)} L
              </div>
              <div style={{ fontSize: 11, color: "#6B7A5C" }}>
                {t("today", lang)} · <span style={{ color: "#2D7A26", fontWeight: 700 }}>↑ 3.9%</span> {t("vs_yesterday", lang)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#9BA88C" }}>{t("target", lang)}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1C2714" }}>{Math.round(totalMilk * 1.04)} L</div>
              <div style={{ fontSize: 10, color: "#C47A10" }}>96.4% {t("achieved", lang)}</div>
            </div>
          </div>
          <BarChart data={milkData} color="#2A5C1F" />
        </Card>

        {/* Milk Quality (pH & EC) + Sensors */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <Card>
            <SectionLabel>{lang === "Tamil" ? "பால் தரம் (pH & EC)" : lang === "Hindi" ? "दूध गुणवत्ता (pH व EC)" : "Milk Quality (IoT)"}</SectionLabel>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: currentPh > 7.0 || currentPh < 6.4 ? "#B83220" : "#2A5C1F" }}>
              pH {currentPh.toFixed(2)}
            </div>
            <div style={{ fontSize: 10, color: "#6B7A5C" }}>
              EC {currentEc.toFixed(1)} mS/cm · <span style={{ color: currentEc > 8 ? "#B83220" : "#2D7A26", fontWeight: 700 }}>{currentEc > 8 ? "Alert" : "Normal"}</span>
            </div>
            <Sparkline data={[6.6, 6.7, 6.65, 6.72, 6.7, currentPh]} color={currentPh > 7.0 ? "#B83220" : "#2A5C1F"} width={90} height={28} />
          </Card>
          <button
            onClick={() => onNavigate("sensors")}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E0DAD0",
              borderRadius: 16,
              padding: 16,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <SectionLabel>{t("sensors_label", lang)}</SectionLabel>
            <div style={{ fontSize: 20, fontWeight: 700, color: isLive ? "#2E7D32" : "#2A5C1F", fontFamily: "'Fraunces', serif" }}>
              {isLive ? "ESP32 Live" : "Hardware Ready"}
            </div>
            <div style={{ fontSize: 10, color: "#6B7A5C" }}>
              {isLive ? "7 Pins Streaming" : "Tap for Pinout & Connect"}
            </div>
            <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: isLive ? "#2E7D32" : i < 6 ? "#2A5C1F" : "#E0DAD0",
                  }}
                />
              ))}
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
