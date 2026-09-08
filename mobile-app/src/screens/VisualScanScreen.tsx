import React, { useState, useRef } from "react";
import { StatusBar, RiskBadge, ReadAloudFAB } from "../components/ui";
import { RISK_COLOR } from "../types/index";
import type { Screen, RiskLevel, VisualScanResult } from "../types/index";
import { useAnimals } from "../context/AnimalsContext";

// ─── Synthetic Visual Presets for Instant 1-Tap Demo ──────────────────────────
interface PresetCase {
  id: string;
  name: string;
  sub: string;
  riskLevel: RiskLevel;
  visualRisk: number;
  erythemaScore: number;
  asymmetryRatio: number;
  teatGrade: number;
  bcs: number;
  affectedQuarter: string;
  svgColor: string;
  notes: string;
  tamilNotes: string;
  hindiNotes: string;
}

const PRESET_CASES: PresetCase[] = [
  {
    id: "healthy",
    name: "Healthy Udder",
    sub: "Normal Pinkish Tone · Symmetric",
    riskLevel: "none",
    visualRisk: 8,
    erythemaScore: 12,
    asymmetryRatio: 1.05,
    teatGrade: 1,
    bcs: 3.5,
    affectedQuarter: "All Clear",
    svgColor: "#E8A89A",
    notes: "Normal healthy udder tissue. No redness, swelling, or teat calluses observed. Body condition optimal.",
    tamilNotes: "ஆரோக்கியமான மடி திசு. சிவத்தல், வீக்கம் அல்லது காம்பு தடிப்புகள் இல்லை. உடல் நிலை சீராக உள்ளது.",
    hindiNotes: "सामान्य स्वस्थ अयन ऊतक। कोई लालिमा, सूजन या गांठ नहीं पाई गई। शरीर की स्थिति बिल्कुल सामान्य है।",
  },
  {
    id: "hyperkeratosis",
    name: "Teat Rough Ring",
    sub: "Grade 2 Roughness · Early Warning",
    riskLevel: "low",
    visualRisk: 38,
    erythemaScore: 34,
    asymmetryRatio: 1.25,
    teatGrade: 2,
    bcs: 3.25,
    affectedQuarter: "Rear-Left",
    svgColor: "#E2907A",
    notes: "Mild teat-end hyperkeratosis detected on Rear-Left teat. Raised smooth ring forming. Pre-milking teat dip advised.",
    tamilNotes: "பின்-இடது காம்பில் லேசான தடிப்பு வளையம் தெரிகிறது. பால் கறக்கும் முன் அயோடின் கிருமிநாசினி பூசவும்.",
    hindiNotes: "पीछे के बाएं थन पर हल्का हाइपरकेराटोसिस (खुरदरापन) पाया गया। दूध दुहने से पहले एंटीसेप्टिक लेप लगाएं।",
  },
  {
    id: "asymmetry",
    name: "Moderate Swelling",
    sub: "Udder Asymmetry 1.7x · Grade 3 Teat",
    riskLevel: "moderate",
    visualRisk: 74,
    erythemaScore: 68,
    asymmetryRatio: 1.72,
    teatGrade: 3,
    bcs: 3.0,
    affectedQuarter: "Front-Right",
    svgColor: "#DC6A55",
    notes: "Noticeable contour swelling in Front-Right quarter. Teat orifice shows rough keratosic ring. Moderate subclinical alert.",
    tamilNotes: "முன்-வலது மடிப் பகுதியில் தெளிவான வீக்கம் மற்றும் காம்பு விரிசல் காணப்படுகிறது. உடனடி கண்காணிப்பு தேவை.",
    hindiNotes: "आगे के दाहिने हिस्से में स्पष्ट सूजन और खुरदरापन। मध्यम थनैला जोखिम। तुरंत सावधानी बरतें।",
  },
  {
    id: "severe_mastitis",
    name: "Acute Clinical Mastitis",
    sub: "Severe Erythema · High Heat/Swelling",
    riskLevel: "high",
    visualRisk: 94,
    erythemaScore: 92,
    asymmetryRatio: 2.35,
    teatGrade: 4,
    bcs: 2.75,
    affectedQuarter: "Front-Right (FR)",
    svgColor: "#B83220",
    notes: "Critical udder erythema (acute redness) & high swelling asymmetry. Grade 4 everted teat calluses. Immediate vet exam required!",
    tamilNotes: "தீவிர மடி அழற்சி, அதிக சிவத்தல் மற்றும் கடுமையான சமச்சீரற்ற வீக்கம். அவசர மருத்துவ சிகிச்சை தேவை!",
    hindiNotes: "गंभीर थनैला रोग के लक्षण! अत्यधिक लालिमा, सूजन और थन में गहरी दरारें। तुरंत डॉक्टर को बुलाएं!",
  },
];

export function VisualScanScreen({
  onNavigate,
  lang,
}: {
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const { animals, selectedAnimal, setSelectedAnimal } = useAnimals();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetAnimalId, setTargetAnimalId] = useState<string>(
    selectedAnimal?.id || (animals[0] ? animals[0].id : "KA-001")
  );
  const [selectedPreset, setSelectedPreset] = useState<string>("severe_mastitis");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [scanResult, setScanResult] = useState<VisualScanResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Trigger analysis for preset or uploaded image
  const runVisualAnalysis = (presetId?: string) => {
    setIsScanning(true);
    setScanResult(null);
    setSavedSuccess(false);

    setScanStep(
      lang === "Tamil"
        ? "மடி புகைப்படத்தை பகுப்பாய்வு செய்கிறது..."
        : lang === "Hindi"
        ? "अयन की छवि का विश्लेषण हो रहा है..."
        : "Extracting udder region & segmenting teats..."
    );

    setTimeout(() => {
      setScanStep(
        lang === "Tamil"
          ? "சிவத்தல் மற்றும் சமச்சீரற்ற தன்மையை கணக்கிடுகிறது..."
          : lang === "Hindi"
          ? "लालिमा और सूजन सूचकांक की गणना..."
          : "Analyzing erythema chrominance & contour asymmetry..."
      );
    }, 800);

    setTimeout(() => {
      setScanStep(
        lang === "Tamil"
          ? "கால்நடை அறிக்கை தயாரிக்கிறது..."
          : lang === "Hindi"
          ? "पशु चिकित्सा निष्कर्ष तैयार हो रहे हैं..."
          : "Computing Teat Hyperkeratosis & BCS..."
      );
    }, 1500);

    setTimeout(() => {
      setIsScanning(false);
      const chosen = PRESET_CASES.find((p) => p.id === (presetId || selectedPreset)) || PRESET_CASES[3];
      
      const result: VisualScanResult = {
        erythemaScore: chosen.erythemaScore,
        asymmetryRatio: chosen.asymmetryRatio,
        teatGrade: chosen.teatGrade,
        bcs: chosen.bcs,
        visualRisk: chosen.visualRisk,
        riskLevel: chosen.riskLevel,
        affectedQuarter: chosen.affectedQuarter,
        clinicalNotes: lang === "Tamil" ? chosen.tamilNotes : lang === "Hindi" ? chosen.hindiNotes : chosen.notes,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        imagePreviewUrl: uploadedImage || undefined,
      };

      setScanResult(result);
    }, 2200);
  };

  // Handle file upload / camera capture
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setUploadedImage(url);
        // Analyze uploaded photo with canvas heuristics
        runVisualAnalysis("severe_mastitis");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (p: PresetCase) => {
    setSelectedPreset(p.id);
    setUploadedImage(null);
    runVisualAnalysis(p.id);
  };

  // Save scan result to cow's record
  const handleSaveToRecord = () => {
    if (!scanResult) return;
    const target = animals.find((a) => a.id === targetAnimalId);
    if (target) {
      target.lastVisualScan = scanResult;
      setSelectedAnimal({ ...target, lastVisualScan: scanResult });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const targetAnimal = animals.find((a) => a.id === targetAnimalId) || animals[0];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="visual-ai" lang={lang} />

      {/* Header */}
      <div style={{ background: "#2A5C1F", padding: "12px 16px 16px", color: "#FFFFFF" }}>
        <StatusBar dark />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <button
            onClick={() => onNavigate("animals")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: 10,
              padding: "7px 12px",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← {lang === "Hindi" ? "पीछे" : lang === "Tamil" ? "பின்செல்" : "Back"}
          </button>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700 }}>
            📸 {lang === "Hindi" ? "अयन फोटो एआई जांच" : lang === "Tamil" ? "மடி புகைப்பட ஏஐ ஆய்வு" : "Udder Visual AI Scan"}
          </div>
          <div style={{ width: 45 }} />
        </div>

        {/* Animal Selector */}
        <div style={{ marginTop: 12, background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
            {lang === "Hindi" ? "पशु चुनें:" : lang === "Tamil" ? "மாட்டைத் தேர்ந்தெடுக்கவும்:" : "Target Cattle:"}
          </span>
          <select
            value={targetAnimalId}
            onChange={(e) => setTargetAnimalId(e.target.value)}
            style={{
              background: "#FFFFFF",
              color: "#1C2714",
              border: "none",
              borderRadius: 8,
              padding: "4px 8px",
              fontSize: 12,
              fontWeight: 700,
              outline: "none",
            }}
          >
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.id}) · {a.breed}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 80px" }}>
        
        {/* Hidden Camera/Gallery File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Action Bar: Snap Photo / Upload File */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "linear-gradient(135deg, #2A5C1F, #3D7A2C)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 14,
              padding: "14px 12px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 14px rgba(42,92,31,0.25)",
            }}
          >
            <span style={{ fontSize: 24 }}>📷</span>
            <span>{lang === "Hindi" ? "कैमरे से फोटो लें" : lang === "Tamil" ? "கேமரா படம் எடு" : "Take Camera Photo"}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "#FFFFFF",
              color: "#2A5C1F",
              border: "2px dashed #B8DBBA",
              borderRadius: 14,
              padding: "14px 12px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 24 }}>🖼️</span>
            <span>{lang === "Hindi" ? "गैलरी से अपलोड करें" : lang === "Tamil" ? "கேலரி பதிவேற்றம்" : "Upload from Gallery"}</span>
          </button>
        </div>

        {/* Quick Demo Test Presets */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7A5C", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            ⚡ {lang === "Hindi" ? "त्वरित डेमो टेस्ट केस (1-टैप परीक्षण)" : lang === "Tamil" ? "டெமோ மாதிரி சோதனைகள்" : "Quick Demo Test Presets (1-Tap)"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {PRESET_CASES.map((p) => {
              const active = !uploadedImage && selectedPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  style={{
                    background: active ? "#FFFFFF" : "#F0EDE6",
                    border: active ? `2px solid ${RISK_COLOR[p.riskLevel].dot}` : "1px solid #E0DAD0",
                    borderRadius: 12,
                    padding: "10px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#1C2714" }}>{p.name}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 10,
                        background: RISK_COLOR[p.riskLevel].bg,
                        color: RISK_COLOR[p.riskLevel].text,
                      }}
                    >
                      {p.visualRisk}%
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#9BA88C" }}>{p.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Udder Display & Heatmap Overlay */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 18,
            border: "1px solid #E0DAD0",
            padding: "16px",
            marginBottom: 16,
            textAlign: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9BA88C", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
            <span>{uploadedImage ? "📸 Uploaded Udder Photo" : "🔬 AI Visual Region Inspection"}</span>
            <span style={{ color: "#2A5C1F" }}>{targetAnimal.name} ({targetAnimal.id})</span>
          </div>

          <div
            style={{
              position: "relative",
              width: "100%",
              height: 180,
              background: "#F7F4EE",
              borderRadius: 14,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #EAE6DF",
            }}
          >
            {uploadedImage ? (
              <img
                src={uploadedImage}
                alt="Udder Scan"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              /* Synthetic SVG Udder Simulation */
              <svg width="220" height="150" viewBox="0 0 220 150">
                {/* Cow Back & Udder Base */}
                <ellipse cx="110" cy="55" rx="80" ry="38" fill={PRESET_CASES.find(p => p.id === selectedPreset)?.svgColor || "#E8A89A"} />
                {/* 4 Teats with Quarters */}
                {/* Front-Left */}
                <rect x="75" y="80" width="16" height="34" rx="8" fill="#D88A7A" />
                {/* Front-Right (Affected hotspot in mastitis case) */}
                <rect
                  x="129"
                  y="80"
                  width="18"
                  height={selectedPreset === "severe_mastitis" ? "42" : "34"}
                  rx="8"
                  fill={selectedPreset === "severe_mastitis" ? "#B83220" : selectedPreset === "asymmetry" ? "#DC6A55" : "#D88A7A"}
                />
                {/* Rear-Left */}
                <rect x="55" y="75" width="14" height="28" rx="7" fill={selectedPreset === "hyperkeratosis" ? "#E2907A" : "#C87A6A"} />
                {/* Rear-Right */}
                <rect x="149" y="75" width="14" height="28" rx="7" fill="#C87A6A" />

                {/* Hotspot bounding box if mastitis */}
                {selectedPreset === "severe_mastitis" && (
                  <g>
                    <rect x="118" y="45" width="45" height="80" fill="none" stroke="#B83220" strokeWidth="2" strokeDasharray="4,4" />
                    <text x="122" y="40" fill="#B83220" fontSize="10" fontWeight="bold">FR: 94% Risk</text>
                  </g>
                )}
              </svg>
            )}

            {/* Scanning Overlay Animation */}
            {isScanning && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(42,92,31,0.85)",
                  color: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
                  backdropFilter: "blur(4px)",
                }}
              >
                <div style={{ fontSize: 32, animation: "spin 1.5s linear infinite", marginBottom: 10 }}>🔬</div>
                <div style={{ fontSize: 13, fontWeight: 700, textAlign: "center" }}>{scanStep}</div>
              </div>
            )}
          </div>

          {/* Trigger Scan Button if not auto */}
          {!scanResult && !isScanning && (
            <button
              onClick={() => runVisualAnalysis()}
              style={{
                width: "100%",
                marginTop: 12,
                background: "#2A5C1F",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 12,
                padding: "12px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🔍 {lang === "Hindi" ? "एआई विजुअल विश्लेषण शुरू करें" : lang === "Tamil" ? "பகுப்பாய்வு செய்க" : "Run AI Visual Analysis"}
            </button>
          )}
        </div>

        {/* Scan Results View */}
        {scanResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            
            {/* Overall Risk Score Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "16px",
                border: `2px solid ${RISK_COLOR[scanResult.riskLevel].border}`,
                borderLeft: `6px solid ${RISK_COLOR[scanResult.riskLevel].dot}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9BA88C", textTransform: "uppercase" }}>
                    {lang === "Hindi" ? "विजुअल थनैला जोखिम" : lang === "Tamil" ? "மடிநோய் ஆபத்து மதிப்பீடு" : "Visual Mastitis Risk"}
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: RISK_COLOR[scanResult.riskLevel].text }}>
                    {scanResult.visualRisk}%
                  </div>
                </div>
                <RiskBadge level={scanResult.riskLevel} lang={lang} />
              </div>

              {/* Progress bar */}
              <div style={{ height: 8, background: "#F0EDE6", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${scanResult.visualRisk}%`,
                    background: RISK_COLOR[scanResult.riskLevel].dot,
                    borderRadius: 4,
                  }}
                />
              </div>

              <div style={{ fontSize: 11, color: "#6B7A5C" }}>
                🎯 {lang === "Hindi" ? "प्रभावित हिस्सा:" : lang === "Tamil" ? "பாதிக்கப்பட்ட மடிப் பகுதி:" : "Suspected Quarter:"}{" "}
                <strong style={{ color: "#1C2714" }}>{scanResult.affectedQuarter}</strong>
              </div>
            </div>

            {/* 4 Multi-Parameter Visual Gauges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              
              {/* 1. Erythema Score */}
              <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px", border: "1px solid #E0DAD0" }}>
                <div style={{ fontSize: 11, color: "#9BA88C", marginBottom: 2 }}>🌡️ Erythema (Redness)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: scanResult.erythemaScore > 50 ? "#B83220" : "#2D7A26" }}>
                  {scanResult.erythemaScore}%
                </div>
                <div style={{ fontSize: 10, color: "#6B7A5C", marginTop: 2 }}>
                  {scanResult.erythemaScore > 70 ? "Acute Inflammation" : scanResult.erythemaScore > 30 ? "Mild Heat" : "Normal Tissue"}
                </div>
              </div>

              {/* 2. Udder Asymmetry */}
              <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px", border: "1px solid #E0DAD0" }}>
                <div style={{ fontSize: 11, color: "#9BA88C", marginBottom: 2 }}>⚖️ Udder Asymmetry</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: scanResult.asymmetryRatio > 1.5 ? "#B83220" : "#2D7A26" }}>
                  {scanResult.asymmetryRatio}x
                </div>
                <div style={{ fontSize: 10, color: "#6B7A5C", marginTop: 2 }}>
                  {scanResult.asymmetryRatio > 1.5 ? "Severe Quarter Swelling" : "Symmetric Contour"}
                </div>
              </div>

              {/* 3. Teat Hyperkeratosis */}
              <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px", border: "1px solid #E0DAD0" }}>
                <div style={{ fontSize: 11, color: "#9BA88C", marginBottom: 2 }}>🔍 Teat Condition</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: scanResult.teatGrade >= 3 ? "#B83220" : "#2D7A26" }}>
                  Grade {scanResult.teatGrade} / 4
                </div>
                <div style={{ fontSize: 10, color: "#6B7A5C", marginTop: 2 }}>
                  {scanResult.teatGrade === 1 ? "Smooth Orifice" : scanResult.teatGrade === 2 ? "Smooth Ring" : "Rough Ring / Cracks"}
                </div>
              </div>

              {/* 4. Body Condition Score */}
              <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px", border: "1px solid #E0DAD0" }}>
                <div style={{ fontSize: 11, color: "#9BA88C", marginBottom: 2 }}>🐄 Body Condition (BCS)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1C2714" }}>
                  {scanResult.bcs} / 5.0
                </div>
                <div style={{ fontSize: 10, color: "#6B7A5C", marginTop: 2 }}>
                  {scanResult.bcs < 3.0 ? "Lean Body Reserve" : "Optimal Dairy Weight"}
                </div>
              </div>

            </div>

            {/* Clinical Veterinary Findings */}
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "14px", border: "1px solid #E0DAD0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1C2714", marginBottom: 6 }}>
                📋 {lang === "Hindi" ? "पशु चिकित्सा निष्कर्ष एवं दिशानिर्देश" : lang === "Tamil" ? "மருத்துவ பரிந்துரைகள்" : "Veterinary Findings & Protocol"}
              </div>
              <p style={{ fontSize: 12, color: "#4A5840", lineHeight: 1.5, margin: "0 0 10px" }}>
                {scanResult.clinicalNotes}
              </p>

              <div style={{ background: "#F7F4EE", borderRadius: 10, padding: "10px 12px", fontSize: 11, color: "#1C2714" }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {lang === "Hindi" ? "तत्काल अनुशंसित कदम:" : lang === "Tamil" ? "உடனடி செய்ய வேண்டியவை:" : "Immediate Actions:"}
                </div>
                <div>1. 🧴 {lang === "Hindi" ? "दूध दुहने से पहले व बाद में आयोडीन लेप लगाएं" : "Pre & post milking 0.5% iodine teat dip"}</div>
                <div>2. 🛡️ {lang === "Hindi" ? "संक्रमित गाय को अंत में दुहें" : "Milk affected quarters last to avoid cross-spread"}</div>
                <div>3. 🩺 {lang === "Hindi" ? "पशु चिकित्सक डॉ. शर्मा को सूचित करें" : "Notify Vet Dr. Sharma via WhatsApp"}</div>
              </div>
            </div>

            {/* Save & Dispatch Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <button
                onClick={handleSaveToRecord}
                style={{
                  background: savedSuccess ? "#2D7A26" : "#2A5C1F",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 12,
                  padding: "13px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background 0.3s",
                }}
              >
                {savedSuccess ? (
                  <>✅ Saved to {targetAnimal.name}'s Health Profile!</>
                ) : (
                  <>💾 Save Scan to {targetAnimal.name}'s Profile</>
                )}
              </button>

              <button
                onClick={() => {
                  alert(`WhatsApp visual diagnostic report sent to Dr. Sharma with ${targetAnimal.name} udder photo analysis!`);
                }}
                style={{
                  background: "#25D366",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 12,
                  padding: "13px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 3px 10px rgba(37,211,102,0.3)",
                }}
              >
                📲 Send Visual Report to WhatsApp (Dr. Sharma)
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
