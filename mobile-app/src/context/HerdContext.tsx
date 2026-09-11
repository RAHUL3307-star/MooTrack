import React, { createContext, useContext, useState } from "react";
import { HERDS } from "../types/index";
import type { Herd } from "../types/index";

interface HerdContextType {
  herds: Herd[];
  selectedHerdId: string | "all";
  setSelectedHerdId: (id: string | "all") => void;
  selectedHerd: Herd | null;
}

const HerdContext = createContext<HerdContextType>({
  herds: HERDS,
  selectedHerdId: "all",
  setSelectedHerdId: () => {},
  selectedHerd: null,
});

export function useHerd() {
  return useContext(HerdContext);
}

export function HerdProvider({ children }: { children: React.ReactNode }) {
  const [selectedHerdId, setSelectedHerdId] = useState<string | "all">("all");

  const selectedHerd =
    selectedHerdId === "all"
      ? null
      : (HERDS.find((h) => h.id === selectedHerdId) ?? null);

  return (
    <HerdContext.Provider
      value={{
        herds: HERDS,
        selectedHerdId,
        setSelectedHerdId,
        selectedHerd,
      }}
    >
      {children}
    </HerdContext.Provider>
  );
}
