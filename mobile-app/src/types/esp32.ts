export interface ESP32Telemetry {
  cowId: string;
  temp: number;
  conductivity: number;
  scc: number;
  humidity?: number;
  battery?: number;
  rssi?: number;
  timestamp: string;
}

export interface ESP32State {
  isLive: boolean;
  connected: boolean;
  deviceId: string;
  baudRate: number;
  source: string;
  lastTelemetry: ESP32Telemetry | null;
}

export interface ESP32Notification {
  id: number;
  type: "connected" | "disconnected";
  deviceId: string;
  source?: string;
  cowId?: string;
  temp?: number;
  conductivity?: number;
  message?: string;
}

export interface ESP32ContextType extends ESP32State {
  notification: ESP32Notification | null;
  dismissNotification: () => void;
  connectUsbSerial: () => Promise<void>;
  toggleEsp32: () => Promise<void>;
  dismissBanner: () => void;
  bannerDismissed: boolean;
  setBannerDismissed: (v: boolean) => void;
}
