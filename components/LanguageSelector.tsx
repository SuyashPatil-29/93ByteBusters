"use client";
import { useEffect, useState } from "react";
import type { LanguageCode } from "@/services/translation";

const LANG_KEY = "ingres-lang";

export function LanguageSelector() {
  const [lang, setLang] = useState<LanguageCode>('en');
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem(LANG_KEY) as LanguageCode | null) : null;
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  return (
    <select
      className="bg-white dark:bg-zinc-700 rounded px-2 py-1 text-sm"
      value={lang}
      onChange={(e) => setLang(e.target.value as LanguageCode)}
    >
      {(['en','hi','ta','te','bn','kn','mr','gu','pa'] as LanguageCode[]).map(code => (
        <option key={code} value={code}>{code}</option>
      ))}
    </select>
  );
}


