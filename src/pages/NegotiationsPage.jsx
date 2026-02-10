import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES, getCompanyProfileUrl } from "../routes";
import { offerService } from "../services/offerService";
import { dealService } from "../services/dealService";
import { notificationService } from "../services/notificationService";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/Layout";
import { Clock, CheckCircle, XCircle, MessageSquare, Building2 } from "lucide-react";

const getStatusBadge = (status, t) => {
  const statusMap = {
    'PENDING': {
      label: t("negotiations.status.pending") || "قيد الانتظار",
      className: "bg-amber-100 text-amber-900",
      icon: Clock
    },
    'ACCEPTED': {
      label: t("negotiations.status.accepted") || "مقبول",
      className: "bg-green-100 text-green-900",
      icon: CheckCircle
    },
    'REJECTED': {
      label: t("negotiations.status.rejected") || "مرفوض",
      className: "bg-red-100 text-red-900",
      icon: XCircle
    },
    'CANCELLED': {
      label: t("negotiations.status.cancelled") || "ملغي",
      className: "bg-slate-100 text-slate-900",
      icon: XCircle
    },
  };

  return statusMap[status] || {
    label: status,
    className: "bg-slate-100 text-slate-900",
    icon: Clock
  };
};

export default function NegotiationsPage() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [priceQuoteNotifications, setPriceQuoteNotifications] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [priceQuoteCount, setPriceQuoteCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNegotiations();
    }
  }, [isAuthenticated]);

  // Fetch price quote count for tab badge (when authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      setPriceQuoteCount(0);
      return;
    }
    const fetchCount = async () => {
      try {
        const res = await notificationService.getNotifications({ type: "PRICE_QUOTE", limit: 99 });
        const data = res.data?.data ?? res.data;
        const list = Array.isArray(data) ? data : [];
        setPriceQuoteCount(list.length);
      } catch {
        setPriceQuoteCount(0);
      }
    };
    fetchCount();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeStatus === "priceQuote") {
      fetchPriceQuoteNotifications();
    }
  }, [isAuthenticated, activeStatus]);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const response = await offerService.getMyNegotiations();

      if (response.data && response.data.success) {
        // The response contains deals with NEGOTIATION status
        // Transform deals to negotiation format
        const dealsData = response.data.data || [];
        const negotiationsData = dealsData.map(deal => ({
          id: deal.id,
          dealId: deal.id,
          offerId: deal.offerId,
          status: deal.status === 'NEGOTIATION' ? 'PENDING' :
            deal.status === 'APPROVED' ? 'ACCEPTED' :
              deal.status === 'REJECTED' ? 'REJECTED' :
                deal.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING',
          offer: deal.offer,
          trader: deal.trader,
          items: deal.items || [],
          notes: deal.notes,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt
        }));

        setNegotiations(negotiationsData);
      }
    } catch (error) {
      console.error("Error fetching negotiations:", error);
      setNegotiations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceQuoteNotifications = async () => {
    try {
      setLoadingQuotes(true);
      const response = await notificationService.getNotifications({ type: "PRICE_QUOTE", limit: 50 });
      const data = response.data?.data ?? response.data;
      const list = Array.isArray(data) ? data : [];
      setPriceQuoteNotifications(list);
      setPriceQuoteCount(list.length);
    } catch (error) {
      console.error("Error fetching price quote notifications:", error);
      setPriceQuoteNotifications([]);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const TABS = [
    { key: "all", label: t("negotiations.tabs.all") || "الكل" },
    { key: "priceQuote", label: t("negotiations.tabs.priceQuote") || "عرض السعر" },
    { key: "PENDING", label: t("negotiations.tabs.pending") || "قيد الانتظار" },
    { key: "ACCEPTED", label: t("negotiations.tabs.accepted") || "مقبول" },
    { key: "REJECTED", label: t("negotiations.tabs.rejected") || "مرفوض" },
  ];

  const filteredNegotiations =
    activeStatus === "priceQuote"
      ? []
      : activeStatus === "all"
        ? negotiations
        : negotiations.filter((n) => n.status === activeStatus);

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white mt-40">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
            <div className="text-center text-slate-600">
              {t("negotiations.notAuthenticated") || "يجب تسجيل الدخول لعرض طلبات التفاوض"}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-white mt-40">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          <h1 className={`text-2xl sm:text-3xl font-bold text-slate-900 mb-6 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {t("negotiations.title") || "طلبات التفاوض"}
          </h1>

          <div className={`flex items-center justify-start gap-3 mb-6 ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
            {TABS.map((tab) => {
              const active = activeStatus === tab.key;
              const showBadge = tab.key === "priceQuote" && priceQuoteCount > 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveStatus(tab.key)}
                  className={`relative rounded-md px-4 py-2 text-sm font-semibold transition ${active
                    ? "bg-blue-100 text-blue-900"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  {tab.label}
                  {showBadge && (
                    <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                      {priceQuoteCount > 99 ? "99+" : priceQuoteCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeStatus === "priceQuote" ? (
            loadingQuotes ? (
              <div className="mt-6 text-center py-12">
                <div className="text-slate-500">{t("common.loading") || "جاري التحميل..."}</div>
              </div>
            ) : priceQuoteNotifications.length === 0 ? (
              <div className="mt-6 text-center py-12">
                <div className="text-slate-500">
                  {t("negotiations.noPriceQuotes") || "لا توجد عروض سعر مرسلة إليك"}
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {priceQuoteNotifications.map((notif) => {
                  const dealId = notif.relatedEntityId;
                  if (!dealId) return null;
                  return (
                    <div
                      key={notif.id}
                      className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200 px-5 py-5 hover:ring-blue-300 transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-slate-600 mb-1">
                            {t("negotiations.priceQuoteSentByEmployee") || "عرض السعر كما أرسله موظف ستوكشيب"}
                          </p>
                          <p className="text-slate-700 font-medium">
                            {notif.title || notif.message || t("negotiations.priceQuote") || "عرض السعر"}
                          </p>
                          {notif.createdAt && (
                            <p className="text-xs text-slate-500 mt-2">
                              {new Date(notif.createdAt).toLocaleDateString(i18n.language === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium" })}
                            </p>
                          )}
                        </div>
                        <Link
                          to={`${ROUTES.CLIENT_QUOTE}/${dealId}`}
                          className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                          {t("negotiations.viewPriceQuote") || "عرض عرض السعر"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : loading ? (
            <div className="mt-6 text-center py-12">
              <div className="text-slate-500">{t("common.loading") || "جاري التحميل..."}</div>
            </div>
          ) : filteredNegotiations.length === 0 ? (
            <div className="mt-6 text-center py-12">
              <div className="text-slate-500">
                {t("negotiations.noNegotiations") || "لا توجد طلبات تفاوض"}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {filteredNegotiations.map((negotiation, idx) => {
                const badge = getStatusBadge(negotiation.status, t);
                const StatusIcon = badge.icon;

                return (
                  <div
                    key={negotiation.id || idx}
                    className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200 px-5 py-5"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <StatusIcon className={`h-5 w-5 ${badge.className.split(' ')[1]}`} />
                          <span className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>

                        {negotiation.offer && (
                          <div className="mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {negotiation.offer.title || t("negotiations.offer") || "عرض"}
                            </h3>
                          </div>
                        )}

                        {negotiation.trader && (
                          <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Building2 className="h-4 w-4" />
                            <Link
                              to={getCompanyProfileUrl(negotiation.trader.id)}
                              className="hover:text-blue-900 hover:underline"
                            >
                              {negotiation.trader.companyName || negotiation.trader.name || t("negotiations.trader") || "تاجر"}
                            </Link>
                          </div>
                        )}


                        {negotiation.items && negotiation.items.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">
                              {t("negotiations.products") || "المنتجات المتفاوض عليها"} ({negotiation.items.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {negotiation.items.map((dealItem, idx) => {
                                const { offerItem } = dealItem;
                                if (!offerItem) return null;

                                // Parse images
                                let images = [];
                                try {
                                  const parsedImages = typeof offerItem.images === 'string'
                                    ? JSON.parse(offerItem.images)
                                    : offerItem.images;
                                  if (Array.isArray(parsedImages)) {
                                    images = parsedImages.map(img => {
                                      const imgUrl = typeof img === 'string' ? img : (img?.url || img?.src || img);
                                      if (!imgUrl) return null;
                                      if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
                                        return imgUrl;
                                      }
                                      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                                      const BASE_URL = API_URL.replace('/api', '');
                                      return `${BASE_URL}${imgUrl.startsWith('/') ? imgUrl : '/uploads/' + imgUrl}`;
                                    }).filter(Boolean);
                                  }
                                } catch (e) {
                                  console.warn('Error parsing images:', e);
                                }

                                const imageUrl = images.length > 0
                                  ? images[0]
                                  : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';

                                return (
                                  <div key={dealItem.id || idx} className="border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                                    <img
                                      src={imageUrl}
                                      alt={offerItem.productName || 'Product'}
                                      className="w-full h-32 object-cover rounded-md mb-2"
                                      onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
                                      }}
                                    />
                                    <h5 className={`text-sm font-semibold text-slate-900 mb-1 line-clamp-2 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                      {offerItem.productName || offerItem.description || t("negotiations.product") || "منتج"}
                                    </h5>
                                    <div className={`text-xs text-slate-600 space-y-1 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                      {offerItem.itemNo && (
                                        <div className="font-mono text-slate-500">{offerItem.itemNo}</div>
                                      )}
                                      <div className={`flex justify-between ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span>{t("negotiations.quantity") || "الكمية"}:</span>
                                        <span className="font-semibold">
                                          {parseInt(dealItem.quantity || offerItem.quantity || 0).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                                        </span>
                                      </div>
                                      {dealItem.negotiatedPrice && (
                                        <div className={`flex justify-between ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                                          <span>{t("negotiations.price") || "السعر"}:</span>
                                          <span className="font-semibold">
                                            {parseFloat(dealItem.negotiatedPrice).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            })} {i18n.language === 'ar' ? 'ر.س' : (offerItem.currency || 'SAR')}
                                          </span>
                                        </div>
                                      )}
                                      {offerItem.totalCBM && (
                                        <div className={`flex justify-between ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                                          <span>CBM:</span>
                                          <span className="font-semibold">{parseFloat(offerItem.totalCBM).toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}


                        {negotiation.notes && (
                          <div className={`mt-3 flex items-start gap-2 ${currentDir === 'rtl' ? 'flex-row-reverse text-right' : 'text-left'}`}>
                            <MessageSquare className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                            <p className="text-sm text-slate-600">{negotiation.notes}</p>
                          </div>
                        )}

                        {negotiation.createdAt && (
                          <div className={`mt-2 text-xs text-slate-500 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                            {t("negotiations.requestedAt") || "تاريخ الطلب"}: {new Date(negotiation.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Negotiate Button */}
                        {(negotiation.status === 'PENDING' || negotiation.status === 'ACCEPTED') && (
                          <button
                            onClick={() => {
                              // Pass the original deal status along with the negotiation data
                              const dealData = {
                                ...negotiation,
                                status: negotiation.status === 'PENDING' ? 'NEGOTIATION' :
                                  negotiation.status === 'ACCEPTED' ? 'APPROVED' :
                                    negotiation.status,
                                originalStatus: negotiation.status === 'PENDING' ? 'NEGOTIATION' :
                                  negotiation.status === 'ACCEPTED' ? 'APPROVED' :
                                    negotiation.status
                              };
                              navigate(`${ROUTES.NEGOTIATION_DETAIL}/${negotiation.dealId}`, {
                                state: { deal: dealData, negotiation: negotiation }
                              });
                            }}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                          >
                            <MessageSquare className="h-4 w-4" />
                            {t("negotiations.negotiate") || "التفاوض"}
                          </button>
                        )}

                        {/* Proceed to Checkout Button */}
                        {negotiation.status === 'ACCEPTED' && (
                          <button
                            onClick={async () => {
                              try {
                                let dealData = null;
                                let offerData = negotiation.offer;

                                // Try to fetch deal if dealId exists
                                if (negotiation.dealId) {
                                  try {
                                    const dealResponse = await dealService.getDealById(negotiation.dealId);
                                    if (dealResponse.data?.success && dealResponse.data?.data) {
                                      dealData = dealResponse.data.data;
                                      // Use offer from deal if available
                                      if (dealData.offer) {
                                        offerData = dealData.offer;
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error fetching deal:', error);
                                  }
                                }

                                // If no deal found but we have offerId, try to find deal by offerId
                                if (!dealData && negotiation.offerId) {
                                  try {
                                    const dealsResponse = await dealService.getDeals({ offerId: negotiation.offerId });
                                    if (dealsResponse.data?.success && dealsResponse.data?.data?.length > 0) {
                                      dealData = dealsResponse.data.data[0];
                                      if (dealData.offer) {
                                        offerData = dealData.offer;
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error fetching deal by offerId:', error);
                                  }
                                }

                                // If still no offer data, try to fetch offer by ID
                                if (!offerData && negotiation.offerId) {
                                  try {
                                    const offerResponse = await offerService.getOfferById(negotiation.offerId);
                                    if (offerResponse.data?.success) {
                                      offerData = offerResponse.data.data?.offer || offerResponse.data.data;
                                    }
                                  } catch (error) {
                                    console.error('Error fetching offer:', error);
                                  }
                                }

                                // Navigate to checkout with all available data
                                navigate(ROUTES.ORDER_CHECKOUT, {
                                  state: {
                                    offer: offerData,
                                    deal: dealData,
                                    negotiation: negotiation
                                  }
                                });
                              } catch (error) {
                                console.error('Error preparing checkout:', error);
                                // Fallback: navigate with basic negotiation data
                                navigate(ROUTES.ORDER_CHECKOUT, {
                                  state: {
                                    offer: negotiation.offer,
                                    negotiation: negotiation
                                  }
                                });
                              }
                            }}
                            className="inline-block rounded-md bg-green-900 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 whitespace-nowrap"
                          >
                            {t("negotiations.proceedToCheckout") || "المتابعة للدفع"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
