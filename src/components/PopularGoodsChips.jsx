import React from "react";
import { useTranslation } from "react-i18next";

export default function PopularGoodsChips({
  title,
  items,
  onSelect,
}) {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const defaultTitle = t("popular.title");
  
  // Default items with translation keys
  const defaultItems = [
    "popular.items.homeFurniture",
    "popular.items.schoolSupplies",
    "popular.items.carParts",
    "popular.items.computerCards",
    "popular.items.machineryEquipment",
    "popular.items.appliances",
    "popular.items.homeSupplies",
    "popular.items.transportShipping",
    "popular.items.warehouseCards",
    "popular.items.homeFurniture",
    "popular.items.schoolSupplies",
    "popular.items.carParts",
    "popular.items.computerCards",
    "popular.items.machineryEquipment",
    "popular.items.homeFurniture",
    "popular.items.electricalTools",
  ];
  
  const itemsToDisplay = items || defaultItems;
  
  return (
    <section dir={currentDir} className="w-full py-8 sm:py-10 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8">
        <h3 className={`${currentDir === 'rtl' ? 'text-right' : 'text-left'} text-base font-semibold text-slate-800 md:text-xl`}>
          {title || defaultTitle}
        </h3>

        <div className="mt-4 flex flex-wrap justify-start gap-3">
          {itemsToDisplay.map((item, i) => {
            // If item is a translation key, translate it; otherwise use as-is
            const label = item.startsWith('popular.items.') ? t(item) : item;
            return (
              <button
                key={`${item}-${i}`}
                type="button"
                onClick={() => onSelect?.(label)}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 shadow-[0_1px_0_rgba(15,23,42,0.02)] transition hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 md:text-sm"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

    </section>
  );
}
