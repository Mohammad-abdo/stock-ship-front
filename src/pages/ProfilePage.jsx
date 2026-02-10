import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { MainLayout } from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';

function ProfileContent() {
  const { t } = useTranslation();
  const { user, userType, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Check if user is already a trader
  const isTrader = userType === 'TRADER' || (user?.linkedProfiles && user.linkedProfiles.some(p => p.userType === 'TRADER'));
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCountry(user.country || '');
      setCity(user.city || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const result = await updateProfile({
        name,
        phone,
        country,
        city
      });

      if (result.success) {
        setSuccess('تم تحديث الملف الشخصي بنجاح');
      } else {
        setError(result.message || 'حدث خطأ في تحديث الملف الشخصي');
      }
    } catch (err) {
      setError('حدث خطأ في تحديث الملف الشخصي');
      console.error('Update profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <MainLayout className="dir-rtl" contentClassName="min-h-screen bg-slate-50 pt-40 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">الملف الشخصي</h1>

          {/* User Type Badge & Become Seller Button */}
          <div className="mb-6 flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {userType === 'CLIENT' ? 'عميل' : userType === 'TRADER' ? 'تاجر' : userType}
            </span>

            {!isTrader && (
              <button
                onClick={() => navigate(ROUTES.SIGNUP_BANK_INFO)}
                className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-md hover:bg-amber-600 transition-colors"
              >
                كن بائع
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full px-4 py-3 border border-slate-300 rounded-md bg-slate-50 text-slate-500"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الاسم *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الدولة
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المدينة
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}







