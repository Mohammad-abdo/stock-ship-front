import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MainLayout } from "../components/Layout";
import ProductsListComponent from "../components/ProductsListComponent";
import { categoryService } from "../services/categoryService";
import { ROUTES } from "../routes";
import { ChevronLeft } from "lucide-react";

function getCategoryDisplayName(data, lang, t) {
  if (!data) return t("categoryPage.category");
  const isAr = lang === "ar";
  const name = isAr ? data.nameAr : data.nameEn;
  if (name) return name;
  if (data.nameAr || data.nameEn) return data.nameAr || data.nameEn;
  if (data.name) return data.name;
  if (data.title) return data.title;
  if (data.nameKey) {
    const key = data.nameKey.replace(/^category\./, "categories.");
    const translated = t(key);
    return translated !== key ? translated : data.nameKey;
  }
  return t("categoryPage.category");
}

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === "ar" ? "rtl" : "ltr";
  const [categoryData, setCategoryData] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    setCategoryLoading(true);
    categoryService
      .getCategoryById(categoryId)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || res.data;
        setCategoryData(data || null);
      })
      .catch(() => {
        if (!cancelled) setCategoryData(null);
      })
      .finally(() => {
        if (!cancelled) setCategoryLoading(false);
      });
    return () => { cancelled = true; };
  }, [categoryId]);

  const categoryName = getCategoryDisplayName(categoryData, i18n.language, t);

  return (
    <MainLayout>
      <div dir={currentDir} className="min-h-screen bg-white pt-40">
        <div className="container-stockship py-6 sm:py-8 lg:py-10">
          {/* Header */}
          <div className="bg-[#EEF4FF] rounded-lg px-6 py-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate(ROUTES.HOME)}
                className="p-2 hover:bg-white/50 rounded-full transition-colors shrink-0"
                aria-label={t("common.back")}
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <h1 className="text-xl font-bold text-slate-900 truncate">
                {categoryLoading ? t("common.loading") : categoryName}
              </h1>
            </div>
            <div className="text-sm text-slate-600 shrink-0">
              {t("categoryPage.offersInCategory")}
            </div>
          </div>

          <ProductsListComponent categoryId={categoryId} compactTop />
        </div>
      </div>
    </MainLayout>
  );
}
