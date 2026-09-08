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
        {isLive && lastTelemetry ? (
          <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 10, padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#86EFAC" }}>
                📡 ESP32 Live: {targetCow?.name || lastTelemetry.cowId}
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
              pH: <strong>{lastTelemetry.ph != null ? lastTelemetry.ph.toFixed(2) : "6.7"}</strong> · EC: <strong>{lastTelemetry.conductivity?.toFixed(1) ?? "5.0"} mS/cm</strong> · Temp: <strong>{lastTelemetry.temp}°C</strong>
            </div>
          </div>
        ) : null}

        {highRisk.length === 0 && modRisk.length === 0 ? (
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


export function HomeScreen({
  onNavigate,
  lang,
}: {
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const { animals, setSelectedAnimal } = useAnimals();
  const priorityAnimals = animals.filter((a) => a.risk === "high" || a.risk === "moderate").slice(0, 3);
  const counts = {
    high: animals.filter((a) => a.risk === "high").length,
    moderate: animals.filter((a) => a.risk === "moderate").length,
    low: animals.filter((a) => a.risk === "low").length,
    none: animals.filter((a) => a.risk === "none").length,
  };

  // Real milk totals from animal data
  const totalMilk = animals.reduce((sum, a) => sum + (a.milk || 0), 0);
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
  const farmLabel = [user?.farmName, user?.village, user?.state].filter(Boolean).join(" · ") || "My Dairy Farm";
  const speechText = generateLiveSituationSummary(animals, lang, isLive ? lastTelemetry : null);

  // Average milk quality from real sensor readings or live ESP32
  const phAnimals = animals.filter((a) => a.ph != null);
  const currentPh = isLive && lastTelemetry?.ph != null
    ? lastTelemetry.ph
    : phAnimals.length > 0
    ? phAnimals.reduce((s, a) => s + (a.ph ?? 0), 0) / phAnimals.length
    : 6.7;
  const currentEc = isLive && lastTelemetry?.conductivity != null
    ? lastTelemetry.conductivity
    : animals.length > 0
    ? animals.reduce((s, a) => s + (a.conductivity || 0), 0) / animals.length
    : 5.0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <ReadAloudFAB screen="home" lang={lang} customText={speechText} />
      <div style={{ background: "#2A5C1F", padding: "16px 20px 22px" }}>
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
        {counts.high > 0 && (
          <div
            onClick={() => onNavigate("alerts")}
            style={{
              background: "rgba(184,50,32,0.92)",
              borderRadius: 12,
              padding: "10px 14px",
              marginTop: 14,
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
        {/* Situation Voice Summary Card — real animal data, no hardcoded names */}
        <HomeSituationSummaryCard onNavigate={onNavigate} lang={lang} />

        {/* Visual Udder AI Scan Banner */}
        <div
          onClick={() => onNavigate("visual-ai")}
          style={{
            background: "linear-gradient(135deg, #1C2714, #2A5C1F)",
            borderRadius: 14,
            padding: "12px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(42,92,31,0.2)",
            color: "#FFFFFF",
          }}
        >
          <div style={{ fontSize: 22, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 8px" }}>📸</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {lang === "Hindi" ? "अयन फोटो एआई जांच" : lang === "Tamil" ? "மடி புகைப்பட ஏஐ ஆய்வு" : "Visual Udder AI Scan"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
              {lang === "Hindi" ? "फोटो खींचकर तुरंत बीमारी का पता लगाएं" : lang === "Tamil" ? "படத்தை பதிவேற்றி உடனே நோய் கண்டறியுங்கள்" : "Upload udder photo for instant clinical diagnosis"}
            </div>
          </div>
          <span style={{ fontSize: 14, color: "#8AE68A", fontWeight: 700 }}>→</span>
        </div>

        {/* Herd Overview */}
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

        {/* Priority Animals */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <SectionLabel>{t("priority_animals", lang)}</SectionLabel>
            <button onClick={() => onNavigate("animals")} style={{ fontSize: 11, color: "#2A5C1F", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}>
              {t("see_all", lang)}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {priorityAnimals.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelectedAnimal(a); onNavigate("animal-profile"); }}
                style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFFFFF", border: "1px solid #E0DAD0", borderRadius: 14, padding: "12px 14px", cursor: "pointer", textAlign: "left", width: "100%" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: RISK_COLOR[a.risk].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🐄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1C2714" }}>{a.name}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#9BA88C" }}>{a.id}</span>
                    <span style={{ background: "#EEF6E4", color: "#2A5C1F", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 12, border: "1px solid #C4DDA0" }}>🎂 {a.age}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7A5C" }}>
                    {a.breed} · Lac {a.lactation}
                    {a.ph != null ? ` · pH ${a.ph}` : ""} · EC {a.conductivity} mS/cm
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <RiskBadge level={a.risk} small lang={lang} />
                  <TrendArrow dir={a.trend} />
                </div>
              </button>
            ))}
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
