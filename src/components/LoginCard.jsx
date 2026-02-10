import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import logo from "../assets/imgs/Group20.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../routes";
import { useAuth } from "../contexts/AuthContext";

export default function LoginCard() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === "ar" ? "rtl" : "ltr";

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Form — مثل SignUpCard */}
          <div dir={currentDir} className="p-6 sm:p-10">
            <div className="w-full">
              <h1 className="text-xl font-bold text-slate-900 text-right w-full">
                تسجيل الدخول
              </h1>
              <p className="text-slate-500 text-sm mt-1 text-right w-full">
                Enter your credentials to access your account
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {successMessage && (
                  <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 text-right">
                    {successMessage}
                  </div>
                )}

                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 text-right">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-700 mb-1">البريد الإلكتروني*</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    disabled={loading}
                    className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${error ? "border-red-500" : ""}`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">كلمة المرور*</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${error ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50"
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${!loading ? "bg-blue-900 hover:bg-blue-800" : "bg-slate-300 cursor-not-allowed"}`}
                >
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </button>

                <div className="pt-2 text-center text-sm">
                  <span className="text-slate-500">ليس لديك حساب؟</span>{" "}
                  <Link to={ROUTES.SIGNUP}>
                    <button type="button" className="font-semibold text-amber-600 hover:text-amber-700">
                      سجّل الآن
                    </button>
                  </Link>
                </div>
                <Link to={ROUTES.HOME}>
                  <div className="text-center">
                    <button type="button" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
                      الدخول كزائر
                    </button>
                  </div>
                </Link>
              </form>

              <div className="mt-10 text-center text-xs text-slate-400">
                © 2025 QeemaTech - جميع الحقوق محفوظة
              </div>
            </div>
          </div>

          {/* Right: Brand — مثل SignUpCard */}
          <div className="bg-blue-900 p-6 sm:p-10 flex items-center justify-center">
            <img className="w-md" src={logo} alt="logo" />
          </div>
        </div>
      </div>
    </div>
  );
}
