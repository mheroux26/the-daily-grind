import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null); // { id, nickname }
  const [loading, setLoading] = useState(true);

  // Check localStorage for an existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem("dailygrind_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {}
    }
    setLoading(false);
  }, []);

  async function loginWithNickname(nickname) {
    const trimmed = nickname.trim().toLowerCase();
    if (!trimmed) return { error: "Nickname can't be empty" };

    // Try to find existing user
    let { data: existing } = await supabase
      .from("users")
      .select("id, nickname")
      .eq("nickname", trimmed)
      .single();

    if (existing) {
      setUser(existing);
      localStorage.setItem("dailygrind_user", JSON.stringify(existing));
      return { user: existing };
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({ nickname: trimmed })
      .select("id, nickname")
      .single();

    if (error) {
      if (error.code === "23505") {
        // Race condition — already exists, retry fetch
        const { data: retry } = await supabase
          .from("users")
          .select("id, nickname")
          .eq("nickname", trimmed)
          .single();
        if (retry) {
          setUser(retry);
          localStorage.setItem("dailygrind_user", JSON.stringify(retry));
          return { user: retry };
        }
      }
      return { error: error.message };
    }

    setUser(newUser);
    localStorage.setItem("dailygrind_user", JSON.stringify(newUser));
    return { user: newUser };
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("dailygrind_user");
  }

  return (
    <UserContext.Provider value={{ user, loading, loginWithNickname, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}
