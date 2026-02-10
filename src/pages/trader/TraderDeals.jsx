import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { dealService } from "../../services/dealService";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";
import { ShoppingCart, ChevronLeft, ChevronRight, Search, Users, Check } from "lucide-react";

export default function TraderDeals() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadDeals = async () => {
      try {
        // Fetch deals for this trader
        const dealsRes = await dealService.getDeals({ traderId: user.id, limit: 100 });
        let dealsData = dealsRes.data.data || dealsRes.data || [];
        
        // For each deal, fetch the latest negotiation messages to get the latest price and quantity
        const dealsWithNegotiationData = await Promise.all(
          dealsData.map(async (deal) => {
            // If deal already has negotiatedAmount, use it
            if (deal.negotiatedAmount && deal.negotiatedAmount > 0) {
              return deal;
            }
            
            // Otherwise, try to get latest price from negotiation messages
            try {
              const messagesRes = await dealService.getNegotiationMessages(deal.id, { limit: 50 });
              const messages = messagesRes.data?.data || messagesRes.data || [];
              
              if (messages.length > 0) {
                // Sort messages by createdAt (newest first)
                const sortedMessages = [...messages].sort((a, b) => {
                  return new Date(b.createdAt) - new Date(a.createdAt);
                });
                
                // Find the most recent price proposal
                let latestPrice = null;
                for (const message of sortedMessages) {
                  if (message.proposedPrice && message.proposedPrice > 0) {
                    latestPrice = message.proposedPrice;
                    break;
                  }
                }
                
                // If we found a latest price, update the deal
                if (latestPrice) {
                  return {
                    ...deal,
                    negotiatedAmount: latestPrice
                  };
                }
              }
            } catch (msgError) {
              console.warn(`Could not fetch messages for deal ${deal.id}:`, msgError);
            }
            
            return deal;
          })
        );
        
        setDeals(dealsWithNegotiationData);
      } catch (error) {
        console.error('Error loading deals:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadDeals();
    }
  }, [user]);

  const filteredDeals = deals.filter(deal => 
    deal.dealNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    deal.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      NEGOTIATION: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-purple-100 text-purple-800',
      SETTLED: 'bg-indigo-100 text-indigo-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    if (!status) return '';
    const statusKey = `mediation.deals.status.${status.toLowerCase()}`;
    try {
      const translated = t(statusKey, { defaultValue: status });
      // If translation returns the key itself (not found), return the original status
      if (translated === statusKey || translated === undefined) {
        console.warn(`Translation not found for key: ${statusKey}, using status: ${status}`);
        return status;
      }
      return translated;
    } catch (error) {
      console.error(`Error translating status ${status}:`, error);
      return status;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    try {
      return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      return amount;
    }
  };

  const handleApprove = async (e, deal) => {
    e.stopPropagation(); // Prevent navigation when clicking approve button
    
    try {
      // First, try to fetch the full deal data to get items
      let dealData = deal;
      try {
        const dealResponse = await dealService.getDealById(deal.id);
        if (dealResponse.data?.success && dealResponse.data?.data) {
          if (dealResponse.data.data.deal) {
            dealData = dealResponse.data.data.deal;
          } else if (dealResponse.data.data.id) {
            dealData = dealResponse.data.data;
          }
        }
      } catch (fetchError) {
        console.warn("⚠️ Could not fetch full deal data, using provided deal:", fetchError);
      }
      
      // Calculate negotiatedAmount from deal items or use deal's negotiatedAmount
      let calculatedAmount = dealData?.negotiatedAmount;
      
      // If no negotiatedAmount, calculate from items
      if (!calculatedAmount || calculatedAmount === 0) {
        if (dealData?.items && dealData.items.length > 0) {
          calculatedAmount = dealData.items.reduce((total, item) => {
            const quantity = item.negotiatedQuantity || item.quantity || 0;
            const unitPrice = item.negotiatedPrice || item.unitPrice || 0;
            return total + (quantity * unitPrice);
          }, 0);
        }
      }
      
      // If still no amount, try to get from latest negotiation messages
      if (!calculatedAmount || calculatedAmount === 0) {
        try {
          const messagesRes = await dealService.getNegotiationMessages(deal.id, { limit: 50 });
          const messages = messagesRes.data?.data || messagesRes.data || [];
          
          if (messages.length > 0) {
            // Sort messages by createdAt (newest first)
            const sortedMessages = [...messages].sort((a, b) => {
              return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            // Find the most recent price proposal
            for (const message of sortedMessages) {
              if (message.proposedPrice && message.proposedPrice > 0) {
                calculatedAmount = message.proposedPrice;
                console.log("✅ Found latest price from negotiation messages:", calculatedAmount);
                break;
              }
            }
          }
        } catch (msgError) {
          console.warn("⚠️ Could not fetch negotiation messages:", msgError);
        }
      }
      
      console.log("🔍 Approve Deal Debug:", {
        dealId: deal.id,
        dealNegotiatedAmount: dealData?.negotiatedAmount,
        calculatedAmount: calculatedAmount,
        hasItems: dealData?.items && dealData.items.length > 0,
        itemsCount: dealData?.items?.length || 0
      });
      
      // If still no amount, show error
      if (!calculatedAmount || calculatedAmount <= 0 || isNaN(calculatedAmount)) {
        const errorMsg = t('trader.noAmountToApprove', 'لا يمكن الموافقة على الصفقة بدون مبلغ صحيح. يرجى فتح الصفقة وإضافة مبلغ أو عناصر.') || 
                        'لا يمكن الموافقة على الصفقة بدون مبلغ صحيح. يرجى فتح الصفقة وإضافة مبلغ أو عناصر.';
        console.error("❌ Invalid negotiatedAmount:", calculatedAmount);
        alert(errorMsg);
        return;
      }

      console.log("✅ Approving deal:", deal.id, "with amount:", calculatedAmount);
      
      // Call the approve deal API endpoint
      const response = await dealService.approveDeal(deal.id, {
        negotiatedAmount: parseFloat(calculatedAmount)
      });
      
      if (response.data?.success) {
        // Refresh deals list
        const dealsRes = await dealService.getDeals({ traderId: user.id, limit: 100 });
        setDeals(dealsRes.data.data || dealsRes.data || []);
        alert(t('trader.dealApproved', 'تم الموافقة على الصفقة بنجاح') || 'تم الموافقة على الصفقة بنجاح');
      }
    } catch (error) {
      console.error("❌ Error approving deal:", error);
      const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ أثناء الموافقة على الصفقة';
      alert(t('trader.errorApprovingDeal', errorMessage) || errorMessage);
    }
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
                {t('trader.deals', 'صفقاتي')}
              </h1>
            </div>
            <p className="text-slate-600 ml-7 rtl:mr-7">
              {t('trader.manageDeals', 'متابعة جميع الصفقات والطلبات')}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('common.searchDeals', 'بحث في الصفقات...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        </div>

        {/* Deals List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           {filteredDeals.length > 0 ? (
             <div className="divide-y divide-slate-100">
               {filteredDeals.map((deal) => (
                 <div 
                   key={deal.id}
                   className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                 >
                   <div 
                     onClick={() => navigate(ROUTES.TRADER_DEAL_DETAILS.replace(':id', deal.id))}
                     className="flex items-start gap-4 flex-1 cursor-pointer"
                   >
                     <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                       <ShoppingCart className="w-6 h-6 text-green-600" />
                     </div>
                     <div>
                       <h3 className="font-semibold text-slate-900 font-mono group-hover:text-blue-700 transition-colors">
                         {deal.dealNumber || 'NO-NUMBER'}
                       </h3>
                       <div className="flex items-center gap-3 mt-1 flex-wrap">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(deal.status)}`}>
                           {getStatusLabel(deal.status)}
                         </span>
                         {deal.client && (
                           <span className="text-sm text-slate-500 flex items-center gap-1">
                             <Users className="w-4 h-4" />
                             {deal.client.name}
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="text-right sm:text-left rtl:text-left rtl:sm:text-right">
                       <span className="block font-bold text-slate-900">
                         {formatCurrency(deal.negotiatedAmount || 0)}
                       </span>
                       <span className="text-xs text-slate-400 block mt-1">
                         {new Date(deal.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                       </span>
                     </div>
                     {deal.status === 'NEGOTIATION' && (
                       <button
                         onClick={(e) => handleApprove(e, deal)}
                         className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition flex items-center gap-1"
                       >
                         <Check className="w-4 h-4" />
                         {t('trader.approve', 'موافقة')}
                       </button>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="p-12 text-center">
               <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <p className="text-slate-500 mb-4">{t('trader.noDealsFound', 'لم يتم العثور على صفقات')}</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
