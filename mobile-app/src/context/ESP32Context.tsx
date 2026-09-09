import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ESP32ContextType, ESP32State, ESP32Telemetry, ESP32Notification } from "../types/esp32";
import { logTelemetry } from "../services/telemetryService";

// ─── Default State ────────────────────────────────────────────────────────────
const DEFAULT_STATE: ESP32ContextType = {
  isLive: false,
  connected: false,
  deviceId: "",
  baudRate: 115200,
  source: "lan-wifi",
  lastTelemetry: null,
  notification: null,
  dismissNotification: () => {},
  connectUsbSerial: async () => {},
  toggleEsp32: async () => {},
  dismissBanner: () => {},
  bannerDismissed: false,
  setBannerDismissed: () => {},
};

export const ESP32Context = createContext<ESP32ContextType>(DEFAULT_STATE);

export function useESP32() {
  return useContext(ESP32Context);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ESP32Provider({ children }: { children: React.ReactNode }) {
  const [esp32State, setEsp32State] = useState<ESP32State>({
    isLive: false,
    connected: false,
    deviceId: "",
    baudRate: 115200,
    source: "lan-wifi",
    lastTelemetry: null,
  });

  const [notification, setNotification] = useState<ESP32Notification | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Transition tracking refs so notifications ONLY trigger once per real state transition
  const prevLiveRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const autoDismissTimerRef = useRef<any>(null);

  const triggerNotification = useCallback((n: ESP32Notification) => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    setNotification(n);
    // Automatically dismiss the popup after 4.5 seconds
    autoDismissTimerRef.current = setTimeout(() => {
      setNotification((curr) => (curr?.id === n.id ? null : curr));
    }, 4500);
  }, []);

  const dismissNotification = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    setNotification(null);
  }, []);

  // Connect to SSE stream (/api/esp32/stream) with fallback polling
  useEffect(() => {
    let sseSource: EventSource | null = null;
    let pollInterval: any = null;

    const applyTelemetryData = (data: any) => {
      if (!data) return;
      const nextLive = !!(data.isLive && data.lastTelemetry);

      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        prevLiveRef.current = nextLive;
      }

      if (nextLive && data.lastTelemetry) {
        const raw = data.lastTelemetry;
        const tel: ESP32Telemetry = {
          cowId: raw.cowId || "KA-001",
          rfidTag: raw.rfidTag,
          temp: raw.temp || 38.5,
          ph: raw.ph,
          conductivity: raw.ec ?? raw.conductivity ?? 5.0,
          ec_fl: raw.ec_fl,
          ec_fr: raw.ec_fr,
          ec_rl: raw.ec_rl,
          ec_rr: raw.ec_rr,
          quarterRatio: raw.quarterRatio,
          thermalAsymmetry: raw.thermalAsymmetry,
          weight: raw.weight,
          activity: raw.activity,
          shedTemp: raw.shedTemp,
          humidity: raw.humidity,
          battery: raw.battery,
          rssi: data.rssi || raw.rssi,
          riskScore: raw.riskScore,
          riskTier: raw.riskTier,
          timestamp: raw.timestamp || new Date().toLocaleTimeString(),
        };

        setEsp32State((prev) => ({
          isLive: true,
          connected: true,
          deviceId: data.deviceId || prev.deviceId || "ESP32-CLINICAL",
          baudRate: 115200,
          source: data.connectionType || prev.source || "WiFi Direct",
          lastTelemetry: tel,
        }));

        if (!prevLiveRef.current) {
          prevLiveRef.current = true;
          triggerNotification({
            id: Date.now(),
            type: "connected",
            deviceId: data.deviceId || "ESP32-WROOM32",
            source: data.connectionType || "WiFi SSE Stream",
            cowId: tel.cowId,
            rfidTag: tel.rfidTag,
            temp: tel.temp,
            ph: tel.ph,
            conductivity: tel.conductivity,
            weight: tel.weight,
          });
        }
      } else if (!nextLive && prevLiveRef.current) {
        prevLiveRef.current = false;
        setEsp32State((prev) => ({
          ...prev,
          isLive: false,
          connected: false,
        }));
        triggerNotification({
          id: Date.now(),
          type: "disconnected",
          deviceId: esp32State.deviceId || "ESP32-HARDWARE-WROOM32",
          source: "lan-wifi",
          message: "Hardware telemetry stream disconnected. Resilient offline mode active.",
        });
      }
    };

    // Try EventSource first for real-time push streaming
    try {
      if (typeof window !== "undefined" && "EventSource" in window) {
        sseSource = new EventSource("/api/esp32/stream");
        sseSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            applyTelemetryData(parsed);
          } catch (err) {
            console.warn("Error parsing SSE telemetry:", err);
          }
        };
        sseSource.onerror = () => {
          if (sseSource) {
            sseSource.close();
            sseSource = null;
          }
        };
      }
    } catch {
      // SSE unsupported or blocked
    }

    // Polling fallback
    const checkServerStatus = async () => {
      try {
        const res = await fetch("/api/esp32/status", { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          applyTelemetryData(data);
        }
      } catch {
        // Offline / server not reachable
      }
    };

    checkServerStatus();
    pollInterval = setInterval(checkServerStatus, 3500);

    return () => {
      if (sseSource) sseSource.close();
      if (pollInterval) clearInterval(pollInterval);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    };
  }, [triggerNotification, esp32State.deviceId]);

  // Persist live telemetry to Supabase whenever it updates
  useEffect(() => {
    if (esp32State.isLive && esp32State.lastTelemetry) {
      logTelemetry(esp32State.deviceId, esp32State.lastTelemetry);
    }
  }, [esp32State.lastTelemetry, esp32State.isLive, esp32State.deviceId]);

  // ── Web Serial USB Connection (115200 baud) ─────────────────────────────────
  const connectUsbSerial = useCallback(async () => {
    if (!("serial" in navigator)) {
      alert("Web Serial is supported in Google Chrome & Edge. You can also connect via WiFi or use the Simulate Live button.");
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      
      prevLiveRef.current = true;
      setEsp32State({
        isLive: true,
        connected: true,
        deviceId: "ESP32-USB-COM",
        source: "usb-serial",
        baudRate: 115200,
        lastTelemetry: {
          cowId: "KA-001",
          temp: 38.5,
          ph: 6.7,
          conductivity: 5.0,
          weight: 0,
          activity: 55,
          shedTemp: 32.4,
          humidity: 68,
          battery: 94,
          rssi: -58,
          timestamp: "Just now",
        },
      });

      triggerNotification({
        id: Date.now(),
        type: "connected",
        deviceId: "ESP32-USB-COM",
        source: "USB Serial (115200 Baud)",
        cowId: "KA-001",
        temp: 38.5,
        ph: 6.7,
        conductivity: 5.0,
      });

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = "";
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                try {
                  const parsed = JSON.parse(line.trim());
                  if (parsed.cowId || parsed.temp) {
                    const telemetry: ESP32Telemetry = {
                      cowId: parsed.cowId || "KA-001",
                      rfidTag: parsed.rfid || parsed.rfidTag,
                      temp: parsed.temp || 38.5,
                      ph: parsed.ph,
                      conductivity: parsed.ec || parsed.conductivity || 5.0,
                      weight: parsed.weight,
                      activity: parsed.activity,
                      shedTemp: parsed.shedTemp,
                      humidity: parsed.humidity,
                      battery: parsed.battery || 92,
                      rssi: parsed.rssi || -60,
                      timestamp: new Date().toLocaleTimeString(),
                    };
                    setEsp32State((prev) => ({ ...prev, isLive: true, lastTelemetry: telemetry }));
                  }
                } catch (_) {}
              }
            }
          }
        } catch (e) {
          console.warn("Serial stream closed", e);
          prevLiveRef.current = false;
          setEsp32State((prev) => ({ ...prev, isLive: false, connected: false }));
          triggerNotification({
            id: Date.now(),
            type: "disconnected",
            deviceId: "ESP32-USB-COM",
            source: "usb-serial",
            message: "USB serial port disconnected.",
          });
        }
      })();
    } catch (err: any) {
      if (err.name !== "NotFoundError") {
        alert("ESP32 USB connection failed: " + (err.message || err));
      }
    }
  }, [triggerNotification]);

  // ── Toggle Simulation ───────────────────────────────────────────────────────
  const toggleEsp32 = useCallback(async () => {
    const nextLive = !esp32State.isLive;
    prevLiveRef.current = nextLive;

    try {
      await fetch(nextLive ? "/api/esp32/connect" : "/api/esp32/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: "ESP32-HARDWARE-WROOM32",
          baudRate: 115200,
          telemetry: { cowId: "KA-001", temp: 39.4, ph: 6.7, conductivity: 6.85, weight: 12.4, humidity: 84, battery: 94, rssi: -58 },
        }),
      });
    } catch (_) {}

    setEsp32State((prev) => ({
      ...prev,
      isLive: nextLive,
      connected: nextLive,
      deviceId: nextLive ? "ESP32-WROOM32" : "",
      lastTelemetry: nextLive
        ? {
            cowId: "KA-001",
            temp: 38.5,
            ph: 6.7,
            conductivity: 5.0,
            weight: 12.4,
            activity: 55,
            shedTemp: 32.4,
            humidity: 68,
            battery: 94,
            rssi: -58,
            timestamp: new Date().toLocaleTimeString(),
          }
        : null,
    }));

    triggerNotification({
      id: Date.now(),
      type: nextLive ? "connected" : "disconnected",
      deviceId: "ESP32-WROOM32",
      source: "Simulation / LAN",
      cowId: "KA-001",
      temp: 38.5,
      ph: 6.7,
      conductivity: 5.0,
      message: nextLive ? undefined : "ESP32 disconnected. Resilient offline fallback active.",
    });
  }, [esp32State.isLive, triggerNotification]);

  return (
    <ESP32Context.Provider
      value={{
        ...esp32State,
        notification,
        dismissNotification,
        connectUsbSerial,
        toggleEsp32,
        dismissBanner: () => setBannerDismissed(true),
        bannerDismissed,
        setBannerDismissed,
      }}
    >
      {children}
    </ESP32Context.Provider>
  );
}
