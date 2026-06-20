import { useState, useRef, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { t } from "../i18n";
import { X, Camera, Eye, EyeOff, Save } from "lucide-react";
import UserAvatar from "./UserAvatar";
import toast from "react-hot-toast";

interface ProfileSettingsProps {
  onClose: () => void;
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { user, updateProfile } = useAuth();
  const { theme, lang } = useSettings();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === "dark";

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("imageTooLarge", lang));
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      if (username !== user?.username) formData.append("username", username);
      if (email !== user?.email) formData.append("email", email);
      if (avatarFile) formData.append("avatar", avatarFile);
      if (newPassword) {
        formData.append("currentPassword", currentPassword);
        formData.append("newPassword", newPassword);
      }

      if ([...formData.entries()].length === 0) {
        toast.error(t("noChanges", lang));
        setSaving(false);
        return;
      }

      await updateProfile(formData);
      toast.success(t("profileUpdated", lang));
      setCurrentPassword("");
      setNewPassword("");
      setAvatarFile(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("failedUpdate", lang));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl border overflow-hidden max-h-[90vh] flex flex-col ${
        isDark ? "bg-dark-900 border-dark-700" : "bg-white border-light-300"
      }`}>
        <div className={`flex items-center justify-between p-6 border-b shrink-0 ${isDark ? "border-dark-700" : "border-light-300"}`}>
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-light-900"}`}>{t("profileSettings", lang)}</h2>
          <button onClick={onClose} className={`p-2 rounded-lg transition ${isDark ? "hover:bg-dark-800" : "hover:bg-light-200"}`}>
            <X className={`w-5 h-5 ${isDark ? "text-dark-400" : "text-light-500"}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <UserAvatar
                username={user?.username || ""}
                avatar={avatarPreview || user?.avatar}
                size="lg"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarSelect}
              className="hidden"
              accept="image/*"
            />
            <p className={`text-xs ${isDark ? "text-dark-400" : "text-light-500"}`}>{t("changePhoto", lang)}</p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-dark-300" : "text-light-700"}`}>{t("username", lang)}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 transition ${
                isDark ? "bg-dark-800 border border-dark-600 text-white" : "bg-light-100 border border-light-300 text-light-900"
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-dark-300" : "text-light-700"}`}>{t("email", lang)}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 transition ${
                isDark ? "bg-dark-800 border border-dark-600 text-white" : "bg-light-100 border border-light-300 text-light-900"
              }`}
              required
            />
          </div>

          <div className={`border-t pt-5 ${isDark ? "border-dark-700" : "border-light-300"}`}>
            <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-dark-300" : "text-light-700"}`}>{t("changePassword", lang)}</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${isDark ? "text-dark-400" : "text-light-600"}`}>{t("currentPassword", lang)}</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 transition pr-12 ${
                      isDark ? "bg-dark-800 border border-dark-600 text-white" : "bg-light-100 border border-light-300 text-light-900"
                    }`}
                    placeholder={t("enterCurrentPw", lang)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-dark-400 hover:text-white" : "text-light-500 hover:text-light-900"}`}
                  >
                    {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={`block text-sm mb-2 ${isDark ? "text-dark-400" : "text-light-600"}`}>{t("newPassword", lang)}</label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 transition pr-12 ${
                      isDark ? "bg-dark-800 border border-dark-600 text-white" : "bg-light-100 border border-light-300 text-light-900"
                    }`}
                    placeholder={t("enterNewPw", lang)}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-dark-400 hover:text-white" : "text-light-500 hover:text-light-900"}`}
                  >
                    {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
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
              disabled={saving}
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? t("saving", lang) : t("saveChanges", lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
