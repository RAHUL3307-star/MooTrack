// Translation helper — does NOT use require() so it works with ES modules (Vite)
import { UI_STRINGS } from "./translations";

export function t(key: string, lang: string): string {
  const dict = UI_STRINGS[lang] || UI_STRINGS["English"];
  return dict[key] || UI_STRINGS["English"][key] || key;
}

export function sendWhatsAppAlert(
  animal: string,
  risk: string,
  reason: string,
  action: string,
  urgency: string,
  lang: string = "English"
) {
  let msg = "";
  if (lang === "Tamil") {
    msg = [
      `🚨 *மஸ்திகார்ட் AI எச்சரிக்கை (MooTracker Alert)*`,
      ``,
      `🐄 *மாடு:* ${animal}`,
      `⚠️ *ஆபத்து நிலை:* ${risk.toUpperCase() === "HIGH" ? "அதிக ஆபத்து (HIGH)" : risk.toUpperCase()}`,
      `🔍 *காரணம்:* ${reason}`,
      `⏱️ *அவசரம்:* ${urgency}`,
      `💡 *பரிந்துரைக்கப்பட்ட நடவடிக்கை:* ${action}`,
      ``,
      `_MooTracker · Smart Cattle Health System_`,
      `_ICAR-NRC Bovine Health_`,
    ].join("\n");
  } else if (lang === "Hindi") {
    msg = [
      `🚨 *मस्तिगार्ड AI अलर्ट (MooTracker Alert)*`,
      ``,
      `🐄 *पशु:* ${animal}`,
      `⚠️ *जोखिम स्तर:* ${risk.toUpperCase() === "HIGH" ? "उच्च जोखिम (HIGH)" : risk.toUpperCase()}`,
      `🔍 *कारण:* ${reason}`,
      `⏱️ *आवश्यकता:* ${urgency}`,
      `💡 *अनुशंसित कार्रवाई:* ${action}`,
      ``,
      `_MooTracker · Smart Cattle Health System_`,
      `_ICAR-NRC Bovine Health_`,
    ].join("\n");
  } else {
    msg = [
      `🚨 *MooTracker Alert*`,
      ``,
      `🐄 *Animal:* ${animal}`,
      `⚠️ *Risk Level:* ${risk.toUpperCase()}`,
      `🔍 *Reason:* ${reason}`,
      `⏱️ *Urgency:* ${urgency}`,
      `💡 *Recommended Action:* ${action}`,
      ``,
      `_Sent via MooTracker · Smart Cattle Health System_`,
      `_Powered by ICAR-NRC Bovine Health_`,
    ].join("\n");
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

export { LANG_CODES, LANG_FLAGS, UI_STRINGS } from "./translations";
export { SCREEN_SPEECH, generateLiveSituationSummary } from "./speech";
export { useReadAloud } from "./useReadAloud";

