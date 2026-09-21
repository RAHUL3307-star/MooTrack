import React from "react";
import { Card, SectionLabel } from "../components/ui";
import { t, LANG_FLAGS } from "../i18n/index";
import { useUser } from "../context/UserContext";

export function ProfileScreen({
  onBack,
  onNavigate,
  lang,
  onLangChange,
}: {
  onBack: () => void;
  onNavigate?: (screen: any) => void;
  lang: string;
  onLangChange: (l: string) => void;
}) {
  const { user, clearUser, savedAccounts, removeAccountFromDevice } = useUser();
  const farmerName = user?.name || (lang === "Tamil" ? "விவசாயி" : lang === "Hindi" ? "किसान" : "Farmer");
  const farmLabel = [user?.farmName, user?.village, user?.state].filter(Boolean).join(" · ") || "My Dairy Farm";
  const roleIcon = user?.role === "vet" ? "🩺" : user?.role === "officer" ? "📋" : "👨‍🌾";

  const handleSignOut = () => {
    clearUser();
    if (onNavigate) {
      onNavigate("login");
    } else {
      onBack();
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE" }}>
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E0DAD0" }}>
        <div style={{ padding: "16px 16px 16px" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#1C2714" }}>
            {t("profile_title", lang)}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <Card style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "#2A5C1F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: "#FFFFFF",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={farmerName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              roleIcon
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 18,
                fontWeight: 700,
                color: "#1C2714",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {farmerName}
              {user?.authProvider === "google" && (
                <span title="Signed in with Google" style={{ fontSize: 13 }}>
                  🌐
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#6B7A5C" }}>{farmLabel}</div>
            {user?.email && (
              <div style={{ fontSize: 11, color: "#2A5C1F", marginTop: 2, fontWeight: 600 }}>
                ✉️ {user.email}
              </div>
            )}
            {user?.phone && (
              <div style={{ fontSize: 11, color: "#9BA88C", marginTop: 2 }}>
                📱 +91 {user.phone}
              </div>
            )}
          </div>
        </Card>

        {/* Accounts on this device */}
        {savedAccounts.length > 1 && (
          <Card style={{ marginBottom: 14 }}>
            <SectionLabel>{lang === "Tamil" ? "இந்த சாதனத்தில் உள்ள கணக்குகள்" : lang === "Hindi" ? "इस डिवाइस पर सहेजे गए खाते" : "Accounts On This Device"}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedAccounts.map((acc) => {
                const isActive = (acc.email && acc.email === user?.email) || (acc.phone && acc.phone === user?.phone);
                return (
                  <div
                    key={acc.email || acc.phone || acc.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: isActive ? "#E8F5E9" : "#F7F4EE",
                      border: `1px solid ${isActive ? "#81C784" : "#E0DAD0"}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2714" }}>
                        {acc.name} {isActive && <span style={{ color: "#2E7D32", fontSize: 11 }}>● Active</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7A5C" }}>{acc.email || acc.phone}</div>
                    </div>
                    {!isActive && (
                      <button
                        onClick={() => removeAccountFromDevice(acc.email || acc.phone || acc.name)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#B83220",
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Language selector in profile */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>{lang === "Tamil" ? "பயன்பாட்டு மொழி" : "App Language"}</SectionLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Tamil", "Hindi", "English", "Kannada", "Telugu"].map((l) => (
              <button
                key={l}
                onClick={() => onLangChange(l)}
                style={{
                  background: lang === l ? "#2A5C1F" : "#F0EDE6",
                  color: lang === l ? "#FFFFFF" : "#6B7A5C",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 36,
                }}
              >
                {LANG_FLAGS[l] || l}
              </button>
            ))}
          </div>
        </Card>

        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            background: "#FCE8E5",
            color: "#B83220",
            border: "1px solid #F0B4AA",
            borderRadius: 12,
            padding: "14px 0",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            minHeight: 48,
          }}
        >
          {t("sign_out", lang)}
        </button>
      </div>
    </div>
  );
}
