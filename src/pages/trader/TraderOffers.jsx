import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { traderService } from "../../services/traderService";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";
import { Package, Plus, ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function TraderOffers() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const traderRes = await traderService.getTraderById(user.id);
        // Depending on API structure, offers might be nested or direct
        const traderData = traderRes.data.data || traderRes.data;
        setOffers(traderData.offers || []);
      } catch (error) {
        console.error('Error loading offers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadOffers();
    }
  }, [user]);

  const filteredOffers = offers.filter(offer => 
    offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    offer.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING_VALIDATION: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
      DRAFT: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12" dir={currentDir}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to={ROUTES.TRADER_DASHBOARD} className="text-slate-500 hover:text-slate-700">
                {currentDir === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">
                {t('trader.offers', 'إعلاناتي')}
              </h1>
            </div>
            <p className="text-slate-600 ml-7 rtl:mr-7">
              {t('trader.manageOffers', 'إدارة ومتابعة جميع إعلاناتك')}
            </p>
          </div>
          <Link
            to={ROUTES.PUBLISH_AD}
            className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>{t('trader.createOffer', 'إعلان جديد')}</span>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('common.search', 'بحث...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        </div>

        {/* Offers List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           {filteredOffers.length > 0 ? (
             <div className="divide-y divide-slate-100">
               {filteredOffers.map((offer) => (
                 <div 
                   key={offer.id}
                   onClick={() => navigate(ROUTES.TRADER_OFFER_DETAILS.replace(':id', offer.id))}
                   className="p-4 sm:p-6 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                 >
                   <div className="flex items-start gap-4">
                     <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                       <Package className="w-6 h-6 text-blue-600" />
                     </div>
                     <div>
                       <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                         {offer.title || 'Untitled Offer'}
                       </h3>
                       <div className="flex items-center gap-3 mt-1 flex-wrap">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(offer.status)}`}>
                           {offer.status}
                         </span>
                         <span className="text-sm text-slate-500">
                           {offer._count?.items || 0} {t('common.items', 'عنصر')}
                         </span>
                         {offer.totalCBM && (
                           <span className="text-sm text-slate-500">
                             {parseFloat(offer.totalCBM).toFixed(2)} CBM
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                   <div className="text-right sm:text-left rtl:text-left rtl:sm:text-right">
                     <span className="text-xs text-slate-400 block">
                       {new Date(offer.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="p-12 text-center">
               <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <p className="text-slate-500 mb-4">{t('trader.noOffersFound', 'لم يتم العثور على إعلانات')}</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
