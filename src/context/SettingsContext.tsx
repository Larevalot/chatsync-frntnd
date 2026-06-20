import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Lang } from "../i18n";

type Theme = "dark" | "light";

interface SettingsContextType {
  theme: Theme;
  lang: Lang;
  toggleTheme: () => void;
  setLang: (lang: Lang) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("chatsync_theme") as Theme) || "dark";
  });
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("chatsync_lang") as Lang) || "en";
  });

  useEffect(() => {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(theme);
    localStorage.setItem("chatsync_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("chatsync_lang", lang);
  }, [lang]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
  }, []);

  return (
    <SettingsContext.Provider value={{ theme, lang, toggleTheme, setLang }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
