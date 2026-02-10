import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import logo from "../assets/imgs/Group20.png";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { useAuth } from "../contexts/AuthContext";
import { categoryService } from "../services/categoryService";

export default function SignUpCard() {
  const { i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState({ code: "+966", flag: "🇸🇦" });
  const [countryName, setCountryName] = useState("السعودية");
  const [city, setCity] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoryService.getCategories();
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  return (
    <div className="min-h-screen bg-white mb-10 flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Form */}
          <div dir={currentDir} className="p-6 sm:p-10">
            <div className="w-full">
              <h1 className="text-xl font-bold text-slate-900 text-right w-full">
                مرحباً بعودتك!
              </h1>

              <form
                className="mt-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");

                  // Validation
                  if (!acceptTerms) {
                    setError("يجب الموافقة على الشروط والأحكام");
                    return;
                  }

                  if (password !== confirmPassword) {
                    setError("كلمات المرور غير متطابقة");
                    return;
                  }

                  if (password.length < 6) {
                    setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                    return;
                  }

                  if (selectedCategories.length === 0) {
                    setError("يجب اختيار قسم واحد على الأقل");
                    return;
                  }

                  setLoading(true);

                  try {
                    const result = await register({
                      name,
                      email,
                      phone: country.code + phone,
                      countryCode: country.code,
                      country: countryName,
                      city,
                      password,
                      preferredCategories: selectedCategories
                    });

                    if (result.success) {
                      // Navigate to bank info page for seller registration
                      navigate(ROUTES.SIGNUP_BANK_INFO);
                    } else {
                      setError(result.message || "حدث خطأ في التسجيل");
                    }
                  } catch (err) {
                    setError(err.response?.data?.message || "حدث خطأ في التسجيل");
                    console.error("Registration error:", err);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {/* Name */}
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    الاسم*
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل الاسم"
                    required
                    disabled={loading}
                    className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${error ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    البريد الإلكتروني*
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    disabled={loading}
                    className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${error ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    رقم الهاتف*
                  </label>

                  <div className="flex flex-row-reverse items-stretch  gap-2">
                    {/* Country code */}
                    <div className="relative min-w-[120px]">
                      <select
                        value={country.code}
                        onChange={(e) => {
                          const v = e.target.value;
                          // عدّل flags براحتك
                          if (v === "+966") setCountry({ code: "+966", flag: "🇸🇦" });
                          if (v === "+965") setCountry({ code: "+965", flag: "🇰🇼" });
                          if (v === "+20") setCountry({ code: "+20", flag: "🇪🇬" });
                        }}
                        className="appearance-none w-full rounded-md border border-slate-200 bg-white ps-3 pe-9 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+965">🇰🇼 +965</option>
                        <option value="+20">🇪🇬 +20</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Phone number */}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="5XXXXXXXX"
                      required
                      disabled={loading}
                      className={`flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${error ? 'border-red-500' : ''}`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
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
                      minLength={6}
                      className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${error ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50"
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    تأكيد كلمة المرور*
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      minLength={6}
                      className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${error ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50"
                      aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Preferred Categories */}
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    الأقسام المفضلة* <span className="text-xs text-slate-500">(اختر على الأقل قسم واحد)</span>
                  </label>
                  <div className="relative category-dropdown">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      disabled={loading || loadingCategories}
                      className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-right outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 flex items-center justify-between ${error ? 'border-red-500' : ''}`}
                    >
                      <span className="text-slate-500">
                        {selectedCategories.length === 0
                          ? "اختر الأقسام المفضلة"
                          : `${selectedCategories.length} قسم محدد`}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showCategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto category-dropdown">
                        {loadingCategories ? (
                          <div className="p-3 text-sm text-slate-500 text-center">جاري التحميل...</div>
                        ) : categories.length === 0 ? (
                          <div className="p-3 text-sm text-slate-500 text-center">لا توجد أقسام متاحة</div>
                        ) : (
                          <div className="p-2">
                            {categories.map((category) => (
                              <label
                                key={category.id}
                                className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.includes(category.id)}
                                  onChange={() => toggleCategory(category.id)}
                                  disabled={loading}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
                                />
                                <span className="text-sm text-slate-700">
                                  {category.nameKey || `Category ${category.id}`}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedCategories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedCategories.map((catId) => {
                        const category = categories.find((c) => c.id === catId);
                        return category ? (
                          <span
                            key={catId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {category.nameKey || `Category ${catId}`}
                            <button
                              type="button"
                              onClick={() => toggleCategory(catId)}
                              disabled={loading}
                              className="hover:text-blue-900"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Terms */}
                <label className="flex items-center gap-2 text-sm text-slate-700 rounded-md bg-rose-50 px-3 py-2 border border-rose-100">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
                  />
                  موافقة على الشروط والاحكام
                </label>

                {/* Error Message */}
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 text-right">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!acceptTerms || loading}
                  className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200
                    ${acceptTerms && !loading ? "bg-blue-900 hover:bg-blue-800" : "bg-slate-300 cursor-not-allowed"}`}
                >
                  {loading ? "جاري التسجيل..." : "استكمال البيانات"}
                </button>

                {/* Links */}
                <Link to={ROUTES.LOGIN}>
                    <div className="pt-2 text-center text-sm">
                        
                    <span className="text-slate-500">هل لديك حساب بالفعل؟</span>{" "}
                    <button type="button" className="font-semibold text-amber-600 hover:text-amber-700">
                        سجل الدخول
                    </button>
                    </div>
                </Link>
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

          {/* Right: Brand */}
          <div className="bg-blue-900 p-6 sm:p-10 flex items-center justify-center">
            <img className="w-md" src={logo} alt="logo" />
          </div>
        </div>
      </div>
    </div>
  );
}
