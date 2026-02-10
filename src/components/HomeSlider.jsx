import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Keyboard } from "swiper/modules";
import api, { getFileUrl } from '../services/api';
import bannerImg from "../assets/imgs/Banner.jpg";
import Group18 from "../assets/imgs/Group18.png";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export default function HomeSlider() {
  const { t, i18n } = useTranslation();
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        setLoading(true);
        const response = await api.get('/sliders');
        const data = response.data.data || response.data;
        if (Array.isArray(data) && data.length > 0) {
          setSliders(data);
        }
      } catch (error) {
        console.error('Error fetching sliders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSliders();
  }, []);

  // Fallback slide if no data or loading
  const fallbackSlide = {
    id: 'fallback',
    titleAr: t("hero.title"),
    titleEn: t("hero.title"),
    descriptionAr: t("hero.description"),
    descriptionEn: t("hero.description"),
    imageUrl: bannerImg,
    isFallback: true
  };

  const displaySliders = sliders.length > 0 ? sliders : [fallbackSlide];

  return (
    <section className="w-full">
      <Swiper
        modules={[Autoplay, Pagination, Keyboard]}
        loop={displaySliders.length > 1}
        autoplay={displaySliders.length > 1 ? {
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        } : false}
        speed={1000}
        pagination={displaySliders.length > 1 ? {
          clickable: true,
          dynamicBullets: true,
        } : false}
        keyboard={{ enabled: true }}
        grabCursor={displaySliders.length > 1}
        className="w-full"
      >
        {displaySliders.map((slider) => (
          <SwiperSlide key={slider.id}>
            <div className="mx-auto ">
              <div
                className="
                  relative isolate w-full overflow-hidden inline-block
                  h-[90vh]

                  after:content-[''] after:absolute after:inset-y-0 after:left-0 after:w-[30%]
                  after:bg-blue-900/40 after:blur-2xl after:pointer-events-none after:z-10

                  before:content-[''] before:absolute before:bottom-0 before:right-0 before:w-[55%] before:h-[60%]
                  before:bg-blue-500/90
                  before:[clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]
                  before:pointer-events-none before:z-10
                "
              >
                {/* Background Image */}
                <img
                  src={slider.isFallback ? bannerImg : getFileUrl(slider.imageUrl)}
                  alt="banner"
                  className="absolute inset-0 z-0 h-full w-full object-cover"
                />

                {/* Blue diagonal shape - design preserved exactly */}
                <div
                  className="
                    absolute inset-0 z-20
                    bg-(--nav-bg)
                    [clip-path:polygon(90%_0,100%_0,100%_100%,20%_100%)]
                    flex items-end justify-end
                  "
                >
                  <img
                    src={Group18}
                    alt="Group18"
                    className="
                      h-full object-cover
                      w-[78%] sm:w-10/12
                    "
                  />
                </div>

                {/* Text Content - Exactly as in original Banner.jsx */}
                <div
                  dir={currentDir}
                  className={`
                    absolute inset-0 z-40
                    flex items-end ${currentDir === 'rtl' ? 'justify-end' : 'justify-start'}
                    px-4 sm:px-8 lg:px-16
                    pb-6 sm:pb-10 md:pb-14
                  `}
                >
                  <div
                    className={`
                      ${currentDir === 'rtl' ? 'ml-auto' : 'mr-auto'} w-full
                      max-w-[520px] md:max-w-[600px]
                      text-white ${currentDir === 'rtl' ? 'text-right' : 'text-left'}
                      flex flex-col ${currentDir === 'rtl' ? 'items-end' : 'items-start'}
                    `}
                  >
                    <h1 className="font-['Tajawal'] font-bold text-[20px] sm:text-[25px] md:text-[30px] leading-tight w-full drop-shadow-md">
                      {i18n.language === 'ar' ? slider.titleAr : slider.titleEn}
                    </h1>

                    <p className="mt-4 font-['Tajawal'] text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-white/90 max-w-full drop-shadow-sm">
                      {i18n.language === 'ar' ? slider.descriptionAr : slider.descriptionEn}
                    </p>

                    {slider.linkUrl && (
                      <a
                        href={slider.linkUrl}
                        className="mt-8 px-8 py-3 bg-white text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all duration-300 shadow-lg"
                      >
                        {i18n.language === 'ar' ? (slider.linkTextAr || 'المزيد') : (slider.linkTextEn || 'Learn More')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style dangerouslySetInnerHTML={{ __html: `
        .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          background: white !important;
          opacity: 1;
        }
      `}} />
    </section>
  );
}
