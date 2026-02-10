import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes";

export default function NotFound() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={currentDir} className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-slate-200">404</h1>
        <h2 className="text-3xl font-bold text-slate-900 mt-4">{t("notFound.title")}</h2>
        <p className="text-slate-600 mt-4 mb-8">
          {t("notFound.description")}
        </p>
        <Link
          to={ROUTES.HOME}
          className="inline-block rounded-lg bg-[#194386] px-6 py-3 text-white font-semibold hover:bg-[#153268] transition-colors"
        >
          {t("notFound.backToHome")}
        </Link>
      </div>
    </div>
  );
}

