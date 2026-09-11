import React, { useState, useEffect } from "react";
import { ESP32Provider, useESP32 } from "./context/ESP32Context";
import { AnimalsProvider, useAnimals } from "./context/AnimalsContext";
import { UserProvider } from "./context/UserContext";
import { HerdProvider } from "./context/HerdContext";
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
  VisualScanScreen,
  LocationScreen,
} from "./screens/index";

function MainAppShell() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [history, setHistory] = useState<Screen[]>([]);
  const [lang, setLang] = useState<string>("Tamil");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 640 : false
  );
  const [mockupMode, setMockupMode] = useState(false);
  const [showDevToolbar, setShowDevToolbar] = useState(false);

  const {
    isLive,
    connectUsbSerial,
    toggleEsp32,
    notification,
    dismissNotification,
  } = useESP32();
  const { setSelectedAnimal } = useAnimals();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 640);
    };
    const handleFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen error:", err);
      });
    }
  };

  const navigate = (s: Screen) => {
    setHistory((h) => [...h, screen]);
    setScreen(s);
  };

  const goBack = () => {
    if (history.length > 0) {
      setScreen(history[history.length - 1]);
      setHistory((h) => h.slice(0, -1));
    } else {
      setScreen("home");
      setActiveTab("home");
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
        return (
          <AnalyticsScreen
            onBack={goBack}
            lang={lang}
            onNavigate={navigate}
            onSelectAnimal={(animal) => {
              setSelectedAnimal(animal);
              navigate("animal-profile");
            }}
          />
        );
      case "sensors":
        return <SensorsScreen onBack={goBack} onNavigate={navigate} lang={lang} />;
      case "gis":
        return (
          <GISScreen
            onBack={goBack}
            lang={lang}
            onSelectAnimal={(animal) => {
              setSelectedAnimal(animal);
              navigate("animal-profile");
            }}
          />
        );
      case "interventions":
        return <InterventionsScreen onBack={goBack} lang={lang} />;
      case "ml-lab":
        return <MLLabScreen onBack={goBack} lang={lang} />;
      case "visual-ai":
        return <VisualScanScreen onNavigate={navigate} lang={lang} />;
      case "location":
        return (
          <LocationScreen
            onBack={goBack}
            lang={lang}
            onSelectAnimal={(animal) => {
              setSelectedAnimal(animal);
              navigate("animal-profile");
            }}
          />
        );
      case "profile":
        return <ProfileScreen onBack={goBack} lang={lang} onLangChange={setLang} />;
      default:
        return null;
    }
  };

  const isEdgeToEdge = isMobileScreen || isFullscreen || !mockupMode;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100dvh",
        height: isEdgeToEdge ? "100dvh" : "auto",
        background: isEdgeToEdge ? "#F7F4EE" : "#D5C9B8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isEdgeToEdge ? "stretch" : "center",
        padding: isEdgeToEdge ? 0 : "16px 12px",
        fontFamily: "'Outfit', sans-serif",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Desktop Top Toolbar (Hidden on real mobile / fullscreen unless toggled) */}
      {!isMobileScreen && !isFullscreen && (
        <div
          style={{
            width: "100%",
            maxWidth: 680,
            background: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(208, 202, 192, 0.6)",
            borderRadius: 14,
            padding: "8px 12px",
            marginBottom: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={connectUsbSerial}
              style={{
                background: "#1E293B",
                color: "#38BDF8",
                border: "1px solid #38BDF8",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>🔌</span> USB ESP32
            </button>
            <button
              onClick={toggleEsp32}
              style={{
                background: isLive ? "#052E16" : "#FFFFFF",
                color: isLive ? "#4ADE80" : "#2A5C1F",
                border: `1.5px solid ${isLive ? "#22C55E" : "#2A5C1F"}`,
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                boxShadow: isLive ? "0 0 10px rgba(34,197,94,0.3)" : "none",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: isLive ? "#22C55E" : "#94A3B8",
                }}
              />
              {isLive ? "ESP32 Active" : "⚡ Simulate ESP32"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={() => setMockupMode(!mockupMode)}
              style={{
                background: mockupMode ? "#2A5C1F" : "#F0EDE6",
                color: mockupMode ? "#FFFFFF" : "#1C2714",
                border: "1px solid #D0CAC0",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Toggle Phone Frame Bezel Mockup"
            >
              {mockupMode ? "📱 Bezel Mode: ON" : "📱 Bezel Mode: OFF"}
            </button>

            <button
              onClick={toggleFullscreen}
              style={{
                background: "#2A5C1F",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
              title="Launch Fullscreen"
            >
              <span>⛶</span> Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Floating Fullscreen & Tools Pill for Mobile screens */}
      {isMobileScreen && (
        <div
          style={{
            position: "fixed",
            bottom: 68,
            right: 12,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {!isFullscreen && (
            <button
              onClick={toggleFullscreen}
              style={{
                background: "rgba(42, 92, 31, 0.92)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 24,
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 700,
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                gap: 5,
                backdropFilter: "blur(8px)",
                cursor: "pointer",
              }}
            >
              <span>⛶</span> Fullscreen
            </button>
          )}
        </div>
      )}

      {/* Main Mobile App Frame / Container */}
      <div
        style={{
          width: "100%",
          maxWidth: isEdgeToEdge ? (isMobileScreen ? "100%" : 460) : 390,
          minHeight: isEdgeToEdge ? "100dvh" : 844,
          height: isEdgeToEdge ? "100dvh" : 844,
          background: "#1C2714",
          borderRadius: isEdgeToEdge ? 0 : 48,
          boxShadow: isEdgeToEdge
            ? (isMobileScreen ? "none" : "0 8px 30px rgba(0,0,0,0.12)")
            : "0 32px 80px rgba(0,0,0,0.35), 0 0 0 2px #8A7A6A, inset 0 0 0 1px rgba(255,255,255,0.3)",
          border: isEdgeToEdge && !isMobileScreen ? "1px solid #E0DAD0" : "none",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Notch - ONLY displayed in Desktop Mockup Bezel Mode */}
        {mockupMode && !isMobileScreen && !isFullscreen && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 120,
              height: 30,
              background: "#000000",
              borderRadius: "0 0 20px 20px",
              zIndex: 10000,
            }}
          />
        )}

        {/* Real ESP32 Single Pop-Up Notification */}
        <ESP32TopBannerNotification
          notification={notification}
          onDismiss={dismissNotification}
          onInspect={() => {
            navigate("sensors");
          }}
        />

        {/* Screen Container */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {renderScreen()}
        </div>

        {/* Bottom Navigation */}
        {isMain && screen !== "splash" && screen !== "language" && screen !== "login" && (
          <BottomNav active={activeTab} onChange={handleTab} lang={lang} />
        )}
      </div>

      {/* Onboarding helper buttons */}
      {["splash", "language", "login"].includes(screen) && !isMobileScreen && !isFullscreen && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
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
        <HerdProvider>
          <UserProvider>
            <MainAppShell />
          </UserProvider>
        </HerdProvider>
      </AnimalsProvider>
    </ESP32Provider>
  );
}

