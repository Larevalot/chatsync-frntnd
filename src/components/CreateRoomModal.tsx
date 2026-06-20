import { useState, FormEvent } from "react";
import { X, Hash, Lock } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { t } from "../i18n";

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (data: { name: string; description?: string; isPrivate?: boolean }) => void;
}

export default function CreateRoomModal({ onClose, onCreate }: CreateRoomModalProps) {
  const { theme, lang } = useSettings();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const isDark = theme === "dark";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim() || undefined, isPrivate });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border overflow-hidden ${
        isDark ? "bg-dark-900 border-dark-700" : "bg-white border-light-300"
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-dark-700" : "border-light-300"}`}>
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-light-900"}`}>{t("createRoom", lang)}</h2>
          <button onClick={onClose} className={`p-2 rounded-lg transition ${isDark ? "hover:bg-dark-800" : "hover:bg-light-200"}`}>
            <X className={`w-5 h-5 ${isDark ? "text-dark-400" : "text-light-500"}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-dark-300" : "text-light-700"}`}>
              {t("roomName", lang)}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("roomNamePlaceholder", lang)}
              className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 transition ${
                isDark ? "bg-dark-800 border border-dark-600 text-white" : "bg-light-100 border border-light-300 text-light-900"
              }`}
              required
              autoFocus
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-dark-300" : "text-light-700"}`}>
              {t("description", lang)}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descPlaceholder", lang)}
              rows={2}
              className={`w-full px-4 py-3 rounded-xl resize-none focus:outline-none focus:border-primary-500 transition ${
                isDark ? "bg-dark-800 border border-dark-600 text-white" : "bg-light-100 border border-light-300 text-light-900"
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? "text-dark-300" : "text-light-700"}`}>
              {t("roomType", lang)}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition ${
                  !isPrivate
                    ? "border-primary-500 bg-primary-600/10"
                    : isDark
                      ? "border-dark-600 bg-dark-800 hover:border-dark-500"
                      : "border-light-300 bg-light-100 hover:border-light-400"
                }`}
              >
                <Hash className={`w-5 h-5 ${!isPrivate ? "text-primary-500" : isDark ? "text-dark-400" : "text-light-500"}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${!isPrivate ? "text-white" : isDark ? "text-dark-300" : "text-light-700"}`}>
                    {t("public", lang)}
                  </p>
                  <p className={`text-xs ${isDark ? "text-dark-500" : "text-light-500"}`}>{t("anyoneJoin", lang)}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition ${
                  isPrivate
                    ? "border-primary-500 bg-primary-600/10"
                    : isDark
                      ? "border-dark-600 bg-dark-800 hover:border-dark-500"
                      : "border-light-300 bg-light-100 hover:border-light-400"
                }`}
              >
                <Lock className={`w-5 h-5 ${isPrivate ? "text-primary-500" : isDark ? "text-dark-400" : "text-light-500"}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${isPrivate ? "text-white" : isDark ? "text-dark-300" : "text-light-700"}`}>
                    {t("private", lang)}
                  </p>
                  <p className={`text-xs ${isDark ? "text-dark-500" : "text-light-500"}`}>{t("inviteOnly", lang)}</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-medium transition ${
                isDark ? "bg-dark-800 hover:bg-dark-700 text-dark-300" : "bg-light-200 hover:bg-light-300 text-light-700"
              }`}
            >
              {t("cancel", lang)}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition"
            >
              {t("createRoom", lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
