import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Eye, EyeOff, ChevronDown, FileCheck, X } from "lucide-react";
import logo from "../assets/imgs/Group20.png";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { useAuth } from "../contexts/AuthContext";
import { categoryService } from "../services/categoryService";
import { countriesWithDialCode, getFlagUrl } from "../data/countriesWithDialCode";
import { citiesByCountry } from "../data/citiesByCountry";

export default function SignUpCard() {
  const { t, i18n } = useTranslation();
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
  const defaultCountry = countriesWithDialCode.find((c) => c.iso === "SA") || countriesWithDialCode[0];
  const [country, setCountry] = useState(defaultCountry);
  const [countryName, setCountryName] = useState(i18n.language === "ar" ? defaultCountry.nameAr : defaultCountry.nameEn);
  const [city, setCity] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Keep countryName in sync with language and selected country
  useEffect(() => {
    setCountryName(i18n.language === "ar" ? country.nameAr : country.nameEn);
  }, [i18n.language, country]);

  // Reset city when country changes (city list is tied to country)
  useEffect(() => {
    setCity("");
  }, [country.iso]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
      }
      if (showCountryDropdown && !event.target.closest('.country-phone-dropdown')) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown, showCountryDropdown]);

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

  const isRTL = currentDir === 'rtl';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center py-8 px-4 sm:px-6">
      {/* Card - عرض أوسع */}
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-200/50 ring-1 ring-slate-200/80">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px] md:min-h-[640px]">
          {/* Form column */}
          <div dir={currentDir} className="p-8 sm:p-10 lg:p-14 flex flex-col justify-center">
            <div className="w-full max-w-4xl mx-auto md:mx-0 md:max-w-none">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 text-right w-full tracking-tight">
                مرحباً بعودتك!
              </h1>
              <p className="text-slate-500 text-sm mt-1.5 text-right w-full">
                أنشئ حسابك لبدء البيع والشراء
              </p>

              <form
                className="mt-7 space-y-5"
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

                  const hasCities = (citiesByCountry[country?.iso] || []).length > 0;
                  if (hasCities && !city) {
                    setError("يجب اختيار المدينة");
                    return;
                  }

                  setLoading(true);

                  try {
                    const availableCities = citiesByCountry[country?.iso] || [];
                    const selectedCityObj = availableCities.find((c) => c.value === city);
                    const cityToSend = selectedCityObj
                      ? (i18n.language === "ar" ? selectedCityObj.label.ar : selectedCityObj.label.en)
                      : city;

                    const result = await register({
                      name,
                      email,
                      phone: country.dialCode + phone,
                      countryCode: country.dialCode,
                      country: countryName,
                      city: cityToSend,
                      password,
                      preferredCategories: selectedCategories
                    });

                    if (result.success) {
                      toast.success(t("auth.registrationSuccess"));
                      navigate(ROUTES.HOME);
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    الاسم*
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل الاسم"
                    required
                    disabled={loading}
                    className={`w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                </div>

                {/* Email */}
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
                    className={`w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    رقم الهاتف*
                  </label>

                  <div className="flex flex-row-reverse items-stretch gap-2">
                    {/* Country code with flag */}
                    <div className="relative min-w-[140px] country-phone-dropdown">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCountryDropdown(!showCountryDropdown);
                          setCountrySearch("");
                        }}
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 flex items-center justify-between gap-1"
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <img
                            src={getFlagUrl(country.iso)}
                            alt=""
                            className="w-5 h-4 object-cover rounded-sm shrink-0 border border-slate-200"
                            loading="lazy"
                          />
                          <span className="truncate text-slate-700">
                            {currentDir === 'rtl' ? country.nameAr : country.nameEn} {country.dialCode}
                          </span>
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showCountryDropdown && (
                        <div className="absolute z-20 mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden country-phone-dropdown">
                          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder={currentDir === 'rtl' ? 'بحث...' : 'Search...'}
                              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                            />
                          </div>
                          <div className="overflow-y-auto max-h-52">
                            {countriesWithDialCode
                              .filter((c) => {
                                const q = (countrySearch || "").toLowerCase();
                                if (!q) return true;
                                return (
                                  c.nameEn.toLowerCase().includes(q) ||
                                  (c.nameAr || "").includes(countrySearch) ||
                                  c.dialCode.includes(q) ||
                                  c.iso.toLowerCase().includes(q)
                                );
                              })
                              .map((c) => (
                                <button
                                  key={c.iso}
                                  type="button"
                                  onClick={() => {
                                    setCountry(c);
                                    setCountryName(currentDir === 'rtl' ? c.nameAr : c.nameEn);
                                    setShowCountryDropdown(false);
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-slate-50 text-sm ${country.iso === c.iso ? 'bg-blue-50 text-blue-800' : 'text-slate-700'}`}
                                >
                                  <img
                                    src={getFlagUrl(c.iso)}
                                    alt=""
                                    className="w-5 h-4 object-cover rounded-sm shrink-0 border border-slate-200"
                                    loading="lazy"
                                  />
                                  <span className="flex-1 truncate">{currentDir === 'rtl' ? c.nameAr : c.nameEn}</span>
                                  <span className="text-slate-500 shrink-0">{c.dialCode}</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Phone number */}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="5XXXXXXXX"
                      required
                      disabled={loading}
                      className={`flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400' : ''}`}
                    />
                  </div>
                </div>

                {/* الدولة والمدينة: المدينة مرتبطة ديناميكياً بالدولة المختارة أعلى */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    المدينة {citiesByCountry[country?.iso]?.length ? '*' : ''}
                  </label>
                  {citiesByCountry[country?.iso]?.length > 0 ? (
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required={citiesByCountry[country?.iso]?.length > 0}
                      disabled={loading}
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-right ${error ? 'border-red-400' : ''}`}
                    >
                      <option value="">اختر المدينة</option>
                      {(citiesByCountry[country?.iso] || []).map((c) => (
                        <option key={c.value} value={c.value}>
                          {currentDir === 'rtl' ? c.label.ar : c.label.en}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="مدينة (اختياري)"
                      disabled={loading}
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400' : ''}`}
                    />
                  )}
                </div>

                {/* Password */}
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
                      minLength={6}
                      className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isRTL ? 'pl-3.5 pr-10' : 'pl-10 pr-3.5'} ${error ? 'border-red-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className={`absolute top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors ${isRTL ? 'right-2' : 'left-2'}`}
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isRTL ? 'pl-3.5 pr-10' : 'pl-10 pr-3.5'} ${error ? 'border-red-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className={`absolute top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors ${isRTL ? 'right-2' : 'left-2'}`}
                      aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Preferred Categories */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    الأقسام المفضلة* <span className="text-xs font-normal text-slate-500">(اختر على الأقل قسم واحد)</span>
                  </label>
                  <div className="relative category-dropdown">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      disabled={loading || loadingCategories}
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-right outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 flex items-center justify-between ${error ? 'border-red-400' : ''}`}
                    >
                      <span className="text-slate-500">
                        {selectedCategories.length === 0
                          ? "اختر الأقسام المفضلة"
                          : `${selectedCategories.length} قسم محدد`}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showCategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto category-dropdown">
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

                {/* Terms - الموافقة مع أيقونة في البوب أب + رابط الأحكام والشروط */}
                <div className="rounded-lg bg-amber-50/80 px-3.5 py-2.5 border border-amber-100">
                  <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer hover:bg-amber-50/50 -m-1 p-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      disabled={loading}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 shrink-0"
                    />
                    <span className="flex-1">
                      موافقة على{" "}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }}
                        className="font-semibold text-blue-700 hover:text-amber-600 underline underline-offset-2"
                      >
                        الشروط والأحكام
                      </button>
                    </span>
                  </label>
                  <p className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      to={ROUTES.TERMS_AND_POLICIES}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-800 font-medium underline underline-offset-1"
                    >
                      الأحكام والشروط (رابط إضافي)
                    </Link>
                  </p>
                </div>

                {/* نافذة منبثقة الموافقة - أيقونة + نص */}
                {showTermsModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowTermsModal(false)} />
                    <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                      <div className="p-6 text-right">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-700 shrink-0">
                            <FileCheck className="w-7 h-7" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(false)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            aria-label="إغلاق"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <h2 id="terms-modal-title" className="text-lg font-bold text-slate-800 mb-3">
                          الموافقة على الشروط والأحكام
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          بمتابعة التسجيل فإنك توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بالمنصة. يرجى قراءة الأحكام والشروط الكاملة قبل إكمال التسجيل.
                        </p>
                        <Link
                          to={ROUTES.TERMS_AND_POLICIES}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-sm font-semibold text-blue-600 hover:text-amber-600 underline underline-offset-2"
                        >
                          الأحكام والشروط الكاملة ←
                        </Link>
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(false)}
                            className="w-full py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                          >
                            فهمت
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-sm text-red-700 text-right">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!acceptTerms || loading}
                  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all
                    ${acceptTerms && !loading ? "bg-blue-900 hover:bg-blue-800 focus:ring-blue-500/50 active:scale-[0.99]" : "bg-slate-300 cursor-not-allowed focus:ring-slate-300"}`}
                >
                  {loading ? "جاري التسجيل..." : "استكمال البيانات"}
                </button>

                {/* Links */}
                <div className="pt-1 space-y-2">
                  <Link to={ROUTES.LOGIN} className="block text-center text-sm">
                    <span className="text-slate-500">هل لديك حساب بالفعل؟</span>{" "}
                    <span className="font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline">سجل الدخول</span>
                  </Link>
                  <Link to={ROUTES.HOME} className="block text-center">
                    <span className="text-sm font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline">الدخول كزائر</span>
                  </Link>
                </div>
              </form>

              <div className="mt-8 pt-6 text-center text-xs text-slate-400 border-t border-slate-100">
                © 2025 QeemaTech - جميع الحقوق محفوظة
              </div>
            </div>
          </div>

          {/* Right: Brand - وضوح اللوجو ولمسات جمالية */}
          <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 sm:p-12 flex flex-col items-center justify-center min-h-[320px] md:min-h-0 overflow-hidden">
            {/* زخرفة خفيفة */}
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
