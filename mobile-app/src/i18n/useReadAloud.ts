import { useState, useRef, useCallback, useEffect } from "react";
import { LANG_CODES } from "./translations";

// ─── Lang code map ─────────────────────────────────────────────────────────────
const LANG_CODE_MAP: Record<string, string> = {
  tamil: "ta",
  hindi: "hi",
  kannada: "kn",
  telugu: "te",
  english: "en",
  marathi: "mr",
  gujarati: "gu",
  punjabi: "pa",
};

function getLangCode(name: string): string {
  return LANG_CODE_MAP[(name || "").toLowerCase().trim()] || "en";
}

// ─── Text sanitizer ────────────────────────────────────────────────────────────
function sanitizeTtsText(text: string, langName: string): string {
  if (!text) return "";

  // Strip emojis
  let s = text.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu,
    ""
  );

  // Strip markdown / symbols
  s = s.replace(/[*_#~`|•·\\/→←↑↓]/g, " ");

  // Normalise cow IDs: KA-001 → KA 001
  s = s.replace(/\b([A-Z]{2})-(\d{2,4})\b/g, "$1 $2");

  // Strip brackets
  s = s.replace(/[()[\]{}"'""'`~@$^&*+=<>]/g, " ");

  const l = (langName || "").toLowerCase();

  if (l === "tamil") {
    s = s
      .replace(/\bHRI\b/g, " எச் ஆர் ஐ ")
      .replace(/\bSCC\b/g, " எஸ் சி சி ")
      .replace(/\bIoT\b/g, " ஐ ஓ டி ")
      .replace(/\bESP32\b/gi, " இ எஸ் பி முப்பத்தி இரண்டு ")
      .replace(/\bRFID\b/g, " ஆர் எப் ஐ டி ")
      .replace(/\bpH\b/gi, " பி எச் ")
      .replace(/°C\b/g, " டிகிரி செல்சியஸ் ")
      .replace(/\b(mS\/cm)\b/gi, " மில்லி சீமென்ஸ் ")
      .replace(/%/g, " சதவீதம் ");
  } else if (l === "hindi") {
    s = s
      .replace(/\bHRI\b/g, " एच आर आई ")
      .replace(/\bSCC\b/g, " एस सी सी ")
      .replace(/\bIoT\b/g, " आई ओ टी ")
      .replace(/\bESP32\b/gi, " ई एस पी बत्तीस ")
      .replace(/\bRFID\b/g, " आर एफ आई डी ")
      .replace(/\bpH\b/gi, " पी एच ")
      .replace(/°C\b/g, " डिग्री सेल्सियस ")
      .replace(/\b(mS\/cm)\b/gi, " मिली सीमेंस ")
      .replace(/%/g, " प्रतिशत ");
  } else if (l === "kannada") {
    s = s
      .replace(/\bHRI\b/g, " ಎಚ್ ಆರ್ ಐ ")
      .replace(/\bSCC\b/g, " ಎಸ್ ಸಿ ಸಿ ")
      .replace(/\bESP32\b/gi, " ಈ ಎಸ್ ಪಿ ಮೂವತ್ತೆರಡು ")
      .replace(/\bpH\b/gi, " ಪಿ ಎಚ್ ")
      .replace(/°C\b/g, " ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ")
      .replace(/%/g, " ಪ್ರತಿಶತ ");
  } else if (l === "telugu") {
    s = s
      .replace(/\bHRI\b/g, " హెచ్ ఆర్ ఐ ")
      .replace(/\bSCC\b/g, " ఎస్ సి సి ")
      .replace(/\bESP32\b/gi, " ఈ ఎస్ పి ముప్పై రెండు ")
      .replace(/\bpH\b/gi, " పి హెచ్ ")
      .replace(/°C\b/g, " డిగ్రీల సెల్సియస్ ")
      .replace(/%/g, " శాతం ");
  } else if (l === "marathi") {
    s = s
      .replace(/\bHRI\b/g, " एच आर आय ")
      .replace(/\bSCC\b/g, " एस सी सी ")
      .replace(/\bESP32\b/gi, " ई एस पी बत्तीस ")
      .replace(/°C\b/g, " अंश सेल्सिअस ")
      .replace(/%/g, " टक्के ");
  } else if (l === "gujarati") {
    s = s
      .replace(/\bHRI\b/g, " એચ આર આઈ ")
      .replace(/\bESP32\b/gi, " ઈ એસ પી બત્રીસ ")
      .replace(/°C\b/g, " ડિગ્રી સેલ્સિયસ ")
      .replace(/%/g, " ટકા ");
  } else if (l === "punjabi") {
    s = s
      .replace(/\bHRI\b/g, " ਐਚ ਆਰ ਆਈ ")
      .replace(/\bESP32\b/gi, " ਈ ਐਸ ਪੀ ਬੱਤੀ ")
      .replace(/°C\b/g, " ਡਿਗਰੀ ਸੈਲਸੀਅਸ ")
      .replace(/%/g, " ਪ੍ਰਤੀਸ਼ਤ ");
  } else {
    s = s
      .replace(/\bHRI\b/g, " H R I ")
      .replace(/\bSCC\b/g, " S C C ")
      .replace(/\bIoT\b/g, " I O T ")
      .replace(/\bESP32\b/gi, " E S P thirty two ")
      .replace(/\bRFID\b/g, " R F I D ")
      .replace(/\bpH\b/gi, " p H ")
      .replace(/°C\b/g, " degrees Celsius ")
      .replace(/\b(mS\/cm)\b/gi, " milli Siemens ")
      .replace(/%/g, " percent ");
  }

  return s.replace(/\s+/g, " ").trim();
}

// ─── Chunk splitter ─────────────────────────────────────────────────────────────
// Google TTS truncates after ~200 chars. Keep chunks ≤100 chars to be safe.
function splitIntoChunks(text: string): string[] {
  if (!text) return [];

  // Split on sentence boundaries
  const sentences = text.split(/([.!?।;:\n]+)/);
  const clauses: string[] = [];

  for (let i = 0; i < sentences.length; i += 2) {
    const part = (sentences[i] || "").trim();
    const punct = (sentences[i + 1] || "").trim();
    const combined = punct ? part + punct : part;
    if (!combined.trim()) continue;

    if (combined.length > 100) {
      // Split long clause at commas
      const sub = combined.split(",");
      let cur = "";
      for (const s of sub) {
        const candidate = cur ? cur + ", " + s.trim() : s.trim();
        if (candidate.length > 100) {
          if (cur) clauses.push(cur.trim());
          cur = s.trim();
        } else {
          cur = candidate;
        }
      }
      if (cur.trim()) clauses.push(cur.trim());
    } else {
      clauses.push(combined.trim());
    }
  }

  // Merge tiny clauses
  const chunks: string[] = [];
  let cur = "";
  for (const c of clauses) {
    if ((cur + " " + c).trim().length > 100) {
      if (cur) chunks.push(cur.trim());
      cur = c;
    } else {
      cur = cur ? cur + " " + c : c;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());

  return chunks.length > 0 ? chunks : [text.trim()];
}

// ─── Fetch audio blob with no-referrer ─────────────────────────────────────────
// Fetching as a blob + using an object URL is the ONLY reliable way to play
// Google TTS audio from a non-Google domain. Direct new Audio(url) sends
// a Referer header that Google TTS blocks, producing a beep or error.
async function fetchTtsBlob(text: string, langCode: string): Promise<string | null> {
  const url =
    `https://translate.google.com/translate_tts` +
    `?client=gtx&ie=UTF-8&tl=${langCode}&q=${encodeURIComponent(text)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      referrerPolicy: "no-referrer",
      headers: {
        // Mimic a browser request so Google TTS returns audio
        Accept: "audio/mpeg, audio/*, */*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return null;

    const blob = await res.blob();
    if (!blob || blob.size < 100) return null; // sanity: a valid MP3 is at least ~100 bytes

    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────────
export function useReadAloud(text: string, langName: string) {
  const [speaking, setSpeaking] = useState(false);
  const [activeChunk, setActiveChunk] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track blob URLs so we can revoke them to free memory
  const blobUrlsRef = useRef<string[]>([]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const revokeBlobUrls = () => {
    for (const u of blobUrlsRef.current) {
      try { URL.revokeObjectURL(u); } catch {}
    }
    blobUrlsRef.current = [];
  };

  // ─── Stop ──────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    isSpeakingRef.current = false;
    clearTimer();

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.onplay = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.src = "";
        audioRef.current.load();
      } catch {}
      audioRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }

    revokeBlobUrls();
    setSpeaking(false);
    setActiveChunk(0);
  }, []);

  // ─── Speak ─────────────────────────────────────────────────────────────────
  const speak = useCallback(() => {
    if (speaking || isSpeakingRef.current) {
      stop();
      return;
    }

    stop();

    if (!text || !text.trim()) return;

    const tl = getLangCode(langName);
    const fullLocale = LANG_CODES[langName] || "en-IN";
    const sanitized = sanitizeTtsText(text, langName);
    const chunks = splitIntoChunks(sanitized);

    if (chunks.length === 0) return;

    setTotalChunks(chunks.length);
    setActiveChunk(1);
    setSpeaking(true);
    isSpeakingRef.current = true;

    // ── Web Speech fallback (offline / when Google TTS fails) ─────────────
    const playViaWebSpeech = (idx: number) => {
      if (!isSpeakingRef.current) return;
      if (idx >= chunks.length) { stop(); return; }

      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        stop();
        return;
      }

      setActiveChunk(idx + 1);

      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(chunks[idx]);
        utt.lang = fullLocale;
        utt.volume = 1.0;
        utt.rate = ["ta", "te", "kn"].includes(tl) ? 0.88 : 0.92;
        utt.pitch = 1.0;

        // Pick a matching voice if available
        const allVoices = window.speechSynthesis.getVoices();
        if (allVoices.length > 0) {
          const v =
            allVoices.find((v) => v.lang.toLowerCase().replace("_", "-") === fullLocale.toLowerCase()) ||
            allVoices.find((v) => v.lang.toLowerCase().startsWith(tl + "-")) ||
            allVoices.find((v) => v.lang.toLowerCase() === tl);
          if (v) utt.voice = v;
        }

        utt.onend = () => {
          if (!isSpeakingRef.current) return;
          if (idx + 1 < chunks.length) {
            clearTimer();
            timerRef.current = setTimeout(() => {
              if (isSpeakingRef.current) playViaWebSpeech(idx + 1);
            }, 80);
          } else {
            stop();
          }
        };

        utt.onerror = () => {
          if (!isSpeakingRef.current) return;
          if (idx + 1 < chunks.length) playViaWebSpeech(idx + 1);
          else stop();
        };

        window.speechSynthesis.speak(utt);
      } catch {
        stop();
      }
    };

    // ── Google TTS via blob fetch (primary, avoids Referer blocking) ──────
    const playViaGoogleTts = async (idx: number) => {
      if (!isSpeakingRef.current) return;
      if (idx >= chunks.length) { stop(); return; }

      setActiveChunk(idx + 1);

      const blobUrl = await fetchTtsBlob(chunks[idx], tl);

      // If fetch failed or speaking was stopped while fetching
      if (!isSpeakingRef.current) return;

      if (!blobUrl) {
        // Google TTS unavailable → use Web Speech
        console.warn(`[MooTracker TTS] Google TTS fetch failed for chunk ${idx + 1}, using Web Speech`);
        playViaWebSpeech(idx);
        return;
      }

      blobUrlsRef.current.push(blobUrl);

      try {
        const audio = new Audio(blobUrl);
        audio.volume = 1.0;
        audioRef.current = audio;

        audio.onplay = () => {
          if (isSpeakingRef.current) setSpeaking(true);
        };

        audio.onended = () => {
          if (!isSpeakingRef.current) return;
          audioRef.current = null;
          if (idx + 1 < chunks.length) {
            clearTimer();
            timerRef.current = setTimeout(() => {
              if (isSpeakingRef.current) playViaGoogleTts(idx + 1);
            }, 80);
          } else {
            stop();
          }
        };

        audio.onerror = () => {
          audioRef.current = null;
          if (!isSpeakingRef.current) return;
          console.warn(`[MooTracker TTS] Blob audio error on chunk ${idx + 1}, trying Web Speech`);
          playViaWebSpeech(idx);
        };

        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => {
            audioRef.current = null;
            if (isSpeakingRef.current) playViaWebSpeech(idx);
          });
        }
      } catch {
        if (isSpeakingRef.current) playViaWebSpeech(idx);
      }
    };

    // Start from chunk 0
    playViaGoogleTts(0);
  }, [text, langName, speaking, stop]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { speak, speaking, stop, activeChunk, totalChunks };
}
