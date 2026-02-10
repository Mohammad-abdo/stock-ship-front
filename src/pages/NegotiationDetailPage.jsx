import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { dealService } from "../services/dealService";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/Layout";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "../routes";
// import { io } from "socket.io-client"; // WebSocket disabled
import { resolveCountryCode, getFlagUrl } from "../utils/flagUtils";

export default function NegotiationDetailPage() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { dealId } = useParams();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productState, setProductState] = useState([]);
  const [notes, setNotes] = useState("");
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [acceptingDeal, setAcceptingDeal] = useState(false);
  const [rejectingDeal, setRejectingDeal] = useState(false);

  const fetchDeal = async () => {
    try {
      const response = await dealService.getDealById(dealId);
      let dealData = null;
      if (response.data?.success && response.data?.data) {
        if (response.data.data.deal) {
          dealData = response.data.data.deal;
        } else if (response.data.data.id) {
          dealData = response.data.data;
        }
      }

      if (dealData) {
        if (!dealData.status) {
          dealData.status = 'NEGOTIATION';
        }
        setDeal(dealData);
        setNotes(dealData.notes || "");

        // Transform deal items to product format
        if (dealData.items && dealData.items.length > 0) {
          const products = dealData.items.map((dealItem, index) => {
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

            return {
              id: dealItem.id,
              dealItemId: dealItem.id,
              offerItemId: offerItem.id,
              image: imageUrl,
              thumbnails: images.length > 1 ? images.slice(1, 4) : [],
              images: images,
              title: offerItem.productName || offerItem.description || t("negotiations.product") || "منتج",
              itemNumber: offerItem.itemNo || `#${offerItem.id?.substring(0, 8) || 'N/A'}`,
              countryCode: resolveCountryCode(
                dealData.offer?.country,
                offerItem.country,
                dealData.trader?.country,
                dealData.trader?.countryCode
              ),
              description: offerItem.description || offerItem.notes || "",
              
              // Show AVAILABLE quantity
              quantity: Math.max(0, (parseInt(offerItem.quantity) || 0) - (parseInt(offerItem.reservedQuantity) || 0)),
              totalQuantity: parseInt(offerItem.quantity) || 0,
              reservedQuantity: parseInt(offerItem.reservedQuantity) || 0,
              
              piecesPerCarton: parseInt(offerItem.packageQuantity || offerItem.package_quantity || offerItem.cartons || 1),
              pricePerPiece: parseFloat(offerItem.unitPrice) || 0,
              cbm: parseFloat(offerItem.totalCBM || offerItem.cbm || 0),
              negotiationPrice: dealItem.negotiatedPrice ? parseFloat(dealItem.negotiatedPrice) : "",
              negotiationQuantity: dealItem.quantity || "",
              currency: offerItem.currency || 'SAR',
              // In negotiation page we never treat as "sold out" so user can always reduce quantity
              soldOut: false
            };
          }).filter(Boolean);

          setProductState(products);
        }
      }
    } catch (error) {
      console.error("Error fetching deal:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const response = await dealService.getNegotiationMessages(dealId, {
        page: 1,
        limit: 100
      });

      if (response.data?.success && response.data?.data) {
        const messagesData = Array.isArray(response.data.data) ? response.data.data : [];
        const sortedMessages = [...messagesData].sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && dealId) {
      fetchDeal();
      fetchMessages();
    }
  }, [isAuthenticated, dealId]);

  // Real-time inventory updates (WebSocket disabled)
  // Data is fetched via API on page load instead.

  const handleNegotiationChange = (productId, field, value) => {
    setProductState((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const calculateTotals = () => {
    const selectedProducts = productState.filter(
      (p) => !p.soldOut && (p.negotiationQuantity || p.negotiationPrice)
    );

    let totalQuantity = 0;
    let totalPrice = 0;
    let totalCbm = 0;

    selectedProducts.forEach((p) => {
      const qty = parseInt(p.negotiationQuantity) || 0;
      const price = parseFloat(p.negotiationPrice) || p.pricePerPiece;
      totalQuantity += qty;
      totalPrice += qty * price;
      totalCbm += (qty / p.quantity) * p.cbm;
    });

    return { totalQuantity, totalPrice, totalCbm };
  };

  const { totalQuantity, totalPrice, totalCbm } = calculateTotals();

  // When deal is approved, or trader marked price/quantity as final — lock negotiation; client can only accept or reject
  const isNegotiationClosed = deal && (deal.status !== 'NEGOTIATION' || !!deal.priceQuantityFinal);
  const isFinalOfferMode = deal && deal.status === 'NEGOTIATION' && !!deal.priceQuantityFinal;

  const handleSendNegotiationMessage = async () => {
    if (isNegotiationClosed) return;
    if (!notes.trim() && !productState.some(p => p.negotiationPrice || p.negotiationQuantity)) {
      toast.error(
        t("negotiations.required") || "Required",
        { description: t("negotiations.pleaseEnterData") || "Please enter a message or update prices/quantities" }
      );
      return;
    }

    // STRICT VALIDATION: Check for carton multiples before sending
    const invalidProducts = productState.filter(p => p.negotiationQuantity && parseInt(p.negotiationQuantity) % p.piecesPerCarton !== 0);
    if (invalidProducts.length > 0) {
      toast.error(
        t("negotiations.cantSendInvalidQty") || "Cannot send: Invalid carton quantities.",
        { description: t("negotiations.pleaseFixErrors") || "Please correct the red fields before sending." }
      );
      return;
    }

    try {
      setSubmitting(true);

      // Collect product changes for detailed history
      const productChanges = productState
        .filter(p => p.negotiationPrice || p.negotiationQuantity)
        .map(p => ({
          itemNumber: p.itemNumber,
          title: p.title,
          oldPrice: p.pricePerPiece,
          newPrice: parseFloat(p.negotiationPrice) || p.pricePerPiece,
          oldQuantity: p.quantity,
          newQuantity: parseInt(p.negotiationQuantity) || 0,
          priceChanged: p.negotiationPrice && parseFloat(p.negotiationPrice) !== p.pricePerPiece,
          quantityChanged: p.negotiationQuantity && parseInt(p.negotiationQuantity) !== p.quantity
        }));
      
      // Validation: Check if any quantity exceeds available
      const invalidQuantity = productChanges.find(p => p.newQuantity > p.oldQuantity);
      if (invalidQuantity) {
        setError(t("negotiations.quantityExceedsAvailable") || `الكمية المطلوبة للمنتج ${invalidQuantity.title} تتجاوز الكمية المتاحة (${invalidQuantity.oldQuantity})`);
        setSubmitting(false);
        return;
      }



      // Calculate proposed price from products
      let proposedPrice = null;
      const hasNegotiation = productState.some(p => p.negotiationPrice || p.negotiationQuantity);
      if (hasNegotiation) {
        proposedPrice = totalPrice > 0 ? totalPrice : null;
      }

      // Build detailed message with changes
      let detailedMessage = notes.trim() || '';
      if (productChanges.length > 0) {
        const changesText = productChanges.map((change, idx) => {
          let productText = `${idx + 1}. ${change.title} (${change.itemNumber}):\n`;
          if (change.quantityChanged) {
            productText += `   الكمية: ${change.newQuantity.toLocaleString()}\n`;
          }
          if (change.priceChanged) {
            productText += `   السعر: ${change.newPrice.toLocaleString()} ${i18n.language === 'ar' ? 'ر.س' : 'SAR'}\n`;
          }
          return productText;
        }).join('\n');

        if (detailedMessage) {
          detailedMessage += '\n\n--- تفاصيل المنتجات ---\n' + changesText;
        } else {
          detailedMessage = '--- تفاصيل المنتجات ---\n' + changesText;
        }
      }

      // Send negotiation message
      await dealService.sendNegotiationMessage(dealId, {
        message: detailedMessage,
        proposedPrice: proposedPrice,
        counterOffer: null,
        productChanges: JSON.stringify(productChanges) // Send as metadata
      });

      // Refresh data
      await fetchMessages();
      await fetchDeal(); // Re-fetch to get updated product data

      // Clear the message field
      setNotes("");

      toast.success(
        t("negotiations.success") || "Success",
        { description: t("negotiations.messageSentSuccess") || "Message sent successfully" }
      );
    } catch (error) {
      console.error("Error sending negotiation message:", error);
      const errorMessage = error.response?.data?.message || error.message || t("negotiations.errorSendingMessage") || "Error sending message";
      toast.error(
        t("negotiations.error") || "Error",
        { description: errorMessage }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptDeal = async () => {
    if (!dealId || acceptingDeal) return;
    try {
      setAcceptingDeal(true);
      await dealService.clientAcceptDeal(dealId);
      toast.success(
        t('negotiations.dealAccepted') || 'تم قبول الصفقة',
        { description: t('negotiations.proceedToPayment') || 'يمكنك المتابعة للدفع' }
      );
      fetchDeal();
      navigate(ROUTES.NEGOTIATIONS);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || (t('negotiations.acceptFailed') || 'فشل قبول الصفقة');
      toast.error(t('negotiations.error') || 'خطأ', { description: msg });
    } finally {
      setAcceptingDeal(false);
    }
  };

  const handleRejectDeal = async () => {
    if (!dealId || rejectingDeal) return;
    if (!window.confirm(t('negotiations.confirmReject') || 'هل أنت متأكد من رفض الصفقة؟')) return;
    try {
      setRejectingDeal(true);
      await dealService.clientRejectDeal(dealId);
      toast.success(t('negotiations.dealRejected') || 'تم رفض الصفقة');
      fetchDeal();
      navigate(ROUTES.NEGOTIATIONS);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || (t('negotiations.rejectFailed') || 'فشل رفض الصفقة');
      toast.error(t('negotiations.error') || 'خطأ', { description: msg });
    } finally {
      setRejectingDeal(false);
    }
  };

  const summaryData = productState
    .filter((p) => p.soldOut || p.negotiationQuantity || p.negotiationPrice)
    .map((p) => ({
      id: p.id,
      itemNumber: p.itemNumber,
      quantity: p.soldOut ? p.negotiationQuantity : p.negotiationQuantity || 1,
      price: p.soldOut ? p.negotiationPrice : p.negotiationPrice || p.pricePerPiece,
      cbm: p.soldOut
        ? ((p.negotiationQuantity || 0) / p.quantity) * p.cbm
        : ((parseInt(p.negotiationQuantity) || 0) / p.quantity) * p.cbm || p.cbm,
    }));

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white mt-40">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
            <div className="text-center text-slate-600">
              {t("negotiations.notAuthenticated") || "يجب تسجيل الدخول لعرض التفاوض"}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading && !deal) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white mt-40">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
            <div className="text-center text-slate-500">
              {t("common.loading") || "جاري التحميل..."}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!deal) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white mt-40">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
            <div className="text-center text-slate-600">
              {t("negotiations.dealNotFound") || "لم يتم العثور على الصفقة"}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div dir={currentDir} className="min-h-screen bg-white pt-40">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          {/* Header */}
          <div className="bg-[#EEF4FF] rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {deal.offer?.title || t("negotiations.negotiationDetails") || "تفاصيل التفاوض"}
              </h1>
              {deal.dealNumber && (
                <div className="text-sm text-slate-600 mt-1">
                  {t("negotiations.dealNumber") || "رقم الصفقة"}: {deal.dealNumber}
                </div>
              )}
              {productState.length > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  ✅ {productState.length} {t("negotiations.products") || "منتجات"}
                </div>
              )}
              {isFinalOfferMode && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-sm font-medium">
                  📌 {t("negotiations.finalOfferByTrader") || "التاجر حدد السعر والكمية كنهائية. يمكنك قبول الصفقة أو رفضها فقط."}
                </div>
              )}
              {isNegotiationClosed && !isFinalOfferMode && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-sm font-medium">
                  🔒 {t("negotiations.negotiationClosed") || "تم إغلاق التفاوض — لا يمكن تعديل الكميات أو الأسعار أو إرسال رسائل"}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(ROUTES.NEGOTIATIONS)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Products List */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {!loading && (
            <div className="space-y-6 mb-8">
              {productState.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-yellow-800 font-semibold mb-2">
                      {t("negotiations.noProducts") || "لا توجد منتجات"}
                    </p>
                  </div>
                </div>
              ) : (
                productState.map((product, index) => {
                  const negotiationQty = parseInt(product.negotiationQuantity) || 0;
                  const negotiationPrice = parseFloat(product.negotiationPrice) || product.pricePerPiece || 0;

                  const totalQty = negotiationQty;
                  const totalCbmForProduct = product.quantity > 0
                    ? (negotiationQty / product.quantity) * product.cbm
                    : 0;
                  const totalPriceForProduct = negotiationQty * negotiationPrice;

                  return (
                    <div
                      key={product.id}
                      className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
                    >
                      {/* No "quantity exhausted" cover on negotiation page - user must be able to reduce quantity */}

                      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
                        {/* Product Image Section */}
                        <div className="space-y-2">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-48 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80";
                            }}
                          />
                          <div className="flex gap-2">
                            {product.thumbnails && product.thumbnails.length > 0 ? (
                              product.thumbnails.map((thumb, idx) => (
                                <img
                                  key={idx}
                                  src={thumb}
                                  alt={`${product.title} ${idx + 1}`}
                                  className="w-16 h-16 object-cover rounded border border-slate-200"
                                  onError={(e) => {
                                    e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=100&q=80";
                                  }}
                                />
                              ))
                            ) : null}
                            <div className="w-16 h-16 rounded border border-slate-200 flex items-center justify-center bg-slate-50">
                              <span className="text-xs">🎥</span>
                            </div>
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {product.countryCode ? (
                                <img
                                  src={getFlagUrl(product.countryCode, 40)}
                                  alt={product.countryCode}
                                  className="w-8 h-6 object-cover rounded shadow-sm"
                                />
                              ) : (
                                <span className="text-2xl">🌍</span>
                              )}
                              <h3 className="text-lg font-bold text-slate-900">
                                {product.title}
                              </h3>
                              <span className="text-sm text-slate-500">
                                {product.itemNumber}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {product.description}
                            </p>
                          </div>

                          {/* Product Info Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-slate-500 mb-1">
                                {t("negotiations.quantity") || "الكمية"}
                              </div>
                              <div className="font-semibold text-slate-900">
                                {product.quantity.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                                <span className="text-xs font-normal text-slate-500 mx-1">
                                  ({product.piecesPerCarton} {t("negotiations.piecesInCarton") || "قطع/كرتون"})
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">
                                {t("negotiations.pricePerPiece") || "سعر القطعة"}
                              </div>
                              <div className="font-semibold text-slate-900">
                                {product.pricePerPiece.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">
                                {t("negotiations.cbm") || "CBM"}
                              </div>
                              <div className="font-semibold text-slate-900">
                                {product.cbm.toFixed(2)} CBM
                              </div>
                            </div>
                          </div>

                          {/* Negotiation Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-slate-700 mb-2">
                                {t("negotiations.negotiationPrice") || "السعر المتفاوض عليه"}
                              </label>
                              <input
                                  type="number"
                                  value={product.negotiationPrice}
                                  onChange={(e) =>
                                    handleNegotiationChange(
                                      product.id,
                                      "negotiationPrice",
                                      e.target.value
                                    )
                                  }
                                  disabled={isNegotiationClosed}
                                  readOnly={isNegotiationClosed}
                                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNegotiationClosed ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-slate-300'}`}
                                  placeholder={t("negotiations.enterPrice") || "أدخل السعر"}
                                />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-700 mb-2">
                                {t("negotiations.negotiationQuantity") || "الكمية المتفاوض عليها"}
                                <span className="text-xs text-slate-400 mr-1 ml-1">
                                  ({i18n.language === 'ar' ? `مضاعفات ${product.piecesPerCarton}` : `multiples of ${product.piecesPerCarton}`})
                                </span>
                              </label>
                              <>
                                  {/* Quantity input with carton +/- buttons */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentQty = parseInt(product.negotiationQuantity) || 0;
                                        const step = product.piecesPerCarton || 1;
                                        const newQty = Math.max(0, currentQty - step);
                                        handleNegotiationChange(product.id, "negotiationQuantity", newQty === 0 ? "" : String(newQty));
                                      }}
                                      disabled={isNegotiationClosed || !product.negotiationQuantity || parseInt(product.negotiationQuantity) <= 0}
                                      className="w-10 h-10 flex items-center justify-center rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-lg transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="number"
                                      value={product.negotiationQuantity}
                                      onChange={(e) =>
                                        handleNegotiationChange(product.id, "negotiationQuantity", e.target.value)
                                      }
                                      disabled={isNegotiationClosed}
                                      readOnly={isNegotiationClosed}
                                      step={product.piecesPerCarton || 1}
                                      min={0}
                                      className={`flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold ${isNegotiationClosed ? 'bg-slate-50 cursor-not-allowed' : ''} ${
                                        (() => {
                                          const qty = parseInt(product.negotiationQuantity) || 0;
                                          if (qty > (product.quantity)) return 'border-red-300 ring-1 ring-red-200';
                                          if (qty > 0 && qty % (product.piecesPerCarton || 1) !== 0) return 'border-amber-400 ring-1 ring-amber-200';
                                          return 'border-slate-300';
                                        })()
                                      }`}
                                      placeholder={`${product.piecesPerCarton}, ${product.piecesPerCarton * 2}, ${product.piecesPerCarton * 3}...`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentQty = parseInt(product.negotiationQuantity) || 0;
                                        const step = product.piecesPerCarton || 1;
                                        handleNegotiationChange(product.id, "negotiationQuantity", String(currentQty + step));
                                      }}
                                      disabled={isNegotiationClosed}
                                      className="w-10 h-10 flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-lg transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Carton count display */}
                                  {(parseInt(product.negotiationQuantity) || 0) > 0 && (
                                    <div className={`mt-2 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 flex-wrap ${
                                      (parseInt(product.negotiationQuantity) || 0) % (product.piecesPerCarton || 1) === 0
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {(() => {
                                        const qty = parseInt(product.negotiationQuantity) || 0;
                                        const cartonSize = product.piecesPerCarton || 1;
                                        const fullCartons = Math.floor(qty / cartonSize);
                                        const remainder = qty % cartonSize;

                                        if (remainder === 0) {
                                          return (
                                            <>
                                              <span>📦</span>
                                              <span>
                                                {fullCartons} {i18n.language === 'ar' ? (fullCartons === 1 ? 'كرتونة' : fullCartons === 2 ? 'كرتونتين' : fullCartons <= 10 ? 'كراتين' : 'كرتونة') : (fullCartons === 1 ? 'carton' : 'cartons')}
                                                {' × '}{cartonSize} {i18n.language === 'ar' ? 'حبة' : 'pcs'} = {qty} {i18n.language === 'ar' ? 'حبة' : 'pcs'}
                                              </span>
                                            </>
                                          );
                                        } else {
                                          const lowerValid = fullCartons * cartonSize;
                                          const upperValid = (fullCartons + 1) * cartonSize;
                                          return (
                                            <>
                                              <span>⚠️</span>
                                              <span>
                                                {i18n.language === 'ar'
                                                  ? `يجب أن تكون من مضاعفات ${cartonSize}. الأقرب:`
                                                  : `Must be a multiple of ${cartonSize}. Nearest:`
                                                }
                                              </span>
                                              {lowerValid > 0 && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleNegotiationChange(product.id, "negotiationQuantity", String(lowerValid))}
                                                  disabled={isNegotiationClosed}
                                                  className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 rounded text-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  {lowerValid}
                                                </button>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => handleNegotiationChange(product.id, "negotiationQuantity", String(upperValid))}
                                                disabled={isNegotiationClosed}
                                                className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 rounded text-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                {upperValid}
                                              </button>
                                            </>
                                          );
                                        }
                                      })()}
                                    </div>
                                  )}

                                  {/* Exceeds available */}
                                  {(parseInt(product.negotiationQuantity) || 0) > product.quantity && product.quantity >= 0 && (
                                     <div className="text-xs text-amber-600 mt-1 font-semibold">
                                       ⚠️ {t("negotiations.quantityExceeds") || "الكمية تتجاوز المتاح"} ({product.quantity.toLocaleString()}) — {i18n.language === 'ar' ? 'يمكنك تقليل الكمية أدناه' : 'You can reduce the quantity below'}
                                     </div>
                                  )}
                                </>
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-slate-500 mb-1">{t("negotiations.totalQuantity") || "الكمية الإجمالية"}</div>
                              <div className="font-semibold text-slate-900">
                                {totalQty.toLocaleString()} {t("negotiations.piece") || "قطعة"}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">📦 {i18n.language === 'ar' ? 'عدد الكراتين' : 'Cartons'}</div>
                              <div className="font-semibold text-slate-900">
                                {totalQty > 0 && product.piecesPerCarton > 0
                                  ? `${Math.ceil(totalQty / product.piecesPerCarton)} ${i18n.language === 'ar' ? 'كرتونة' : 'cartons'}`
                                  : '—'
                                }
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">{t("negotiations.totalCbm") || "إجمالي CBM"}</div>
                              <div className="font-semibold text-slate-900">
                                {totalCbmForProduct.toFixed(2)} CBM
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">{t("negotiations.totalPrice") || "السعر الإجمالي"}</div>
                              <div className="font-semibold text-slate-900">
                                {totalPriceForProduct.toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Product Number */}
                      <div className="absolute top-4 left-4 bg-blue-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Order Summary Table */}
          {summaryData.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
              <h2 className={`text-xl font-bold text-slate-900 mb-4 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {t("negotiations.orderSummary") || "ملخص الطلب"}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full" dir={currentDir}>
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("negotiations.serial") || "م"}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("negotiations.itemNumber") || "رقم الصنف"}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("negotiations.quantity") || "الكمية"}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("negotiations.price") || "السعر"}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        CBM
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className={`py-3 px-4 text-sm text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          {idx + 1}
                        </td>
                        <td className={`py-3 px-4 text-sm text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          {item.itemNumber}
                        </td>
                        <td className={`py-3 px-4 text-sm text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          {item.quantity.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                        </td>
                        <td className={`py-3 px-4 text-sm text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          {item.price.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                        </td>
                        <td className={`py-3 px-4 text-sm text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          {item.cbm.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td className={`py-3 px-4 text-sm text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`} colSpan={2}>
                        {t("negotiations.total") || "المجموع"}
                      </td>
                      <td className={`py-3 px-4 text-sm text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {totalQuantity.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>
                      <td className={`py-3 px-4 text-sm text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {totalPrice.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                      </td>
                      <td className={`py-3 px-4 text-sm text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {totalCbm.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className={`mt-4 text-sm text-slate-600 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {t("negotiations.siteFee") || "سيتم احتساب رسوم الموقع"}
              </p>
            </div>
          )}

          {/* Final offer: Accept or Reject only */}
          {isFinalOfferMode ? (
            <div className="mb-6 p-6 rounded-xl border-2 border-amber-200 bg-amber-50/50">
              <p className={`text-slate-800 font-semibold mb-4 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {t("negotiations.finalOfferCta") || "التاجر حدد السعر والكمية كنهائية. اختر أحد الخيارين:"}
              </p>
              <div className={`flex flex-wrap gap-4 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={handleAcceptDeal}
                  disabled={acceptingDeal || rejectingDeal}
                  className="flex-1 min-w-[160px] bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {acceptingDeal ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("negotiations.accepting") || "جاري القبول..."}
                    </>
                  ) : (
                    t("negotiations.acceptDeal") || "قبول الصفقة"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRejectDeal}
                  disabled={acceptingDeal || rejectingDeal}
                  className="flex-1 min-w-[160px] bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {rejectingDeal ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("negotiations.rejecting") || "جاري الرفض..."}
                    </>
                  ) : (
                    t("negotiations.rejectDeal") || "رفض الصفقة"
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Message Section (when not final offer) */
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("negotiations.addMessage") || "رسالة التفاوض"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  disabled={isNegotiationClosed}
                  readOnly={isNegotiationClosed}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isNegotiationClosed ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-slate-300'}`}
                  placeholder={t("negotiations.enterMessage") || "أدخل رسالتك للتفاوض..."}
                />
              </div>

              <button
                type="button"
                onClick={handleSendNegotiationMessage}
                disabled={submitting || isNegotiationClosed}
                className="w-full bg-[#F5AF00] hover:bg-[#E5A000] text-[#194386] font-bold py-4 px-6 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#194386] border-t-transparent rounded-full animate-spin" />
                    {t("negotiations.sending") || "جاري الإرسال..."}
                  </>
                ) : (
                  t("negotiations.sendMessage") || "إرسال رسالة التفاوض"
                )}
              </button>
            </div>
          )}

          {/* Negotiation History Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {t("negotiations.history") || "سجل التفاوض"}
            </h2>

            {messagesLoading ? (
              <div className="text-center py-8 text-slate-500">
                {t("common.loading") || "جاري التحميل..."}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {t("negotiations.noMessages") || "لا توجد رسائل تفاوض"}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isClient = message.senderType === 'CLIENT';
                  const isTrader = message.senderType === 'TRADER';
                  const isEmployee = message.senderType === 'EMPLOYEE';

                  return (
                    <div
                      key={message.id || index}
                      className={`flex gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Timeline Dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1 ${isClient ? 'bg-blue-500' :
                          isTrader ? 'bg-green-500' :
                            'bg-purple-500'
                          }`} />
                        {index < messages.length - 1 && (
                          <div className="w-0.5 h-full bg-slate-200 mt-1" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-semibold ${isClient ? 'text-blue-700' :
                            isTrader ? 'text-green-700' :
                              'text-purple-700'
                            }`}>
                            {isClient && (t("negotiations.client") || "العميل")}
                            {isTrader && (t("negotiations.trader") || "التاجر")}
                            {isEmployee && (t("negotiations.employee") || "الموظف")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(message.createdAt).toLocaleString(
                              i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }
                            )}
                          </span>
                        </div>

                        {/* Display message with product changes highlighted */}
                        {message.message && (
                          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                            <div className="whitespace-pre-wrap">{message.message}</div>
                          </div>
                        )}

                        {/* Price and Quantity Info */}
                        <div className="mt-2 space-y-1">
                          {message.proposedPrice && (
                            <div className="text-sm bg-green-50 border border-green-200 rounded px-3 py-2">
                              <span className="text-slate-600 font-medium">{t("negotiations.proposedPrice") || "السعر المقترح"}: </span>
                              <span className="font-bold text-green-700">
                                {parseFloat(message.proposedPrice).toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                              </span>
                            </div>
                          )}

                          {message.counterOffer !== null && message.counterOffer !== undefined && (
                            <div className="text-sm bg-orange-50 border border-orange-200 rounded px-3 py-2">
                              <span className="text-slate-600 font-medium">{t("negotiations.counterOffer") || "عرض مضاد"}: </span>
                              <span className="font-bold text-orange-700">
                                {parseFloat(message.counterOffer).toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                              </span>
                            </div>
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
      </div>
    </MainLayout>
  );
}
