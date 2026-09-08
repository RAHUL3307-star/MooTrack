import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  name: string;
  farmName: string;
  phone: string;
  role: "farmer" | "vet" | "officer";
  village?: string;
  state?: string;
  email?: string;
}

interface UserContextType {
  user: UserProfile | null;
  setUser: (u: UserProfile) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  clearUser: () => {},
});

const STORAGE_KEY = "mootracker_user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as UserProfile) : null;
    } catch {
      return null;
    }
  });

  const setUser = (u: UserProfile) => {
    setUserState(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {}
  };

  const clearUser = () => {
    setUserState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <UserContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
