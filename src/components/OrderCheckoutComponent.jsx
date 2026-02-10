import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { offerService } from "../services/offerService";

export default function OrderCheckoutComponent() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get initial offer from navigation state
  const [currentOffer, setCurrentOffer] = useState(location.state?.offer || null);
  const [loading, setLoading] = useState(false);
  
  // Effect to fetch offer if items are missing but we have an ID
  useEffect(() => {
    const fetchFullOffer = async () => {
      // If we don't have an offer ID, we can't fetch. Redirect.
      if (!currentOffer?.id) {
        // If it's completely empty (direct access), redirect
        if (!currentOffer) {
           navigate(ROUTES.PRODUCTS_LIST);
        }
        return;
      }

      // If we have an offer but NO items, fetch the full details
      if (!currentOffer.items || currentOffer.items.length === 0) {
        try {
          console.log("OrderCheckout: Fetching full details for offer:", currentOffer.id);
          setLoading(true);
          const res = await offerService.getOfferById(currentOffer.id);
          if (res.data?.success && res.data?.data) {
             console.log("OrderCheckout: Fetched full offer:", res.data.data);
             setCurrentOffer(res.data.data);
          }
        } catch (err) {
          console.error("OrderCheckout: Error fetching offer details:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFullOffer();
  }, [currentOffer?.id]); 

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

  // Transform offer items to products format
  const products = useMemo(() => {
    if (!currentOffer || !currentOffer.items) return [];
    
    // Parse images from offer
    let offerImages = [];
    if (currentOffer.images) {
      try {
        const parsedImages = typeof currentOffer.images === 'string' 
          ? JSON.parse(currentOffer.images) 
          : currentOffer.images;
        offerImages = Array.isArray(parsedImages) 
          ? parsedImages.map(img => getImageUrl(img)).filter(img => img !== null)
          : [];
      } catch {
        offerImages = [];
      }
    }
    
    return [{
        id: currentOffer.id,
        title: currentOffer.title || t("productDetails.offerDefaultTitle"),
        sku: currentOffer.id.substring(0, 8),
        desc: currentOffer.description || t("productDetails.noDescription"),
        qtyTotal: currentOffer.totalCartons || 0,
        cbmTotal: currentOffer.totalCBM || 0,
        totalPrice: 0, 
        currency: "USD",
        mainImg: offerImages.length > 0 ? offerImages[0] : "https://placehold.co/600x400?text=No+Image",
        thumbs: offerImages,
    }];
  }, [currentOffer, t]);

  // ✅ selected image 
  const [selectedImages, setSelectedImages] = useState({});
  
  // Update selected images when products change
  useEffect(() => {
     if (products.length > 0) {
         setSelectedImages(Object.fromEntries(products.map((p) => [p.id, p.mainImg])));
     }
  }, [products]);

  const setSelectedFor = (productId, img) => {
    setSelectedImages((prev) => ({ ...prev, [productId]: img }));
  };

  // Initialize rows from offer items - use useEffect to update when/if offer loads
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (currentOffer && currentOffer.items) {
        const newRows = currentOffer.items.map((item, index) => ({
            serial: index + 1,
            itemNo: item.itemNo || item.productName,
            qty: item.quantity || 0,
            price: item.unitPrice || 0,
            cbm: item.cbm || 0,
            originalItem: item
        }));
        setRows(newRows);
    }
  }, [currentOffer]);

  const totals = useMemo(() => {
    const sumQty = rows.reduce((a, r) => a + Number(r.qty || 0), 0);
    const sumPrice = rows.reduce((a, r) => a + Number(r.price || 0), 0);
    const sumCbm = rows.reduce((a, r) => a + Number(r.cbm || 0), 0);
    return { sumQty, sumPrice, sumCbm };
  }, [rows]);

  const updateRow = (idx, key, value) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r))
    );
  };
   
  const [coupon, setCoupon] = useState("");

  const subtotal = totals.sumPrice;
  const shipping = 0; // Or calculate
  const total = subtotal + shipping;

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-white">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          </div>
      );
  }

  return (
    <div dir={currentDir} className="min-h-screen bg-white mt-40 w-full">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-25">
        
        {/* Navigation Links */}
        <div className={`mb-6 flex flex-wrap items-center gap-4 text-sm ${currentDir === 'rtl' ? '' : 'flex-row-reverse'}`}>
          <Link
            to={ROUTES.HOME}
            className="text-blue-900 hover:text-blue-700 hover:underline"
          >
            {t("checkout.homePage")}
          </Link>
          <span className="text-slate-400">/</span>
          <Link
            to={ROUTES.PRODUCTS_LIST}
            className="text-blue-900 hover:text-blue-700 hover:underline"
          >
            {t("checkout.products")}
          </Link>
          <span className="text-slate-400">/</span>
          <Link
            to={ROUTES.ORDERS}
            className="text-blue-900 hover:text-blue-700 hover:underline"
          >
            {t("checkout.myOrders")}
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 font-semibold">{t("checkout.title")}</span>
        </div>
        
        <div className="space-y-6">
          {products.map((p) => {
            const activeImg = selectedImages[p.id] || p.mainImg;

            return (
              <div
                key={p.id}
                className="rounded-md  border-slate-200 bg-white"
              >
                
                <div
                  className="flex flex-col md:flex-row gap-6 p-4 sm:p-6"
                  dir={currentDir}
                >
                   {/* RIGHT: image + thumbs (First in DOM -> Right in RTL) */}
                   <div className="w-full md:w-56 flex-shrink-0">
                    <div className="relative w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                      <img
                        src={activeImg}
                        alt={p.title}
                        className="h-48 w-full object-cover"
                      />
                      <span className={`absolute top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white ${currentDir === 'rtl' ? 'right-2' : 'left-2'}`}>
                        SALE
                      </span>
                    </div>

                    {/* ✅ thumbnails clickable */}
                    <div className="mt-2 grid grid-cols-4 gap-2 w-full">
                      {p.thumbs.slice(0, 4).map((thumb, i) => {
                        const isActive = activeImg === thumb;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedFor(p.id, thumb)}
                            className={`h-12 overflow-hidden rounded border bg-slate-50 transition
                              ${isActive ? "border-blue-700 ring-2 ring-blue-200" : "border-slate-200 hover:border-slate-400"}`}
                            aria-label={t("checkout.viewImage")}
                          >
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* LEFT: text + summary */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                          {p.title}
                        </h3>
                        <div className="text-sm text-slate-500 mb-4">
                          #{p.sku}
                        </div>
                      </div>
                    </div>

                    <p className="text-base leading-relaxed text-slate-600 mb-6">
                      {p.desc}
                    </p>

                  {/* Summary rows */}
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      {[
                        { label: t("checkout.totalQuantity"), value: `${p.qtyTotal} ${t("checkout.piece")}` },
                        { label: t("checkout.totalCbm"), value: `${p.cbmTotal} CBM` },
                        { label: t("checkout.totalPrice"), value: `${p.totalPrice} ${i18n.language === 'ar' ? 'ر.س' : 'SAR'}` },
                      ].map((row, idx) => (
                        <div
                          key={row.label}
                          className={`flex items-center justify-between px-4 py-3 ${idx !== 0 ? "border-t border-slate-200" : ""} bg-white`}
                        >
                           {/* Label first = Right in RTL */}
                           <div className="font-bold text-blue-900">
                            {row.label}
                          </div>
                          
                          {/* Value second = Left in RTL */}
                          <div className="text-slate-700 font-medium">
                            {row.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary table */}
        <section className="w-full mt-10">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold text-blue-900">{t("checkout.orderSummary")}</h2>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            {/* Header */}
            <div className="grid grid-cols-5 bg-blue-50 text-sm font-bold text-slate-800 border-b border-slate-200">
              <div className="px-4 py-4 text-center">{t("checkout.serial")}</div>
              <div className="px-4 py-4 text-center">{t("checkout.itemNumber")}</div>
              <div className="px-4 py-4 text-center">{t("checkout.quantity")}</div>
              <div className="px-4 py-4 text-center">{t("checkout.price")}</div>
              <div className="px-4 py-4 text-center">CBM</div>
            </div>

            {/* Rows */}
            <div className="bg-white divide-y divide-slate-100">
              {rows.map((r, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-5 items-center py-3 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="px-2 text-center">
                    <input
                      value={r.serial}
                      onChange={(e) => updateRow(idx, "serial", e.target.value)}
                      className="mx-auto w-16 block text-center bg-blue-50 text-blue-900 font-medium py-1.5 rounded-md border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="px-2 text-center">
                    <input
                      value={r.itemNo}
                      onChange={(e) => updateRow(idx, "itemNo", e.target.value)}
                       className="mx-auto w-24 block text-center bg-blue-50 text-blue-900 font-medium py-1.5 rounded-md border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="px-2 text-center">
                    <input
                      value={r.qty}
                      onChange={(e) => updateRow(idx, "qty", e.target.value)}
                       className="mx-auto w-24 block text-center bg-blue-50 text-blue-900 font-medium py-1.5 rounded-md border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="px-2 text-center font-semibold text-slate-700 text-sm">
                    {r.price}
                  </div>

                  <div className="px-2 text-center font-semibold text-slate-700 text-sm">
                     {r.cbm}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer / Total */}
            <div className="grid grid-cols-5 bg-[#1E3A8A] text-white text-sm font-bold">
              <div className="px-4 py-4 text-center">{t("checkout.total")}</div>
              <div className="px-4 py-4 text-center">......</div>
              <div className="px-4 py-4 text-center">{totals.sumQty}</div>
              <div className="px-4 py-4 text-center">
                {totals.sumPrice} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
              </div>
              <div className="px-4 py-4 text-center">{totals.sumCbm || 2222}</div>
            </div>
          </div>
        </section>
        {/* Cart summary */}
        <section className="w-full mt-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{t("checkout.cart")}</h2>

          <div className="w-full rounded-md border border-slate-200 overflow-hidden bg-white">
            <div className="flex items-stretch">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder={t("checkout.enterCouponCode")}
                className={`flex-1 px-4 py-3 text-sm outline-none bg-white text-slate-700 placeholder:text-slate-400`}
                dir={currentDir}
              />
              <button
                type="button"
                className={`px-6 border-slate-200 text-sm font-semibold text-blue-700 hover:bg-slate-50 transition-colors border-l rtl:border-r rtl:border-l-0`}
              >
                {t("checkout.save")}
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
             {/* Totals Block */}
            <div className="flex items-center justify-between text-base font-semibold text-slate-800">
               <span>{t("checkout.subtotal")}</span>
               <span>{subtotal} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
            
            <div className="flex items-center justify-between text-base font-semibold text-slate-800">
               <span>{t("checkout.shipping")}</span>
               <span>{shipping.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
            
             <div className="flex items-center justify-between text-base font-bold text-slate-900 pt-2">
               <span>{t("checkout.total")}</span>
               <span>{total} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
          </div>
          
          <Link to={ROUTES.ORDER_CHECKOUT_TWO} className="block mt-8">
            <button
              type="button"
              className="w-full rounded-md bg-[#F59E0B] px-4 py-4 text-center text-lg font-bold text-blue-900 hover:bg-[#D97706] transition-colors shadow-sm"
            >
              {t("checkout.completePurchase")}
            </button>
          </Link>
        </section>

        {/* Additional Navigation Links */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to={ROUTES.HOME}
            className="px-6 py-2 text-sm font-semibold text-blue-900 border border-blue-900 rounded-md hover:bg-blue-50 transition-colors"
          >
            {t("checkout.backToHome")}
          </Link>
          <Link
            to={ROUTES.PRODUCTS_LIST}
            className="px-6 py-2 text-sm font-semibold text-blue-900 border border-blue-900 rounded-md hover:bg-blue-50 transition-colors"
          >
            {t("checkout.browseMoreProducts")}
          </Link>
          <Link
            to={ROUTES.ORDERS}
            className="px-6 py-2 text-sm font-semibold text-blue-900 border border-blue-900 rounded-md hover:bg-blue-50 transition-colors"
          >
            {t("checkout.viewMyOrders")}
          </Link>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
