"use client";
import React from "react";
import { useLanguage, type LanguageCode } from "./LanguageProvider";

const options: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" },
  { code: "gu", label: "Gujarati" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "pa", label: "Punjabi" },
  { code: "or", label: "Odia" },
  { code: "as", label: "Assamese" },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  return (
    <select
      aria-label="Language"
      className="text-sm border border-blue-100 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800"
      value={language}
      onChange={(e) => setLanguage(e.target.value as LanguageCode)}
    >
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}


