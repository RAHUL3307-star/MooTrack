import { useState, useRef, useCallback, useEffect } from "react";
import { LANG_CODES } from "./translations";

// Helper to sanitize & normalize text for smooth TTS pronunciation across languages
function sanitizeTtsText(text: string, langName: string): string {
  let cleaned = text
    .replace(/\b(mS\/cm)\b/gi, langName === "Tamil" ? "மில்லி சீமென்ஸ்" : langName === "Hindi" ? "मिली सीमेंस" : "milli-Siemens per centimeter")
    .replace(/°C\b/g, langName === "Tamil" ? " டிகிரி செல்சியஸ்" : langName === "Hindi" ? " डिग्री सेल्सियस" : " degrees Celsius")
    .replace(/\bSCC\b/g, langName === "Tamil" ? "எஸ் சி சி" : langName === "Hindi" ? "एस सी सी" : "S C C")
    .replace(/\bHRI\b/g, langName === "Tamil" ? "எச் ஆர் ஐ" : langName === "Hindi" ? "एच आर आई" : "H R I")
    .replace(/\bRFID\b/g, langName === "Tamil" ? "ஆர் எப் ஐ டி" : langName === "Hindi" ? "आर एफ आई डी" : "R F I D")
    .replace(/\bIoT\b/g, "I O T")
    .replace(/\bpH\b/gi, langName === "Tamil" ? "பி எச்" : langName === "Hindi" ? "पी एच" : "p H")
    .replace(/\b([A-Z]{2})-(\d{3})\b/g, "$1 $2") // e.g. KA-001 -> KA 001
    .replace(/%/g, langName === "Tamil" ? " சதவீதம் " : langName === "Hindi" ? " प्रतिशत " : " percent ")
    .replace(/[()[\]{}"'“”`~@#$%^&*+=<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

// Split text into natural, digestible clauses (~100-130 chars max for optimal audio streaming)
function splitIntoTtsChunks(text: string): string[] {
  if (!text) return [];
  const segments = text.split(/([.,!?।;:\n]+)/);
  const chunks: string[] = [];
  let current = "";

  for (let i = 0; i < segments.length; i += 2) {
    const clause = segments[i]?.trim() || "";
    const punct = segments[i + 1] || "";
    const combined = (clause + punct).trim();
    if (!combined) continue;

    if ((current + " " + combined).trim().length > 120) {
      if (current.trim()) chunks.push(current.trim());
      current = combined;
    } else {
      current = current ? current + " " + combined : combined;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

export function useReadAloud(text: string, langName: string) {
  const [speaking, setSpeaking] = useState(false);
  const [activeChunk, setActiveChunk] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const currentChunkIndexRef = useRef<number>(0);
  const allChunksRef = useRef<string[]>([]);
  const keepAliveTimerRef = useRef<number | null>(null);

  const langCodeMap: Record<string, string> = {
    Tamil: "ta",
    Hindi: "hi",
    Kannada: "kn",
    Telugu: "te",
    English: "en",
    Marathi: "mr",
    Gujarati: "gu",
    Punjabi: "pa",
  };

  const clearKeepAlive = () => {
    if (keepAliveTimerRef.current !== null) {
      window.clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    isSpeakingRef.current = false;
    clearKeepAlive();

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
      audioRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    setSpeaking(false);
    setActiveChunk(0);
  }, []);

  const speak = useCallback(() => {
    if (speaking || isSpeakingRef.current) {
      stop();
      return;
    }

    stop();

    if (!text || !text.trim()) return;

    const tl = langCodeMap[langName] || "en";
    const fullLocale = LANG_CODES[langName] || "en-IN";

    const sanitized = sanitizeTtsText(text, langName);
    const chunks = splitIntoTtsChunks(sanitized);

    if (chunks.length === 0) return;

    allChunksRef.current = chunks;
    currentChunkIndexRef.current = 0;
    setTotalChunks(chunks.length);
    setActiveChunk(1);
    setSpeaking(true);
    isSpeakingRef.current = true;

    // Primary Engine: Authentic High-Fidelity Audio Stream (Google Neural TTS - client=gtx)
    // Works flawlessly for Tamil, Hindi, Telugu, Kannada, English, Marathi, Gujarati on all devices
    const playChunkViaAudio = (idx: number) => {
      if (!isSpeakingRef.current) return;
      if (idx >= chunks.length) {
        stop();
        return;
      }

      currentChunkIndexRef.current = idx;
      setActiveChunk(idx + 1);

      const textChunk = chunks[idx];
      const audioUrl = `https://translate.google.com/translate_tts?client=gtx&ie=UTF-8&tl=${tl}&q=${encodeURIComponent(textChunk)}`;

      try {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          if (isSpeakingRef.current) {
            setSpeaking(true);
          }
        };

        audio.onended = () => {
          if (!isSpeakingRef.current) return;
          if (idx + 1 < chunks.length) {
            setTimeout(() => {
              if (isSpeakingRef.current) {
                playChunkViaAudio(idx + 1);
              }
            }, 80);
          } else {
            stop();
          }
        };

        audio.onerror = (e) => {
          console.warn("[TTS Audio] Stream error, trying Web Speech API fallback:", e);
          // Fallback to Web Speech API if offline or network stream fails
          playChunkViaWebSpeech(idx);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("[TTS Audio] Autoplay/Audio error, falling back to Web Speech:", err);
            playChunkViaWebSpeech(idx);
          });
        }
      } catch (err) {
        console.warn("[TTS Audio] Audio init error:", err);
        playChunkViaWebSpeech(idx);
      }
    };

    // Secondary Engine: Web Speech API (Offline / Local Fallback)
    const playChunkViaWebSpeech = (idx: number) => {
      if (!isSpeakingRef.current) return;
      if (idx >= chunks.length) {
        stop();
        return;
      }

      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        stop();
        return;
      }

      currentChunkIndexRef.current = idx;
      setActiveChunk(idx + 1);

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(chunks[idx]);
        utterance.lang = fullLocale;
        utterance.rate = langName === "Tamil" || langName === "Telugu" || langName === "Kannada" ? 0.92 : 0.96;
        utterance.pitch = 1.0;

        // Try finding a matching voice if available
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const matched = voices.find((v) => {
            const l = v.lang.toLowerCase().replace("_", "-");
            return l === fullLocale.toLowerCase() || l.startsWith(tl + "-") || l === tl;
          });
          if (matched) {
            utterance.voice = matched;
          }
        }

        utterance.onstart = () => {
          if (isSpeakingRef.current) {
            setSpeaking(true);
          }
        };

        utterance.onend = () => {
          if (!isSpeakingRef.current) return;
          if (idx + 1 < chunks.length) {
            setTimeout(() => {
              if (isSpeakingRef.current) {
                playChunkViaAudio(idx + 1); // Resume audio streaming for next chunk
              }
            }, 80);
          } else {
            stop();
          }
        };

        utterance.onerror = (err) => {
          console.warn("[WebSpeech] Utterance error:", err);
          if (!isSpeakingRef.current) return;
          if (idx + 1 < chunks.length) {
            playChunkViaAudio(idx + 1);
          } else {
            stop();
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[WebSpeech] Utterance failed:", err);
        stop();
      }
    };

    // Start with high-quality authentic native stream
    playChunkViaAudio(0);
  }, [text, langName, speaking, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { speak, speaking, stop, activeChunk, totalChunks };
}
