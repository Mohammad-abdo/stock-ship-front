import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { offerService } from "../../services/offerService";
import { ROUTES } from "../../routes";
import { ChevronLeft, ChevronRight, Package, Calendar, MapPin, Box, Layers, AlertCircle } from "lucide-react";

export default function TraderViewOffer() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { id } = useParams();
  
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        setLoading(true);
        const res = await offerService.getOfferById(id);
        setOffer(res.data.data || res.data);
      } catch (err) {
        console.error("Error fetching offer:", err);
        setError("Failed to load offer details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOffer();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('common.error', 'خطأ')}</h2>
        <p className="text-slate-600 mb-6">{error || t('trader.offerNotFound', 'العرض غير موجود')}</p>
        <Link to={ROUTES.TRADER_OFFERS} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {t('common.back', 'عودة')}
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING_VALIDATION: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
      DRAFT: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12" dir={currentDir}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
          <Link to={ROUTES.TRADER_DASHBOARD} className="hover:text-slate-900">{t('trader.dashboard', 'لوحة التحكم')}</Link>
          {currentDir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Link to={ROUTES.TRADER_OFFERS} className="hover:text-slate-900">{t('trader.offers', 'إعلاناتي')}</Link>
          {currentDir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-slate-900 font-semibold truncate max-w-[200px]">{offer.title}</span>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Left Col */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Offer Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{offer.title}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                    {offer.status}
                  </span>
                </div>
                <div className="flex flex-col items-end text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </span>
                  <span className="mt-1 text-slate-400">ID: {offer.id.substring(0, 8)}...</span>
                </div>
              </div>

              <div className="mt-6 prose prose-slate max-w-none">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('trader.description', 'الوصف')}</h3>
                <p className="text-slate-600 whitespace-pre-wrap">{offer.description || t('common.noDescription', 'لا يوجد وصف')}</p>
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  {t('trader.offerItems', 'عناصر العرض')}
                </h3>
                <span className="text-sm text-slate-500">
                  {offer.items?.length || 0} {t('common.items', 'عنصر')}
                </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {offer.items && offer.items.length > 0 ? (
                  offer.items.map((item, idx) => (
                    <div key={idx} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200">
                           {/* Placeholder for item image if available */}
                           <div className="w-full h-full flex items-center justify-center text-slate-400">
                             <Box className="w-8 h-8" />
                           </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{item.productName}</h4>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              <span className="font-medium">{t('checkout.quantity')}:</span>
                              <span>{item.quantity} {item.unit}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              <span className="font-medium">{t('checkout.price')}:</span>
                              <span>{item.unitPrice} {item.currency}</span>
                            </div>
                             {item.cbm && (
                              <div className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                <span className="font-medium">CBM:</span>
                                <span>{item.cbm}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    {t('trader.noItems', 'لا توجد عناصر')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Col */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4">{t('trader.offerDetails', 'تفاصيل العرض')}</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> {t('common.category', 'التصنيف')}
                  </span>
                  <span className="font-medium text-slate-900">{offer.category || 'N/A'}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {t('common.location', 'الموقع')}
                  </span>
                  <span className="font-medium text-slate-900">
                    {[offer.city, offer.country].filter(Boolean).join(', ') || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">{t('checkout.totalQuantity', 'إجمالي الكمية')}</span>
                  <span className="font-medium text-slate-900">{offer.totalCartons || 0}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">{t('checkout.totalCbm', 'إجمالي الحجم')}</span>
                  <span className="font-medium text-slate-900">{offer.totalCBM ? `${offer.totalCBM} m³` : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Images Gallery Preview (simplified) */}
            {offer.images && offer.images.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-4">{t('trader.images', 'الصور')} ({offer.images.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {offer.images.slice(0, 6).map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
