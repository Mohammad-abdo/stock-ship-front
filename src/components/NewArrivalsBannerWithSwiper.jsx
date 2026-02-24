import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Keyboard } from "swiper/modules";
import { Clock } from "lucide-react";

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
      theme: "primary", // Stockship blue
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
      theme: "dark",
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
      theme: "accent",
    },
  ];

  return (
    <section dir={currentDir} className="w-full py-6 sm:py-8 md:py-10 xl:py-12 2xl:py-14">
      <div className="container-stockship relative">
       
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

const themeStyles = {
  primary:
    "bg-[var(--stockship-primary)] text-white",
  dark:
    "bg-slate-800 text-white",
  accent:
    "bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 text-white",
};

function BannerSlide({ slide, currentDir }) {
  const theme = slide.theme || "primary";
  const isRTL = currentDir === "rtl";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl ${themeStyles[theme]} min-h-[300px] sm:min-h-[340px] md:min-h-[400px] lg:min-h-[440px] xl:min-h-[480px] 2xl:min-h-[520px]`}
    >
      {/* زخرفة خفيفة للعمق */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white" />
      </div>

      <div
        className={`relative flex flex-col ${isRTL ? "md:flex-row-reverse" : "md:flex-row"} items-center justify-between gap-6 sm:gap-8 p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 2xl:p-16 h-full`}
      >
        {/* صورة المنتج - إطار احترافي */}
        <div className="w-full md:w-[45%] lg:w-[42%] shrink-0">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-white/5">
            <img
              src={slide.image}
              alt=""
              className="h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 w-full object-cover"
              draggable="false"
              loading="lazy"
            />
          </div>
        </div>

        {/* النص والأزرار */}
        <div
          className={`w-full md:w-[55%] lg:w-[58%] ${isRTL ? "text-right" : "text-left"} flex flex-col justify-center`}
        >
          <span className={`inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur-sm ${isRTL ? 'ml-auto' : ''}`}>
            {slide.badge}
          </span>

          <h2 className="mt-4 sm:mt-5 text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold leading-tight tracking-tight text-white">
            {slide.title1}
            <br />
            <span className="text-white/95">{slide.title2}</span>
          </h2>

          <div className={`mt-6 sm:mt-8 flex flex-wrap items-center gap-3 ${isRTL ? "justify-end" : "justify-start"}`}>
            <button
              type="button"
              className="inline-flex items-center gap-2.5 rounded-xl border-2 border-white/30 bg-white/10 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 hover:border-white/40"
            >
              <Clock className="w-5 h-5 shrink-0 opacity-90" />
              {slide.secondary}
            </button>
            <button
              type="button"
              className="rounded-xl bg-[var(--stockship-accent)] px-6 py-2.5 sm:px-8 sm:py-3 text-sm font-bold text-[var(--stockship-primary)] shadow-lg transition hover:opacity-95 active:scale-[0.98]"
            >
              {slide.primary}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
