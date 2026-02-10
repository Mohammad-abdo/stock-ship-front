import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dealService } from "../../services/dealService";
import { ROUTES } from "../../routes";
import { ChevronLeft, ChevronRight, ShoppingCart, User, Calendar, CreditCard, Box, AlertCircle, Send, MessageSquare, DollarSign, Package } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function TraderViewDeal() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { id } = useParams();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedQuantity, setProposedQuantity] = useState("");
  const [messageType, setMessageType] = useState("TEXT");

  const fetchDeal = async () => {
    try {
      const res = await dealService.getDealById(id);
      console.log("✅ Full API Response:", res.data);
      
      // The API returns data in response.data.data, which contains { deal, platformSettings }
      let dealData = null;
      if (res.data?.success && res.data?.data) {
        // The backend returns { deal, platformSettings }, so we need to access .deal
        if (res.data.data.deal) {
          dealData = res.data.data.deal;
        } else if (res.data.data.id) {
          // Fallback: if data is the deal itself (not nested)
          dealData = res.data.data;
        }
      }
      
      if (dealData) {
        console.log("✅ Deal fetched - Status:", dealData.status, "Deal ID:", dealData.id);
        console.log("✅ Deal Items:", dealData.items?.length || 0, "items");
        console.log("✅ Negotiated Amount:", dealData.negotiatedAmount);
        console.log("✅ Full Deal Data:", dealData);
        
        // If items are missing but we have messages, try to update from messages
        if ((!dealData.items || dealData.items.length === 0) && dealData.id) {
          console.log("⚠️ No items found in deal, checking negotiation messages...");
          try {
            const messagesRes = await dealService.getNegotiationMessages(dealData.id, { limit: 50 });
            const messages = messagesRes.data?.data || messagesRes.data || [];
            
            if (messages.length > 0) {
              // Sort messages by createdAt (newest first)
              const sortedMessages = [...messages].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
              });
              
              // Find the most recent price proposal
              for (const message of sortedMessages) {
                if (message.proposedPrice && message.proposedPrice > 0) {
                  dealData.negotiatedAmount = message.proposedPrice;
                  console.log("✅ Updated negotiatedAmount from messages:", dealData.negotiatedAmount);
                  break;
                }
              }
            }
          } catch (msgError) {
            console.warn("⚠️ Could not fetch messages to update amount:", msgError);
          }
        }
        
        setDeal(dealData);
      } else {
        console.warn("⚠️ No deal data found in API response");
      }
    } catch (err) {
      console.error("Error fetching deal:", err);
      setError("Failed to load deal details");
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      const loadData = async () => {
        await Promise.all([fetchDeal(), fetchMessages()]);
        // Mark messages as read when opening the page
        markMessagesAsRead();
        setLoading(false);
      };
      loadData();
      
      // Poll for new messages and deal updates every 5 seconds
      const interval = setInterval(() => {
        console.log("🔄 Polling for updates...");
        fetchMessages(false);
        fetchDeal(); // Also refresh deal data
      }, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingMessages(true);
      const response = await dealService.getNegotiationMessages(id, {
        page: 1,
        limit: 100
      });
      
      if (response.data?.success && response.data?.data) {
        // Backend returns messages in descending order (newest first) and reverses them
        // So we need to ensure they're sorted by createdAt (oldest first) for display
        const messagesData = Array.isArray(response.data.data) ? response.data.data : [];
        const sortedMessages = [...messagesData].sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await dealService.markMessagesAsRead(id);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      // Don't show error to user, this is a background operation
    }
  };

  const handleSendMessage = async () => {
    // Validate input based on message type
    if (messageType === "TEXT" && !messageText.trim()) {
      return;
    }
    if (messageType === "PRICE_PROPOSAL" && !proposedPrice) {
      alert(t("negotiations.enterPrice") || "يرجى إدخال السعر المقترح");
      return;
    }
    if (messageType === "QUANTITY_PROPOSAL" && !proposedQuantity) {
      alert(t("negotiations.enterQuantity") || "يرجى إدخال الكمية المقترحة");
      return;
    }
    if (!messageText.trim() && !proposedPrice && !proposedQuantity) {
      return;
    }

    try {
      setSending(true);
      const messageData = {
        message: messageText.trim() || null,
        messageType: messageType,
        proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
        proposedQuantity: proposedQuantity ? parseInt(proposedQuantity) : null
      };

      console.log("📤 Sending negotiation message:", messageData);
      const response = await dealService.sendNegotiationMessage(id, messageData);
      console.log("✅ Message sent successfully:", response.data);
      
      // Clear form
      setMessageText("");
      setProposedPrice("");
      setProposedQuantity("");
      setMessageType("TEXT");
      
      // Refresh messages and deal data
      await Promise.all([
        fetchMessages(false),
        fetchDeal() // Also refresh deal to get updated negotiatedAmount
      ]);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      const errorMessage = error.response?.data?.message || error.message || "حدث خطأ أثناء إرسال الرسالة";
      alert(t("negotiations.errorSendingMessage", errorMessage) || errorMessage);
    } finally {
      setSending(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('common.error', 'خطأ')}</h2>
        <p className="text-slate-600 mb-6">{error || t('trader.dealNotFound', 'الصفقة غير موجودة')}</p>
        <Link to={ROUTES.TRADER_DEALS} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {t('common.back', 'عودة')}
        </Link>
      </div>
    );
  }

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
    } catch {
      return amount;
    }
  };

  // Get the latest price and quantity from negotiation messages
  const getLatestNegotiationValues = () => {
    if (!messages || messages.length === 0) {
      return { latestPrice: null, latestQuantity: null };
    }
    
    // Sort messages by createdAt (newest first) to get the latest
    const sortedMessages = [...messages].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    let latestPrice = null;
    let latestQuantity = null;
    
    // Find the most recent price and quantity proposals
    for (const message of sortedMessages) {
      if (message.proposedPrice && latestPrice === null) {
        latestPrice = message.proposedPrice;
      }
      if (message.proposedQuantity && latestQuantity === null) {
        latestQuantity = message.proposedQuantity;
      }
      // If we found both, we can break early
      if (latestPrice !== null && latestQuantity !== null) {
        break;
      }
    }
    
    return { latestPrice, latestQuantity };
  };

  const { latestPrice, latestQuantity } = getLatestNegotiationValues();

  // Calculate statistics from deal items
  const calculateStatistics = () => {
    if (!deal?.items || deal.items.length === 0) {
      return {
        totalAmount: 0,
        totalCubicMeter: 0,
        totalCartons: 0,
        itemsCount: 0,
        paymentsCount: deal?.payments?.length || 0
      };
    }

    const stats = deal.items.reduce((acc, item) => {
      const quantity = item.negotiatedQuantity || item.quantity || 0;
      const unitPrice = item.negotiatedPrice || item.unitPrice || 0;
      const amount = quantity * unitPrice;
      
      return {
        totalAmount: acc.totalAmount + amount,
        totalCubicMeter: acc.totalCubicMeter + (item.cubicMeter || 0) * quantity,
        totalCartons: acc.totalCartons + (item.cartons || 0) * quantity,
        itemsCount: acc.itemsCount + 1
      };
    }, {
      totalAmount: 0,
      totalCubicMeter: 0,
      totalCartons: 0,
      itemsCount: 0
    });

    return {
      ...stats,
      paymentsCount: deal?.payments?.length || 0
    };
  };

  const statistics = calculateStatistics();

  const handleApprove = async () => {
    try {
      // Recalculate statistics and latest values to ensure we have fresh data
      const currentStatistics = calculateStatistics();
      const currentLatestValues = getLatestNegotiationValues();
      const currentLatestPrice = currentLatestValues.latestPrice;
      
      // Calculate negotiatedAmount from items or use latest price
      // Priority: deal.negotiatedAmount > statistics.totalAmount > latestPrice > 0
      let calculatedAmount = null;
      
      // Try deal.negotiatedAmount first
      if (deal?.negotiatedAmount && parseFloat(deal.negotiatedAmount) > 0) {
        calculatedAmount = parseFloat(deal.negotiatedAmount);
      }
      // Try statistics.totalAmount
      else if (currentStatistics?.totalAmount && currentStatistics.totalAmount > 0) {
        calculatedAmount = currentStatistics.totalAmount;
      }
      // Try latestPrice from messages
      else if (currentLatestPrice && parseFloat(currentLatestPrice) > 0) {
        calculatedAmount = parseFloat(currentLatestPrice);
      }
      // Default to 0
      else {
        calculatedAmount = 0;
      }
      
      console.log("🔍 Approve Deal Debug:", {
        dealNegotiatedAmount: deal?.negotiatedAmount,
        statisticsTotalAmount: currentStatistics?.totalAmount,
        latestPrice: currentLatestPrice,
        calculatedAmount: calculatedAmount,
        hasItems: deal?.items && deal.items.length > 0,
        itemsCount: deal?.items?.length || 0,
        items: deal?.items
      });
      
      // Validate that we have a valid amount
      if (!calculatedAmount || calculatedAmount <= 0 || isNaN(calculatedAmount)) {
        const errorMsg = t('trader.noAmountToApprove', 'لا يمكن الموافقة على الصفقة بدون مبلغ صحيح. يرجى التأكد من وجود عناصر أو سعر متفق عليه.') || 
                         'لا يمكن الموافقة على الصفقة بدون مبلغ صحيح. يرجى التأكد من وجود عناصر أو سعر متفق عليه.';
        console.error("❌ Invalid negotiatedAmount:", {
          calculatedAmount: calculatedAmount,
          dealNegotiatedAmount: deal?.negotiatedAmount,
          statisticsTotalAmount: currentStatistics?.totalAmount,
          latestPrice: currentLatestPrice,
          isNaN: isNaN(calculatedAmount)
        });
        alert(errorMsg);
        return;
      }

      console.log("✅ Approving deal with amount:", calculatedAmount);
      
      // Call the approve deal API endpoint
      const response = await dealService.approveDeal(id, {
        negotiatedAmount: calculatedAmount
      });
      
      if (response.data?.success) {
        // Refresh deal data
        await fetchDeal();
        alert(t('trader.dealApproved', 'تم الموافقة على الصفقة بنجاح') || 'تم الموافقة على الصفقة بنجاح');
      }
    } catch (error) {
      console.error("❌ Error approving deal:", error);
      const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ أثناء الموافقة على الصفقة';
      alert(t('trader.errorApprovingDeal', errorMessage) || errorMessage);
    }
  };

  const handleReject = async () => {
    if (!confirm(t('trader.confirmReject', 'هل أنت متأكد من رفض هذه الصفقة؟') || 'هل أنت متأكد من رفض هذه الصفقة؟')) {
      return;
    }

    try {
      // Call the reject deal API endpoint
      const response = await dealService.rejectDeal(id);
      
      if (response.data?.success) {
        // Refresh deal data
        await fetchDeal();
        alert(t('trader.dealRejected', 'تم رفض الصفقة') || 'تم رفض الصفقة');
      }
    } catch (error) {
      console.error("❌ Error rejecting deal:", error);
      const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ أثناء رفض الصفقة';
      alert(t('trader.errorRejectingDeal', errorMessage) || errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12" dir={currentDir}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
          <Link to={ROUTES.TRADER_DASHBOARD} className="hover:text-slate-900">{t('trader.dashboard', 'لوحة التحكم')}</Link>
          {currentDir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Link to={ROUTES.TRADER_DEALS} className="hover:text-slate-900">{t('trader.deals', 'صفقاتي')}</Link>
          {currentDir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-slate-900 font-semibold truncate max-w-[200px]">{deal.dealNumber || '#' + deal.id.substring(0,8)}</span>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Left Col */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Deal Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('trader.deal', 'صفقة')} {deal.dealNumber}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                    {getStatusLabel(deal.status)}
                  </span>
                </div>
                <div className="flex flex-col items-end text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(deal.createdAt).toLocaleDateString()}
                  </span>
                  <span className="mt-1 font-bold text-slate-900 text-lg">
                    {formatCurrency(deal.negotiatedAmount || latestPrice || 0)}
                  </span>
                  {(latestPrice || latestQuantity) && (
                    <div className="mt-2 text-xs text-slate-600">
                      {latestPrice && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {t("negotiations.latestPrice") || "آخر سعر"}: {formatCurrency(latestPrice)}
                        </div>
                      )}
                      {latestQuantity && (
                        <div className="flex items-center gap-1 mt-1">
                          <Package className="w-3 h-3" />
                          {t("negotiations.latestQuantity") || "آخر كمية"}: {latestQuantity}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Deal Stages / Progress could accept status logic later */}
            </div>

            {/* Quick Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-blue-600" />
                {t('trader.quickStatistics', 'إحصائيات سريعة')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">{t('trader.totalAmount', 'إجمالي المبلغ')}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(deal.negotiatedAmount || statistics.totalAmount || latestPrice || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">{t('trader.totalCubicMeter', 'إجمالي المتر المكعب')}</span>
                  <span className="font-semibold text-slate-900">{statistics.totalCubicMeter.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">{t('trader.totalCartons', 'إجمالي الكرتونات')}</span>
                  <span className="font-semibold text-slate-900">{statistics.totalCartons}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">{t('trader.items', 'العناصر')}</span>
                  <span className="font-semibold text-slate-900">{statistics.itemsCount}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">{t('trader.payments', 'المدفوعات')}</span>
                  <span className="font-semibold text-slate-900">{statistics.paymentsCount}</span>
                </div>
              </div>
            </div>

            {/* Deal Items */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Box className="w-5 h-5 text-blue-600" />
                {t('trader.dealItems', 'عناصر الصفقة')} ({deal.items?.length || 0})
              </h3>
              
              {deal.items && deal.items.length > 0 ? (
                <>
                  {/* Search Input */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder={t('trader.searchItems', '...بحث عن العناصر')}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                    />
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-right text-slate-700 font-semibold">{t('trader.itemNumber', 'رقم العنصر')}</th>
                          <th className="px-4 py-3 text-right text-slate-700 font-semibold">{t('trader.description', 'الوصف')}</th>
                          <th className="px-4 py-3 text-right text-slate-700 font-semibold">{t('trader.quantity', 'الكمية')}</th>
                          <th className="px-4 py-3 text-right text-slate-700 font-semibold">{t('trader.unit', 'الوحدة')}</th>
                          <th className="px-4 py-3 text-right text-slate-700 font-semibold">{t('trader.unitPrice', 'سعر الوحدة')}</th>
                          <th className="px-4 py-3 text-right text-slate-700 font-semibold">{t('trader.amount', 'المبلغ')}</th>
                          <th className="px-4 py-3 text-right text-slate-700 font-semibold">{t('trader.cartons', 'الكرتونات')}</th>
                          <th className="px-4 py-3 text-right text-slate-700 font-semibold">{t('trader.cubicMeter', 'المتر المكعب')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deal.items.map((item, index) => {
                          const quantity = item.negotiatedQuantity || item.quantity || 0;
                          const unitPrice = item.negotiatedPrice || item.unitPrice || 0;
                          const amount = quantity * unitPrice;
                          const cartons = (item.cartons || 0) * quantity;
                          const cubicMeter = (item.cubicMeter || 0) * quantity;
                          
                          return (
                            <tr key={item.id || index} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-900">{index + 1}</td>
                              <td className="px-4 py-3 text-slate-900">
                                {item.offerItem?.description || item.description || '-'}
                              </td>
                              <td className="px-4 py-3 text-slate-900">{quantity}</td>
                              <td className="px-4 py-3 text-slate-900">{item.unit || '-'}</td>
                              <td className="px-4 py-3 text-slate-900">{formatCurrency(unitPrice)}</td>
                              <td className="px-4 py-3 text-slate-900 font-semibold">{formatCurrency(amount)}</td>
                              <td className="px-4 py-3 text-slate-900">{cartons}</td>
                              <td className="px-4 py-3 text-slate-900">{cubicMeter.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Box className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p>{t('common.noData', 'لا توجد عناصر في هذه الصفقة')}</p>
                </div>
              )}
            </div>

            {/* Related Offer Details (if available in deal object) */}
            {deal.offer && (
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Box className="w-5 h-5 text-blue-600" />
                    {t('trader.relatedOffer', 'العرض المرتبط')}
                 </h3>
                 <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50">
                    <div className="w-16 h-16 bg-white rounded border border-slate-200 overflow-hidden">
                       {deal.offer.images && deal.offer.images[0] ? (
                           <img src={deal.offer.images[0]} alt="" className="w-full h-full object-cover" />
                       ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-300"><Box /></div>
                       )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900">{deal.offer.title}</h4>
                        <Link to={ROUTES.TRADER_OFFER_DETAILS.replace(':id', deal.offer.id)} className="text-sm text-blue-600 hover:underline">
                            {t('common.viewDetails', 'عرض التفاصيل')}
                        </Link>
                    </div>
                 </div>
               </div>
            )}
            
            {/* Negotiation Messages */}
            {(deal.status === 'NEGOTIATION' || deal.status === 'APPROVED') && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  {t("negotiations.messages") || "رسائل التفاوض"}
                </h3>

                {/* Messages Area */}
                <div className="h-96 overflow-y-auto p-4 space-y-4 mb-4 border border-slate-100 rounded-lg bg-slate-50">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      {t("common.loading") || "جاري التحميل..."}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      {t("negotiations.noMessages") || "لا توجد رسائل بعد"}
                    </div>
                  ) : (
                    messages.map((message) => {
                      // Check if message was sent by current user
                      // Check by senderId first (most reliable), then by senderType and specific IDs
                      const isMyMessage = message.senderId === user?.id || 
                        (message.senderType === 'CLIENT' && message.clientId === user?.id) ||
                        (message.senderType === 'TRADER' && message.traderId === user?.id) ||
                        (message.senderType === 'EMPLOYEE' && message.employeeId === user?.id);
                      
                      // Determine sender name
                      let senderName = t("negotiations.you") || "أنت";
                      if (!isMyMessage) {
                        if (message.senderType === 'CLIENT') {
                          senderName = deal.client?.name || message.client?.name || t("negotiations.otherParty") || "الطرف الآخر";
                        } else if (message.senderType === 'TRADER') {
                          senderName = deal.trader?.companyName || deal.trader?.name || message.trader?.companyName || message.trader?.name || t("negotiations.otherParty") || "الطرف الآخر";
                        } else {
                          senderName = t("negotiations.otherParty") || "الطرف الآخر";
                        }
                      }

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMyMessage ? (currentDir === 'rtl' ? 'justify-start' : 'justify-end') : (currentDir === 'rtl' ? 'justify-end' : 'justify-start')}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isMyMessage
                                ? "bg-blue-900 text-white"
                                : "bg-slate-100 text-slate-900"
                            }`}
                          >
                            <div className="text-xs opacity-75 mb-1">{senderName}</div>
                            
                            {message.message && (
                              <div className="mb-2">{message.message}</div>
                            )}

                            {message.proposedPrice && (
                              <div className="flex items-center gap-2 text-sm mb-1">
                                <DollarSign className="h-4 w-4" />
                                <span>
                                  {t("negotiations.proposedPrice") || "السعر المقترح"}: {message.proposedPrice.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                                </span>
                              </div>
                            )}

                            {message.proposedQuantity && (
                              <div className="flex items-center gap-2 text-sm mb-1">
                                <Package className="h-4 w-4" />
                                <span>
                                  {t("negotiations.proposedQuantity") || "الكمية المقترحة"}: {message.proposedQuantity}
                                </span>
                              </div>
                            )}

                            <div className="text-xs opacity-75 mt-2">
                              {new Date(message.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMessageType("TEXT")}
                      className={`px-3 py-1 rounded text-sm ${
                        messageType === "TEXT"
                          ? "bg-blue-900 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t("negotiations.textMessage") || "رسالة نصية"}
                    </button>
                    <button
                      onClick={() => setMessageType("PRICE_PROPOSAL")}
                      className={`px-3 py-1 rounded text-sm ${
                        messageType === "PRICE_PROPOSAL"
                          ? "bg-blue-900 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t("negotiations.priceProposal") || "اقتراح سعر"}
                    </button>
                    <button
                      onClick={() => setMessageType("QUANTITY_PROPOSAL")}
                      className={`px-3 py-1 rounded text-sm ${
                        messageType === "QUANTITY_PROPOSAL"
                          ? "bg-blue-900 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t("negotiations.quantityProposal") || "اقتراح كمية"}
                    </button>
                  </div>

                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t("negotiations.typeMessage") || "اكتب رسالتك هنا..."}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                    rows={3}
                  />

                  {messageType === "PRICE_PROPOSAL" && (
                    <input
                      type="number"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      placeholder={t("negotiations.enterPrice") || "أدخل السعر المقترح"}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                    />
                  )}

                  {messageType === "QUANTITY_PROPOSAL" && (
                    <input
                      type="number"
                      value={proposedQuantity}
                      onChange={(e) => setProposedQuantity(e.target.value)}
                      placeholder={t("negotiations.enterQuantity") || "أدخل الكمية المقترحة"}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                    />
                  )}

                  <button
                    onClick={handleSendMessage}
                    disabled={sending || (!messageText.trim() && !proposedPrice && !proposedQuantity)}
                    className={`flex items-center gap-2 rounded-md bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed ${currentDir === 'rtl' ? 'flex-row-reverse ml-auto' : 'flex-row'}`}
                  >
                    <Send className="h-4 w-4" />
                    {sending ? (t("negotiations.sending") || "جاري الإرسال...") : (t("negotiations.send") || "إرسال")}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Info & Receipts */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    {t('checkout.payment', 'الدفع')} / {t('common.payments', 'المدفوعات')}
                 </h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-slate-600">{t('checkout.total', 'الإجمالي')}</span>
                        <span className="font-bold text-slate-900">{formatCurrency(deal.negotiatedAmount)}</span>
                    </div>
                    {deal.payments && deal.payments.length > 0 ? (
                      <div className="space-y-4 mt-4">
                        {deal.payments.map((payment) => {
                          const receiptFullUrl = payment.receiptUrl
                            ? `${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '') || window.location.origin}${payment.receiptUrl.startsWith('/') ? '' : '/'}${payment.receiptUrl}`
                            : null;
                          return (
                            <div key={payment.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                              <div className={`flex flex-wrap justify-between items-start gap-2 text-sm ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                <div>
                                  <span className="text-slate-600">{formatCurrency(payment.amount)}</span>
                                  <span className="mx-2 text-slate-400">•</span>
                                  <span className="text-slate-700">{payment.method}</span>
                                  <span className="mx-2 text-slate-400">•</span>
                                  <span className={payment.status === 'VERIFIED' ? 'text-green-600' : payment.status === 'PENDING' ? 'text-amber-600' : 'text-slate-600'}>
                                    {payment.status === 'VERIFIED' ? (t('payment.verified', 'تم التحقق') || 'تم التحقق') : payment.status === 'PENDING' ? (t('payment.pending', 'قيد المراجعة') || 'قيد المراجعة') : payment.status}
                                  </span>
                                </div>
                                <span className="text-slate-500 text-xs">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US') : ''}</span>
                              </div>
                              {receiptFullUrl && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold text-slate-600 mb-2">{t('payment.receipt', 'إيصال الدفع')}</p>
                                  <a href={receiptFullUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow max-w-[280px]">
                                    {/\.(pdf)$/i.test(payment.receiptUrl) ? (
                                      <span className="flex items-center gap-2 px-4 py-3 text-sm text-blue-600 font-medium">
                                        <CreditCard className="w-5 h-5" />
                                        {t('payment.viewPdf', 'عرض PDF')}
                                      </span>
                                    ) : (
                                      <img src={receiptFullUrl} alt={t('payment.receipt', 'إيصال الدفع')} className="w-full h-auto max-h-48 object-contain" />
                                    )}
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 mt-2">{t('payment.noPaymentsYet', 'لا توجد مدفوعات بعد')}</p>
                    )}
                 </div>
             </div>

          </div>

          {/* Sidebar - Right Col */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4">{t('common.status', 'الحالة')}</h3>
              <div className="space-y-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(deal.status)}`}>
                  {getStatusLabel(deal.status)}
                </span>
                {deal.status === 'NEGOTIATION' && (
                  <p className="text-sm text-slate-600 mt-2">
                    {t('trader.canApproveDeal', 'يمكنك الموافقة على هذه الصفقة للمتابعة') || 'يمكنك الموافقة على هذه الصفقة للمتابعة'}
                  </p>
                )}
              </div>
            </div>

            {/* Client Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <User className="w-5 h-5 text-slate-500" />
                 {t('trader.client', 'العميل')}
              </h3>
              
              {deal.client ? (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {deal.client.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900">{deal.client.name}</div>
                        <div className="text-slate-500">{deal.client.email}</div>
                    </div>
                  </div>
                  
                  {deal.client.phone && (
                     <div className="pt-3 border-t border-slate-50 flex justify-between">
                        <span className="text-slate-500">{t('common.phone', 'الهاتف')}</span>
                        <span className="text-slate-900">{deal.client.phone}</span>
                     </div>
                  )}
                  {deal.client.country && (
                     <div className="pt-2 flex justify-between">
                        <span className="text-slate-500">{t('common.country', 'الدولة')}</span>
                        <span className="text-slate-900">{deal.client.country}</span>
                     </div>
                  )}
                </div>
              ) : (
                 <div className="text-slate-500 italic">{t('trader.noClientInfo', 'معلومات العميل غير متوفرة')}</div>
              )}
            </div>

            {/* Actions for Trader (e.g., Approve, Reject - simplified for now) */}
            {deal.status === 'NEGOTIATION' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-900 mb-3">{t('common.actions', 'إجراءات')}</h3>
                    <button 
                      onClick={handleApprove}
                      className="w-full mb-2 py-2 px-4 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition"
                    >
                        {t('trader.approveDeal', 'موافقة على الصفقة')}
                    </button>
                    <button 
                      onClick={handleReject}
                      className="w-full py-2 px-4 bg-white border border-red-200 text-red-600 rounded font-medium hover:bg-red-50 transition"
                    >
                         {t('trader.rejectDeal', 'رفض الصفقة')}
                    </button>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
