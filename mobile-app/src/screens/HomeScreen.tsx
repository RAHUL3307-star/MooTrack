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
import { t, LANG_FLAGS } from "../i18n/index";
import { SCREEN_SPEECH } from "../i18n/speech";
import { useReadAloud } from "../i18n/useReadAloud";

export function HomeSituationSummaryCard({
  onNavigate,
  lang,
}: {
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const speechText = (SCREEN_SPEECH["ml-lab"] || SCREEN_SPEECH["home"])(lang);
  const { speak, speaking, activeChunk, totalChunks } = useReadAloud(speechText, lang);
  const flag = LANG_FLAGS[lang] || "EN";

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

      <div style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.92)", marginBottom: 12 }}>
        {lang === "Tamil" ? (
          <>
            <div>🚨 <strong>கங்கா (KA-001)</strong> & <strong>பெட்வா (KA-052)</strong> மாடுகளுக்கு தீவிர மடிநோய் அபாயம் <strong>96%</strong>.</div>
            <div style={{ marginTop: 4, color: "#FFE082", fontSize: 11.5 }}>
              ⚠️ <strong>இடைநிலை கட்டம் (70%–80%):</strong> காவேரி & சரஸ்வதி மாடுகளுக்கு அடுத்த <strong>7 முதல் 14 நாட்களில்</strong> மடிநோய் தாக்கும் அதிக வாய்ப்புள்ளது என AI எச்சரிக்கிறது. உடனடி தடுப்பு சிகிச்சை தேவை!
            </div>
          </>
        ) : lang === "Hindi" ? (
          <>
            <div>🚨 <strong>गंगा (KA-001)</strong> व <strong>बेतवा (KA-052)</strong> में गंभीर थनैला का <strong>96%</strong> खतरा।</div>
            <div style={{ marginTop: 4, color: "#FFE082", fontSize: 11.5 }}>
              ⚠️ <strong>मध्यवर्ती चरण (70%–80%):</strong> कावेरी और सरस्वती में अगले <strong>7 से 14 दिनों में</strong> रोग होने की पूरी आशंका है। तुरंत निवारक आयोडीन उपचार शुरू करें!
            </div>
          </>
        ) : lang === "Kannada" ? (
          <>
            <div>🚨 <strong>ಗಂಗಾ (KA-001)</strong> ಮತ್ತು <strong>ಬೆಟ್ವಾ (KA-052)</strong> ಹಸುಗಳಿಗೆ ಕೆಚ್ಚಲುಬಾವು ಅಪಾಯ <strong>96%</strong>.</div>
            <div style={{ marginTop: 4, color: "#FFE082", fontSize: 11.5 }}>
              ⚠️ <strong>ಮಧ್ಯಂತರ ಹಂತ (70%–80%):</strong> ಕಾವೇರಿ ಮತ್ತು ಸರಸ್ವತಿ ಹಸುಗಳಿಗೆ ಮುಂದಿನ <strong>7 ರಿಂದ 14 ದಿನಗಳಲ್ಲಿ</strong> ರೋಗ ಬರುವ ಹೆಚ್ಚಿನ ಸಾಧ್ಯತೆಯಿದೆ ಎಂದು AI ಎಚ್ಚರಿಸಿದೆ.
            </div>
          </>
        ) : lang === "Telugu" ? (
          <>
            <div>🚨 <strong>గంగ (KA-001)</strong> మరియు <strong>బెత్వా (KA-052)</strong> ఆవులకు తీవ్ర పొదుగువాపు ముప్పు <strong>96%</strong>.</div>
            <div style={{ marginTop: 4, color: "#FFE082", fontSize: 11.5 }}>
              ⚠️ <strong>మధ్యస్థ దశ (70%–80%):</strong> కావేరి మరియు సరస్వతి ఆవులకు రాబోయే <strong>7 నుండి 14 రోజులలో</strong> వ్యాధి సోకే అవకాశం ఎక్కువగా ఉందని AI హెచ్చరిస్తోంది.
            </div>
          </>
        ) : lang === "Marathi" ? (
          <>
            <div>🚨 <strong>गंगा (KA-001)</strong> व <strong>बेतवा (KA-052)</strong> मध्ये <strong>96%</strong> तीव्र मस्टायटिस धोका.</div>
            <div style={{ marginTop: 4, color: "#FFE082", fontSize: 11.5 }}>
              ⚠️ <strong>मध्यम टप्पा (70%–80%):</strong> कावेरी आणि सरस्वती गाईंना पुढील <strong>7 ते 14 दिवसांत</strong> रोग होण्याची दाट शक्यता आहे. तातडीने प्रतिबंधक उपाय करा!
            </div>
          </>
        ) : lang === "Gujarati" ? (
          <>
            <div>🚨 <strong>ગંગા (KA-001)</strong> અને <strong>બetva (KA-052)</strong> માં <strong>96%</strong> ગંભીર મસ્ટાઇટિસ જોખમ.</div>
            <div style={{ marginTop: 4, color: "#FFE082", fontSize: 11.5 }}>
              ⚠️ <strong>મધ્યવર્તી તબક્કો (70%–80%):</strong> કાવેરી અને સરસ્વતીમાં આગામી <strong>7 થી 14 દિવસમાં</strong> રોગ થવાની પૂરી શક્યતા છે. તાત્કાલિક સાવચેતી રાખો!
            </div>
          </>
        ) : lang === "Punjabi" ? (
          <>
            <div>🚨 <strong>ਗੰਗਾ (KA-001)</strong> ਅਤੇ <strong>ਬੇਤਵਾ (KA-052)</strong> ਵਿੱਚ <strong>96%</strong> ਗੰਭੀਰ ਥਣੇਲਾ ਖ਼ਤਰਾ।</div>
            <div style={{ marginTop: 4, color: "#FFE082", fontSize: 11.5 }}>
              ⚠️ <strong>ਦਰਮਿਆਨਾ ਪੜਾਅ (70%–80%):</strong> ਕਾਵੇਰੀ ਅਤੇ ਸਰਸਵਤੀ ਵਿੱਚ ਅਗਲੇ <strong>7 ਤੋਂ 14 ਦਿਨਾਂ ਵਿੱਚ</strong> ਰੋਗ ਲੱਗਣ ਦੀ ਪੂਰੀ ਸੰਭਾਵਨਾ ਹੈ।
            </div>
          </>
        ) : (
          <>
            <div>🚨 <strong>Ganga (KA-001)</strong> & <strong>Betwa (KA-052)</strong> at critical <strong>96%</strong> mastitis risk.</div>
            <div style={{ marginTop: 4, color: "#FFE082", fontSize: 11.5 }}>
              ⚠️ <strong>Intermediate Stage (70%–80%):</strong> Kaveri & Saraswati face high chance of disease onset within <strong>7 to 14 days</strong> without preventive intervention.
            </div>
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
          onClick={() => onNavigate("ml-lab")}
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
          {lang === "Tamil" ? "🔬 ஆய்வகம் & சிகிச்சை →" : lang === "Hindi" ? "🔬 उपचार लैब →" : "🔬 AI Lab & Protocols →"}
        </button>
      </div>
    </div>
  );
}

import { useAnimals } from "../context/AnimalsContext";

export function HomeScreen({
  onNavigate,
  lang,
}: {
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const { animals } = useAnimals();
  const priorityAnimals = animals.filter((a) => a.risk === "high" || a.risk === "moderate").slice(0, 3);
  const counts = {
    high: animals.filter((a) => a.risk === "high").length,
    moderate: animals.filter((a) => a.risk === "moderate").length,
    low: animals.filter((a) => a.risk === "low").length,
    none: animals.filter((a) => a.risk === "none").length,
  };
  const milkData = [
    { label: "Mon", value: 382 },
    { label: "Tue", value: 395 },
    { label: "Wed", value: 401 },
    { label: "Thu", value: 378 },
    { label: "Fri", value: 412 },
    { label: "Sat", value: 408 },
    { label: t("today", lang), value: 424 },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <ReadAloudFAB screen="home" lang={lang} />
      <div style={{ background: "#2A5C1F", padding: "12px 20px 22px" }}>
        <StatusBar light />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 }}>
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
              {t("farmer_name", lang)}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3 }}>
              {t("farm_sub", lang)}
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: "8px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>7 Sep 2026</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{t("today", lang)}</div>
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
        {/* Situation Voice Summary Card */}
        <HomeSituationSummaryCard onNavigate={onNavigate} lang={lang} />

        {/* Herd Overview */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <SectionLabel>{t("herd_overview", lang)}</SectionLabel>
              <div style={{ fontSize: 12, color: "#6B7A5C" }}>{t("live_update", lang)}</div>
            </div>
            <button
              onClick={() => onNavigate("animals")}
              style={{
                fontSize: 12,
                color: "#2A5C1F",
                fontWeight: 700,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 4px",
              }}
            >
              {t("view_all", lang)}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <DonutChart {...counts} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { level: "high" as RiskLevel, count: counts.high },
                { level: "moderate" as RiskLevel, count: counts.moderate },
                { level: "low" as RiskLevel, count: counts.low },
                { level: "none" as RiskLevel, count: counts.none },
              ].map((item) => (
                <div key={item.level} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: RISK_COLOR[item.level].dot,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, height: 6, background: "#F0EDE6", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: RISK_COLOR[item.level].dot,
                        borderRadius: 3,
                        width: `${(item.count / (animals.length || 1)) * 100}%`,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: RISK_COLOR[item.level].text,
                      width: 14,
                      textAlign: "right",
                    }}
                  >
                    {item.count}
                  </div>
                  <div style={{ fontSize: 11, color: "#9BA88C", width: 68 }}>{t(`risk_${item.level}`, lang)}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Priority Animals */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <SectionLabel>{t("priority_animals", lang)}</SectionLabel>
            <button
              onClick={() => onNavigate("animals")}
              style={{
                fontSize: 11,
                color: "#2A5C1F",
                fontWeight: 700,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 0",
              }}
            >
              {t("see_all", lang)}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {priorityAnimals.map((a) => (
              <button
                key={a.id}
                onClick={() => onNavigate("animal-profile")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#FFFFFF",
                  border: "1px solid #E0DAD0",
                  borderRadius: 14,
                  padding: "12px 14px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: RISK_COLOR[a.risk].bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  🐄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1C2714" }}>{a.name}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#9BA88C" }}>{a.id}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7A5C" }}>
                    {a.breed} · Lac {a.lactation} · SCC {a.scc}k
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <SectionLabel>{t("milk_yield", lang)}</SectionLabel>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: "#2A5C1F" }}>
                424 L
              </div>
              <div style={{ fontSize: 11, color: "#6B7A5C" }}>
                {t("today", lang)} ·{" "}
                <span style={{ color: "#2D7A26", fontWeight: 700 }}>↑ 3.9%</span> {t("vs_yesterday", lang)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#9BA88C" }}>{t("target", lang)}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1C2714" }}>440 L</div>
              <div style={{ fontSize: 10, color: "#C47A10" }}>96.4% {t("achieved", lang)}</div>
            </div>
          </div>
          <BarChart data={milkData} color="#2A5C1F" />
        </Card>

        {/* SCC + Sensors */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <Card>
            <SectionLabel>{t("avg_scc", lang)}</SectionLabel>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#C47A10" }}>
              248k
            </div>
            <div style={{ fontSize: 10, color: "#6B7A5C" }}>
              {t("cells_ml", lang)} · <span style={{ color: "#B83220" }}>↑ 12%</span>
            </div>
            <Sparkline data={[180, 195, 210, 225, 238, 248]} color="#C47A10" width={90} height={28} />
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
            <div style={{ fontSize: 22, fontWeight: 700, color: "#2A5C1F", fontFamily: "'Fraunces', serif" }}>
              42/48
            </div>
            <div style={{ fontSize: 10, color: "#6B7A5C" }}>
              {t("online", lang)} · <span style={{ color: "#B83220" }}>6 {t("offline", lang)}</span>
            </div>
            <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: i < 7 ? "#2A5C1F" : "#E0DAD0",
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
