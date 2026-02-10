import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Rectangle1 from "../assets/imgs/Rectangle1.png";
import {
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  BadgeCheck,
  Star,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ROUTES, getSellerProductsUrl, getCompanyProfileUrl } from "../routes";
import { offerService } from "../services/offerService";
import { useAuth } from "../contexts/AuthContext";

const StarRating = ({ value = 5 }) => {
  const { t } = useTranslation();
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-start gap-1" aria-label={`${t("productDetails.rating")} ${value} ${t("common.of")} 5`}>
      {stars.map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= value ? "fill-current" : ""}`}
        />
      ))}
      <span className="ms-2 text-xs text-slate-500">({value.toFixed(1)})</span>
    </div>
  );
};

export default function ProductDetailsComponent({ offerId }) {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [activeImageId, setActiveImageId] = useState("main");
  const [liked, setLiked] = useState(false);
  const [tab, setTab] = useState("company");
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMakeDeal = () => {
    if (!isAuthenticated) {
      // Redirect to login with return path
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }

    // Allow Clients AND Traders (for testing) to proceed
    if (user?.userType === 'CLIENT' || user?.userType === 'TRADER') {
      console.log("ProductDetails: Navigating with offer:", offer);
      // Navigate to checkout with offer details
      navigate(ROUTES.ORDER_CHECKOUT, { state: { offer } });
    } else {
       console.warn("User type not allowed to make deal:", user?.userType);
    }
  };

  const fetchOffer = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching offer with ID:", offerId);
      console.log("📡 API URL will be:", `/offers/${offerId}`);
      
      const response = await offerService.getOfferById(offerId);
      
      console.log("📦 Full API response object:", response);
      console.log("📦 Response.data:", response.data);
      console.log("📦 Response.data.data:", response.data?.data);
      console.log("📦 Response.data.data?.offer:", response.data?.data?.offer);
      console.log("📦 Response.data.success:", response.data?.success);
      
      // Backend returns: { success: true, data: { offer: {...}, platformSettings: {...} }, message: "..." }
      // or: { success: true, data: {...}, message: "..." }
      let offerData = null;
      
      if (response && response.data) {
        // Check for nested structure: response.data.data.offer
        if (response.data.data?.offer) {
          offerData = response.data.data.offer;
          console.log("Found offer in nested structure (data.data.offer)");
        } 
        // Check for direct structure: response.data.data (when data is the offer itself)
        else if (response.data.data && !response.data.data.platformSettings) {
          offerData = response.data.data;
          console.log("Found offer in direct structure (data.data)");
        }
        // Check if response.data itself is the offer
        else if (response.data.id || response.data.title) {
          offerData = response.data;
          console.log("Found offer in response.data");
        }
        // Check for axios response structure: response.data.data.data
        else if (response.data.data?.data?.offer) {
          offerData = response.data.data.data.offer;
          console.log("Found offer in deeply nested structure");
        }
      }
      
      if (offerData && (offerData.id || offerData.title)) {
        console.log("✅ Offer data loaded successfully!");
        console.log("✅ Offer ID:", offerData.id);
        console.log("✅ Offer title:", offerData.title);
        console.log("✅ Offer description:", offerData.description);
        console.log("✅ Trader data:", offerData.trader);
        console.log("✅ Trader ID:", offerData.trader?.id);
        console.log("✅ Trader name:", offerData.trader?.name || offerData.trader?.companyName);
        console.log("✅ Offer images:", offerData.images);
        console.log("✅ Offer items count:", offerData.items?.length || 0);
        console.log("✅ Offer status:", offerData.status);
        setOffer(offerData);
        
        // Helper function to get full image URL
        const getImageUrl = (imagePath) => {
          if (!imagePath) return null;
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
          }
          if (imagePath.startsWith('/uploads')) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const BASE_URL = API_URL.replace('/api', '');
            return `${BASE_URL}${imagePath}`;
          }
          if (!imagePath.startsWith('/')) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const BASE_URL = API_URL.replace('/api', '');
            return `${BASE_URL}/uploads/${imagePath}`;
          }
          return imagePath;
        };

        // Parse and set images
        let offerImages = [];
        
        // Parse offer images
        if (offerData.images) {
          try {
            const parsedImages = typeof offerData.images === 'string' 
              ? JSON.parse(offerData.images) 
              : offerData.images;
            if (Array.isArray(parsedImages)) {
              const validImages = parsedImages
                .map(img => {
                  // Handle both string URLs and objects with url property
                  const imageUrl = typeof img === 'string' ? img : (img?.url || img?.src || img);
                  return getImageUrl(imageUrl);
                })
                .filter(img => img !== null && img !== undefined);
              offerImages = [...offerImages, ...validImages];
            }
          } catch (error) {
            console.warn("Error parsing offer images:", error);
            offerImages = [];
          }
        }
        
        // Add item images
        if (offerData.items && Array.isArray(offerData.items) && offerData.items.length > 0) {
          offerData.items.forEach(item => {
            if (item.images) {
              try {
                const itemImages = typeof item.images === 'string' 
                  ? JSON.parse(item.images) 
                  : item.images;
                if (Array.isArray(itemImages)) {
                  const parsedItemImages = itemImages
                    .map(img => {
                      // Handle both string URLs and objects with url property
                      const imageUrl = typeof img === 'string' ? img : (img?.url || img?.src || img);
                      return getImageUrl(imageUrl);
                    })
                    .filter(img => img !== null && img !== undefined);
                  offerImages = [...offerImages, ...parsedItemImages];
                }
              } catch (error) {
                console.warn("Error parsing item images:", error);
                // Skip invalid images
              }
            }
          });
        }
        
        console.log("Parsed offer images:", offerImages);
        
        // Set images with IDs
        let imagesWithIds = offerImages.map((img, idx) => ({
          id: idx === 0 ? "main" : `t${idx}`,
          src: img,
          alt: offerData.title || t("productDetails.offerImage") || "Offer Image"
        }));
        
        // If no images found, use placeholder
        if (imagesWithIds.length === 0) {
          imagesWithIds = [{
            id: "main",
            src: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80",
            alt: offerData.title || t("productDetails.offerImage") || "Offer Image"
          }];
        }
        
        console.log("Final images array:", imagesWithIds);
        setImages(imagesWithIds);
        setActiveImageId(imagesWithIds[0].id);
      } else {
        console.error("❌ No offer data found in response!");
        console.error("Response structure analysis:", {
          hasResponse: !!response,
          hasResponseData: !!response?.data,
          hasResponseDataData: !!response?.data?.data,
          hasResponseDataDataOffer: !!response?.data?.data?.offer,
          responseDataType: typeof response?.data?.data,
          responseDataKeys: response?.data?.data ? Object.keys(response.data.data) : [],
          fullResponse: JSON.stringify(response, null, 2)
        });
        
        // Try one more time with different structure
        if (response?.data && typeof response.data === 'object') {
          // Maybe the response.data itself is the offer
          if (response.data.id || response.data.title) {
            console.log("🔄 Trying response.data as offer...");
            setOffer(response.data);
            return;
          }
        }
        
        setOffer(null);
      }
    } catch (error) {
      console.error("❌ Error fetching offer:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.message);
      setOffer(null);
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    console.log("🔄 useEffect triggered, offerId:", offerId);
    if (offerId) {
      console.log("✅ Calling fetchOffer with offerId:", offerId);
      fetchOffer();
    } else {
      console.warn("⚠️ No offerId provided!");
    }
  }, [offerId, fetchOffer]);

  const activeImage = images.find((i) => i.id === activeImageId) ?? (images.length > 0 ? images[0] : { src: "", alt: "" });

  if (loading) {
    return (
      <div dir={currentDir} className="min-h-screen bg-white text-slate-900">
        <div className="w-full pt-25 sm:pt-30 md:pt-30 lg:pt-55 xl:pt-55 2xl:pt-55">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">{t("common.loading") || "Loading..."}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div dir={currentDir} className="min-h-screen bg-white text-slate-900">
        <div className="w-full pt-25 sm:pt-30 md:pt-30 lg:pt-55 xl:pt-55 2xl:pt-55">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">{t("productDetails.offerNotFound") || t("common.notFound") || "Offer not found"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir={currentDir} className="min-h-screen bg-white text-slate-900">
      <div className="w-full pt-25 sm:pt-30 md:pt-30 lg:pt-55 xl:pt-55 2xl:pt-55">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
            {/* RIGHT: Gallery */}
            <div className="space-y-3 sm:space-y-4">
              {/* Breadcrumbs */}
              <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 ${currentDir === 'rtl' ? 'justify-start' : 'justify-end'}`}>
                <span>{t("productDetails.home")}</span>
                <ChevronLeft className={`h-3 w-3 sm:h-4 sm:w-4 ${currentDir === 'ltr' ? 'rotate-180' : ''}`} />
                <span>{t("productDetails.products")}</span>
                <ChevronLeft className={`h-3 w-3 sm:h-4 sm:w-4 ${currentDir === 'ltr' ? 'rotate-180' : ''}`} />
                <span className="text-slate-700">{t("productDetails.productDetails")}</span>
              </div>

              {/* Main image */}
              <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
                <img
                  src={activeImage.src}
                  alt={activeImage.alt}
                  className="h-[240px] sm:h-[320px] w-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80";
                  }}
                />

                {/* Floating actions (left side inside image) */}
                <div className={`absolute top-2 sm:top-3 flex flex-col gap-1.5 sm:gap-2 ${currentDir === 'rtl' ? 'left-2 sm:left-3' : 'right-2 sm:right-3'}`}>
                  <button
                    onClick={() => setLiked((v) => !v)}
                    className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200 backdrop-blur hover:bg-white transition"
                    aria-label={liked ? t("productDetails.removeFromFavorites") : t("productDetails.addToFavorites")}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${liked ? "fill-current text-red-500" : ""}`}
                    />
                  </button>
                  <button
                    onClick={() => {
                      try {
                        navigator.clipboard?.writeText(window.location.href);
                      } catch {
                        // empty
                      }
                    }}
                    className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200 backdrop-blur hover:bg-white transition"
                    aria-label={t("productDetails.share")}
                  >
                    <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>

                {/* Left arrow - Only show if more than one image */}
                {images.length > 1 && (
                  <button
                    onClick={() => {
                      const idx = images.findIndex((i) => i.id === activeImageId);
                      const next = (idx - 1 + images.length) % images.length;
                      setActiveImageId(images[next].id);
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200 backdrop-blur hover:bg-white transition ${currentDir === 'rtl' ? 'left-2 sm:left-3' : 'right-2 sm:right-3'}`}
                    aria-label={t("productDetails.previousImage")}
                  >
                    <ChevronLeft className={`h-4 w-4 sm:h-5 sm:w-5 ${currentDir === 'ltr' ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {/* Right arrow - Only show if more than one image */}
                {images.length > 1 && (
                  <button
                    onClick={() => {
                      const idx = images.findIndex((i) => i.id === activeImageId);
                      const next = (idx + 1) % images.length;
                      setActiveImageId(images[next].id);
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200 backdrop-blur hover:bg-white transition ${currentDir === 'rtl' ? 'right-2 sm:right-3' : 'left-2 sm:left-3'}`}
                    aria-label={t("productDetails.nextImage")}
                  >
                    <ChevronRight className={`h-4 w-4 sm:h-5 sm:w-5 ${currentDir === 'ltr' ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* Thumbnails - Show all images including the first one */}
              {images.length > 0 && (
                <div className="flex items-center justify-start gap-1.5 sm:gap-2 overflow-x-auto pb-2">
                  {images.map((img) => {
                    const active = img.id === activeImageId;
                    return (
                      <button
                        key={img.id}
                        onClick={() => setActiveImageId(img.id)}
                        className={`relative overflow-hidden rounded-md border bg-white shadow-sm transition flex-shrink-0 ${
                          active
                            ? "border-slate-900 ring-2 ring-slate-900"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                        aria-label={`${t("productDetails.selectImage")}: ${img.alt}`}
                      >
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="h-14 w-20 sm:h-16 sm:w-24 object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80";
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LEFT: Info */}
            <div className="space-y-4 sm:space-y-6">
              <div className={currentDir === 'rtl' ? 'text-right' : 'text-left'}>
                <div className={`flex items-center gap-2 sm:gap-3 ${currentDir === 'rtl' ? 'justify-start' : 'justify-end'}`}>
                  <span className="text-lg sm:text-xl" aria-hidden>
                    🇨🇳
                  </span>
                  <h1 className="text-base sm:text-lg font-semibold tracking-tight">
                    {offer.title || t("productDetails.offer")}
                  </h1>
                </div>
                <div>
                  <div className="my-3 sm:my-4 text-amber-500">
                    <StarRating value={5} />
                  </div>
                  <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-slate-600">
                    {(() => {
                      const description = offer.description || '';
                      // Filter out known static sample text
                      const staticSampleText = 'This is a sample offer from Dual Profile Trading Co. containing various products for wholesale purchase.';
                      
                      if (description && description.trim() !== staticSampleText.trim()) {
                        return description;
                      }
                      
                      // Show fallback if description is empty or matches static text
                      return t("productDetails.descriptionNotAvailable") || "Offer description not available";
                    })()}
                  </p>
                  {/* Debug indicator - remove in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-2 text-xs text-green-600">
                      {t("common.dataLoaded") || "Data loaded"} {t("common.fromBackend") || "from backend"} (ID: {offer.id})
                    </div>
                  )}
                </div>
              </div>

              {offer.trader && offer.trader.id && (
                <Link
                  to={getSellerProductsUrl(offer.trader.id, offer.id)}
                  className="block w-full rounded-md bg-blue-900 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                >
                  {(() => {
                    const key = "seller.viewProducts";
                    const translated = t(key);
                    // If translation returns the key itself, it means translation wasn't found
                    if (translated === key) {
                      return i18n.language === 'ar' ? "عرض قائمة البضائع" : "View Products List";
                    }
                    return translated;
                  })()}
                </Link>
              )}

              <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                {/* Location */}
                <div className="flex items-center gap-2 text-slate-700 justify-start">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-words">
                    {(() => {
                      const city = offer.city || offer.trader?.city;
                      const country = offer.country || offer.trader?.country;
                      if (!city && !country) {
                        return t("productDetails.locationNotSpecified");
                      }
                      // Localize common locations
                      const locationParts = [];
                      if (city) {
                        const cityKey = `locations.cities.${city.toLowerCase().replace(/\s+/g, '')}`;
                        locationParts.push(t(cityKey) !== cityKey ? t(cityKey) : city);
                      }
                      if (country) {
                        const countryKey = `locations.countries.${country.toLowerCase().replace(/\s+/g, '')}`;
                        locationParts.push(t(countryKey) !== countryKey ? t(countryKey) : country);
                      }
                      return locationParts.join(i18n.language === 'ar' ? '، ' : ', ');
                    })()}
                  </span>
                </div>

                {/* Price - Calculate minimum price from items */}
                <div className={`text-right ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                  <div className="text-slate-500">{t("products.price")}</div>
                  <div className="text-sm sm:text-base font-semibold">
                    {(() => {
                      if (offer.items && offer.items.length > 0) {
                        // Calculate minimum unit price from all items
                        const prices = offer.items
                          .map(item => parseFloat(item.unitPrice || item.amount || 0))
                          .filter(price => price > 0);
                        if (prices.length > 0) {
                          const minPrice = Math.min(...prices);
                          const currency = offer.items[0].currency || 'SAR';
                          const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
                          return `${minPrice.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
                        }
                      }
                      return t("productDetails.priceOnRequest");
                    })()}
                  </div>
                </div>

                {/* Seller */}
                {offer.trader && (
                  <div className="flex items-center gap-2 text-slate-700 justify-start">
                    <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="break-words">
                      {t("productDetails.sellerLabel")} {offer.trader.companyName || offer.trader.name || t("productDetails.trader")}
                    </span>
                  </div>
                )}

                {/* Availability */}
                <div className="flex items-center gap-2 text-slate-700 justify-start">
                  <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-green-600" />
                  <span>
                    {offer.status === 'ACTIVE' 
                      ? t("products.available") 
                      : offer.status === 'INACTIVE'
                      ? t("products.unavailable") || "Unavailable"
                      : offer.status === 'PENDING'
                      ? t("products.pending") || "Pending"
                      : offer.status === 'REJECTED'
                      ? t("products.rejected") || "Rejected"
                      : offer.status || t("common.notAvailable")}
                  </span>
                </div>
              </div>

              {/* Company card - Redirects to Company Profile Page */}
              {offer.trader && offer.trader.id && (
                <Link to={getCompanyProfileUrl(offer.trader.id)} className="block">
                  <div className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 sm:p-4 hover:bg-slate-100 transition cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-200 flex-shrink-0" aria-hidden />

                      <div className="text-center flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 truncate">
                          {offer.trader.companyName || offer.trader.name || t("productDetails.companyName") || "Company Name"}
                        </div>
                        <div className="mt-1.5 sm:mt-2 flex items-center justify-center gap-1 text-amber-500">
                          <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                          <span className="text-xs text-slate-700">5.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="pt-2 sm:pt-4">
            <div className={`flex items-center gap-4 sm:gap-6 border-b border-slate-200 overflow-x-auto ${currentDir === 'rtl' ? 'justify-start' : 'justify-end'}`}>
              <button
                onClick={() => setTab("company")}
                className={`py-2.5 sm:py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                  tab === "company"
                    ? "text-slate-900 border-amber-400"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                {t("productDetails.companyProfile")}
              </button>

              <button
                onClick={() => setTab("desc")}
                className={`py-2.5 sm:py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                  tab === "desc"
                    ? "text-slate-900 border-amber-400"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                {t("productDetails.goodsDescription")}
              </button>
            </div>

            {/* Content */}
            <div className="mt-3 sm:mt-4 rounded-md border border-slate-200 bg-white overflow-hidden">
              {tab === "company" ? (
                <div className="flex flex-col md:flex-row">
                  {/* Logo block */}
                  <div className="md:w-44 flex items-center justify-center p-4 sm:p-6 border-b md:border-b-0 md:border-l border-slate-200">
                    <div className="h-24 w-24 sm:h-35 sm:w-35">
                      <img src={Rectangle1} alt="Rectangle1" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Table */}
                  <div className="flex-1 divide-y divide-slate-200">
                    <div className="grid grid-cols-[1fr_1.5fr] sm:grid-cols-[1fr_2fr]">
                      <div className={`px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold bg-slate-50 border-slate-200 ${currentDir === 'rtl' ? 'border-l' : 'border-r'}`}>
                        {t("productDetails.verificationNumber")}
                      </div>
                      <div className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-700 break-words">
                        {offer.trader?.traderCode || offer.id || t("common.notAvailable") || "N/A"}
                      </div>
                    </div>

                    {offer.acceptsNegotiation && (
                      <div className="grid grid-cols-[1fr_1.5fr] sm:grid-cols-[1fr_2fr]">
                        <div className={`px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold bg-slate-50 border-slate-200 ${currentDir === 'rtl' ? 'border-l' : 'border-r'}`}>
                          {t("productDetails.paymentTerms")}
                        </div>
                        <div className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-700 break-words">
                          {t("productDetails.acceptsNegotiation")}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-[1fr_1.5fr] sm:grid-cols-[1fr_2fr]">
                      <div className={`px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold bg-slate-50 border-slate-200 ${currentDir === 'rtl' ? 'border-l' : 'border-r'}`}>
                        {t("productDetails.companyRating")}
                      </div>
                      <div className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-700">
                        <div className={`flex items-center gap-1.5 sm:gap-2 text-amber-500 ${currentDir === 'rtl' ? 'justify-start' : 'justify-end'}`}>
                          <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                          <span className="text-slate-700 text-xs sm:text-sm">5.0</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_1.5fr] sm:grid-cols-[1fr_2fr]">
                      <div className={`px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold bg-slate-50 border-slate-200 ${currentDir === 'rtl' ? 'border-l' : 'border-r'}`}>
                        {t("productDetails.mainGoods")}
                      </div>
                      <div className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-700 break-words">
                        {offer.categoryRelation?.nameKey || offer.category || t("productDetails.general")}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">
                    {(() => {
                      const description = offer.description || '';
                      // Filter out known static sample text
                      const staticSampleText = 'This is a sample offer from Dual Profile Trading Co. containing various products for wholesale purchase.';
                      
                      if (description && description.trim() !== staticSampleText.trim()) {
                        return description;
                      }
                      
                      // Show fallback if description is empty or matches static text
                      return t("productDetails.goodsDescriptionNotAvailable") || "No goods description available";
                    })()}
                  </div>
                  {offer.items && offer.items.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {t("productDetails.offerItems")}
                      </div>
                      {offer.items.map((item, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-md p-3">
                          <div className="font-semibold text-slate-900">{item.productName || `${t("productDetails.item")} ${idx + 1}`}</div>
                          {item.description && (
                            <div className="text-xs text-slate-600 mt-1">{item.description}</div>
                          )}
                          <div className="text-xs text-slate-500 mt-2">
                            {item.quantity && `${t("productDetails.quantity")}: ${item.quantity} ${item.unit || ''}`}
                            {item.unitPrice && ` | ${t("productDetails.price")}: ${item.unitPrice} ${item.currency || ''}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Subtle footer spacing */}
          <div className="h-10" />
        </div>
      </div>
    </div>
  );
}
