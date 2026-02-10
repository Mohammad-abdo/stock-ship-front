import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getProductDetailsUrl } from "../routes";

export default function ProductCard({
  id,
  category,
  title,
  image,
  rating = 5,
  reviews = 65,
  subtitle,
}) {
  const { t } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="w-full h-full overflow-hidden rounded-xl sm:rounded-2xl border-0 p-2 sm:p-3 py-4 sm:py-5 bg-[#F0F2F5] shadow-sm flex flex-col">
      {/* Image */}
      <div className="relative flex-shrink-0">
        <img
          src={
            image ??
            "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1200&q=80&auto=format&fit=crop"
          }
          alt={title}
          className="h-48 sm:h-56 w-full rounded-xl sm:rounded-2xl object-cover aspect-[4/3]"
          loading="lazy"
        />

        {/* Badge
        {badgeText ? (
          <span className="absolute right-3 top-3 rounded-xl bg-white px-3 py-2 text-sm font-extrabold tracking-wide text-red-600 shadow">
            {badgeText}
          </span>
        ) : null} */}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 text-right flex-1 flex flex-col">
        {category && (
          <div className="text-xs sm:text-sm text-slate-500">{category}</div>
        )}

        {title && (
          <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 line-clamp-2">{title}</div>
        )}

        {/* Rating */}
        <div className="mt-2 flex items-center gap-2">
          <Stars value={rating} />
          <span className="text-xs sm:text-sm text-slate-500">({reviews})</span>
        </div>

        <div className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-1">
          {subtitle}
        </div>
        {/* Buttons */}
        <div className="mt-4 sm:mt-6 flex items-center justify-between gap-2 flex-shrink-0">
          <Link to={`/offers/${id || 1}`} className="flex-1">
            <div className="rounded-lg sm:rounded-xl border border-slate-300 bg-white py-2 sm:py-2.5 text-center text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors">       
              {t("product.viewDetails")}
            </div>
          </Link>

          {/* Favorite */}
          <button
            type="button"
            onClick={() => setIsFavorite((v) => !v)}
            className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-white/90 shadow hover:bg-white transition-colors flex-shrink-0"
            aria-label={t("product.favorite")}
            title={t("product.favorite")}
          >
            <HeartIcon filled={isFavorite} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Stars({ value = 0, max = 5 }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${t("product.rating")} ${value} ${t("common.of") || "of"} ${max}`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <StarIcon key={i} filled={i < value} />
      ))}
    </div>
  );
}

function StarIcon({ filled }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      className={filled ? "fill-yellow-400" : "fill-slate-200"}
    >
      <path d="M12 17.27l-5.18 3.05 1.39-5.81-4.5-3.89 5.92-.5L12 4.5l2.37 5.62 5.92.5-4.5 3.89 1.39 5.81z" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className={filled ? "fill-rose-500" : "fill-slate-300"}
    >
      <path d="M12 21s-7.1-4.4-9.3-8.7C.7 8.4 3.1 5.5 6.4 5.5c1.7 0 3.3.8 4.3 2 1-1.2 2.6-2 4.3-2 3.3 0 5.7 2.9 3.7 6.8C19.1 16.6 12 21 12 21z" />
    </svg>
  );
}
