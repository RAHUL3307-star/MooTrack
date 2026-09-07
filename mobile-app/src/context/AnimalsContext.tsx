import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Animal, RiskLevel } from "../types/index";
import { ANIMALS } from "../types/index";
import { fetchAnimals, seedAnimals, updateAnimalRisk } from "../services/animalService";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface AnimalsContextType {
  animals: Animal[];
  loading: boolean;
  refreshAnimals: () => Promise<void>;
  updateRisk: (animalId: string, risk: RiskLevel, scc: number, temp: number) => Promise<void>;
}

const AnimalsContext = createContext<AnimalsContextType>({
  animals: ANIMALS,
  loading: false,
  refreshAnimals: async () => {},
  updateRisk: async () => {},
});

export function useAnimals() {
  return useContext(AnimalsContext);
}

export function AnimalsProvider({ children }: { children: React.ReactNode }) {
  const [animals, setAnimals] = useState<Animal[]>(ANIMALS);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await seedAnimals();
      }
      const data = await fetchAnimals();
      if (data && data.length > 0) {
        setAnimals(data);
      }
    } catch (e) {
      console.warn("[AnimalsContext] Error loading animals:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Setup Supabase Realtime subscription if available
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel("animals_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "animals" },
          () => {
            fetchAnimals().then((data) => {
              if (data && data.length > 0) setAnimals(data);
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loadData]);

  const updateRisk = useCallback(
    async (animalId: string, risk: RiskLevel, scc: number, temp: number) => {
      // Optimistic update
      setAnimals((prev) =>
        prev.map((a) => (a.id === animalId ? { ...a, risk, scc, temp, lastSync: "Just now" } : a))
      );
      if (isSupabaseConfigured) {
        await updateAnimalRisk(animalId, risk, scc, temp);
      }
    },
    []
  );

  return (
    <AnimalsContext.Provider
      value={{
        animals,
        loading,
        refreshAnimals: loadData,
        updateRisk,
      }}
    >
      {children}
    </AnimalsContext.Provider>
  );
}
