// src/components/RecommendedProducts.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ProductCard from "./ProductCard";
import { offerService } from "../services/offerService";
import { transformOffersToProducts } from "../utils/offerTransformers";

export default function RecommendedProducts() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendedOffers();
  }, []);

  const fetchRecommendedOffers = async () => {
    try {
      setLoading(true);
      const response = await offerService.getRecommendedOffers(12);
      
      // Backend returns: { success: true, data: [...], message: "..." }
      if (response.data && response.data.success) {
        // Handle array response
        const offersData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data ? [response.data.data] : []);
        const transformedProducts = transformOffersToProducts(offersData);
        setProducts(transformedProducts);
      } else {
        console.warn("Unexpected response format:", response.data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching recommended offers:", error);
      console.error("Error details:", error.response?.data || error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10 mb-10" dir={currentDir}>
      <div className="mx-auto  px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Title */}
        <div className="mb-4">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {t("recommended.title")}
          </h2>
        </div>

        {/* Grid: 5 فوق + 5 تحت على الشاشات الكبيرة */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">{t("common.loading") || "Loading..."}</div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                category={p.category}
                title={p.title}
                image={p.image}
                rating={p.rating}
                reviews={p.reviews}
                subtitle={p.subtitle}
                badgeText={t("recommended.badge") || "RECOMMENDED"}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">{t("recommended.noProducts") || t("common.noData") || "No recommended products"}</div>
          </div>
        )}
      </div>
    </section>
  );
}
