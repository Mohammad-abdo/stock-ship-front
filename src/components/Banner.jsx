import { useTranslation } from "react-i18next";
import bannerImg from "../assets/imgs/Banner.jpg";
import Group18 from "../assets/imgs/Group18.png";

export default function Banner() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  return (
    <section className="w-full">
      <div className="mx-auto ">
        <div
          className="
            relative isolate w-full overflow-hidden inline-block
                h-80 sm:h-96 md:h-112 lg:h-128 xl:h-144 2xl:h-160

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
          src={bannerImg}
          alt="banner"
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />

        {/* Blue diagonal shape */}
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

        {/* Text Content */}
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
            <h1 className="font-['Tajawal'] font-bold text-[20px] sm:text-[25px] md:text-[30px] leading-tight w-full">
              {t("hero.title")}
            </h1>

            <p className="mt-4 font-['Tajawal'] text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-white/90 max-w-full">
              {t("hero.description")}
            </p>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
