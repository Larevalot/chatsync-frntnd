import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { t } from "../i18n";
import {
  MessageSquare,
  Eye,
  EyeOff,
  AlertTriangle,
  Shield,
  Zap,
  Users,
} from "lucide-react";
import SettingsToggle from "../components/SettingsToggle";

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, lang } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === "dark";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || t("loginFailed", lang);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-dark-950" : "bg-light-100"}`}>
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-300 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">ChatSync</h1>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              {t("connectTeam", lang)}
              <br />
              <span className="text-primary-200">{t("inRealTime", lang)}</span>
            </h2>
            <p className="text-lg text-white/70 max-w-md">
              {t("landingDesc", lang)}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary-200" />
              </div>
              <div>
                <p className="text-white font-medium">{t("realtimeMessaging", lang)}</p>
                <p className="text-sm text-white/50">{t("realtimeDesc", lang)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary-200" />
              </div>
              <div>
                <p className="text-white font-medium">{t("privateRooms", lang)}</p>
                <p className="text-sm text-white/50">{t("privateDesc", lang)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary-200" />
              </div>
              <div>
                <p className="text-white font-medium">{t("multipleRooms", lang)}</p>
                <p className="text-sm text-white/50">{t("multipleDesc", lang)}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm text-white/30">
          &copy; {new Date().getFullYear()} {t("copyright", lang)}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-4 right-4">
          <SettingsToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-3">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-light-900"}`}>ChatSync</h1>
          </div>

          <div className="mb-8">
            <h2 className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-light-900"}`}>
              {t("loginTitle", lang)}
            </h2>
            <p className={isDark ? "text-dark-400" : "text-light-500"}>
              {t("loginSubtitle", lang)}
            </p>
          </div>

          {error !== null && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">{t("invalidCredentials", lang)}</p>
                <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-dark-300" : "text-light-700"}`}>
                {t("email", lang)}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition ${
                  isDark
                    ? "bg-dark-900 border border-dark-700 text-white"
                    : "bg-white border border-light-300 text-light-900"
                }`}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-dark-300" : "text-light-700"}`}>
                {t("password", lang)}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition pr-12 ${
                    isDark
                      ? "bg-dark-900 border border-dark-700 text-white"
                      : "bg-white border border-light-300 text-light-900"
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-dark-400 hover:text-white" : "text-light-500 hover:text-light-900"}`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("signingIn", lang) : t("signIn", lang)}
            </button>

            <p className={`text-center text-sm ${isDark ? "text-dark-400" : "text-light-500"}`}>
              {t("noAccount", lang)}{" "}
              <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium">
                {t("signUp", lang)}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
