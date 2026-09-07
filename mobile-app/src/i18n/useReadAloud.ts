import { useState, useRef, useCallback, useEffect } from "react";
import { LANG_CODES } from "./translations";

export function useReadAloud(text: string, langName: string) {
  const [speaking, setSpeaking] = useState(false);
  const [activeChunk, setActiveChunk] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeaking(false);
    setActiveChunk(0);
  }, []);

  const speak = useCallback(() => {
    if (speaking) {
      stop();
      return;
    }
    stop();

    const langCodeMap: Record<string, string> = {
      "Tamil": "ta",
      "Hindi": "hi",
      "Kannada": "kn",
      "Telugu": "te",
      "English": "en",
      "Marathi": "mr",
      "Gujarati": "gu",
      "Punjabi": "pa",
    };
    const tl = langCodeMap[langName] || "en";
    const fullLocale = LANG_CODES[langName] || "en-IN";

    // 1. Check if browser has a native voice for this specific language
    let foundNativeVoice: SpeechSynthesisVoice | null = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        foundNativeVoice = voices.find(v => {
          const l = v.lang.toLowerCase().replace('_', '-');
          return l === fullLocale.toLowerCase() || l.startsWith(tl + "-") || l === tl;
        }) || null;

        if (!foundNativeVoice) {
          foundNativeVoice = voices.find(v => {
            const nameLower = v.name.toLowerCase();
            return (
              (tl === "ta" && (nameLower.includes("tamil") || nameLower.includes("valluvar") || nameLower.includes("pallavi"))) ||
              (tl === "hi" && (nameLower.includes("hindi") || nameLower.includes("swara") || nameLower.includes("madhur") || nameLower.includes("kalpana"))) ||
              (tl === "kn" && (nameLower.includes("kannada") || nameLower.includes("gagan") || nameLower.includes("sapna"))) ||
              (tl === "te" && (nameLower.includes("telugu") || nameLower.includes("mohan") || nameLower.includes("chitra"))) ||
              (tl === "en" && (nameLower.includes("india") || nameLower.includes("en-in") || nameLower.includes("english")))
            );
          }) || null;
        }
      }
    }

    // 2. If valid native voice exists and is authentic (non-English when language is not English):
    if (foundNativeVoice && (tl === "en" || !foundNativeVoice.lang.toLowerCase().startsWith("en"))) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.voice = foundNativeVoice;
      utt.lang = foundNativeVoice.lang;
      utt.rate = 0.88;
      utt.pitch = 1.0;
      utt.onstart = () => setSpeaking(true);
      utt.onend = () => { setSpeaking(false); setActiveChunk(0); };
      utt.onerror = () => { setSpeaking(false); setActiveChunk(0); };
      utterRef.current = utt;
      window.speechSynthesis.speak(utt);
      setSpeaking(true);
      return;
    }

    // 3. Guaranteed fallback: Stream authentic human neural audio via /api/tts endpoint
    const cleanText = text.replace(/[\n\r]+/g, " ").trim();
    // Split into sentences / natural chunks
    const sentences = cleanText.match(/[^.!?।]+[.!?।]?/g) || [cleanText];
    const chunks: string[] = [];
    let cur = "";
    for (const s of sentences) {
      if ((cur + " " + s).trim().length > 150) {
        if (cur) chunks.push(cur.trim());
        cur = s;
      } else {
        cur = (cur + " " + s).trim();
      }
    }
    if (cur) chunks.push(cur.trim());

    if (chunks.length === 0) return;

    setTotalChunks(chunks.length);
    setSpeaking(true);
    setActiveChunk(1);

    const playChunk = (idx: number) => {
      if (idx >= chunks.length) {
        setSpeaking(false);
        setActiveChunk(0);
        return;
      }
      setActiveChunk(idx + 1);
      const textToPlay = chunks[idx];
      const proxyUrl = `/api/tts?tl=${tl}&text=${encodeURIComponent(textToPlay)}`;
      const audio = new Audio(proxyUrl);
      audioRef.current = audio;

      audio.onended = () => {
        playChunk(idx + 1);
      };

      audio.onerror = () => {
        // Direct Google TTS fallback if proxy was blocked
        const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(textToPlay)}`;
        const fallback = new Audio(directUrl);
        audioRef.current = fallback;
        fallback.onended = () => playChunk(idx + 1);
        fallback.onerror = () => {
          setSpeaking(false);
          setActiveChunk(0);
        };
        fallback.play().catch(() => {
          setSpeaking(false);
          setActiveChunk(0);
        });
      };

      audio.play().catch(e => {
        console.warn("Audio playback interrupted or blocked", e);
        setSpeaking(false);
        setActiveChunk(0);
      });
    };

    playChunk(0);
  }, [text, langName, speaking, stop]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      stop();
    };
  }, [stop]);

  return { speak, speaking, stop, activeChunk, totalChunks };
}
