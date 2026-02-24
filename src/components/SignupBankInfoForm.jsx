import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import api from "../services/api";

const Field = ({ label, required, value, onChange, placeholder = "...", currentDir = 'rtl', disabled = false, error = "" }) => {
  const hasError = !!error;
  return (
    <div className="w-full">
      <label className={`block text-sm font-semibold text-slate-800 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`mt-2 w-full rounded-md border px-4 py-3 text-sm outline-none focus:ring-2 ${hasError ? 'border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50/50' : 'border-blue-200 focus:ring-blue-200'} ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
      />
      {hasError && (
        <p className={`mt-1 text-xs text-red-600 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

const REQUIRED_FIELDS = [
  'fullName', 'phone', 'email', 'city', 'country',
  'bankAccountName', 'bankAccountNumber', 'bankName', 'bankAddress', 'bankCode', 'swift', 'region', 'companyAddress'
];

export default function SignupBankInfoForm() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    country: "",

    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    bankAddress: "",
    bankCode: "",
    swift: "",
    region: "",
    companyAddress: "",

    agree: true,
  });

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setForm(prev => ({ 
        ...prev, 
        email: user.email || prev.email,
        fullName: user.name || prev.fullName,
        phone: user.phone || prev.phone,
        city: user.city || prev.city,
        country: user.country || prev.country
      }));
    }
  }, [user]);

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [k]: '' }));
  };
  const setCheck = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.checked }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.agree) {
      alert(t("signupBankInfo.mustAgree"));
      return;
    }

    const requiredMsg = t("signupBankInfo.fieldRequired");
    const errors = {};
    for (const key of REQUIRED_FIELDS) {
      const val = form[key];
      if (val === undefined || val === null || String(val).trim() === '') {
        errors[key] = requiredMsg;
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(t("signupBankInfo.pleaseFixErrors"));
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload = {
        name: form.fullName,
        phone: form.phone,
        city: form.city,
        country: form.country,
        bankAccountName: form.bankAccountName,
        bankAccountNumber: form.bankAccountNumber,
        bankName: form.bankName,
        bankAddress: form.bankAddress,
        bankCode: form.bankCode,
        swiftCode: form.swift,
        companyAddress: form.companyAddress,
      };

      const response = await api.post('/traders/register', payload);

      if (response.data.success) {
        navigate(ROUTES.LOGIN, {
          state: {
            message: t("signupBankInfo.pendingApprovalMessage") || "Application submitted successfully! Your account is pending admin approval."
          }
        });
      } else {
        const msg = response.data.message || 'Registration failed';
        setError(msg);
        if (msg.toLowerCase().includes('bank')) {
          setFieldErrors((p) => ({ ...p, bankAccountName: msg, bankAccountNumber: '', bankName: '' }));
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred. Please try again.';
      setError(msg);
      if (msg.toLowerCase().includes('bank')) {
        setFieldErrors((p) => ({ ...p, bankAccountName: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={currentDir} className="min-h-screen bg-white pt-20 sm:pt-32 md:pt-40 pb-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 py-10">
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-slate-100 bg-white shadow-sm p-6 sm:p-8 space-y-10"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}

          {/* Section 1 */}
          <div>
            <div className="text-center text-lg font-bold text-slate-900">
              {t("signupBankInfo.title")}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label={t("signupBankInfo.fullName")}
                required
                value={form.fullName}
                onChange={set("fullName")}
                placeholder={t("signupBankInfo.fullNamePlaceholder")}
                currentDir={currentDir}
                disabled={!!user?.name}
                error={fieldErrors.fullName}
              />
              <Field
                label={t("signupBankInfo.phone")}
                required
                value={form.phone}
                onChange={set("phone")}
                placeholder={t("signupBankInfo.phonePlaceholder")}
                currentDir={currentDir}
                disabled={!!user?.phone}
                error={fieldErrors.phone}
              />
            </div>

            <div className="mt-6">
              <Field
                label={t("signupBankInfo.email")}
                required
                value={form.email}
                onChange={set("email")}
                placeholder={t("signupBankInfo.emailPlaceholder")}
                currentDir={currentDir}
                disabled={!!user?.email}
                error={fieldErrors.email}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label={t("signupBankInfo.city")}
                required
                value={form.city}
                onChange={set("city")}
                placeholder={t("signupBankInfo.cityPlaceholder")}
                currentDir={currentDir}
                disabled={!!user?.city}
                error={fieldErrors.city}
              />
              <Field
                label={t("signupBankInfo.country")}
                required
                value={form.country}
                onChange={set("country")}
                placeholder={t("signupBankInfo.countryPlaceholder")}
                currentDir={currentDir}
                disabled={!!user?.country}
                error={fieldErrors.country}
              />
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <div className="text-center text-lg font-bold text-slate-900">
              {t("signupBankInfo.subtitle")}
            </div>

            <div className="mt-8 space-y-6">
              <Field
                label={t("signupBankInfo.bankAccountName")}
                required
                value={form.bankAccountName}
                onChange={set("bankAccountName")}
                placeholder={t("signupBankInfo.bankAccountNamePlaceholder")}
                currentDir={currentDir}
                error={fieldErrors.bankAccountName}
              />

              <Field
                label={t("signupBankInfo.bankAccountNumber")}
                required
                value={form.bankAccountNumber}
                onChange={set("bankAccountNumber")}
                placeholder={t("signupBankInfo.bankAccountNumberPlaceholder")}
                currentDir={currentDir}
                error={fieldErrors.bankAccountNumber}
              />

              <Field
                label={t("signupBankInfo.bankName")}
                required
                value={form.bankName}
                onChange={set("bankName")}
                placeholder={t("signupBankInfo.bankNamePlaceholder")}
                currentDir={currentDir}
                error={fieldErrors.bankName}
              />

              <Field
                label={t("signupBankInfo.bankAddress")}
                required
                value={form.bankAddress}
                onChange={set("bankAddress")}
                placeholder={t("signupBankInfo.bankAddressPlaceholder")}
                currentDir={currentDir}
                error={fieldErrors.bankAddress}
              />

              <Field
                label={t("signupBankInfo.bankCode")}
                required
                value={form.bankCode}
                onChange={set("bankCode")}
                placeholder={t("signupBankInfo.bankCodePlaceholder")}
                currentDir={currentDir}
                error={fieldErrors.bankCode}
              />

              <Field
                label={t("signupBankInfo.swift")}
                required
                value={form.swift}
                onChange={set("swift")}
                placeholder={t("signupBankInfo.swiftPlaceholder")}
                currentDir={currentDir}
                error={fieldErrors.swift}
              />

              <Field
                label={t("signupBankInfo.region")}
                required
                value={form.region}
                onChange={set("region")}
                placeholder={t("signupBankInfo.regionPlaceholder")}
                currentDir={currentDir}
                error={fieldErrors.region}
              />

              <Field
                label={t("signupBankInfo.companyAddress")}
                required
                value={form.companyAddress}
                onChange={set("companyAddress")}
                placeholder={t("signupBankInfo.companyAddressPlaceholder")}
                currentDir={currentDir}
                error={fieldErrors.companyAddress}
              />
            </div>

            <label className={`mt-8 flex items-center gap-3 rounded-md bg-rose-100/70 px-4 py-3 text-sm font-semibold text-slate-800 ${currentDir === 'rtl' ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
              <span>{t("signupBankInfo.agreeTerms")}</span>
              <input
                type="checkbox"
                checked={form.agree}
                onChange={setCheck("agree")}
                className="h-4 w-4 rounded border-slate-300"
              />
            </label>

            <div className={`mt-6 flex flex-col sm:flex-row gap-4 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <button
                type="submit"
                className="w-full sm:w-52 rounded-md bg-amber-500 px-6 py-3 text-sm font-bold text-blue-900 hover:bg-amber-600 transition-colors"
              >
                {t("signupBankInfo.done")}
              </button>
             
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
