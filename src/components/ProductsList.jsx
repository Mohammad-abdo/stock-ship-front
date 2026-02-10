import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, Keyboard } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import ProductCard from "./ProductCard";
import { offerService } from "../services/offerService";
import { transformOffersToProducts } from "../utils/offerTransformers";

export default function ProductsCarousel({title, categoryId = null, limit = 10}) {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, [categoryId, limit]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      let response;
      
      if (categoryId) {
        response = await offerService.getOffersByCategory(categoryId, { limit, page: 1 });
      } else {
        response = await offerService.getActiveOffers({ limit, page: 1 });
      }

      // Backend returns: { success: true, data: [...], pagination: {...} } or { success: true, data: {...}, message: "..." }
      if (response.data && response.data.success) {
        // Handle paginated response (array) or single response
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
      console.error("Error fetching offers:", error);
      console.error("Error details:", error.response?.data || error.message);
      // Keep empty array on error - don't break the design
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="my-10" dir={currentDir}>
      <div className="mx-auto  px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Title */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">{title}</h2>
          </div>
        </div>

      {/* Swiper */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500">{t("common.loading") || "Loading..."}</div>
        </div>
      ) : products.length > 0 ? (
        <Swiper
          modules={[Autoplay, Pagination, Navigation, Keyboard]}
          autoplay={{
            delay: 3000, 
            disableOnInteraction: false, 
            pauseOnMouseEnter: true, 
          }}
          loop={products.length > 4}
          speed={700}
          navigation={{
            enabled: true,
            prevEl: '.swiper-button-prev',
            nextEl: '.swiper-button-next',
          }}
          spaceBetween={12}
          slidesPerView={1}
          breakpoints={{
            375: { slidesPerView: 1, spaceBetween: 12 },
            640: { slidesPerView: 2, spaceBetween: 16 },
            768: { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 4, spaceBetween: 24 },
            1536: { slidesPerView: 4, spaceBetween: 24 },
          }}
          grabCursor={true}
          keyboard={{ enabled: true }}
        >
          {products.map((p) => (
            <SwiperSlide key={p.id}>
              <ProductCard
                id={p.id}
                category={p.category}
                title={p.title}
                image={p.image}
                rating={p.rating}
                reviews={p.reviews}
                subtitle={p.subtitle}
                badgeText={p.badgeText}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500">لا توجد منتجات متاحة</div>
        </div>
      )}
      </div>
    </section>
  );
}
