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
  setUser: (u: UserProfile) => void;
  clearUser: () => void;
  isGoogleLoading: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  clearUser: () => {},
  isGoogleLoading: false,
  signInWithGoogle: async () => ({ success: false }),
});

const STORAGE_KEY = "mootracker_user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

        setUserState((prev) => {
          const updated: UserProfile = {
            name: fullName,
            farmName: prev?.farmName || meta.farm_name || "Shri Balaji Dairy Farm",
            phone: phone || prev?.phone || "",
            role: prev?.role || "farmer",
            village: prev?.village || meta.village || "Anand",
            state: prev?.state || meta.state || "Gujarat",
            email,
            avatar,
            authProvider: "google",
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
            farmName: meta.farm_name || "Shri Balaji Dairy Farm",
            phone: phone || "9876543210",
            role: "farmer",
            village: meta.village || "Anand",
            state: meta.state || "Gujarat",
            email,
            avatar,
            authProvider: "google",
          };
          setUser(updated);
        } else if (event === "SIGNED_OUT") {
          // Keep local if user didn't explicitly clear
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsGoogleLoading(true);
    try {
      if (supabase && isSupabaseConfigured) {
        // Real Supabase Google OAuth redirect
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
        setUser,
        clearUser,
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
