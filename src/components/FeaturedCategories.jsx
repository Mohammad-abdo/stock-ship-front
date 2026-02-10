import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes";
import contact from "../assets/imgs/contact.png";
import Frame4 from "../assets/imgs/Frame4.png";
import Clippathgroup from "../assets/imgs/Clippathgroup.png";
import chairs from "../assets/imgs/chairs.png";
import cleaner from "../assets/imgs/9819.png";
import phones from "../assets/imgs/phones.png";
import bags from "../assets/imgs/1773.png";
import screans from "../assets/imgs/screans.png";
import Group22 from "../assets/imgs/Group22.png";
import unsplash from "../assets/imgs/unsplash_fzc23K1F_b0.png";
import group18 from "../assets/imgs/Group18.png";

export default function FeaturedCategories() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const features = [
    {
      title: t("featured.communication"),
      desc: t("featured.communicationDesc"),
      icon: contact,
    },
    {
      title: t("featured.commercialServices"),
      desc: t("featured.commercialServicesDesc"),
      icon: Frame4,
    },
    {
      title: t("featured.security"),
      desc: t("featured.securityDesc"),
      icon: Clippathgroup,
    },
  ];

  const bigCard = {
    title: t("featured.homeOfficeFurniture"),
    desc: t("featured.homeOfficeFurnitureDesc"),
    image: chairs,
  };

  return (
    <section
      dir={currentDir}
      className="w-full bg-slate-50 py-8 sm:py-10 md:py-12"
    >
      <div className="mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Top features */}
        <div className="w-full flex flex-col md:flex-row justify-around items-start md:items-center gap-6 md:gap-7">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-3 w-full md:w-auto"
            >
              <img
                className="inline-flex items-center justify-center shrink-0"
                src={f.icon}
                alt={f.title}
              />
              <div className={`${currentDir === 'rtl' ? 'text-right' : 'text-left'} w-full md:w-[291.33px]`}>
                <div className="text-lg font-bold text-slate-800 w-full text-[24px]">
                  {f.title}
                </div>
                <div className="text-sm text-slate-700 font-bold">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="mt-8 flex flex-col gap-4 sm:gap-6 lg:flex-row h-auto lg:h-[450px]">
          {/* right card */}
          <div className="w-full lg:w-[70%] h-auto lg:h-[450px] overflow-hidden flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row overflow-hidden h-auto lg:h-[48%]">
              {/* one */}
              <div className="w-full lg:w-[40%] bg-[#373737] min-h-50 lg:min-h-0 lg:h-full group relative overflow-hidden rounded-2xl">
                <div className={`absolute inset-0 p-6 text-white z-10 ${currentDir === 'rtl' ? 'w-[80%]' : 'w-[80%]'}`}>
                  <h3 className="text-2xl font-bold">{t("featured.homeAppliances")}</h3>
                  <p className="text-sm leading-relaxed">
                    {t("featured.homeAppliancesDesc")}
                  </p>
                </div>
                <div className={`absolute inset-0 ${currentDir === 'rtl' ? 'left-0 pr-40' : 'right-0 pl-40'} flex items-end justify-${currentDir === 'rtl' ? 'start' : 'end'} p-6`}>
                  <img
                    src={cleaner}
                    alt="cleaner"
                    className="max-w-full h-auto object-contain"
                  />
                </div>
              </div>

              {/* two */}
              <div className="w-full lg:w-[60%] bg-[#202731] min-h-50 lg:min-h-0 lg:h-full group relative overflow-hidden rounded-2xl">
                <div className={`absolute inset-0 p-6 pt-12 text-white z-10 ${currentDir === 'rtl' ? 'w-[80%]' : 'w-[80%]'}`}>
                  <h3 className="text-2xl font-bold">{t("featured.smartphones")}</h3>
                  <p className={`text-sm leading-relaxed ${currentDir === 'rtl' ? 'w-[250px]' : 'w-[250px]'}`}>
                    {t("featured.smartphonesDesc")}
                  </p>
                </div>
                <div className={`absolute inset-0 ${currentDir === 'rtl' ? 'left-0 pr-70' : 'right-0 pl-70'} flex items-center justify-${currentDir === 'rtl' ? 'start' : 'end'} p-6`}>
                  <img
                    src={phones}
                    alt="phones"
                    className="max-w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row overflow-hidden h-auto lg:h-[48%]">
              {/* tree */}
              <div className="w-full lg:w-[60%] bg-[#0A0710] min-h-50 lg:min-h-0 lg:h-full group relative overflow-hidden rounded-2xl">
                <div className={`absolute inset-0 p-6 pt-12 text-white z-10 ${currentDir === 'rtl' ? 'w-[80%]' : 'w-[80%]'}`}>
                  <h3 className="text-2xl font-bold">{t("featured.electronicScreens")}</h3>
                  <p className={`text-sm leading-relaxed ${currentDir === 'rtl' ? 'w-[250px]' : 'w-[250px]'}`}>
                    {t("featured.electronicScreensDesc")}
                  </p>
                </div>
                <div className={`absolute inset-0 ${currentDir === 'rtl' ? 'left-0 pr-70' : 'right-0 pl-70'} flex items-center justify-${currentDir === 'rtl' ? 'start' : 'end'} p-6`}>
                  <img
                    src={screans}
                    alt="screans"
                    className="max-w-full h-auto object-contain"
                  />
                </div>
              </div>

              {/* four */}
              <div className="w-full lg:w-[40%] bg-[#1A181D] min-h-50 lg:min-h-0 lg:h-full group relative overflow-hidden rounded-2xl">
                <div className={`absolute inset-0 p-6 text-white z-10 ${currentDir === 'rtl' ? 'w-[70%]' : 'w-[70%]'}`}>
                  <h3 className="text-2xl font-bold">
                    {t("featured.bagsWomenProducts")}
                  </h3>
                  <p className="text-sm leading-relaxed mt-2">
                    {t("featured.bagsWomenProductsDesc")}
                  </p>
                </div>
                <div className={`absolute inset-0 ${currentDir === 'rtl' ? 'left-0 pr-45' : 'right-0 pl-45'} bottom-0 flex items-end justify-${currentDir === 'rtl' ? 'end' : 'start'} pt-15 pb-6`}>
                  <img src={bags} alt="bags" className="max-w-full h-auto object-contain" />
                </div>
              </div>
            </div>
          </div>

          {/* lift grid of big cards */}
          <div className="w-full lg:w-[30%] h-auto lg:h-112.5">
            <div className="h-auto lg:h-112.5 min-h-80 group relative overflow-hidden rounded-2xl bg-[#504343] text-white shadow-sm">
              <img
                src={bigCard.image}
                alt={bigCard.title}
                className="h-65 sm:h-80 lg:h-90 w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.02] mt-0 lg:mt-25"
              />

              {/* content */}
              <div className="absolute inset-0 p-6">
                <h3 className="text-2xl font-extrabold">{bigCard.title}</h3>
                <p className="mt-3 max-w-[90%] text-sm leading-6 text-white/85">
                  {bigCard.desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom promos */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Promo 1 */}
          <div className="relative overflow-hidden rounded-2xl bg-(--nav-bg) text-white shadow-sm h-auto md:h-42">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 relative overflow-hidden">
              <div className={currentDir === 'rtl' ? 'text-right' : 'text-left'}>
                <div className="text-2xl font-extrabold pb-4">
                  {t("featured.topRated")}
                </div>
                <button className="rounded-md bg-white px-5 py-2 text-sm font-bold text-blue-700 hover:bg-white">
                  {t("featured.browse")} {currentDir === 'rtl' ? '←' : '→'}
                </button>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-4xl w-30 sm:w-37.5">
                  <img
                    src={unsplash}
                    alt="hugeicons"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <img className="absolute" src={group18} alt="group18" />
            </div>
            <div className="pointer-events-none absolute -left-10 top-0 h-full w-40 rotate-12 bg-white/10 blur-2xl" />
          </div>

          {/* Promo 2 */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-(--nav-bg) text-white shadow-sm h-auto md:h-[168px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 relative overflow-hidden">
              <div className={currentDir === 'rtl' ? 'text-right' : 'text-left'}>
                <div className="text-xl sm:text-2xl font-extrabold pb-3 sm:pb-4">
                  {t("featured.bestSellers")}
                </div>
                <Link
                  to={ROUTES.PRODUCTS_LIST}
                  className="inline-block rounded-md bg-white px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  {t("featured.browse")} {currentDir === 'rtl' ? '←' : '→'}
                </Link>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-4xl w-30 sm:w-37.5">
                  <img src={Group22} alt="Group22" className="w-full h-auto" />
                </div>
              </div>

              <img className="absolute" src={group18} alt="group18" />
            </div>
            <div className="pointer-events-none absolute -left-10 top-0 h-full w-40 rotate-12 bg-white/10 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
