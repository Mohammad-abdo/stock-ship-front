import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes";

export default function CtaBanner({
  title,
  description,
  ctaLabel,
  onClick,
  to = ROUTES.SELLER,
}) {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const defaultTitle = t("cta.title");
  const defaultDescription = t("cta.description");
  const defaultCtaLabel = t("cta.joinUs");
  return (
    <section
      dir={currentDir}
      className="relative w-full overflow-hidden bg-[var(--stockship-primary)]"
      aria-label="Call to action"
    >
      {/* Watermark cart */}
      {/* <div className="pointer-events-none absolute -right-10 -top-10 opacity-25">
        <ShoppingCart
          size={420}
          className="text-[#6E89B1] rotate-12"
          strokeWidth={1.2}
        />
      </div> */}

      <div className="container-stockship flex flex-col items-center py-12 sm:py-14 md:py-16 xl:py-20 2xl:py-24 text-center">
        <h2 className="text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl xl:text-5xl 2xl:text-6xl">
          {title || defaultTitle}
        </h2>

        <p className="mt-6 max-w-4xl text-pretty text-base leading-relaxed text-white/95 sm:text-lg">
          {description || defaultDescription}
        </p>

        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-[var(--stockship-accent)] px-10 py-3 text-base font-bold text-[var(--stockship-primary)] shadow-sm transition-transform hover:scale-[1.02] hover:bg-[var(--stockship-accent-hover)] focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[var(--stockship-primary)]"
          >
            {ctaLabel || defaultCtaLabel}
          </button>
        ) : (
          <Link
            to={to}
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-[var(--stockship-accent)] px-10 py-3 text-base font-bold text-[var(--stockship-primary)] shadow-sm transition-transform hover:scale-[1.02] hover:bg-[var(--stockship-accent-hover)] focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[var(--stockship-primary)]"
          >
            {ctaLabel || defaultCtaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
