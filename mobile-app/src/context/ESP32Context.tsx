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

  // Poll /api/esp32/status every 3s to detect real hardware without repeating popups
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const res = await fetch("/api/esp32/status", { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          const nextLive = !!(data.isLive && data.lastTelemetry);

          if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            prevLiveRef.current = nextLive;
            if (nextLive) {
              setEsp32State({
                isLive: true,
                connected: true,
                deviceId: data.deviceId || "ESP32-WIFI-CLIENT",
                baudRate: 115200,
                source: data.connectionType || "WiFi Direct",
                lastTelemetry: {
                  cowId: data.lastTelemetry.cowId || "KA-001",
                  temp: data.lastTelemetry.temp || 39.4,
                  conductivity: data.lastTelemetry.ec || data.lastTelemetry.conductivity || 5.32,
                  scc: data.lastTelemetry.scc || 485000,
                  humidity: data.lastTelemetry.humidity,
                  battery: data.lastTelemetry.battery,
                  rssi: data.rssi,
                  timestamp: new Date().toLocaleTimeString(),
                },
              });
            }
            return;
          }

          // ONLY trigger notification if state actually changed!
          if (nextLive !== prevLiveRef.current) {
            prevLiveRef.current = nextLive;
            if (nextLive) {
              const tel = {
                cowId: data.lastTelemetry.cowId || "KA-001",
                temp: data.lastTelemetry.temp || 39.4,
                conductivity: data.lastTelemetry.ec || data.lastTelemetry.conductivity || 5.32,
                scc: data.lastTelemetry.scc || 485000,
                humidity: data.lastTelemetry.humidity,
                battery: data.lastTelemetry.battery,
                rssi: data.rssi,
                timestamp: new Date().toLocaleTimeString(),
              };
              setEsp32State({
                isLive: true,
                connected: true,
                deviceId: data.deviceId || "ESP32-WIFI-CLIENT",
                baudRate: 115200,
                source: data.connectionType || "WiFi Direct",
                lastTelemetry: tel,
              });
              triggerNotification({
                id: Date.now(),
                type: "connected",
                deviceId: data.deviceId || "ESP32-WIFI-CLIENT",
                source: "WiFi Direct",
                cowId: tel.cowId,
                temp: tel.temp,
                conductivity: tel.conductivity,
              });
            } else {
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
          } else if (nextLive && data.lastTelemetry) {
            // Keep telemetry updated silently without re-popping the banner
            setEsp32State((prev) => ({
              ...prev,
              lastTelemetry: {
                cowId: data.lastTelemetry.cowId || prev.lastTelemetry?.cowId || "KA-001",
                temp: data.lastTelemetry.temp || prev.lastTelemetry?.temp || 39.4,
                conductivity: data.lastTelemetry.ec || data.lastTelemetry.conductivity || prev.lastTelemetry?.conductivity || 5.32,
                scc: data.lastTelemetry.scc || prev.lastTelemetry?.scc || 485000,
                humidity: data.lastTelemetry.humidity ?? prev.lastTelemetry?.humidity,
                battery: data.lastTelemetry.battery ?? prev.lastTelemetry?.battery,
                rssi: data.rssi ?? prev.lastTelemetry?.rssi,
                timestamp: new Date().toLocaleTimeString(),
              },
            }));
          }
        }
      } catch {
        // Server not running — silent
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 3000);
    return () => {
      clearInterval(interval);
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
          temp: 39.4,
          conductivity: 6.85,
          scc: 2450000,
          humidity: 84,
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
        temp: 39.4,
        conductivity: 6.85,
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
                      temp: parsed.temp || 39.4,
                      conductivity: parsed.conductivity || parsed.ec || 6.85,
                      scc: parsed.scc || 2450000,
                      humidity: parsed.humidity || 84,
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
          telemetry: { cowId: "KA-001", temp: 39.4, conductivity: 6.85, scc: 2450000, humidity: 84, battery: 94, rssi: -58 },
        }),
      });
    } catch (_) {}

    setEsp32State((prev) => ({
      ...prev,
      isLive: nextLive,
      connected: nextLive,
      deviceId: nextLive ? "ESP32-HARDWARE-WROOM32" : "",
      lastTelemetry: nextLive
        ? {
            cowId: "KA-001",
            temp: 39.4,
            conductivity: 6.85,
            scc: 2450000,
            humidity: 84,
            battery: 94,
            rssi: -58,
            timestamp: new Date().toLocaleTimeString(),
          }
        : null,
    }));

    triggerNotification({
      id: Date.now(),
      type: nextLive ? "connected" : "disconnected",
      deviceId: "ESP32-HARDWARE-WROOM32",
      source: "Simulation / LAN",
      cowId: "KA-001",
      temp: 39.4,
      conductivity: 6.85,
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
