import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import logo from "../assets/imgs/Group20.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../routes";
import { useAuth } from "../contexts/AuthContext";

export default function LoginCard() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === "ar" ? "rtl" : "ltr";
  const isRTL = currentDir === "rtl";

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password, false);

      if (result.success) {
        const rawUserType = result.user?.userType || result.user?.role || "";
        const userType = rawUserType.toUpperCase();

        if (userType !== "CLIENT" && userType !== "USER" && userType !== "TRADER") {
          await logout();
          setError(`Access denied. This login is for Clients and Traders only. (Role: ${userType})`);
          setLoading(false);
          return;
        }

        if (result.linkedProfiles && result.linkedProfiles.length > 1) {
          console.log("Multiple profiles found:", result.linkedProfiles);
        }

        const from = location.state?.from?.pathname || location.state?.from;
        if (from) {
          const fromState = location.state?.from?.state;
          navigate(from, { state: fromState });
        } else {
          if (userType === "TRADER") {
            navigate(ROUTES.TRADER_DASHBOARD);
          } else {
            navigate(ROUTES.HOME);
          }
        }
      } else {
        setError(result.message || t("auth.loginFailed"));
      }
    } catch (err) {
      setError(t("auth.loginFailed"));
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-200/50 ring-1 ring-slate-200/80">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[560px] md:min-h-[600px]">
          {/* Form column */}
          <div dir={currentDir} className="p-8 sm:p-10 lg:p-14 flex flex-col justify-center">
            <div className="w-full max-w-xl mx-auto md:mx-0 md:max-w-none">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 text-right w-full tracking-tight">
                تسجيل الدخول
              </h1>
              <p className="text-slate-500 text-sm mt-1.5 text-right w-full">
                أدخل بياناتك للوصول إلى حسابك
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                {successMessage && (
                  <div className="rounded-lg bg-green-50 border border-green-200/80 px-3.5 py-2.5 text-sm text-green-700 text-right">
                    {successMessage}
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-sm text-red-700 text-right">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    البريد الإلكتروني*
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    disabled={loading}
                    className={`w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    كلمة المرور*
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isRTL ? "pl-3.5 pr-10" : "pl-10 pr-3.5"} ${error ? "border-red-400" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors ${isRTL ? "right-2" : "left-2"}`}
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${!loading ? "bg-blue-900 hover:bg-blue-800 focus:ring-blue-500/50 active:scale-[0.99]" : "bg-slate-300 cursor-not-allowed focus:ring-slate-300"}`}
                >
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </button>

                <div className="pt-1 space-y-2">
                  <div className="text-center text-sm">
                    <span className="text-slate-500">ليس لديك حساب؟</span>{" "}
                    <Link to={ROUTES.SIGNUP} className="font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline">
                      سجّل الآن
                    </Link>
                  </div>
                  <Link to={ROUTES.HOME} className="block text-center">
                    <span className="text-sm font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline">
                      الدخول كزائر
                    </span>
                  </Link>
                </div>
              </form>

              <div className="mt-8 pt-6 text-center text-xs text-slate-400 border-t border-slate-100">
                © 2025 QeemaTech - جميع الحقوق محفوظة
              </div>
            </div>
          </div>

          {/* Right: Brand - نفس أسلوب SignUp */}
          <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 sm:p-12 flex flex-col items-center justify-center min-h-[300px] md:min-h-0 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 mb-4">
                <img
                  src={logo}
                  alt="شعار المنصة"
                  className="w-40 h-auto max-w-[200px] object-contain drop-shadow-lg"
                  loading="eager"
                />
              </div>
              <p className="text-white/90 text-sm font-medium max-w-[200px]">
                منصتك الموثوقة للتجارة والبيع
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
