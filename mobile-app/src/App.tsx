import React, { useState } from "react";
import { ESP32Provider, useESP32 } from "./context/ESP32Context";
import { AnimalsProvider } from "./context/AnimalsContext";
import { ESP32TopBannerNotification, BottomNav } from "./components/ui";
import type { Screen, Tab } from "./types/index";
import { t } from "./i18n/index";
import {
  SplashScreen,
  LanguageScreen,
  LoginScreen,
  HomeScreen,
  AnimalsScreen,
  AnimalProfileScreen,
  AIRiskScreen,
  AlertsScreen,
  RecommendationsScreen,
  AnalyticsScreen,
  SensorsScreen,
  GISScreen,
  InterventionsScreen,
  MLLabScreen,
  ProfileScreen,
} from "./screens/index";

function MainAppShell() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [history, setHistory] = useState<Screen[]>([]);
  const [lang, setLang] = useState<string>("Tamil");

  const {
    isLive,
    connectUsbSerial,
    toggleEsp32,
    notification,
    dismissNotification,
  } = useESP32();

  const navigate = (s: Screen) => {
    setHistory((h) => [...h, screen]);
    setScreen(s);
  };

  const goBack = () => {
    if (history.length > 0) {
      setScreen(history[history.length - 1]);
      setHistory((h) => h.slice(0, -1));
    }
  };

  const handleTab = (tTab: Tab) => {
    setActiveTab(tTab);
    const screenMap: Record<Tab, Screen> = {
      home: "home",
      animals: "animals",
      alerts: "alerts",
      analytics: "analytics",
      profile: "profile",
    };
    setHistory([]);
    setScreen(screenMap[tTab]);
  };

  const mainScreens: Screen[] = ["home", "animals", "alerts", "analytics", "profile"];
  const isMain = mainScreens.includes(screen);

  const renderScreen = () => {
    switch (screen) {
      case "splash":
        return <SplashScreen onNext={() => { setHistory([]); setScreen("language"); }} />;
      case "language":
        return <LanguageScreen onNext={() => setScreen("login")} onSelect={setLang} currentLang={lang} />;
      case "login":
        return <LoginScreen onNext={() => setScreen("home")} lang={lang} />;
      case "home":
        return <HomeScreen onNavigate={navigate} lang={lang} />;
      case "animals":
        return <AnimalsScreen onNavigate={navigate} lang={lang} />;
      case "animal-profile":
        return <AnimalProfileScreen onBack={goBack} onNavigate={navigate} lang={lang} />;
      case "ai-risk":
        return <AIRiskScreen onBack={goBack} onNavigate={navigate} lang={lang} />;
      case "alerts":
        return <AlertsScreen onNavigate={navigate} lang={lang} />;
      case "recommendations":
        return <RecommendationsScreen onBack={goBack} lang={lang} />;
      case "analytics":
        return <AnalyticsScreen onBack={goBack} lang={lang} />;
      case "sensors":
        return <SensorsScreen onBack={goBack} lang={lang} />;
      case "gis":
        return <GISScreen onBack={goBack} lang={lang} />;
      case "interventions":
        return <InterventionsScreen onBack={goBack} lang={lang} />;
      case "ml-lab":
        return <MLLabScreen onBack={goBack} lang={lang} />;
      case "profile":
        return <ProfileScreen onBack={goBack} lang={lang} onLangChange={setLang} />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#D5C9B8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 12px",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Top Hardware Quick Access Strip */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 580 }}>
        <button
          onClick={connectUsbSerial}
          style={{
            background: "#1E293B",
            color: "#38BDF8",
            border: "1px solid #38BDF8",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>🔌</span> Connect Real ESP32 (USB)
        </button>
        <button
          onClick={toggleEsp32}
          style={{
            background: isLive ? "#052E16" : "#FFFFFF",
            color: isLive ? "#4ADE80" : "#2A5C1F",
            border: `1.5px solid ${isLive ? "#22C55E" : "#2A5C1F"}`,
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: isLive ? "0 0 10px rgba(34,197,94,0.3)" : "none",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isLive ? "#22C55E" : "#94A3B8",
            }}
          />
          {isLive ? "ESP32 Live (Active)" : "⚡ Simulate ESP32 Live"}
        </button>
      </div>

      {/* Navigation bar above phone */}
      {!["splash", "language", "login"].includes(screen) && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 580 }}>
          {[
            { s: "home" as Screen, l: t("tab_home", lang) },
            { s: "animals" as Screen, l: t("tab_animals", lang) },
            { s: "animal-profile" as Screen, l: t("animal_profile", lang) },
            { s: "ai-risk" as Screen, l: "AI Risk" },
            { s: "ml-lab" as Screen, l: "🔬 AI Lab" },
            { s: "alerts" as Screen, l: t("tab_alerts", lang) },
            { s: "recommendations" as Screen, l: t("recs_title", lang) },
            { s: "analytics" as Screen, l: t("tab_analytics", lang) },
            { s: "sensors" as Screen, l: t("sensors_title", lang) },
            { s: "gis" as Screen, l: t("gis_title", lang) },
            { s: "interventions" as Screen, l: t("interventions_title", lang) },
            { s: "profile" as Screen, l: t("tab_profile", lang) },
          ].map(({ s, l }) => (
            <button
              key={s}
              onClick={() => {
                navigate(s);
                if (["home", "animals", "alerts", "analytics", "profile"].includes(s)) {
                  setActiveTab(s as Tab);
                }
              }}
              style={{
                background: screen === s ? "#2A5C1F" : "#FFFFFF",
                color: screen === s ? "#FFFFFF" : "#6B7A5C",
                border: `1px solid ${screen === s ? "#2A5C1F" : "#D0CAC0"}`,
                borderRadius: 8,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Phone frame */}
      <div
        style={{
          width: 390,
          minHeight: 844,
          background: "#FFFFFF",
          borderRadius: 52,
          boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 2px #8A7A6A, inset 0 0 0 1px rgba(255,255,255,0.3)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 34,
            background: "#000000",
            borderRadius: "0 0 22px 22px",
            zIndex: 10000,
          }}
        />

        {/* Real ESP32 Single Pop-Up Notification */}
        <ESP32TopBannerNotification
          notification={notification}
          onDismiss={dismissNotification}
          onInspect={() => {
            navigate("sensors");
          }}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {renderScreen()}
        </div>

        {/* Bottom Nav */}
        {isMain && screen !== "splash" && screen !== "language" && screen !== "login" && (
          <BottomNav active={activeTab} onChange={handleTab} lang={lang} />
        )}
      </div>

      {/* Onboarding flow buttons */}
      {["splash", "language", "login"].includes(screen) && (
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          {screen !== "splash" && (
            <button
              onClick={goBack}
              style={{
                background: "#FFFFFF",
                border: "1px solid #D0CAC0",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 11,
                fontWeight: 600,
                color: "#6B7A5C",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => setScreen("home")}
            style={{
              background: "#2A5C1F",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Skip to App →
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ESP32Provider>
      <AnimalsProvider>
        <MainAppShell />
      </AnimalsProvider>
    </ESP32Provider>
  );
}
