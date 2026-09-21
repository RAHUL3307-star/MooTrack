import { useState, useRef, useCallback, useEffect } from "react";
import { LANG_CODES } from "./translations";

// Helper to sanitize & normalize text for crystal-clear TTS pronunciation across all languages
function sanitizeTtsText(text: string, langName: string): string {
  if (!text) return "";

  // 1. Remove all emojis and decorative pictorial glyphs that crash or confuse TTS engines
  let cleaned = text.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu,
    ""
  );

  // 2. Remove markdown formatting and unwanted punctuation
  cleaned = cleaned.replace(/[*_#~`|•·\\/→←↑↓]/g, " ");

  // 3. Language-specific acoustic normalizations
  const l = (langName || "").toLowerCase();
  const isTamil = l === "tamil" || l === "ta";
  const isHindi = l === "hindi" || l === "hi";
  const isKannada = l === "kannada" || l === "kn";
  const isTelugu = l === "telugu" || l === "te";
  const isMarathi = l === "marathi" || l === "mr";
  const isGujarati = l === "gujarati" || l === "gu";
  const isPunjabi = l === "punjabi" || l === "pa";

  if (isTamil) {
    cleaned = cleaned
      .replace(/\b(mS\/cm)\b/gi, " மில்லி சீமென்ஸ் ")
      .replace(/°C\b/g, " டிகிரி செல்சியஸ் ")
      .replace(/\bSCC\b/g, " எஸ் சி சி ")
      .replace(/\bHRI\b/g, " எச் ஆர் ஐ ")
      .replace(/\bRFID\b/g, " ஆர் எப் ஐ டி ")
      .replace(/\bIoT\b/g, " ஐ ஓ டி ")
      .replace(/\bESP32\b/gi, " இ எஸ் பி முப்பத்தி இரண்டு ")
      .replace(/\bpH\b/gi, " பி எச் ")
      .replace(/%/g, " சதவீதம் ")
      .replace(/\bDr\.\b/g, "டாக்டர் ");
  } else if (isHindi) {
    cleaned = cleaned
      .replace(/\b(mS\/cm)\b/gi, " मिली सीमेंस ")
      .replace(/°C\b/g, " डिग्री सेल्सियस ")
      .replace(/\bSCC\b/g, " एस सी सी ")
      .replace(/\bHRI\b/g, " एच आर आई ")
      .replace(/\bRFID\b/g, " आर एफ आई डी ")
      .replace(/\bIoT\b/g, " आई ओ टी ")
      .replace(/\bESP32\b/gi, " ई एस पी बत्तीस ")
      .replace(/\bpH\b/gi, " पी एच ")
      .replace(/%/g, " प्रतिशत ")
      .replace(/\bDr\.\b/g, "डॉक्टर ");
  } else if (isKannada) {
    cleaned = cleaned
      .replace(/\b(mS\/cm)\b/gi, " ಮಿಲ್ಲಿ ಸೀಮೆನ್ಸ್ ")
      .replace(/°C\b/g, " ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ")
      .replace(/\bSCC\b/g, " ಎಸ್ ಸಿ ಸಿ ")
      .replace(/\bHRI\b/g, " ಎಚ್ ಆರ್ ಐ ")
      .replace(/\bRFID\b/g, " ಆರ್ ಎಫ್ ಐ ಡಿ ")
      .replace(/\bIoT\b/g, " ಐ ಓ ಟಿ ")
      .replace(/\bESP32\b/gi, " ಈ ಎಸ್ ಪಿ ಮೂವತ್ತೆರಡು ")
      .replace(/\bpH\b/gi, " ಪಿ ಎಚ್ ")
      .replace(/%/g, " ಪ್ರತಿಶತ ");
  } else if (isTelugu) {
    cleaned = cleaned
      .replace(/\b(mS\/cm)\b/gi, " మిల్లీ సీమెన్స్ ")
      .replace(/°C\b/g, " డిగ్రీల సెల్సియస్ ")
      .replace(/\bSCC\b/g, " ఎస్ సి సి ")
      .replace(/\bHRI\b/g, " హెచ్ ఆర్ ఐ ")
      .replace(/\bRFID\b/g, " ఆర్ ఎఫ్ ఐ డి ")
      .replace(/\bIoT\b/g, " ఐ ఓ టి ")
      .replace(/\bESP32\b/gi, " ఈ ఎస్ పి ముప్పై రెండు ")
      .replace(/\bpH\b/gi, " పి హెచ్ ")
      .replace(/%/g, " శాతం ");
  } else if (isMarathi) {
    cleaned = cleaned
      .replace(/\b(mS\/cm)\b/gi, " मिली सीमेन्स ")
      .replace(/°C\b/g, " अंश सेल्सिअस ")
      .replace(/\bSCC\b/g, " एस सी सी ")
      .replace(/\bHRI\b/g, " एच आर आय ")
      .replace(/\bRFID\b/g, " आर एफ आय डी ")
      .replace(/\bESP32\b/gi, " ई एस पी बत्तीस ")
      .replace(/%/g, " टक्के ");
  } else if (isGujarati) {
    cleaned = cleaned
      .replace(/\b(mS\/cm)\b/gi, " મિલી સિમેન્સ ")
      .replace(/°C\b/g, " ડિગ્રી સેલ્સિયસ ")
      .replace(/\bSCC\b/g, " એસ સી સી ")
      .replace(/\bHRI\b/g, " એચ આર આઈ ")
      .replace(/\bRFID\b/g, " આર એફ આઈ ડી ")
      .replace(/\bESP32\b/gi, " ઈ એસ પી બત્રીસ ")
      .replace(/%/g, " ટકા ");
  } else if (isPunjabi) {
    cleaned = cleaned
      .replace(/\b(mS\/cm)\b/gi, " ਮਿਲੀ ਸੀਮੈਂਸ ")
      .replace(/°C\b/g, " ਡਿਗਰੀ ਸੈਲਸੀਅਸ ")
      .replace(/\bSCC\b/g, " ਐਸ ਸੀ ਸੀ ")
      .replace(/\bHRI\b/g, " ਐਚ ਆਰ ਆਈ ")
      .replace(/\bRFID\b/g, " ਆਰ ਐਫ ਆਈ ਡੀ ")
      .replace(/\bESP32\b/gi, " ਈ ਐਸ ਪੀ ਬੱਤੀ ")
      .replace(/%/g, " ਪ੍ਰਤੀਸ਼ਤ ");
  } else {
    // English
    cleaned = cleaned
      .replace(/\b(mS\/cm)\b/gi, " milli Siemens per centimeter ")
      .replace(/°C\b/g, " degrees Celsius ")
      .replace(/\bSCC\b/g, " S C C ")
      .replace(/\bHRI\b/g, " H R I ")
      .replace(/\bRFID\b/g, " R F I D ")
      .replace(/\bIoT\b/g, " I O T ")
      .replace(/\bESP32\b/gi, " E S P thirty-two ")
      .replace(/\bpH\b/gi, " p H ")
      .replace(/%/g, " percent ");
  }

  // Normalize cow identifiers (KA-001 -> KA 001)
  cleaned = cleaned.replace(/\b([A-Z]{2})-(\d{2,4})\b/g, "$1 $2");

  // Clean brackets and redundant symbols
  cleaned = cleaned.replace(/[()[\]{}"'“”`~@$^&*+=<>]/g, " ");

  // Consolidate extra whitespace
  return cleaned.replace(/\s+/g, " ").trim();
}

// Split text into natural, bite-sized spoken clauses (<110 characters)
// This guarantees Google TTS never truncates or drops text and plays with high fidelity
function splitIntoTtsChunks(text: string): string[] {
  if (!text) return [];

  // Split on punctuation boundaries: periods, exclamation marks, question marks, danda, colons, semicolons
  const majorParts = text.split(/([.!?।;:\n]+)/);
  const clauses: string[] = [];

  for (let i = 0; i < majorParts.length; i += 2) {
    const clause = (majorParts[i] || "").trim();
    const punct = majorParts[i + 1] || "";
    const combined = (clause + (punct.trim() ? " " : "")).trim();
    if (!combined) continue;

    // If this clause is longer than 110 characters, split further at commas or spaces
    if (combined.length > 110) {
      const subParts = combined.split(/([,]+|\s{2,})/);
      let subCurrent = "";
      for (const part of subParts) {
        if (!part.trim()) continue;
        if ((subCurrent + " " + part).trim().length > 110) {
          if (subCurrent.trim()) clauses.push(subCurrent.trim());
          subCurrent = part.trim();
        } else {
          subCurrent = subCurrent ? subCurrent + " " + part.trim() : part.trim();
        }
      }
      if (subCurrent.trim()) clauses.push(subCurrent.trim());
    } else {
      clauses.push(combined);
    }
  }

  // Combine small clauses so we don't have choppy 2-word chunks
  const chunks: string[] = [];
  let current = "";

  for (const clause of clauses) {
    if ((current + " " + clause).trim().length > 110) {
      if (current.trim()) chunks.push(current.trim());
      current = clause;
    } else {
      current = current ? current + " " + clause : clause;
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
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const currentChunkIndexRef = useRef<number>(0);
  const allChunksRef = useRef<string[]>([]);
  const timerRef = useRef<any>(null);

  const langCodeMap: Record<string, string> = {
    tamil: "ta",
    hindi: "hi",
    kannada: "kn",
    telugu: "te",
    english: "en",
    marathi: "mr",
    gujarati: "gu",
    punjabi: "pa",
  };

  const getLangCode = (name: string): string => {
    const key = (name || "").toLowerCase().trim();
    return langCodeMap[key] || "en";
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    isSpeakingRef.current = false;
    clearTimer();

    // Stop current playing audio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      } catch {}
      audioRef.current = null;
    }

    // Clear preloaded next audio
    if (nextAudioRef.current) {
      try {
        nextAudioRef.current.pause();
        nextAudioRef.current.src = "";
      } catch {}
      nextAudioRef.current = null;
    }

    // Cancel Web Speech API if active
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    setSpeaking(false);
    setActiveChunk(0);
  }, []);

  const speak = useCallback(() => {
    // If already speaking, clicking toggles off
    if (speaking || isSpeakingRef.current) {
      stop();
      return;
    }

    stop();

    if (!text || !text.trim()) return;

    const tl = getLangCode(langName);
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

    // Preloader for chunk at index N
    const preloadChunk = (idx: number): HTMLAudioElement | null => {
      if (idx >= chunks.length || !isSpeakingRef.current) return null;
      const url = `https://translate.google.com/translate_tts?client=tw-ob&ie=UTF-8&tl=${tl}&q=${encodeURIComponent(chunks[idx])}`;
      try {
        const audio = new Audio();
        audio.referrerPolicy = "no-referrer";
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";
        audio.src = url;
        return audio;
      } catch {
        return null;
      }
    };

    // Primary High-Fidelity Audio Stream Engine
    const playChunkViaAudio = (idx: number, existingAudio?: HTMLAudioElement | null) => {
      if (!isSpeakingRef.current) return;
      if (idx >= chunks.length) {
        stop();
        return;
      }

      currentChunkIndexRef.current = idx;
      setActiveChunk(idx + 1);

      const textChunk = chunks[idx];
      const audioUrl = `https://translate.google.com/translate_tts?client=tw-ob&ie=UTF-8&tl=${tl}&q=${encodeURIComponent(textChunk)}`;

      try {
        const audio = existingAudio || new Audio();
        audio.referrerPolicy = "no-referrer";
        audio.crossOrigin = "anonymous";
        if (!existingAudio) {
          audio.src = audioUrl;
        }
        audioRef.current = audio;

        // Preload next chunk in advance for seamless transition without stutter
        if (idx + 1 < chunks.length) {
          nextAudioRef.current = preloadChunk(idx + 1);
        } else {
          nextAudioRef.current = null;
        }

        audio.onplay = () => {
          if (isSpeakingRef.current) {
            setSpeaking(true);
          }
        };

        audio.onended = () => {
          if (!isSpeakingRef.current) return;
          if (idx + 1 < chunks.length) {
            // Small natural breath pause between clauses (60ms)
            clearTimer();
            timerRef.current = setTimeout(() => {
              if (isSpeakingRef.current) {
                const nextAudio = nextAudioRef.current;
                nextAudioRef.current = null;
                playChunkViaAudio(idx + 1, nextAudio);
              }
            }, 60);
          } else {
            stop();
          }
        };

        audio.onerror = (e) => {
          console.warn(`[TTS Audio] Chunk ${idx + 1} stream error:`, e);
          // Attempt Web Speech API fallback for this chunk
          playChunkViaWebSpeech(idx);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn(`[TTS Audio] Chunk ${idx + 1} play error:`, err);
            playChunkViaWebSpeech(idx);
          });
        }
      } catch (err) {
        console.warn("[TTS Audio] Audio initialization failed:", err);
        playChunkViaWebSpeech(idx);
      }
    };

    // Secondary Engine: Web Speech API (Local / Offline Fallback)
    const playChunkViaWebSpeech = (idx: number) => {
      if (!isSpeakingRef.current) return;
      if (idx >= chunks.length) {
        stop();
        return;
      }

      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        // Can't speak via Web Speech either, advance or stop cleanly
        if (idx + 1 < chunks.length) {
          playChunkViaAudio(idx + 1);
        } else {
          stop();
        }
        return;
      }

      currentChunkIndexRef.current = idx;
      setActiveChunk(idx + 1);

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(chunks[idx]);
        utterance.lang = fullLocale;
        utterance.rate = tl === "ta" || tl === "te" || tl === "kn" ? 0.90 : 0.95;
        utterance.pitch = 1.0;

        // Try selecting matching voice if installed
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const matched = voices.find((v) => {
            const l = v.lang.toLowerCase().replace("_", "-");
            return l === fullLocale.toLowerCase() || l.startsWith(tl + "-") || l === tl;
          });
          if (matched) utterance.voice = matched;
        }

        utterance.onstart = () => {
          if (isSpeakingRef.current) setSpeaking(true);
        };

        utterance.onend = () => {
          if (!isSpeakingRef.current) return;
          if (idx + 1 < chunks.length) {
            clearTimer();
            timerRef.current = setTimeout(() => {
              if (isSpeakingRef.current) {
                playChunkViaAudio(idx + 1);
              }
            }, 60);
          } else {
            stop();
          }
        };

        utterance.onerror = (err) => {
          console.warn("[WebSpeech] Utterance failed:", err);
          if (!isSpeakingRef.current) return;
          if (idx + 1 < chunks.length) {
            playChunkViaAudio(idx + 1);
          } else {
            stop();
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[WebSpeech] Failed:", err);
        stop();
      }
    };

    // Start playing first chunk immediately
    playChunkViaAudio(0);
  }, [text, langName, speaking, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { speak, speaking, stop, activeChunk, totalChunks };
}
