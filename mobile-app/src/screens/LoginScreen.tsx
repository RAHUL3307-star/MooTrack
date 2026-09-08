import React, { useState } from "react";
import { t } from "../i18n/index";
import { useUser } from "../context/UserContext";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1.5px solid #E0DAD0",
  borderRadius: 12,
  padding: "14px 16px",
  fontSize: 14,
  fontFamily: "'Outfit', sans-serif",
  color: "#1C2714",
  outline: "none",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6B7A5C",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 5,
  display: "block",
};

export function LoginScreen({ onNext, lang }: { onNext: () => void; lang: string }) {
  const { setUser } = useUser();
  const [view, setView] = useState<"main" | "signin" | "register">("main");

  // ── Sign In state ──────────────────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"farmer" | "vet" | "officer">("farmer");

  // ── Register state ─────────────────────────────────────────────────────────
  const [regName, setRegName] = useState("");
  const [regFarm, setRegFarm] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regVillage, setRegVillage] = useState("");
  const [regState, setRegState] = useState("");
  const [regRole, setRegRole] = useState<"farmer" | "vet" | "officer">("farmer");
  const [regError, setRegError] = useState("");

  const roles = [
    { id: "farmer" as const, label: t("role_farmer", lang), icon: "👨‍🌾" },
    { id: "vet" as const, label: t("role_vet", lang), icon: "🩺" },
    { id: "officer" as const, label: t("role_officer", lang), icon: "📋" },
  ];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSignIn = () => {
    setUser({
      name: "Farmer",
      farmName: "My Farm",
      phone: phone || "9800000000",
      role,
    });
    onNext();
  };

  const handleGoogleSignIn = () => {
    // In production this would trigger Google OAuth
    // For now we log in with a demo account and go straight to home
    setUser({
      name: "Farmer",
      farmName: "My Farm",
      phone: "",
      role: "farmer",
      email: "farmer@gmail.com",
    });
    onNext();
  };

  const handleRegister = () => {
    if (!regName.trim()) { setRegError("Please enter your name"); return; }
    if (!regFarm.trim()) { setRegError("Please enter your farm name"); return; }
    if (!regPhone.trim() || regPhone.length < 10) { setRegError("Enter a valid 10-digit phone number"); return; }
    setRegError("");
    setUser({
      name: regName.trim(),
      farmName: regFarm.trim(),
      phone: regPhone.trim(),
      role: regRole,
      village: regVillage.trim(),
      state: regState.trim(),
    });
    onNext();
  };

  // ── Header (shared) ────────────────────────────────────────────────────────
  const Header = ({ subtitle }: { subtitle: string }) => (
    <div style={{ background: "#2A5C1F", padding: "24px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 26 }}>🐄</span>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>
          MooTracker
        </span>
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.25 }}>
        {subtitle}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
        {t("healthy_cattle", lang)}
      </div>
    </div>
  );

  // ── Google button (shared) ─────────────────────────────────────────────────
  const GoogleBtn = () => (
    <button
      onClick={handleGoogleSignIn}
      style={{
        width: "100%",
        background: "#FFFFFF",
        border: "1.5px solid #E0DAD0",
        borderRadius: 14,
        padding: "15px 0",
        fontSize: 14,
        fontWeight: 700,
        color: "#1C2714",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Google G icon */}
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
      {lang === "Tamil" ? "Google மூலம் உள்நுழைக" : lang === "Hindi" ? "Google से साइन इन करें" : "Continue with Google"}
    </button>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: MAIN (landing choice)
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "main") {
    return (
      <div style={{ flex: 1, background: "#F7F4EE", display: "flex", flexDirection: "column" }}>
        <Header subtitle={t("welcome_dairy", lang)} />
        <div style={{ flex: 1, padding: "24px 20px", overflow: "auto", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Google Sign-In — primary CTA */}
          <GoogleBtn />

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "#E0DAD0" }} />
            <span style={{ fontSize: 12, color: "#9BA88C", fontWeight: 600 }}>
              {lang === "Tamil" ? "அல்லது" : lang === "Hindi" ? "या" : "OR"}
            </span>
            <div style={{ flex: 1, height: 1, background: "#E0DAD0" }} />
          </div>

          {/* Phone sign-in */}
          <button
            onClick={() => setView("signin")}
            style={{
              width: "100%",
              background: "#2A5C1F",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 14,
              padding: "16px 0",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            📱 {lang === "Tamil" ? "மொபைல் எண்ணில் உள்நுழைக" : lang === "Hindi" ? "मोबाइल नंबर से साइन इन" : "Sign In with Mobile Number"}
          </button>

          {/* Register */}
          <button
            onClick={() => setView("register")}
            style={{
              width: "100%",
              background: "transparent",
              color: "#2A5C1F",
              border: "1.5px solid #2A5C1F",
              borderRadius: 14,
              padding: "15px 0",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✨ {lang === "Tamil" ? "புதிய கணக்கு உருவாக்குங்கள்" : lang === "Hindi" ? "नया खाता बनाएं" : "Create New Account"}
          </button>

          <p style={{ fontSize: 11, color: "#9BA88C", textAlign: "center", margin: 0 }}>
            {lang === "Tamil"
              ? "உங்கள் தகவல்கள் பாதுகாப்பாக வைக்கப்படும்"
              : lang === "Hindi"
              ? "आपकी जानकारी सुरक्षित रहेगी"
              : "Your data is stored securely on your device"}
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: SIGN IN (phone)
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "signin") {
    return (
      <div style={{ flex: 1, background: "#F7F4EE", display: "flex", flexDirection: "column" }}>
        <Header subtitle={lang === "Tamil" ? "உள்நுழைக" : lang === "Hindi" ? "साइन इन करें" : "Sign In"} />
        <div style={{ flex: 1, padding: "20px 20px", overflow: "auto" }}>

          {/* Back */}
          <button onClick={() => setView("main")} style={{ background: "none", border: "none", color: "#2A5C1F", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "0 0 16px 0", display: "flex", alignItems: "center", gap: 4 }}>
            ← {lang === "Tamil" ? "திரும்பு" : lang === "Hindi" ? "वापस" : "Back"}
          </button>

          {/* Role selector */}
          <label style={LABEL_STYLE}>{t("select_role", lang)}</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {roles.map((r) => (
              <button key={r.id} onClick={() => setRole(r.id)} style={{
                flex: 1, background: role === r.id ? "#E6F0E2" : "#FFFFFF",
                border: `1.5px solid ${role === r.id ? "#2A5C1F" : "#E0DAD0"}`,
                borderRadius: 12, padding: "12px 6px", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                <span style={{ fontSize: 22 }}>{r.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: role === r.id ? "#2A5C1F" : "#6B7A5C" }}>{r.label}</span>
              </button>
            ))}
          </div>

          {/* Phone input */}
          <label style={LABEL_STYLE}>{t("mobile_num", lang)}</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <div style={{ background: "#FFFFFF", border: "1.5px solid #E0DAD0", borderRadius: 12, padding: "14px 12px", fontSize: 14, fontWeight: 600, color: "#1C2714", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              🇮🇳 +91
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98XXXXXXXX"
              type="tel"
              inputMode="numeric"
              style={{ ...INPUT_STYLE }}
            />
          </div>

          <button onClick={handleSignIn} style={{ width: "100%", background: "#2A5C1F", color: "#FFFFFF", border: "none", borderRadius: 14, padding: "17px 0", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            {t("continue_as", lang)} {roles.find((r) => r.id === role)?.label} →
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#E0DAD0" }} />
            <span style={{ fontSize: 12, color: "#9BA88C", fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#E0DAD0" }} />
          </div>
          <GoogleBtn />

          <p style={{ textAlign: "center", fontSize: 13, color: "#6B7A5C", marginTop: 16 }}>
            {lang === "Tamil" ? "கணக்கு இல்லையா?" : lang === "Hindi" ? "खाता नहीं है?" : "No account yet?"}{" "}
            <span onClick={() => setView("register")} style={{ color: "#2A5C1F", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
              {lang === "Tamil" ? "பதிவு செய்க" : lang === "Hindi" ? "रजिस्टर करें" : "Register here"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: CREATE ACCOUNT
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ flex: 1, background: "#F7F4EE", display: "flex", flexDirection: "column" }}>
      <Header subtitle={lang === "Tamil" ? "புதிய கணக்கு" : lang === "Hindi" ? "नया खाता बनाएं" : "Create Account"} />
      <div style={{ flex: 1, padding: "20px 20px", overflow: "auto" }}>

        {/* Back */}
        <button onClick={() => setView("main")} style={{ background: "none", border: "none", color: "#2A5C1F", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "0 0 14px 0", display: "flex", alignItems: "center", gap: 4 }}>
          ← {lang === "Tamil" ? "திரும்பு" : lang === "Hindi" ? "वापस" : "Back"}
        </button>

        {/* Role */}
        <label style={LABEL_STYLE}>{lang === "Tamil" ? "நீங்கள் யார்?" : lang === "Hindi" ? "आप कौन हैं?" : "I am a"}</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {roles.map((r) => (
            <button key={r.id} onClick={() => setRegRole(r.id)} style={{
              flex: 1, background: regRole === r.id ? "#E6F0E2" : "#FFFFFF",
              border: `1.5px solid ${regRole === r.id ? "#2A5C1F" : "#E0DAD0"}`,
              borderRadius: 12, padding: "12px 6px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 22 }}>{r.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: regRole === r.id ? "#2A5C1F" : "#6B7A5C" }}>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Name */}
        <label style={LABEL_STYLE}>
          {lang === "Tamil" ? "உங்கள் பெயர் *" : lang === "Hindi" ? "आपका नाम *" : "Your Full Name *"}
        </label>
        <input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder={lang === "Tamil" ? "பெயரை உள்ளிடுங்கள்" : lang === "Hindi" ? "अपना नाम दर्ज करें" : "Enter your name"} style={{ ...INPUT_STYLE, marginBottom: 14 }} />

        {/* Farm Name */}
        <label style={LABEL_STYLE}>
          {lang === "Tamil" ? "பண்ணையின் பெயர் *" : lang === "Hindi" ? "फार्म का नाम *" : "Farm / Dairy Name *"}
        </label>
        <input value={regFarm} onChange={(e) => setRegFarm(e.target.value)} placeholder={lang === "Tamil" ? "பண்ணை பெயர்" : lang === "Hindi" ? "फार्म का नाम" : "e.g. Shri Balaji Dairy Farm"} style={{ ...INPUT_STYLE, marginBottom: 14 }} />

        {/* Phone */}
        <label style={LABEL_STYLE}>
          {lang === "Tamil" ? "மொபைல் எண் *" : lang === "Hindi" ? "मोबाइल नंबर *" : "Mobile Number *"}
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ background: "#FFFFFF", border: "1.5px solid #E0DAD0", borderRadius: 12, padding: "14px 12px", fontSize: 14, fontWeight: 600, color: "#1C2714", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            🇮🇳 +91
          </div>
          <input value={regPhone} onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98XXXXXXXX" type="tel" inputMode="numeric" style={{ ...INPUT_STYLE }} />
        </div>

        {/* Village */}
        <label style={LABEL_STYLE}>
          {lang === "Tamil" ? "கிராமம் / நகரம்" : lang === "Hindi" ? "गांव / शहर" : "Village / Town"}
        </label>
        <input value={regVillage} onChange={(e) => setRegVillage(e.target.value)} placeholder={lang === "Tamil" ? "கிராம பெயர்" : lang === "Hindi" ? "गांव का नाम" : "e.g. Anand"} style={{ ...INPUT_STYLE, marginBottom: 14 }} />

        {/* State */}
        <label style={LABEL_STYLE}>
          {lang === "Tamil" ? "மாநிலம்" : lang === "Hindi" ? "राज्य" : "State"}
        </label>
        <input value={regState} onChange={(e) => setRegState(e.target.value)} placeholder={lang === "Tamil" ? "மாநிலம்" : lang === "Hindi" ? "राज्य" : "e.g. Gujarat"} style={{ ...INPUT_STYLE, marginBottom: 6 }} />

        {/* Error */}
        {regError && (
          <div style={{ background: "#FCE8E5", border: "1px solid #F3A09A", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#B83220", marginBottom: 14, fontWeight: 600 }}>
            ⚠️ {regError}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleRegister} style={{ width: "100%", background: "#2A5C1F", color: "#FFFFFF", border: "none", borderRadius: 14, padding: "17px 0", fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
          ✅ {lang === "Tamil" ? "பதிவு செய்து தொடரவும்" : lang === "Hindi" ? "पंजीकृत करें और जारी रखें" : "Register & Continue →"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#E0DAD0" }} />
          <span style={{ fontSize: 12, color: "#9BA88C", fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "#E0DAD0" }} />
        </div>
        <GoogleBtn />

        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7A5C", marginTop: 16, marginBottom: 4 }}>
          {lang === "Tamil" ? "ஏற்கனவே கணக்கு உள்ளதா?" : lang === "Hindi" ? "पहले से खाता है?" : "Already have an account?"}{" "}
          <span onClick={() => setView("signin")} style={{ color: "#2A5C1F", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
            {lang === "Tamil" ? "உள்நுழைக" : lang === "Hindi" ? "साइन इन करें" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );
}
