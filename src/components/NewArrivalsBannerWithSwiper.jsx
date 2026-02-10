import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, Keyboard } from "swiper/modules";
import LanguageSwitcher from "./LanguageSwitcher";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function NewArrivalsBannerWithSwiper() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const slides = [
    {
      id: 1,
      badge: t("newArrivals.newProducts"),
      title1: t("newArrivals.discoverLatest"),
      title2: t("newArrivals.collectionsToday"),
      primary: t("newArrivals.shopNow"),
      secondary: t("newArrivals.fastDelivery"),
      image:
        "https://images.unsplash.com/photo-1607082349566-1870e3fdc793?w=1200&q=80&auto=format&fit=crop",
      gradient: "from-[#6D2AA8] via-[#5B2A9F] to-[#3E1F86]",
    },
    {
      id: 2,
      badge: t("newArrivals.strongOffers"),
      title1: t("newArrivals.saveMore"),
      title2: t("newArrivals.careProducts"),
      primary: t("newArrivals.viewOffers"),
      secondary: t("newArrivals.fastDelivery"),
      image:
        "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=1200&q=80&auto=format&fit=crop",
      gradient: "from-[#2A63A8] via-[#245AA0] to-[#183A7A]",
    },
    {
      id: 3,
      badge: t("newArrivals.justArrived"),
      title1: t("newArrivals.selectedProducts"),
      title2: t("newArrivals.carefullyForYou"),
      primary: t("newArrivals.shopNow"),
      secondary: t("newArrivals.cashOnDelivery"),
      image:
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&q=80&auto=format&fit=crop",
      gradient: "from-[#A82A6B] via-[#9F2A5B] to-[#861F3E]",
    },
  ];

  return (
    <section dir={currentDir} className="w-full py-6 sm:py-8 md:py-10">
      <div className="relative">
       
        <Swiper
          modules={[Autoplay, Pagination,  Keyboard]}
          loop
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={900}
          // pagination={{ 
          //   clickable: true,
          //   dynamicBullets: true,
          // }}
          
          keyboard={{ enabled: true }}
          grabCursor={true}
          className="w-full"
        >
          {slides.map((s) => (
            <SwiperSlide key={s.id}>
              <BannerSlide slide={s} currentDir={currentDir} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}

function BannerSlide({ slide, currentDir }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r ${slide.gradient} min-h-[280px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[420px]`}
    >
      <div className={`relative flex flex-col ${currentDir === 'rtl' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center justify-between gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 lg:p-10 h-full`}>
        <div className="w-full md:w-[48%] shrink-0">
          <img
            src={slide.image}
            alt="banner"
            className="h-40 sm:h-48 md:h-60 lg:h-72 w-full rounded-xl sm:rounded-2xl object-cover"
            draggable="false"
            loading="lazy"
          />
        </div>

        <div className={`w-full md:w-[52%] ${currentDir === 'rtl' ? 'text-right' : 'text-left'} text-white flex flex-col justify-center`}>
          <div className="inline-flex items-center rounded-lg bg-[#2B135F]/70 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold">
            {slide.badge}
          </div>

          <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
            {slide.title1} <br />
            {slide.title2}
          </h2>

          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg sm:rounded-xl bg-[#0F2D3A]/80 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold hover:bg-[#0F2D3A] transition"
            >
              <span className="grid h-6 w-6 sm:h-8 sm:w-8 place-items-center rounded-lg bg-orange-500 shrink-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white sm:w-[18px] sm:h-[18px]"
                >
                  <path
                    d="M12 6v6l4 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              {slide.secondary}
            </button>

            <button
              type="button"
              className="rounded-lg sm:rounded-xl bg-orange-500 px-5 py-2 sm:px-7 sm:py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-orange-600 transition"
            >
              {slide.primary}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
