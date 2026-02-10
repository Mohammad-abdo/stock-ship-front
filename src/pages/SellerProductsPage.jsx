import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { X, Loader2 } from "lucide-react";
// import { io } from "socket.io-client"; // WebSocket disabled
import { io } from "socket.io-client";
import { resolveCountryCode, getFlagUrl } from "../utils/flagUtils";
import Header from "../components/Header";
import FooterArabic from "../components/FooterArabic";
import { ROUTES } from "../routes";
import { offerService } from "../services/offerService";
import { dealService } from "../services/dealService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export default function SellerProductsPage() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { sellerId } = useParams();
  const [searchParams] = useSearchParams();
  const offerId = searchParams.get('offerId');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]); // Flattened offer items
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // (Country flag logic moved to utils/flagUtils.js — uses CDN images)

  const fetchTraderOffers = useCallback(async () => {
    if (!sellerId) {
      console.error("❌ Cannot fetch: sellerId is missing");
      setError(t("sellerProducts.sellerIdNotFound"));
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching trader offers for sellerId:", sellerId);
      console.log("📡 API call will be made to:", `/api/traders/${sellerId}/offers/public`);
      
      const params = { page: 1, limit: 100 };
      if (offerId) params.offerId = offerId;
      
      const response = await offerService.getTraderOffers(sellerId, params);
      
      console.log("📦 Full offers response:", response);
      console.log("📦 Response.data:", response?.data);
      console.log("📦 Response.data.data:", response?.data?.data);
      console.log("📦 Response.data.success:", response?.data?.success);
      console.log("📦 Response.data.pagination:", response?.data?.pagination);
      
      // Handle paginated response: { success: true, data: [...], pagination: {...} }
      let offersData = [];
      if (response && response.data) {
        // Standard paginated response: { success: true, data: [...], pagination: {...} }
        if (response.data.success) {
          if (Array.isArray(response.data.data)) {
            offersData = response.data.data;
            console.log("✅ Found offers in response.data.data (paginated)", offersData.length, "offers");
          } else if (response.data.data?.data && Array.isArray(response.data.data.data)) {
            offersData = response.data.data.data;
            console.log("✅ Found offers in nested response.data.data.data");
          }
        } 
        // Direct array response
        else if (Array.isArray(response.data)) {
          offersData = response.data;
          console.log("✅ Found offers in response.data (direct array)");
        }
        // Nested data structure
        else if (response.data.data && Array.isArray(response.data.data)) {
          offersData = response.data.data;
          console.log("✅ Found offers in response.data.data");
        }
      }
      
      if (offersData.length === 0) {
        console.warn("⚠️ No offers found in response");
        console.warn("⚠️ Full response structure:", JSON.stringify(response?.data, null, 2));
      } else {
        // Log details about each offer
        offersData.forEach((offer, idx) => {
          console.log(`📋 Offer ${idx + 1}:`, {
            id: offer.id,
            title: offer.title,
            itemsCount: offer.items?.length || 0,
            hasItems: !!offer.items && Array.isArray(offer.items) && offer.items.length > 0
          });
        });
      }
      
      console.log("✅ Offers data loaded:", offersData.length, "offers");

      // عرض منتجات عرض واحد فقط — إما العرض المحدد (offerId) أو أول عرض
      if (offersData.length > 1 && !offerId) {
        offersData = [offersData[0]];
        console.log("✅ Showing single offer only (first active offer):", offersData[0]?.title);
      }

      // Helper function to get full image URL
      const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
          return imagePath;
        }
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const BASE_URL = API_URL.replace('/api', '');
        return `${BASE_URL}${imagePath.startsWith('/') ? imagePath : '/uploads/' + imagePath}`;
      };
      
      // Flatten all offer items into a single array
      const items = [];
      offersData.forEach(offer => {
        const itemsCount = offer.items?.length || 0;
        console.log("🔄 Processing offer:", offer.id, offer.title, "with", itemsCount, "items");
        
        if (offer.items && Array.isArray(offer.items) && offer.items.length > 0) {
          offer.items.forEach(item => {
            // Parse item images
            let itemImages = [];
            if (item.images) {
              try {
                const parsedImages = typeof item.images === 'string' 
                  ? JSON.parse(item.images) 
                  : item.images;
                if (Array.isArray(parsedImages)) {
                  itemImages = parsedImages
                    .map(img => {
                      const imgUrl = typeof img === 'string' ? img : (img?.url || img?.src || img);
                      return getImageUrl(imgUrl);
                    })
                    .filter(img => img !== null && img !== undefined);
                }
              } catch (e) {
                console.warn("Error parsing item images:", e);
                itemImages = [];
              }
            }
            
            // If no item images, try offer images as fallback
            if (itemImages.length === 0 && offer.images) {
              try {
                const offerImages = typeof offer.images === 'string' 
                  ? JSON.parse(offer.images) 
                  : offer.images;
                if (Array.isArray(offerImages) && offerImages.length > 0) {
                  const imgUrl = typeof offerImages[0] === 'string' 
                    ? offerImages[0] 
                    : (offerImages[0]?.url || offerImages[0]?.src);
                  if (imgUrl) {
                    itemImages = [getImageUrl(imgUrl)];
                  }
                }
              } catch (e) {
                console.warn("Error parsing offer images as fallback:", e);
              }
            }
            
            items.push({
              ...item,
              offerId: offer.id,
              offerTitle: offer.title,
              // Map to product format
              id: item.id,
              image: itemImages.length > 0 
                ? itemImages[0] 
                : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
              thumbnails: itemImages.length > 1 ? itemImages.slice(1, 4) : [],
              images: itemImages, // Store all images
              title: item.productName || item.description || t("sellerProducts.product"),
              itemNumber: item.itemNo || item.itemNumber || `#${item.id?.substring(0, 8) || 'N/A'}`,
              countryCode: resolveCountryCode(
                offer.country,
                offer.trader?.country,
                offer.trader?.countryCode,
                item.country
              ),
              description: item.description || item.notes || "",

              quantity: (parseInt(item.quantity) || 0) - (parseInt(item.reservedQuantity) || 0),
              totalQuantity: parseInt(item.quantity) || 0,
              reservedQuantity: parseInt(item.reservedQuantity) || 0,
              quantity: parseInt(item.quantity) || 0,
              reservedQuantity: parseInt(item.reservedQuantity) || 0,
              availableQuantity: Math.max(0, (parseInt(item.quantity) || 0) - (parseInt(item.reservedQuantity) || 0)),
              piecesPerCarton: parseInt(item.packageQuantity || item.cartons || item.piecesPerCarton || 1),
              pricePerPiece: parseFloat(item.unitPrice) || 0,
              cbm: parseFloat(item.totalCBM || item.cbm || item.volume || 0),
              soldOut: ((parseInt(item.quantity) || 0) - (parseInt(item.reservedQuantity) || 0)) <= 0,
              soldOut: Math.max(0, (parseInt(item.quantity) || 0) - (parseInt(item.reservedQuantity) || 0)) <= 0,
              negotiationPrice: "",
              negotiationQuantity: "",
              currency: item.currency || offer.items?.[0]?.currency || 'SAR'
            });
          });
        } else {
          console.warn("⚠️ Offer has no items or items array is empty:", {
            offerId: offer.id,
            offerTitle: offer.title,
            items: offer.items,
            itemsType: typeof offer.items,
            isArray: Array.isArray(offer.items)
          });
        }
      });
      
      console.log("✅ Total items extracted:", items.length);
      setAllItems(items);
    } catch (err) {
      console.error('❌ Error fetching trader offers:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(err.response?.data?.message || err.message || t("sellerProducts.failedToLoad"));
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }, [sellerId, offerId, i18n.language, t]);

  // Real-time inventory updates (WebSocket disabled)
  // Data is fetched via API on page load instead.
  // Real-time inventory updates
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socket = io(API_URL.replace('/api', ''), {
      path: '/socket.io',
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected for inventory updates');
      if (user?.id) {
        socket.emit('join', { userId: user.id });
      }
    });

    socket.on('inventory:update', (data) => {
      console.log('📦 Inventory update received:', data);
      setAllItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === data.offerItemId) {
            console.log(`🔄 Updating item ${item.id} quantity from ${item.quantity} to available: ${data.availableQuantity}`);
            const availableQty = Math.max(0, data.availableQuantity || 0);
            const reservedQty = data.reservedQuantity || 0;
            const totalQty = availableQty + reservedQty;
            
            return { 
              ...item, 
              quantity: totalQty,
              reservedQuantity: reservedQty,
              availableQuantity: availableQty,
              soldOut: availableQty <= 0
            };
          }
          return item;
        });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Fetch trader offers on mount
  useEffect(() => {
    if (sellerId) {
      console.log("🔄 useEffect triggered - sellerId:", sellerId);
      fetchTraderOffers();
    } else {
      console.warn("⚠️ No sellerId provided in URL params");
      setError(t("sellerProducts.sellerIdNotFound"));
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]); // Only depend on sellerId, fetchTraderOffers is stable due to useCallback

  // Use API data only - no static fallback
  const [productState, setProductState] = useState([]);
  
  // Update state when allItems changes
  useEffect(() => {
    if (allItems.length > 0) {
      console.log("✅ Setting productState with", allItems.length, "items from API");
      setProductState(allItems);
    } else {
      console.log("⚠️ No items to display");
      setProductState([]);
    }
  }, [allItems]);

  const handleNegotiationChange = (productId, field, value) => {
    setProductState((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updated = { ...p, [field]: value };
          // Recalculate totals for this product when values change
          console.log(`Updated ${field} for product ${productId}:`, value);
          return updated;
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

    // Add sold out items
    productState
      .filter((p) => p.soldOut)
      .forEach((p) => {
        totalQuantity += p.negotiationQuantity || 0;
        totalPrice += (p.negotiationQuantity || 0) * (p.negotiationPrice || 0);
        totalCbm += ((p.negotiationQuantity || 0) / p.quantity) * p.cbm;
      });

    return { totalQuantity, totalPrice, totalCbm };
  };

  const handleSendNegotiationRequest = async () => {
    if (!isAuthenticated) {
      toast.error(t("sellerProducts.loginRequiredToDeal"));
      return;
    }

    // Get selected items with negotiation data
    const selectedItems = productState.filter(
      (p) => !p.soldOut && (p.negotiationQuantity || p.negotiationPrice)
    );

    if (selectedItems.length === 0) {
      toast.warning(t("sellerProducts.pleaseSelectProducts"));
      return;
    }

    // Group items by offerId
    const itemsByOffer = {};

    // Validation: Check if any quantity exceeds available
    const invalidItems = selectedItems.filter(item => {
        const qty = parseInt(item.negotiationQuantity) || 0;
        return qty > (item.availableQuantity || item.quantity);
    });

    if (invalidItems.length > 0) {
        const itemNames = invalidItems.map(i => i.title).join(', ');
        setError(t("sellerProducts.quantityExceedsAvailable") || `الكمية المطلوبة للمنتجات التالية تتجاوز الكمية المتاحة: ${itemNames}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // Validation: Check if quantities are multiples of carton size
    const nonMultipleItems = selectedItems.filter(item => {
        const qty = parseInt(item.negotiationQuantity) || 0;
        const cartonSize = item.piecesPerCarton || 1;
        return qty > 0 && qty % cartonSize !== 0;
    });

    if (nonMultipleItems.length > 0) {
        const msgs = nonMultipleItems.map(item => {
            const qty = parseInt(item.negotiationQuantity) || 0;
            const cs = item.piecesPerCarton || 1;
            const lower = Math.floor(qty / cs) * cs;
            const upper = Math.ceil(qty / cs) * cs;
            const nearest = lower > 0 ? `${lower} ${i18n.language === 'ar' ? 'أو' : 'or'} ${upper}` : `${upper}`;
            return i18n.language === 'ar'
              ? `${item.title}: الكمية (${qty}) يجب أن تكون من مضاعفات ${cs}. الأقرب: ${nearest}`
              : `${item.title}: Quantity (${qty}) must be a multiple of ${cs}. Nearest: ${nearest}`;
        }).join('\n');
        setError(msgs);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    selectedItems.forEach(item => {
      if (!itemsByOffer[item.offerId]) {
        itemsByOffer[item.offerId] = [];
      }
      itemsByOffer[item.offerId].push({
        offerItemId: item.id,
        quantity: parseInt(item.negotiationQuantity) || item.quantity,
        negotiatedPrice: parseFloat(item.negotiationPrice) || item.pricePerPiece,
        notes: item.notes || null
      });
    });

    try {
      setSubmitting(true);
      
      // Use authenticated user data if available, otherwise use guest defaults
      // For public requests, name, email, and phone are required
      const negotiationData = {
        name: isAuthenticated && user ? (user.name || user.companyName || "Guest") : "Guest",
        email: isAuthenticated && user ? (user.email || null) : (user?.email || null),
        phone: isAuthenticated && user ? (user.phone || null) : (user?.phone || null),
        notes: notes || null,
      };
      
      // Send negotiation request for each offer
      // Note: The backend automatically creates a deal when negotiation is requested
      const negotiationResults = await Promise.all(
        Object.keys(itemsByOffer).map(async (offerId) => {
          try {
            // Send negotiation request - use authenticated endpoint if user is logged in
            // The backend will automatically create a deal with status 'NEGOTIATION'
            const negotiationResponse = isAuthenticated
              ? await offerService.requestNegotiation(offerId, {
                  notes: notes || null
                })
              : await offerService.requestNegotiationPublic(offerId, {
                  ...negotiationData,
                  items: itemsByOffer[offerId] // Public endpoint requires items in the request
                });

            // For authenticated users, add selected items to the new deal
            let deal = negotiationResponse.data?.data || negotiationResponse.data;
            if (isAuthenticated && deal?.id && itemsByOffer[offerId]?.length > 0) {
                try {
                  // Each negotiation request creates a new deal; add only the current selection
                  const itemsToAdd = itemsByOffer[offerId].map(item => ({
                    offerItemId: item.offerItemId,
                    quantity: item.quantity,
                    negotiatedPrice: item.negotiatedPrice
                  }));
                  await dealService.addDealItems(deal.id, itemsToAdd);
                } catch (itemsError) {
                  console.error('Error adding items to deal:', itemsError);
                  if (itemsError.response) {
                    console.error('Items Error Response:', itemsError.response.data);
                    toast.error(itemsError.response.data?.message || itemsError.message || t("sellerProducts.errorSendingRequest"));
                  }
                  // Throw to stop the flow and mark as failed
                  throw itemsError;
                }
            }

            // The response should contain the created deal
            return {
              negotiation: negotiationResponse.data,
              deal: deal
            };
          } catch (negotiationError) {
            console.error(`Error sending negotiation for offer ${offerId}:`, negotiationError);
            // Log detailed error information
            if (negotiationError.response) {
              console.error('Error response:', negotiationError.response.data);
              console.error('Error status:', negotiationError.response.status);
            }
            // Don't throw - continue with other offers even if one fails
            return {
              negotiation: null,
              deal: null,
              error: negotiationError.response?.data?.message || negotiationError.message
            };
          }
        })
      );
      
      // Check if any requests succeeded
      const successfulRequests = negotiationResults.filter(r => r.negotiation && !r.error);
      const failedRequests = negotiationResults.filter(r => r.error);
      
      if (successfulRequests.length > 0) {
        // At least one request succeeded (user is always authenticated here)
        toast.success(t("sellerProducts.negotiationSentSuccess"));
        navigate(ROUTES.NEGOTIATIONS);
      } else if (failedRequests.length > 0) {
        // All requests failed
        const errorMessages = failedRequests.map(r => r.error).filter(Boolean);
        const errorMessage = errorMessages.length > 0 
          ? errorMessages[0] 
          : t("sellerProducts.errorSendingRequest");
        toast.error(errorMessage);
      } else {
        // No requests were made (shouldn't happen)
        toast.warning(t("sellerProducts.pleaseSelectProducts"));
      }
    } catch (error) {
      console.error('Error sending negotiation request:', error);
      // Extract error message from response
      let errorMessage = t("sellerProducts.errorSendingRequest");
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const { totalQuantity, totalPrice, totalCbm } = calculateTotals();

  const summaryData = productState
    .filter((p) => p.soldOut || p.negotiationQuantity || p.negotiationPrice)
    .map((p) => ({
      id: p.id,
      itemNumber: p.id,
      quantity: p.soldOut ? p.negotiationQuantity : p.negotiationQuantity || 1,
      price: p.soldOut ? p.negotiationPrice : p.negotiationPrice || p.pricePerPiece,
      cbm: p.soldOut
        ? ((p.negotiationQuantity || 0) / p.quantity) * p.cbm
        : ((parseInt(p.negotiationQuantity) || 0) / p.quantity) * p.cbm || p.cbm,
    }));

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
              {/* Debug indicator - remove in production */}
              {import.meta.env.MODE === 'development' && productState.length > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  ✅ {productState.length} {t("sellerProducts.productsLoaded")}
                </div>
              )}
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">
                {t("common.loading")}
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-red-800 font-semibold mb-1">
                    {t("sellerProducts.errorLoadingData")}
                  </h3>
                  <p className="text-red-700 text-sm">{error}</p>
                  {sellerId && (
                    <p className="text-red-600 text-xs mt-2">
                      Seller ID: {sellerId}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    if (sellerId) {
                      fetchTraderOffers();
                    } else {
                      console.error("Cannot retry: sellerId is missing");
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  {t("sellerProducts.retry")}
                </button>
              </div>
            </div>
          )}

          {/* Products List */}
          {!loading && !error && (
            <div className="space-y-6 mb-8">
              {productState.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-yellow-800 font-semibold mb-2">
                      {t("sellerProducts.noProductsAvailable")}
                    </p>
                    <p className="text-yellow-700 text-sm">
                      {t("sellerProducts.noProductsFound")}
                    </p>
                    {sellerId && (
                      <p className="text-yellow-600 text-xs mt-2">
                        Seller ID: {sellerId}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                productState.map((product, index) => {
              // Calculate totals for this product
              const negotiationQty = product.soldOut 
                ? (parseInt(product.negotiationQuantity) || 0)
                : (parseInt(product.negotiationQuantity) || 0);
              const negotiationPrice = product.soldOut
                ? (parseFloat(product.negotiationPrice) || 0)
                : (parseFloat(product.negotiationPrice) || product.pricePerPiece || 0);
              
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
                  {/* Sold Out Overlay */}
                  {product.soldOut && (
                    <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center z-10 pointer-events-none">
                      <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg border-2 border-red-700 transform -rotate-12">
                        <div className="text-center">
                          <div className="text-xl font-bold mb-1">
                            {i18n.language === 'ar' ? 'تم البيع' : 'SOLD OUT'}
                          </div>
                          <div className="text-sm opacity-90">
                            {i18n.language === 'ar' ? 'نفدت الكمية' : 'Out of Stock'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.quantity")}</div>
                          <div className="font-semibold text-slate-900">
                            {product.soldOut ? (
                              <span className="text-red-600">
                                {i18n.language === 'ar' ? 'نفدت الكمية' : 'Out of Stock'}
                              </span>
                            ) : (
                              <>
                                <span className={product.availableQuantity < product.quantity * 0.1 ? 'text-orange-600' : 'text-green-600'}>
                                  {(product.availableQuantity || product.quantity).toLocaleString()}
                                </span>
                                {product.reservedQuantity > 0 && (
                                  <span className="text-xs text-slate-500 ml-1">
                                    ({product.reservedQuantity.toLocaleString()} {i18n.language === 'ar' ? 'محجوز' : 'reserved'})
                                  </span>
                                )}
                              </>
                            )}
                            <span className="text-xs font-normal text-slate-500 block">
                              ({product.piecesPerCarton} {t("sellerProducts.piecesInCarton")})
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.pricePerPiece")}</div>
                          <div className="font-semibold text-slate-900">
                            {product.pricePerPiece.toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.cbm")}</div>
                          <div className="font-semibold text-slate-900">
                            {product.cbm} CBM
                          </div>
                        </div>
                      </div>

                      {/* Negotiation Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-700 mb-2">
                            {t("sellerProducts.negotiationPrice")}
                          </label>
                          {product.soldOut ? (
                            <div className="px-4 py-2 bg-slate-50 rounded-md text-slate-900 font-semibold">
                              {product.negotiationPrice} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                            </div>
                          ) : (
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
                              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={t("sellerProducts.enterPrice")}
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-slate-700 mb-2">
                            {t("sellerProducts.negotiationQuantity")}
                            <span className="text-xs text-slate-400 mr-1 ml-1">
                              ({i18n.language === 'ar' ? `مضاعفات ${product.piecesPerCarton}` : `multiples of ${product.piecesPerCarton}`})
                            </span>
                          </label>
                          {product.soldOut ? (
                            <div className="px-4 py-2 bg-slate-50 rounded-md text-slate-900 font-semibold">
                              {product.negotiationQuantity}
                            </div>
                          ) : (
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
                                  className="w-10 h-10 flex items-center justify-center rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-lg transition-colors shrink-0"
                                  disabled={!product.negotiationQuantity || parseInt(product.negotiationQuantity) <= 0}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={product.negotiationQuantity}
                                  onChange={(e) => {
                                    handleNegotiationChange(product.id, "negotiationQuantity", e.target.value);
                                  }}
                                  step={product.piecesPerCarton || 1}
                                  min={0}
                                  className={`flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold ${
                                    (() => {
                                      const qty = parseInt(product.negotiationQuantity) || 0;
                                      if (qty > (product.availableQuantity || product.quantity)) return 'border-red-300 ring-1 ring-red-200';
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
                                  className="w-10 h-10 flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-lg transition-colors shrink-0"
                                >
                                  +
                                </button>
                              </div>

                              {/* Carton count display */}
                              {(parseInt(product.negotiationQuantity) || 0) > 0 && (
                                <div className={`mt-2 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
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
                                              ? `الكمية يجب أن تكون من مضاعفات ${cartonSize}. الأقرب: ${lowerValid > 0 ? lowerValid : ''} ${lowerValid > 0 ? 'أو' : ''} ${upperValid}`
                                              : `Quantity must be a multiple of ${cartonSize}. Nearest: ${lowerValid > 0 ? lowerValid + ' or ' : ''}${upperValid}`
                                            }
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleNegotiationChange(product.id, "negotiationQuantity", String(lowerValid > 0 ? lowerValid : upperValid))}
                                            className="mr-1 ml-1 px-2 py-0.5 bg-amber-200 hover:bg-amber-300 rounded text-amber-800 transition-colors"
                                          >
                                            {lowerValid > 0 ? lowerValid : upperValid}
                                          </button>
                                          {lowerValid > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => handleNegotiationChange(product.id, "negotiationQuantity", String(upperValid))}
                                              className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 rounded text-amber-800 transition-colors"
                                            >
                                              {upperValid}
                                            </button>
                                          )}
                                        </>
                                      );
                                    }
                                  })()}
                                </div>
                              )}

                              {/* Exceeds available */}
                              {(parseInt(product.negotiationQuantity) || 0) > (product.availableQuantity || product.quantity) && (
                                 <div className="text-xs text-red-500 mt-1 font-semibold">
                                   ⚠️ {t("sellerProducts.quantityExceeds") || "الكمية تتجاوز المتاح"} ({(product.availableQuantity || product.quantity).toLocaleString()})
                                 </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.totalQuantity")}</div>
                          <div className="font-semibold text-slate-900">
                            {totalQty.toLocaleString()} {t("sellerProducts.piece")}
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
                          <div className="text-slate-500 mb-1">{t("sellerProducts.totalCbm")}</div>
                          <div className="font-semibold text-slate-900">
                            {totalCbmForProduct.toFixed(2)} CBM
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.totalPrice")}</div>
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

          {/* Order Summary Table - Only show if there are items with negotiation values */}
          {summaryData.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{t("sellerProducts.orderSummary")}</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("sellerProducts.serial")}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("sellerProducts.itemNumber")}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("sellerProducts.quantity")}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("sellerProducts.price")}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        CBM
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-sm text-slate-900">{idx + 1}</td>
                        <td className="py-3 px-4 text-sm text-slate-900">{item.itemNumber}</td>
                        <td className="py-3 px-4 text-sm text-slate-900">{item.quantity}</td>
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {item.price} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {item.cbm.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="py-3 px-4 text-sm text-slate-900" colSpan={2}>
                        {t("sellerProducts.total")}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {totalQuantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {totalPrice.toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {totalCbm.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                {t("sellerProducts.siteFee")}
              </p>
            </div>
          )}
          
          {/* Show message when no items are selected for negotiation */}
          {summaryData.length === 0 && productState.length > 0 && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                {t("sellerProducts.enterNegotiationData")}
              </p>
            </div>
          )}

          {/* Notes and Submit */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("sellerProducts.addNote")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={t("sellerProducts.enterNotes")}
              />
            </div>
            <button
              type="button"
              onClick={handleSendNegotiationRequest}
              disabled={submitting || loading}
              className="w-full bg-[#F5AF00] hover:bg-[#E5A000] text-[#194386] font-bold py-4 px-6 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("sellerProducts.sending")}
                </>
              ) : (
                t("sellerProducts.sendNegotiationRequest")
              )}
            </button>
          </div>
        </div>
      </div>
      <FooterArabic />
    </div>
  );
}

