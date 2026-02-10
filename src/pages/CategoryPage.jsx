import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MainLayout } from "../components/Layout";
import ProductsListComponent from "../components/ProductsListComponent";
import { categoryService } from "../services/categoryService";
import { ROUTES } from "../routes";
import { ChevronLeft } from "lucide-react";

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === "ar" ? "rtl" : "ltr";
  const [categoryName, setCategoryName] = useState("");
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
        const name = data?.nameAr || data?.nameEn || data?.name || data?.title || t("categoryPage.category") || "التصنيف";
        setCategoryName(name);
      })
      .catch(() => {
        if (!cancelled) setCategoryName(t("categoryPage.category") || "التصنيف");
      })
      .finally(() => {
        if (!cancelled) setCategoryLoading(false);
      });
    return () => { cancelled = true; };
  }, [categoryId, t]);

  return (
    <MainLayout>
      <div dir={currentDir} className="min-h-screen bg-white pt-40">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6">
          {/* Header */}
          <div className="bg-[#EEF4FF] rounded-lg px-6 py-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate(ROUTES.HOME)}
                className="p-2 hover:bg-white/50 rounded-full transition-colors shrink-0"
                aria-label={t("common.back") || "Back"}
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <h1 className="text-xl font-bold text-slate-900 truncate">
                {categoryLoading ? (t("common.loading") || "جاري التحميل...") : categoryName}
              </h1>
            </div>
            <div className="text-sm text-slate-600 shrink-0">
              {t("categoryPage.offersInCategory") || "عروض التصنيف"}
            </div>
          </div>

          <ProductsListComponent categoryId={categoryId} compactTop />
        </div>
      </div>
    </MainLayout>
  );
}
