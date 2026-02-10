import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useNavigate } from "react-router-dom";
import { X, Loader2 } from "lucide-react";
import { io } from "socket.io-client";
import { countryCodeToFlag, getCountryFlagFromData } from "../utils/flagUtils";
import Header from "../components/Header";
import FooterArabic from "../components/FooterArabic";
import { ROUTES } from "../routes";
import { offerService } from "../services/offerService";
import { dealService } from "../services/dealService";
import { useAuth } from "../contexts/AuthContext";

export default function SellerProductsPage() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  // Test the flag functions immediately
  React.useEffect(() => {
    console.log('🏳️ TESTING FLAGS:');
    console.log('🏳️ SA should be 🇸🇦:', countryCodeToFlag('SA'));
    console.log('🏳️ US should be 🇺🇸:', countryCodeToFlag('US'));
    console.log('🏳️ CN should be 🇨🇳:', countryCodeToFlag('CN'));
    console.log('🏳️ AE should be 🇦🇪:', countryCodeToFlag('AE'));
  }, []);

  // Rest of the component logic will be added here...
  
  return (
    <div>
      <Header />
      
      <div dir={currentDir} className="min-h-screen bg-white pt-40">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          {/* Header */}
          <div className="bg-[#EEF4FF] rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {(() => {
                  const key = "seller.allSellerProducts";
                  const translated = t(key);
                  // If translation returns the key itself, it means translation wasn't found
                  if (translated === key) {
                    return i18n.language === 'ar' ? "جميع بضائع البائع" : "All Seller Products";
                  }
                  return translated;
                })()}
              </h1>
            </div>
            <Link
              to={ROUTES.HOME}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5 text-slate-600" />
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">{t("common.loading")}</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Content will be added here */}
          <div className="text-center py-12">
            <p className="text-slate-600">Page content will be implemented...</p>
            <p className="text-sm text-slate-500 mt-2">
              Flag test: SA = {getCountryFlagFromData('SA')} | 
              AE = {getCountryFlagFromData('AE')} | 
              US = {getCountryFlagFromData('US')}
            </p>
          </div>
        </div>
      </div>
      
      <FooterArabic />
    </div>
  );
}