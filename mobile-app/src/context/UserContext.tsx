import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface UserProfile {
  name: string;
  farmName: string;
  phone: string;
  role: "farmer" | "vet" | "officer";
  village?: string;
  state?: string;
  email?: string;
  avatar?: string;
  authProvider?: "google" | "phone" | "manual";
}

interface UserContextType {
  user: UserProfile | null;
  savedAccounts: UserProfile[];
  setUser: (u: UserProfile) => void;
  clearUser: () => void;
  removeAccountFromDevice: (identifier: string) => void;
  isGoogleLoading: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
}

const STORAGE_ACTIVE_USER = "mootracker_user";
const STORAGE_DEVICE_ACCOUNTS = "mootracker_device_saved_accounts";

function getDeviceAccountsFromStorage(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_DEVICE_ACCOUNTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDeviceAccountsToStorage(accounts: UserProfile[]) {
  try {
    localStorage.setItem(STORAGE_DEVICE_ACCOUNTS, JSON.stringify(accounts));
  } catch {}
}

const UserContext = createContext<UserContextType>({
  user: null,
  savedAccounts: [],
  setUser: () => {},
  clearUser: () => {},
  removeAccountFromDevice: () => {},
  isGoogleLoading: false,
  signInWithGoogle: async () => ({ success: false }),
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<UserProfile[]>(() => getDeviceAccountsFromStorage());

  const [user, setUserState] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_ACTIVE_USER);
      return stored ? (JSON.parse(stored) as UserProfile) : null;
    } catch {
      return null;
    }
  });

  const setUser = (u: UserProfile) => {
    setUserState(u);
    try {
      localStorage.setItem(STORAGE_ACTIVE_USER, JSON.stringify(u));
    } catch {}

    // Save/update this account in this device's saved accounts list
    setSavedAccounts((prev) => {
      const filtered = prev.filter((acc) => {
        if (u.email && acc.email) return acc.email !== u.email;
        if (u.phone && acc.phone) return acc.phone !== u.phone;
        return acc.name !== u.name;
      });
      const updated = [u, ...filtered];
      saveDeviceAccountsToStorage(updated);
      return updated;
    });
  };

  const removeAccountFromDevice = (identifier: string) => {
    setSavedAccounts((prev) => {
      const updated = prev.filter(
        (acc) => acc.email !== identifier && acc.phone !== identifier && acc.name !== identifier
      );
      saveDeviceAccountsToStorage(updated);
      return updated;
    });

    // If currently logged into this account, clear active session
    if (user && (user.email === identifier || user.phone === identifier || user.name === identifier)) {
      setUserState(null);
      try {
        localStorage.removeItem(STORAGE_ACTIVE_USER);
      } catch {}
    }
  };

  const clearUser = () => {
    setUserState(null);
    try {
      localStorage.removeItem(STORAGE_ACTIVE_USER);
    } catch {}
    if (supabase && isSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  // Sync with Supabase Auth (e.g. after Google OAuth redirect)
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const fullName =
          meta.full_name ||
          meta.name ||
          meta.user_name ||
          session.user.email?.split("@")[0] ||
          "Farmer";
        const email = session.user.email || "";
        const avatar = meta.avatar_url || meta.picture || "";
        const phone = session.user.phone || meta.phone || "";

        const updated: UserProfile = {
          name: fullName,
          farmName: meta.farm_name || "My Dairy Farm",
          phone: phone || "",
          role: "farmer",
          village: meta.village || "Anand",
          state: meta.state || "Gujarat",
          email,
          avatar,
          authProvider: "google",
        };
        setUser(updated);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const meta = session.user.user_metadata || {};
        const fullName =
          meta.full_name ||
          meta.name ||
          meta.user_name ||
          session.user.email?.split("@")[0] ||
          "Farmer";
        const email = session.user.email || "";
        const avatar = meta.avatar_url || meta.picture || "";
        const phone = session.user.phone || meta.phone || "";

        const updated: UserProfile = {
          name: fullName,
          farmName: meta.farm_name || "My Dairy Farm",
          phone: phone || "",
          role: "farmer",
          village: meta.village || "Anand",
          state: meta.state || "Gujarat",
          email,
          avatar,
          authProvider: "google",
        };
        setUser(updated);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsGoogleLoading(true);
    try {
      if (supabase && isSupabaseConfigured) {
        const redirectUrl = window.location.origin + window.location.pathname;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });
        if (error) {
          console.warn("[Google Auth] Supabase OAuth returned:", error.message);
          setIsGoogleLoading(false);
          return { success: false, error: error.message };
        }
        return { success: true };
      }
      setIsGoogleLoading(false);
      return { success: false, error: "Supabase not configured" };
    } catch (err: any) {
      setIsGoogleLoading(false);
      return { success: false, error: err?.message || "Google sign in error" };
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        savedAccounts,
        setUser,
        clearUser,
        removeAccountFromDevice,
        isGoogleLoading,
        signInWithGoogle,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
