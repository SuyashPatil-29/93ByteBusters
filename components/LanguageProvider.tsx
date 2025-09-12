"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type LanguageCode = "en" | "hi" | "te" | "ta" | "mr" | "bn" | "gu" | "kn" | "ml" | "pa" | "or" | "as";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  translate: (text: string, lang?: LanguageCode) => Promise<string>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("gw_language") as LanguageCode | null;
    if (stored) setLanguageState(stored);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem("gw_language", lang);
      document.cookie = `gw_language=${lang}; path=/; max-age=31536000`;
    } catch {}
  };

  const translate = async (text: string, lang?: LanguageCode) => {
    const target = lang || language;
    if (target === "en") return text;
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang: target }),
    });
    const json = await res.json();
    return json.translated || text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}


