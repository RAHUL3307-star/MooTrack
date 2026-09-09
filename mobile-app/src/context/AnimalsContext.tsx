import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Animal, RiskLevel } from "../types/index";
import { ANIMALS } from "../types/index";
import { fetchAnimals, seedAnimals, updateAnimalRisk } from "../services/animalService";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useESP32 } from "./ESP32Context";
import { computeMilkRisk } from "../types/esp32";

const LOCAL_STORAGE_KEY = "mootracker_custom_animals";

interface AnimalsContextType {
  animals: Animal[];
  selectedAnimal: Animal | null;
  setSelectedAnimal: (animal: Animal | null) => void;
  loading: boolean;
  refreshAnimals: () => Promise<void>;
  updateRisk: (animalId: string, risk: RiskLevel, temp: number, ph?: number, conductivity?: number) => Promise<void>;
  addAnimal: (rfidTag: string, name: string, ageYears: number, ageMonths: number, breed: string) => Animal;
}

const AnimalsContext = createContext<AnimalsContextType>({
  animals: ANIMALS,
  selectedAnimal: null,
  setSelectedAnimal: () => {},
  loading: false,
  refreshAnimals: async () => {},
  updateRisk: async () => {},
  addAnimal: () => ANIMALS[0],
});

export function useAnimals() {
  return useContext(AnimalsContext);
}

// Load any custom (RFID-registered) animals from localStorage
function loadCustomAnimals(): Animal[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Animal[];
  } catch (_) {}
  return [];
}

function saveCustomAnimals(custom: Animal[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(custom));
  } catch (_) {}
}

export function AnimalsProvider({ children }: { children: React.ReactNode }) {
  const { isLive, lastTelemetry } = useESP32();
  const [baseAnimals, setBaseAnimals] = useState<Animal[]>(ANIMALS);
  const [customAnimals, setCustomAnimals] = useState<Animal[]>(() => loadCustomAnimals());
  const [liveAnimals, setLiveAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(false);

  // When live hardware is connected: ONLY live scanned cows are in herd (0 cows initially until card is tapped)
  // When offline / disconnected: fallback to base mock cows for demo/prototyping
  const animals = isLive ? liveAnimals : [...baseAnimals, ...customAnimals];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await seedAnimals();
      }
      const data = await fetchAnimals();
      if (data && data.length > 0) {
        setBaseAnimals(data);
      }
    } catch (e) {
      console.warn("[AnimalsContext] Error loading animals:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const channel = client
        .channel("animals_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "animals" },
          () => {
            fetchAnimals().then((data) => {
              if (data && data.length > 0) setBaseAnimals(data);
            });
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [loadData]);

  // Synchronize live scanned cow from ESP32 telemetry
  useEffect(() => {
    if (!isLive) {
      setLiveAnimals([]);
      return;
    }

    if (lastTelemetry && (lastTelemetry.cowScanned === true || lastTelemetry.rfid_status === "VERIFIED")) {
      const cowId = lastTelemetry.cowId || "COW_001";
      const cowName = lastTelemetry.cowName || (cowId === "COW_001" ? "Cow 1" : cowId);
      const rfidTag = lastTelemetry.rfidTag || "0xE3995556";
      const temp = lastTelemetry.temp != null ? Number(lastTelemetry.temp) : 38.6;
      const ph = lastTelemetry.ph != null ? Number(lastTelemetry.ph) : 6.70;
      const conductivity = lastTelemetry.conductivity != null ? Number(lastTelemetry.conductivity) : 5.0;
      const weight = lastTelemetry.weight != null ? Number(lastTelemetry.weight) : 0;
      const calculatedRisk = computeMilkRisk(lastTelemetry).risk;
      const riskTier = lastTelemetry.riskTier?.toLowerCase();
      const risk: RiskLevel =
        riskTier === "high" || riskTier === "elevated"
          ? "high"
          : riskTier === "moderate" || riskTier === "watch"
          ? "moderate"
          : calculatedRisk;

      setLiveAnimals((prev) => {
        const existingIdx = prev.findIndex(
          (a) => a.id === cowId || (a.rfidTag && a.rfidTag === rfidTag)
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            name: cowName,
            rfidTag,
            temp,
            ph,
            conductivity,
            weight,
            risk,
            trend: risk === "high" ? "up" : "stable",
            lastSync: "Just now",
          };
          return updated;
        }

        const newCow: Animal = {
          id: cowId,
          name: cowName,
          breed: "HF Cross",
          age: "3y 2m",
          ageYears: 3,
          ageMonths: 2,
          rfidTag,
          lactation: 2,
          risk,
          trend: risk === "high" ? "up" : "stable",
          temp,
          ph,
          conductivity,
          weight,
          activity: "normal",
          milk: weight > 0 ? weight : 12.5,
          lastSync: "Just now",
          quarter: "All Clear",
        };
        return [...prev, newCow];
      });
    }
  }, [isLive, lastTelemetry]);

  // Keep selectedAnimal in sync with current animals
  useEffect(() => {
    if (isLive) {
      if (liveAnimals.length > 0) {
        setSelectedAnimal((curr) => {
          if (!curr || !liveAnimals.some((a) => a.id === curr.id)) {
            return liveAnimals[0];
          }
          return liveAnimals.find((a) => a.id === curr.id) || liveAnimals[0];
        });
      } else {
        setSelectedAnimal(null);
      }
    } else {
      setSelectedAnimal((curr) => curr || baseAnimals[0] || null);
    }
  }, [isLive, liveAnimals, baseAnimals]);

  const updateRisk = useCallback(
    async (animalId: string, risk: RiskLevel, temp: number, ph?: number, conductivity?: number) => {
      setLiveAnimals((prev) =>
        prev.map((a) => (a.id === animalId ? { ...a, risk, temp, ph: ph ?? a.ph, conductivity: conductivity ?? a.conductivity, lastSync: "Just now" } : a))
      );
      setBaseAnimals((prev) =>
        prev.map((a) => (a.id === animalId ? { ...a, risk, temp, ph: ph ?? a.ph, conductivity: conductivity ?? a.conductivity, lastSync: "Just now" } : a))
      );
      setCustomAnimals((prev) =>
        prev.map((a) => (a.id === animalId ? { ...a, risk, temp, ph: ph ?? a.ph, conductivity: conductivity ?? a.conductivity, lastSync: "Just now" } : a))
      );
      // Supabase update
      if (isSupabaseConfigured) {
        await updateAnimalRisk(animalId, risk, 0, temp);
      }
    },
    []
  );

  // Add a new cow via RFID scan — name entered by farmer at scan time
  const addAnimal = useCallback(
    (rfidTag: string, name: string, ageYears: number, ageMonths: number, breed: string): Animal => {
      const totalAnimals = animals.length;
      const cowNumber = totalAnimals + 1;
      const padded = String(cowNumber).padStart(3, "0");

      const newAnimal: Animal = {
        id: `KA-${padded}`,
        name: name.trim() || `Cow ${cowNumber}`,
        breed: breed || "Mixed",
        age: `${ageYears}y ${ageMonths}m`,
        ageYears,
        ageMonths,
        rfidTag,
        lactation: 1,
        risk: "none",
        trend: "stable",
        temp: 38.5,
        ph: 6.7,
        conductivity: 5.0,
        activity: "normal",
        milk: 0,
        lastSync: "Just now",
        quarter: "All Clear",
      };

      if (isLive) {
        setLiveAnimals((prev) => [...prev, newAnimal]);
      } else {
        setCustomAnimals((prev) => {
          const updated = [...prev, newAnimal];
          saveCustomAnimals(updated);
          return updated;
        });
      }

      return newAnimal;
    },
    [animals.length, isLive]
  );

  return (
    <AnimalsContext.Provider
      value={{
        animals,
        selectedAnimal,
        setSelectedAnimal,
        loading,
        refreshAnimals: loadData,
        updateRisk,
        addAnimal,
      }}
    >
      {children}
    </AnimalsContext.Provider>
  );
}
