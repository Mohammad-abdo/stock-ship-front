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
    <section className="mt-10 mb-10 xl:mt-14 xl:mb-14 2xl:mt-16 2xl:mb-16" dir={currentDir}>
      <div className="container-stockship">
        {/* Title */}
        <div className="mb-5 md:mb-6 xl:mb-8">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-[2.25rem] 2xl:text-5xl font-bold text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {t("recommended.title")}
          </h2>
        </div>

        {/* Grid: ديسكتوب 4-5-6 أعمدة */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">{t("common.loading") || "Loading..."}</div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-x-6 gap-y-6 xl:gap-8">
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
