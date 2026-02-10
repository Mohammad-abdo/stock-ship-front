import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import FooterArabic from "../components/FooterArabic";
import { ROUTES } from "../routes";

export default function Seller() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div>
      <Header />
      <div dir={currentDir} className="min-h-screen bg-white pt-20 sm:pt-32 md:pt-40 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
              {t("seller.title")}
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              {t("seller.subtitle")}
            </p>
          </div>

          <div className="mt-12 rounded-2xl bg-slate-50 p-8 sm:p-12">
            <h2 className={`text-2xl font-bold text-slate-900 mb-6 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {t("seller.whyTitle")}
            </h2>
            <ul className={`space-y-4 text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
              <li className={`flex items-start gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-2xl">✓</span>
                <span>{t("seller.benefit1")}</span>
              </li>
              <li className={`flex items-start gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-2xl">✓</span>
                <span>{t("seller.benefit2")}</span>
              </li>
              <li className={`flex items-start gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-2xl">✓</span>
                <span>{t("seller.benefit3")}</span>
              </li>
              <li className={`flex items-start gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-2xl">✓</span>
                <span>{t("seller.benefit4")}</span>
              </li>
            </ul>

            <div className={`mt-8 flex flex-col sm:flex-row gap-4 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <Link
                to={ROUTES.PUBLISH_AD}
                className="flex-1 rounded-lg bg-[#194386] px-6 py-3 text-center font-semibold text-white hover:bg-[#153268] transition-colors"
              >
                {t("seller.publishAd")}
              </Link>
              <Link
                to={ROUTES.SIGNUP}
                className="flex-1 rounded-lg border border-[#194386] px-6 py-3 text-center font-semibold text-[#194386] hover:bg-slate-50 transition-colors"
              >
                {t("seller.signUpNow")}
              </Link>
              <Link
                to={ROUTES.HOME}
                className="flex-1 rounded-lg border border-[#194386] px-6 py-3 text-center font-semibold text-[#194386] hover:bg-slate-50 transition-colors"
              >
                {t("seller.backToHome")}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <FooterArabic />
    </div>
  );
}

