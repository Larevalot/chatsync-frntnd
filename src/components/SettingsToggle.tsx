import { useSettings } from "../context/SettingsContext";
import { Sun, Moon, Globe } from "lucide-react";
import { Lang } from "../i18n";

const langLabels: Record<Lang, string> = { en: "EN", es: "ES", it: "IT" };
const langOrder: Lang[] = ["en", "es", "it"];

export default function SettingsToggle() {
  const { theme, lang, toggleTheme, setLang } = useSettings();

  const cycleLang = () => {
    const idx = langOrder.indexOf(lang);
    setLang(langOrder[(idx + 1) % langOrder.length]);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg transition hover:bg-black/10 dark:hover:bg-white/10"
        title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-dark-300" />
        ) : (
          <Moon className="w-4 h-4 text-light-700" />
        )}
      </button>
      <button
        onClick={cycleLang}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold"
        title="Change language"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{langLabels[lang]}</span>
      </button>
    </div>
  );
}
