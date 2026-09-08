import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Animal, RiskLevel } from "../types/index";
import { ANIMALS } from "../types/index";
import { fetchAnimals, seedAnimals, updateAnimalRisk } from "../services/animalService";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

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
  const [baseAnimals, setBaseAnimals] = useState<Animal[]>(ANIMALS);
  const [customAnimals, setCustomAnimals] = useState<Animal[]>(() => loadCustomAnimals());
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(false);

  // Combined list: base (from DB or defaults) + custom (from RFID registration)
  const animals = [...baseAnimals, ...customAnimals];

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

  const updateRisk = useCallback(
    async (animalId: string, risk: RiskLevel, temp: number, ph?: number, conductivity?: number) => {
      setBaseAnimals((prev) =>
        prev.map((a) => (a.id === animalId ? { ...a, risk, temp, ph: ph ?? a.ph, conductivity: conductivity ?? a.conductivity, lastSync: "Just now" } : a))
      );
      setCustomAnimals((prev) =>
        prev.map((a) => (a.id === animalId ? { ...a, risk, temp, ph: ph ?? a.ph, conductivity: conductivity ?? a.conductivity, lastSync: "Just now" } : a))
      );
      // Supabase update (no SCC column)
      if (isSupabaseConfigured) {
        await updateAnimalRisk(animalId, risk, 0, temp);
      }
    },
    []
  );

  // Add a new cow via RFID scan — name entered by farmer at scan time
  const addAnimal = useCallback(
    (rfidTag: string, name: string, ageYears: number, ageMonths: number, breed: string): Animal => {
      const totalAnimals = baseAnimals.length + customAnimals.length;
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

      setCustomAnimals((prev) => {
        const updated = [...prev, newAnimal];
        saveCustomAnimals(updated);
        return updated;
      });

      return newAnimal;
    },
    [baseAnimals.length, customAnimals.length]
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
