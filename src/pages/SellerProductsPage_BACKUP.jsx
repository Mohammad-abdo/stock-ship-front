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
  const [allItems, setAllItems] = useState([]); // Flattened offer items
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Test the function immediately
  React.useEffect(() => {
    console.log('🏳️ TESTING FLAGS:');
    console.log('🏳️ SA should be 🇸🇦:', countryCodeToFlag('SA'));
    console.log('🏳️ US should be 🇺🇸:', countryCodeToFlag('US'));
    console.log('🏳️ CN should be 🇨🇳:', countryCodeToFlag('CN'));
    console.log('🏳️ AE should be 🇦🇪:', countryCodeToFlag('AE'));
  }, []);

  // Using imported flag functions from utils/flagUtils.js

    // Country name to code mapping for common countries
    const nameToCode = {
      // Arabic names
      'السعودية': 'SA',
      'الإمارات': 'AE', 
      'مصر': 'EG',
      'الأردن': 'JO',
      'لبنان': 'LB',
      'سوريا': 'SY',
      'العراق': 'IQ',
      'الكويت': 'KW',
      'قطر': 'QA',
      'البحرين': 'BH',
      'عمان': 'OM',
      'اليمن': 'YE',
      'الصين': 'CN',
      'الهند': 'IN',
      'اليابان': 'JP',
      'كوريا': 'KR',
      'تركيا': 'TR',
      'ألمانيا': 'DE',
      'فرنسا': 'FR',
      'إيطاليا': 'IT',
      'إسبانيا': 'ES',
      // English names
      'SAUDI ARABIA': 'SA',
      'SAUDI': 'SA',
      'UAE': 'AE',
      'UNITED ARAB EMIRATES': 'AE',
      'EGYPT': 'EG',
      'JORDAN': 'JO',
      'LEBANON': 'LB',
      'SYRIA': 'SY',
      'IRAQ': 'IQ',
      'KUWAIT': 'KW',
      'QATAR': 'QA',
      'BAHRAIN': 'BH',
      'OMAN': 'OM',
      'YEMEN': 'YE',
      'CHINA': 'CN',
      'INDIA': 'IN',
      'JAPAN': 'JP',
      'KOREA': 'KR',
      'SOUTH KOREA': 'KR',
      'TURKEY': 'TR',
      'GERMANY': 'DE',
      'FRANCE': 'FR',
      'ITALY': 'IT',
      'SPAIN': 'ES',
      'UNITED STATES': 'US',
      'USA': 'US',
      'UNITED KINGDOM': 'GB',
      'UK': 'GB',
      'THAILAND': 'TH',
      'VIETNAM': 'VN',
      'MALAYSIA': 'MY',
      'SINGAPORE': 'SG',
      'INDONESIA': 'ID',
      'PHILIPPINES': 'PH',
      'BANGLADESH': 'BD',
      'PAKISTAN': 'PK',
      'IRAN': 'IR',
      'RUSSIA': 'RU',
      'UKRAINE': 'UA',
      'POLAND': 'PL',
      'NETHERLANDS': 'NL',
      'BELGIUM': 'BE',
      'SWITZERLAND': 'CH',
      'AUSTRIA': 'AT',
      'SWEDEN': 'SE',
      'NORWAY': 'NO',
      'DENMARK': 'DK',
      'FINLAND': 'FI',
      'BRAZIL': 'BR',
      'ARGENTINA': 'AR',
      'MEXICO': 'MX',
      'CANADA': 'CA',
      'AUSTRALIA': 'AU',
      'NEW ZEALAND': 'NZ',
      'SOUTH AFRICA': 'ZA'
    };

    // Try to find country code from name
    if (!countryCode) {
      const upperCountry = countryStr.toUpperCase();
      countryCode = nameToCode[upperCountry];
      
      // Try partial matches
      if (!countryCode) {
        for (const [name, code] of Object.entries(nameToCode)) {
          if (upperCountry.includes(name) || name.includes(upperCountry)) {
            countryCode = code;
            break;
          }
        }
      }
    }

    // Try direct country code to flag conversion first
    if (countryCode) {
      console.log('🏳️ Attempting direct conversion for:', countryCode);
      try {
        const directFlag = countryCodeToFlag(countryCode);
        console.log('🏳️ Direct conversion result:', directFlag);
        if (directFlag) {
          console.log('🏳️ SUCCESS - Direct flag conversion:', countryCode, '->', directFlag);
          return directFlag;
        } else {
          console.warn('🏳️ Direct conversion returned null for code:', countryCode);
        }
      } catch (error) {
        console.error('🏳️ Direct conversion error for code:', countryCode, error);
      }
    }

    // Fallback to manual mapping for specific cases
    const manualFlags = {
      'CN': '🇨🇳', 'SA': '🇸🇦', 'AE': '🇦🇪', 'EG': '🇪🇬', 'JO': '🇯🇴',
      'LB': '🇱🇧', 'SY': '🇸🇾', 'IQ': '🇮🇶', 'KW': '🇰🇼', 'QA': '🇶🇦',
      'BH': '🇧🇭', 'OM': '🇴🇲', 'YE': '🇾🇪', 'US': '🇺🇸', 'GB': '🇬🇧',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'TR': '🇹🇷',
      'IN': '🇮🇳', 'JP': '🇯🇵', 'KR': '🇰🇷', 'TH': '🇹🇭', 'VN': '🇻🇳',
      'MY': '🇲🇾', 'SG': '🇸🇬', 'ID': '🇮🇩', 'PH': '🇵🇭', 'BD': '🇧🇩',
      'PK': '🇵🇰', 'IR': '🇮🇷', 'RU': '🇷🇺', 'UA': '🇺🇦', 'PL': '🇵🇱',
      'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹', 'SE': '🇸🇪',
      'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'BR': '🇧🇷', 'AR': '🇦🇷',
      'MX': '🇲🇽', 'CA': '🇨🇦', 'AU': '🇦🇺', 'NZ': '🇳🇿', 'ZA': '🇿🇦'
    };

    if (countryCode && manualFlags[countryCode]) {
      console.log('🏳️ Manual flag found:', countryCode, '->', manualFlags[countryCode]);
      return manualFlags[countryCode];
    }

    // Try direct conversion for any valid country code as final attempt
    if (countryCode) {
      const finalFlag = countryCodeToFlag(countryCode);
      if (finalFlag) {
        console.log('🏳️ Final flag conversion:', countryCode, '->', finalFlag);
        return finalFlag;
      }
    }

    // Default to world flag if no match found
    console.log('🏳️ No flag found for:', countryStr, 'using world flag');
    return "🌍";
  };

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
      
      const response = await offerService.getTraderOffers(sellerId, {
        page: 1,
        limit: 100 // Get all offers
      });
      
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
              country: (() => {
                const countryData = offer.country || 
                  offer.trader?.country || 
                  offer.countryCode || 
                  offer.trader?.countryCode || 
                  offer.origin || 
                  item.country || 
                  item.countryCode || 
                  item.origin ||
                  'CN'; // Default to China if no country data
                
                console.log(`🏳️ Country data for item ${item.id}:`, {
                  offerCountry: offer.country,
                  traderCountry: offer.trader?.country,
                  offerCountryCode: offer.countryCode,
                  traderCountryCode: offer.trader?.countryCode,
                  itemCountry: item.country,
                  finalCountryData: countryData,
                  flag: getCountryFlagFromData(countryData)
                });
                
                return countryData; // Return the country code/name, not the flag
              })(),
              countryCode: (() => {
                // Extract country code for flag display
                const countryData = offer.country || 
                  offer.trader?.country || 
                  offer.countryCode || 
                  offer.trader?.countryCode || 
                  offer.origin || 
                  item.country || 
                  item.countryCode || 
                  item.origin ||
                  'CN';
                
                // If it's already a 2-letter code, return as is
                if (countryData && countryData.length === 2 && /^[A-Z]{2}$/i.test(countryData)) {
                  return countryData.toUpperCase();
                }
                
                // Try to extract from name mapping
                const nameToCode = {
                  'China': 'CN', 'الصين': 'CN', 'United States': 'US', 'الولايات المتحدة': 'US',
                  'Saudi Arabia': 'SA', 'السعودية': 'SA', 'المملكة العربية السعودية': 'SA',
                  'United Arab Emirates': 'AE', 'الإمارات': 'AE', 'الإمارات العربية المتحدة': 'AE',
                  'Egypt': 'EG', 'مصر': 'EG', 'Turkey': 'TR', 'تركيا': 'TR',
                  'India': 'IN', 'الهند': 'IN', 'Germany': 'DE', 'ألمانيا': 'DE',
                  'France': 'FR', 'فرنسا': 'FR', 'United Kingdom': 'GB', 'بريطانيا': 'GB',
                  'Italy': 'IT', 'إيطاليا': 'IT', 'Spain': 'ES', 'إسبانيا': 'ES'
                };
                
                return nameToCode[countryData] || 'CN';
              })(),
              description: item.description || item.notes || "",
              quantity: parseInt(item.quantity) || 0,
              reservedQuantity: parseInt(item.reservedQuantity) || 0,
              availableQuantity: Math.max(0, (parseInt(item.quantity) || 0) - (parseInt(item.reservedQuantity) || 0)),
              piecesPerCarton: parseInt(item.packageQuantity || item.cartons || item.piecesPerCarton || 1),
              pricePerPiece: parseFloat(item.unitPrice) || 0,
              cbm: parseFloat(item.totalCBM || item.cbm || item.volume || 0),
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
  }, [sellerId, i18n.language, t]);

  // Real-time inventory updates
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const BASE_URL = API_URL.replace('/api', '');
    
    console.log('🔌 Attempting to connect to socket:', BASE_URL);
    
    const socket = io(BASE_URL, {
      path: '/socket.io',
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected successfully for inventory updates');
      if (user?.id) {
        socket.emit('join', { userId: user.id });
        console.log('👤 Joined socket room for user:', user.id);
      }
    });

    socket.on('connect_error', (error) => {
      console.warn('🔌 Socket connection error:', error.message);
      // Don't show error to user, just log it
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.warn('🔌 Socket reconnection error:', error.message);
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
    // Get selected items with negotiation data
    const selectedItems = productState.filter(
      (p) => !p.soldOut && (p.negotiationQuantity || p.negotiationPrice)
    );

    if (selectedItems.length === 0) {
      alert(t("sellerProducts.pleaseSelectProducts"));
      return;
    }

    // Group items by offerId
    const itemsByOffer = {};
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

            // For authenticated users, add items to the deal after creation
            let deal = negotiationResponse.data?.data || negotiationResponse.data;
            if (isAuthenticated && deal?.id && itemsByOffer[offerId]?.length > 0) {
                try {
                  // Add items to the deal
                  await dealService.addDealItems(deal.id, itemsByOffer[offerId].map(item => ({
                    offerItemId: item.offerItemId,
                    quantity: item.quantity,
                    negotiatedPrice: item.negotiatedPrice
                  })));
                } catch (itemsError) {
                  console.error('Error adding items to deal:', itemsError);
                  if (itemsError.response) {
                    console.error('Items Error Response:', itemsError.response.data);
                    alert(`Failed to add items: ${itemsError.response.data.message || itemsError.message}`);
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
        // At least one request succeeded
        if (isAuthenticated) {
          navigate(ROUTES.NEGOTIATIONS);
        } else {
          alert(t("sellerProducts.negotiationSentSuccess"));
          navigate(ROUTES.HOME);
        }
      } else if (failedRequests.length > 0) {
        // All requests failed
        const errorMessages = failedRequests.map(r => r.error).filter(Boolean);
        const errorMessage = errorMessages.length > 0 
          ? errorMessages[0] 
          : t("sellerProducts.errorSendingRequest");
        alert(`${t("sellerProducts.errorSendingRequest")}\n${errorMessage}`);
      } else {
        // No requests were made (shouldn't happen)
        alert(t("sellerProducts.pleaseSelectProducts"));
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
      
      // Show user-friendly error message
      alert(`${t("sellerProducts.errorSendingRequest")}\n${errorMessage}\n\n${t("sellerProducts.errorSendingRequestHelp") || "Please try again or contact support if the problem persists."}`);
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

 (
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
                          <span 
                            className="text-3xl flex-shrink-0" 
                            style={{ fontSize: '24px', lineHeight: '1' }}
                            title={`Country: ${product.country} (${product.countryCode})`}
                          >
                            {(() => {
                              console.log('🏳️ RENDERING FLAG - Product:', product.title);
                              console.log('🏳️ RENDERING FLAG - Country:', product.country);
                              console.log('🏳️ RENDERING FLAG - CountryCode:', product.countryCode);
                              const flag = getCountryFlagFromData(product.countryCode);
                              console.log('🏳️ RENDERING FLAG - Result:', flag);
                              return flag;
                            })()}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 flex-1">
                            {product.title}
                          </h3>
                          <span className="text-sm text-slate-500 flex-shrink-0">
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
                          </label>
                          {product.soldOut ? (
                            <div className="px-4 py-2 bg-slate-50 rounded-md text-slate-900 font-semibold">
                              {product.negotiationQuantity}
                            </div>
                          ) : (
                            <input
                              type="number"
                              value={product.negotiationQuantity}
                              onChange={(e) =>
                                handleNegotiationChange(
                                  product.id,
                                  "negotiationQuantity",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={t("sellerProducts.enterQuantity")}
                            />
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.totalQuantity")}</div>
                          <div className="font-semibold text-slate-900">
                            {totalQty.toLocaleString()} {t("sellerProducts.piece")}
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

