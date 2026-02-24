import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Star, Heart, LayoutGrid, List, ChevronDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getProductDetailsUrl } from "../routes";
import { useFilters } from "../hooks/useFilters";
import { offerService } from "../services/offerService";
import { transformOffersToProducts } from "../utils/offerTransformers";

const StarRating = ({ value = 5 }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {stars.map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= value ? "fill-current" : ""}`}
        />
      ))}
      <span className="ms-2 text-xs text-slate-500">({value})</span>
    </div>
  );
};

export default function ProductsListComponent({ categoryId = null, categorySlug = null, search = null, compactTop = false }) {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOffers();
  }, [categoryId, categorySlug, search, page]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      let response;
      const params = { page, limit: 20 };
      
      if (search) {
        params.search = search;
      }

      if (categoryId) {
        response = await offerService.getOffersByCategory(categoryId, params);
      } else if (categorySlug) {
        params.categorySlug = categorySlug;
        response = await offerService.getActiveOffers(params);
      } else {
        response = await offerService.getActiveOffers(params);
      }

      // Backend returns: { success: true, data: [...], pagination: {...} } or { success: true, data: {...}, message: "..." }
      if (response.data && response.data.success) {
        // Handle paginated response (array) or single response
        const offersData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data ? [response.data.data] : []);
        const transformedProducts = transformOffersToProducts(offersData);
        setProducts(transformedProducts);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        }
      } else {
        console.warn("Unexpected response format:", response.data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      console.error("Error details:", error.response?.data || error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Transform products to match filter format
  const productsForFilter = useMemo(() => {
    return products.map(p => ({
      id: p.id,
      title: p.title,
      seller: p.offer?.trader?.companyName || p.offer?.trader?.name || "تاجر",
      rating: p.rating,
      reviews: p.reviews,
      price: 0, // Offers don't have direct price
      category: p.category,
      desc: p.subtitle,
      mainImg: p.image,
      thumbs: p.images && p.images.length > 0 ? p.images.slice(0, 4) : [p.image],
    }));
  }, [products]);

  const { filters, filteredItems, updateFilter, resetFilters, activeFilterCount } = useFilters({
    items: productsForFilter,
  });

  const [liked, setLiked] = useState(() =>
    Object.fromEntries(products.map((p) => [p.id, false]))
  );
  const [selectedImages, setSelectedImages] = useState(() =>
    Object.fromEntries(products.map((p) => [p.id, p.mainImg]))
  );
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
    };

    if (sortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortDropdownOpen]);

  const toggleLike = (id) =>
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  const setSelectedFor = (id, img) =>
    setSelectedImages((prev) => ({ ...prev, [id]: img }));

  const [view, setView] = useState("list");

  const sortOptions = [
    { value: 'default', label: t('products.sortOptions.default') },
    { value: 'price-asc', label: t('products.sortOptions.priceAsc') },
    { value: 'price-desc', label: t('products.sortOptions.priceDesc') },
    { value: 'rating-desc', label: t('products.sortOptions.ratingDesc') },
    { value: 'rating-asc', label: t('products.sortOptions.ratingAsc') },
    { value: 'reviews-desc', label: t('products.sortOptions.reviewsDesc') },
    { value: 'name-asc', label: t('products.sortOptions.nameAsc') },
    { value: 'name-desc', label: t('products.sortOptions.nameDesc') },
  ];

  if (loading && products.length === 0) {
    return (
      <div className={`min-h-screen bg-white ${compactTop ? 'pt-4' : 'pt-50'}`}>
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white ${compactTop ? 'pt-4' : 'pt-50'}`}>
      <div className="mx-auto w-full  px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6">
        {/* Filters and Controls */}
        <div className={`flex items-center justify-between gap-3 flex-wrap ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className={`flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}
              aria-label={t("products.sortBy")}
              aria-expanded={sortDropdownOpen}
            >
              {t("products.sortBy")}
              <ChevronDown className={`h-4 w-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {sortDropdownOpen && (
              <div className={`absolute ${currentDir === 'rtl' ? 'right-0' : 'left-0'} top-full mt-1 z-50 w-56 rounded-md border border-slate-200 bg-white shadow-lg`}>
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        updateFilter('sort', option.value);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-sm hover:bg-slate-50 transition-colors cursor-pointer ${
                        filters.sort === option.value ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-slate-700'
                      } ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Badge */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                {t("products.activeFilters")}: {activeFilterCount}
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {t("products.clearFilters")}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${
                view === "list"
                  ? "border-blue-900 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              aria-label={t("productsList.listView")}
              title={t("productsList.listView")}
            >
              <List className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setView("grid")}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${
                view === "grid"
                  ? "border-blue-900 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              aria-label={t("productsList.gridView")}
              title={t("productsList.gridView")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        {filteredItems.length > 0 && (
          <div className={`mt-4 text-sm text-slate-600 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {t("products.resultsCount", { count: filteredItems.length })}
          </div>
        )}

        {/* No Results */}
        {filteredItems.length === 0 && (
          <div className="mt-8 rounded-md border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">{t("products.noResults")}</p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {t("products.clearFilters")}
              </button>
            )}
          </div>
        )}

        {view === "grid" ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6 xl:gap-6">
            {filteredItems.map((p) => {
              const activeImg = selectedImages[p.id] || p.mainImg;
              const isLiked = liked[p.id];

              return (
                <div
                  key={p.id}
                  className="rounded-md bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={activeImg}
                      alt={p.title}
                      className="h-48 sm:h-56 w-full object-cover"
                    />
                    <span className={`absolute top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white ${currentDir === 'rtl' ? 'left-2' : 'right-2'}`}>
                      {t("products.sale")}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleLike(p.id)}
                      className={`absolute ${currentDir === 'rtl' ? 'left-2' : 'right-2'} top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white transition-colors cursor-pointer shadow-sm`}
                      aria-label={isLiked ? t("products.removeFromFavorites") : t("products.addToFavorites")}
                      title={isLiked ? t("products.removeFromFavorites") : t("products.addToFavorites")}
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          isLiked ? "fill-current text-red-600" : "text-slate-600"
                        }`}
                      />
                    </button>
                  </div>

                  <div dir={currentDir} className="p-4">
                    <div className="text-sm text-slate-500 mb-1">{p.category}</div>
                    <div className="text-base font-bold text-slate-900 line-clamp-2 mb-2">
                      {p.title}
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      {t("products.seller")}{" "}
                      <span className="font-semibold text-slate-700">
                        {p.seller}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating value={p.rating} />
                      <span className="text-xs text-slate-500">
                        ({p.reviews})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                      {p.desc}
                    </p>
                    <Link
                      to={getProductDetailsUrl(p.id)}
                      className="block w-full rounded-md border border-blue-900 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50 text-center transition-colors"
                    >
                      {t("products.viewDetails")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {filteredItems.map((p) => {
              const activeImg = selectedImages[p.id] || p.mainImg;
              const isLiked = liked[p.id];

              return (
                <div
                  key={p.id}
                  className="rounded-md bg-white  p-4 sm:p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
                    <div dir={currentDir} className="flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-lg font-bold text-slate-900">
                              {p.title}
                            </div>
                            <div className="text-xs text-slate-500 py-5">
                            {t("products.seller")}{" "}
                            <span className="font-semibold text-slate-700">
                              {p.seller}
                            </span>
                          </div>

                            <div className="mt-1 flex items-center gap-2">
                              <StarRating value={p.rating} />
                              <span className="text-xs text-slate-500">
                                ({p.reviews})
                              </span>
                            </div>
                          </div>

                          
                        </div>

                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {p.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleLike(p.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          aria-label={isLiked ? t("products.removeFromFavorites") : t("products.addToFavorites")}
                          title={isLiked ? t("products.removeFromFavorites") : t("products.addToFavorites")}
                        >
                          <Heart
                            className={`h-5 w-5 transition-colors ${
                              isLiked ? "fill-current text-red-600" : "text-slate-600"
                            }`}
                          />
                        </button>

                        <Link
                          to={`/offers/${p.id}`}
                          className="flex-1 rounded-md border border-blue-900 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 text-center"
                        >
                          {t("products.viewDetails")}
                        </Link>
                      </div>
                    </div>

                    <div>
                      <div className="relative overflow-hidden rounded-md  bg-slate-50">
                        <img
                          src={activeImg}
                          alt={p.title}
                          className="h-44 sm:h-52 w-full object-cover"
                        />
                        <span className={`absolute top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white ${currentDir === 'rtl' ? 'left-2' : 'right-2'}`}>
                          {t("products.sale")}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-5 gap-1">
                        {p.thumbs.slice(0, 4).map((thumb, i) => {
                          const active = activeImg === thumb;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSelectedFor(p.id, thumb)}
                              className={`h-10 overflow-hidden rounded border bg-white transition cursor-pointer ${
                                active
                                  ? "border-blue-900 ring-2 ring-blue-200"
                                  : "border-slate-200 hover:border-slate-400"
                              }`}
                              aria-label={t("products.viewImage")}
                              title={t("products.viewImage")}
                            >
                              <img
                                src={thumb}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => setSelectedFor(p.id, p.mainImg)}
                          className="h-10 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                          aria-label={t("products.resetImage")}
                          title={t("products.resetImage")}
                        >
                          <span className={currentDir === 'rtl' ? 'transform rotate-180' : ''}>▶</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`mt-8 flex items-center justify-center gap-2 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <span className="px-4 py-2 text-slate-700">
              صفحة {page} من {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
