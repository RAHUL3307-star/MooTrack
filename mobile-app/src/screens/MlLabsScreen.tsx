import React, { useState } from "react";
import {
  StatusBar,
  BackHeader,
  Card,
  SectionLabel,
  AudioEqualizerBars,
  ReadAloudFAB,
} from "../components/ui";
import { t, LANG_FLAGS, sendWhatsAppAlert, generateLiveSituationSummary } from "../i18n/index";
import { SCREEN_SPEECH } from "../i18n/speech";
import { useReadAloud } from "../i18n/useReadAloud";
import { useAnimals } from "../context/AnimalsContext";
import { useESP32 } from "../context/ESP32Context";

export function MLLabScreen({
  onBack,
  lang,
}: {
  onBack: () => void;
  lang: string;
}) {
  const { animals } = useAnimals();
  const { isLive, lastTelemetry } = useESP32();
  const [selectedPreset, setSelectedPreset] = useState("KA-001");
  const [showTranscript, setShowTranscript] = useState(false);

  const presets = [
    {
      id: "KA-001",
      name: "Cow 1",
      badge: "High Risk (96%)",
      color: "#B83220",
      weight: "10.2 kg",
      temp: "40.4°C",
      ec: "12.85",
      qdr: "1.82",
      pH: "7.28",
      rum: "295 min",
      status: "Critical Clinical Onset (1-2 Days)",
    },
    {
      id: "KA-052",
      name: "Cow 8",
      badge: "High Risk (94%)",
      color: "#B83220",
      weight: "8.4 kg",
      temp: "40.1°C",
      ec: "11.72",
      qdr: "1.74",
      pH: "7.18",
      rum: "320 min",
      status: "Acute Signs Imminent (2-3 Days)",
    },
    {
      id: "KA-007",
      name: "Cow 2",
      badge: "Moderate (68%)",
      color: "#C47A10",
      weight: "14.8 kg",
      temp: "39.2°C",
      ec: "7.32",
      qdr: "1.34",
      pH: "6.92",
      rum: "410 min",
      status: "Subclinical Early Window (7-10 Days)",
    },
    {
      id: "KA-014",
      name: "Cow 3",
      badge: "Low Risk (28%)",
      color: "#5E9E2A",
      weight: "9.6 kg",
      temp: "38.8°C",
      ec: "5.48",
      qdr: "1.18",
      pH: "6.72",
      rum: "445 min",
      status: "Early Watch (11-14 Days)",
    },
    {
      id: "KA-022",
      name: "Cow 5",
      badge: "Healthy (2%)",
      color: "#2D7A26",
      weight: "19.2 kg",
      temp: "38.5°C",
      ec: "4.82",
      qdr: "1.06",
      pH: "6.60",
      rum: "485 min",
      status: "Normal Baseline (0 Days)",
    },
  ];

  const curr = presets.find((p) => p.id === selectedPreset) || presets[0];

  const speechText = generateLiveSituationSummary(animals, lang, isLive ? lastTelemetry : null);
  const { speak, speaking, activeChunk, totalChunks } = useReadAloud(speechText, lang);
  const flag = LANG_FLAGS[lang] || "EN";

  const voiceBtnLabel: Record<string, string> = {
    Tamil: speaking ? "⏹ குரலை நிறுத்து" : "🎙️ முழு பண்ணை நிலவரக் குரல் சுருக்கம் கேட்க",
    Hindi: speaking ? "⏹ वॉयस रोकें" : "🎙️ संपूर्ण फार्म स्थिति वॉयस सारांश सुनें",
    Kannada: speaking ? "⏹ ನಿಲ್ಲಿಸಿ" : "🎙️ ಸಮಗ್ರ ಡೇರಿ ಪರಿಸ್ಥಿತಿ ಧ್ವನಿ ಸಾರಾಂಶ ಕೇಳಿ",
    Telugu: speaking ? "⏹ ఆపండి" : "🎙️ పూర్తి ఫారమ్ పరిస్థితి వాయిస్ సారాంశం వినండి",
    English: speaking ? "⏹ Stop Voice Summary" : "🎙️ Listen Full Situation Voice Summary",
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="ml-lab" lang={lang} />
      <div style={{ background: "#FFFFFF" }}>
        <BackHeader
          title={
            lang === "Tamil"
              ? "AI கணிப்பு & சிகிச்சை ஆய்வகம்"
              : lang === "Hindi"
              ? "AI प्रेडिक्शन व उपचार लैब"
              : "AI Predictive Lab & Treatment"
          }
          onBack={onBack}
        />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        {/* Hardware Sensing Subtitle */}
        <div
          style={{
            background: "#E6F0E2",
            border: "1px solid #C4DDA0",
            borderRadius: 10,
            padding: "6px 10px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 13 }}>📡</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#2A5C1F", fontFamily: "'Outfit', sans-serif" }}>
            Real-Time IoT Milk Analysis (pH · EC · Temp · Weight)
          </span>
        </div>

        {/* Dedicated Voice Situation Summary Player */}
        <div
          style={{
            background: "linear-gradient(135deg, #1C3E26 0%, #0D2013 100%)",
            borderRadius: 16,
            padding: "14px 16px",
            color: "#FFFFFF",
            marginBottom: 14,
            border: "1.5px solid #2D6B30",
            boxShadow: "0 8px 24px rgba(28,62,38,0.22)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ background: "rgba(255,255,255,0.18)", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                {flag}
              </span>
              <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#A8D4A0" }}>
                {lang === "Tamil" ? "குரல் வழி நிலைமை விளக்கம்" : lang === "Hindi" ? "वॉयस स्थिति विवरण" : "AI Situation Voice Summary"}
              </strong>
            </div>
            {speaking && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#FFD6D0", fontWeight: 700 }}>
                  {totalChunks > 1 ? `Part ${activeChunk}/${totalChunks}` : "Playing..."}
                </span>
                <AudioEqualizerBars active={speaking} color="#FFD6D0" />
              </div>
            )}
          </div>

          <p style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.9)", margin: "0 0 10px" }}>
            {lang === "Tamil"
              ? "Cow 1 மற்றும் Cow 8 மாடுகளுக்கு தீவிர மடிநோய் அபாயம். 12.4 mS/cm பால் மின்கடத்துதிறன், 40.4°C காய்ச்சல். உடனடி சிகிச்சை நெறிமுறைகள் & மருத்துவ எச்சரிக்கை."
              : lang === "Hindi"
              ? "Cow 1 और Cow 8 में थनैला का गंभीर 96% जोखिम। 12.4 mS/cm दूध चालकता, 40.4°C बुखार। उपचार दिशानिर्देश व आपातकालीन अलर्ट।"
              : "Cow 1 & Cow 8 at critical 96% mastitis risk. 12.4 mS/cm milk EC, 40.4°C hyperthermia. Immediate treatment protocol & veterinary dispatch."}
          </p>

          <button
            onClick={speak}
            style={{
              width: "100%",
              background: speaking ? "#B83220" : "#2E7D32",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: speaking ? "0 4px 14px rgba(184,50,32,0.4)" : "0 4px 14px rgba(46,125,50,0.4)",
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 16 }}>{speaking ? "⏹" : "🔊"}</span>
            <span>{voiceBtnLabel[lang] || voiceBtnLabel["English"]}</span>
          </button>

          {/* Transcript accordion button */}
          <button
            onClick={() => setShowTranscript((s) => !s)}
            style={{
              background: "none",
              border: "none",
              color: "#A8D4A0",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 10,
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{showTranscript ? "▲" : "▼"}</span>
            <span>{showTranscript ? "Hide Transcript" : `📜 View Spoken Transcript in ${lang}`}</span>
          </button>

          {showTranscript && (
            <div
              style={{
                marginTop: 8,
                background: "rgba(0,0,0,0.25)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 11,
                lineHeight: 1.6,
                color: "#E6F0E2",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {speechText}
            </div>
          )}
        </div>

        {/* Preset Selector */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 12 }}>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPreset(p.id)}
              style={{
                background: selectedPreset === p.id ? "#2A5C1F" : "#FFFFFF",
                color: selectedPreset === p.id ? "#FFFFFF" : "#1C2714",
                border: `1.5px solid ${selectedPreset === p.id ? "#2A5C1F" : "#E0DAD0"}`,
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {p.name} ({p.id})
            </button>
          ))}
        </div>

        {/* Prediction Card */}
        <div
          style={{
            background: "linear-gradient(145deg, #1C3E26, #122818)",
            borderRadius: 16,
            padding: 16,
            color: "#FFFFFF",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>
              ML RISK PROBABILITY
            </span>
            <span
              style={{
                background: curr.color,
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: 12,
              }}
            >
              {curr.badge}
            </span>
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>
            {curr.name} ({curr.id})
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, background: "rgba(255,255,255,0.12)", padding: "8px 10px", borderRadius: 8, marginTop: 8 }}>
            ⏱️ <strong>Forecast Window:</strong> {curr.status}
          </div>
        </div>

        {/* Normal vs Current Comparison Table */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>{lang === "Tamil" ? "சாதாரண நிலை vs தற்போதைய அளவு" : "Normal Baseline vs Current Cow"}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F0EDE6", paddingBottom: 4 }}>
              <span style={{ color: "#6B7A5C" }}>Milk Yield / Weight (HX711):</span>
              <span>
                <strong>{curr.weight}</strong> <span style={{ color: "#9BA88C" }}>(Expected: ~14 kg)</span>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F0EDE6", paddingBottom: 4 }}>
              <span style={{ color: "#6B7A5C" }}>Udder Temperature:</span>
              <span>
                <strong>{curr.temp}</strong> <span style={{ color: "#9BA88C" }}>(Normal: 38.6°C)</span>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F0EDE6", paddingBottom: 4 }}>
              <span style={{ color: "#6B7A5C" }}>Conductivity (EC):</span>
              <span>
                <strong>{curr.ec} mS/cm</strong> <span style={{ color: "#9BA88C" }}>(Normal: 4.86)</span>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F0EDE6", paddingBottom: 4 }}>
              <span style={{ color: "#6B7A5C" }}>Quarter Disparity (QDR):</span>
              <span>
                <strong>{curr.qdr}</strong> <span style={{ color: "#9BA88C" }}>(Normal: 1.04)</span>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F0EDE6", paddingBottom: 4 }}>
              <span style={{ color: "#6B7A5C" }}>Milk pH Value:</span>
              <span>
                <strong>{curr.pH}</strong> <span style={{ color: "#9BA88C" }}>(Normal: 6.62)</span>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6B7A5C" }}>Rumination Time:</span>
              <span>
                <strong>{curr.rum}</strong> <span style={{ color: "#9BA88C" }}>(Normal: 470 min)</span>
              </span>
            </div>
          </div>
        </Card>

        {/* Explainable AI Key Drivers */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>{lang === "Tamil" ? "தீவிர ஆபத்தின் முக்கிய காரணங்கள் (ML Factors)" : "Why is this Cow at High Risk? (ML Factors)"}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11 }}>
            <div style={{ background: "#FCE8E5", border: "1px solid #F0B4AA", borderRadius: 8, padding: "8px 10px" }}>
              <strong style={{ color: "#B83220" }}>1. Electrical Conductivity Spike (+9.87 weight):</strong>
              <div style={{ color: "#6B7A5C", marginTop: 2 }}>
                Surpassed 10.0 mS/cm signaling heavy electrolyte and sodium/chloride ion leakage into milk.
              </div>
            </div>
            <div style={{ background: "#FEF3E2", border: "1px solid #F0C882", borderRadius: 8, padding: "8px 10px" }}>
              <strong style={{ color: "#C47A10" }}>2. Quarter Conductivity Asymmetry (+3.44 weight):</strong>
              <div style={{ color: "#6B7A5C", marginTop: 2 }}>
                Rear-right quarter conductivity is 1.82× higher than healthy quarters, indicating tight-junction breakdown.
              </div>
            </div>
            <div style={{ background: "#FEF3E2", border: "1px solid #F0C882", borderRadius: 8, padding: "8px 10px" }}>
              <strong style={{ color: "#C47A10" }}>3. Alkaline Milk pH Shift (+2.05 weight):</strong>
              <div style={{ color: "#6B7A5C", marginTop: 2 }}>
                pH shifted from normal 6.62 to 7.28 due to blood bicarbonate leakage.
              </div>
            </div>
          </div>
        </Card>

        {/* 6-Step Clinical Treatment Protocol */}
        <Card style={{ marginBottom: 16 }}>
          <SectionLabel>{lang === "Tamil" ? "பரிந்துரைக்கப்பட்ட 6 மருத்துவ சிகிச்சை முறைகள்" : "Evidence-Based 6-Step Treatment Protocols"}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                num: "01",
                icon: "🚪",
                title: lang === "Tamil" ? "உடனடி தனிமைப்படுத்தல் & கடைசி கறவை" : "Quarantine & Milking Order",
                desc: lang === "Tamil" ? "மாட்டை உடனே தனி கொட்டகையில் கட்டி கடைசியாக பால் கறக்கவும்." : "Isolate in clean stall and milk strictly last in order.",
              },
              {
                num: "02",
                icon: "🧪",
                title: lang === "Tamil" ? "சி.எம்.டி தட்டு சோதனை" : "CMT Paddle Teat Mapping",
                desc: lang === "Tamil" ? "4 காம்புகளிலும் சிஎம்டி மருந்து விட்டு பாதிக்கப்பட்ட காம்பை கண்டறியவும்." : "Perform 4-cup reagent test to identify affected quarter.",
              },
              {
                num: "03",
                icon: "🧴",
                title: lang === "Tamil" ? "அயோடின் காம்பு நனைத்தல்" : "Iodine Pre/Post Teat Dipping",
                desc: lang === "Tamil" ? "கறவைக்கு முன் 0.5% மற்றும் பின் 1% அயோடின் திரவத்தில் நனையுங்கள்." : "Apply 0.5% pre-dip and 1.0% post-dip antiseptic barrier.",
              },
              {
                num: "04",
                icon: "🔬",
                title: lang === "Tamil" ? "ஆய்வக பால் மாதிரி பரிசோதனை" : "Aseptic Culture & AST",
                desc: lang === "Tamil" ? "சுய சிகிச்சை அளிக்கும் முன் கிருமி வகை கண்டறிய பால் மாதிரி எடுக்கவும்." : "Collect sterile sample for bacterial ID before antibiotics.",
              },
              {
                num: "05",
                icon: "💉",
                title: lang === "Tamil" ? "வீக்கம் & காய்ச்சல் தணிப்பு மருந்து" : "Anti-Inflammatory (NSAIDs)",
                desc: lang === "Tamil" ? "மருத்துவர் பரிந்துரைப்படி மெலோக்சிகாம் ஊசி மூலம் வலி குறைக்கவும்." : "Meloxicam or Flunixin to relieve pain, swelling, and fever.",
              },
              {
                num: "06",
                icon: "🛡️",
                title: lang === "Tamil" ? "மருத்துவர் மேற்பார்வை ஆன்டிபயாடிக்" : "Prescribed Intramammary Infusion",
                desc: lang === "Tamil" ? "சுய மருந்து தவிர்க்கவும்; மருத்துவர் ஆலோசனைப்படி மட்டுமே மருந்து செலுத்தவும்." : "Culture-targeted intramammary tube under vet prescription only.",
              },
            ].map((s) => (
              <div key={s.num} style={{ background: "#F7F4EE", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1C2714" }}>
                    <span style={{ color: "#B83220", marginRight: 4 }}>{s.num}.</span> {s.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7A5C", marginTop: 2 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* WhatsApp Vet Button */}
        <button
          onClick={() =>
            sendWhatsAppAlert(
              curr.name,
              curr.badge,
              `Temp ${curr.temp}, pH ${curr.pH}, EC ${curr.ec} mS/cm`,
              "Isolate cow, apply iodine post-dip, veterinary visit required",
              "Immediate 24h",
              lang
            )
          }
          style={{
            width: "100%",
            background: "#25D366",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 14,
            padding: "14px 0",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
          }}
        >
          <span style={{ fontSize: 18 }}>💬</span> {t("whatsapp_btn", lang)}
        </button>
      </div>
    </div>
  );
}
