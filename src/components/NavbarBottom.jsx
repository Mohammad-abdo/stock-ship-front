// NavbarBottom.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../routes";
import LanguageSwitcher from "./LanguageSwitcher";
import { categoryService } from "../services/categoryService";
import { notificationService } from "../services/notificationService";
import { useAuth } from "../contexts/AuthContext";
import hugeicons from "../assets/imgs/hugeicons_notification-01.png";
import lucide_box from "../assets/imgs/lucide_box.png";
import translate from "../assets/imgs/translate.png";

import Vector from "../assets/imgs/Vector.png";
import textalign from "../assets/imgs/textalign-left.png";
import dropdown from "../assets/imgs/arrow-down.png";

const VISIBLE_CATEGORIES_COUNT = 5;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function DesktopDropdownPortal({ open, rect, items, onClose, dropdownRef, isLanguage, currentDir }) {
  if (!open || !rect) return null;

  const gap = 8;
  const padding = 12;

  const top = Math.round(rect.bottom + gap);
  const minWidth = Math.max(220, Math.round(rect.width));

  // RTL: anchor to button right edge
  const right = Math.round(window.innerWidth - rect.right);

  // keep inside viewport
  const safeRight = clamp(right, padding, window.innerWidth - padding - minWidth);

  const maxHeight = `calc(100vh - ${top + padding}px)`;

  return createPortal(
    <div
      className="fixed inset-0 z-9"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dropdownRef}
        dir={currentDir}
        className="fixed rounded-xl border border-slate-100 bg-white shadow-2xl overflow-hidden"
        style={{ top, right: safeRight, minWidth, maxHeight }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="max-h-full overflow-y-auto">
          {isLanguage ? (
            <LanguageSwitcher variant="dropdown" />
          ) : (
            items.map((c, i) => (
              <Link
                key={i}
                to={c.to}
                className="block px-4 py-3 text-sm text-slate-700 hover:bg-blue-900 hover:text-white transition-colors"
                onClick={onClose}
              >
                {c.label}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function NavbarBottom() {
  const { t, i18n } = useTranslation(); // Used in menuItems useMemo
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const rootRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch unread notification count when authenticated (refetch on route change so count updates after visiting notifications page)
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        if (res?.data?.success) setUnreadCount(res.data.data?.count ?? 0);
      } catch {
        setUnreadCount(0);
      }
    };
    fetchUnread();
  }, [isAuthenticated, location.pathname]);

  const menuItems = useMemo(
    () => [
      
      { key: "orders", label: t("nav.orders"), icon: lucide_box, to: ROUTES.ORDERS },
      { key: "noti", label: t("nav.notifications"), icon: hugeicons, to: ROUTES.NOTIFICATION },
      {
        key: "lang",
        label: t("nav.language"),
        icon: translate,
        arrow: dropdown,
        isLanguage: true,
      },
    ],
    [t]
  );

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await categoryService.getCategoryTree();
        if (response.data && response.data.success) {
          const categoriesData = response.data.data || [];
          // Transform categories to match the expected format
          const transformedCategories = categoriesData.map((cat, index) => {
            // Convert "category.electronics" to "categories.electronics" for translation
            const translationKey = cat.nameKey 
              ? cat.nameKey.replace(/^category\./, 'categories.') 
              : "categories.unknown";
            const translatedLabel = t(translationKey);
            // Check if translation exists (if t() returns the key, translation doesn't exist)
            const label = translatedLabel !== translationKey ? translatedLabel : (cat.nameKey || t("categories.unknown"));
            
            const viewAllLabel = t("categories.viewAll") + " - " + label;
            const childItems = (cat.children || []).map((child, childIndex) => {
              if (!child.nameKey) {
                return {
                  label: t("categories.subcategory") + ` ${childIndex + 1}`,
                  to: `${ROUTES.CATEGORY}/${child.id}`
                };
              }
              const childTranslationKey = child.nameKey.replace(/^category\./, 'categories.');
              const childTranslatedLabel = t(childTranslationKey);
              const childLabel = childTranslatedLabel !== childTranslationKey ? childTranslatedLabel : child.nameKey;
              return {
                label: childLabel,
                to: `${ROUTES.CATEGORY}/${child.id}`
              };
            });
            return {
              key: cat.id || `cat-${index}`,
              label: label,
              icon: cat.icon || Vector,
              arrow: dropdown,
              children: [{ label: viewAllLabel, to: `${ROUTES.CATEGORY}/${cat.id}` }, ...childItems],
              id: cat.id,
              slug: cat.slug
            };
          });
          setCategories(transformedCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to default categories if API fails
        setCategories([
          {
            key: "all",
            label: t("categories.allCategories"),
            icon: textalign,
            arrow: dropdown,
            children: [
              { label: t("categories.all"), to: ROUTES.PRODUCTS_LIST },
              { label: t("categories.latest"), to: ROUTES.PRODUCTS_LIST },
              { label: t("categories.bestseller"), to: ROUTES.PRODUCTS_LIST },
            ],
          },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [t]);

  useEffect(() => {
    const onDown = (e) => {
      const inRoot = rootRef.current?.contains(e.target);
      const inDrop = dropdownRef.current?.contains(e.target);
      if (!inRoot && !inDrop) setOpenDropdown(null);
    };

    const onEsc = (e) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);

    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    const onResizeOrScroll = () => {
      if (!openDropdown?.rect || !openDropdown?.key) return;
      setOpenDropdown(null);
    };

    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, true);

    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll, true);
    };
  }, [openDropdown]);

  // Handle scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Hide navbar when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  const openPortalDropdown = (e, item) => {
    if (!item.children && !item.isLanguage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenDropdown((prev) => {
      if (prev?.key === item.key) return null;
      return { key: item.key, rect, items: item.children || [], isLanguage: item.isLanguage };
    });
  };

  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div 
      ref={rootRef} 
      dir={currentDir} 
      className={`hidden lg:block w-full relative z-[50] transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="w-full rounded-b-2xl lg:rounded-b-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b border-slate-200/60 bg-(--bottom-bg)">
        <div className="container-stockship py-2.5 sm:py-3 lg:py-3.5">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between gap-3 min-h-[52px]">
            {/* الفئات + المزيد بجانب بعض */}
            <div className="flex items-center gap-0 shrink-0 overflow-x-auto scrollbar-none">
              {categories.length > 0 ? (
                <>
                    {/* المزيد بجانب الفئات */}
                    {categories.length > VISIBLE_CATEGORIES_COUNT && (() => {
                    const moreCategories = categories.slice(VISIBLE_CATEGORIES_COUNT);
                    const moreItem = {
                      key: "more-categories",
                      label: t("categories.moreCategories"),
                      icon: textalign,
                      children: moreCategories.map((cat) => ({
                        label: cat.label,
                        to: `${ROUTES.CATEGORY}/${cat.id}`
                      }))
                    };
                    const isActive = openDropdown?.key === moreItem.key;
                    return (
                      <button
                        key={moreItem.key}
                        type="button"
                        onClick={(e) => openPortalDropdown(e, moreItem)}
                        className={`shrink-0 flex items-center gap-2 h-11 xl:h-12 border-r border-(--bottom-divider) pe-3 ps-3 transition-colors rounded-none ${
                          isActive
                            ? "bg-(--accent) text-white"
                            : "bg-transparent text-(--bottom-text) hover:bg-blue-50/70"
                        }`}
                      >
                        <img
                          src={moreItem.icon}
                          alt=""
                          className={`w-5 h-5 object-contain shrink-0 ${isActive ? "brightness-0 invert" : ""}`}
                        />
                        <span className="font-['Tajawal'] font-bold text-[12px] lg:text-[13px] xl:text-[14px] whitespace-nowrap">
                          {moreItem.label}
                        </span>
                        <img
                          src={dropdown}
                          alt=""
                          className={`w-4 h-4 object-contain opacity-70 shrink-0 transition-transform ${isActive ? "rotate-180" : ""}`}
                        />
                      </button>
                    );
                  })()}
                  {categories.slice(0, VISIBLE_CATEGORIES_COUNT).map((item) => {
                    const isActive = openDropdown?.key === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={(e) => openPortalDropdown(e, item)}
                        className={`shrink-0 flex items-center gap-2 h-11 xl:h-12 border-r border-(--bottom-divider) pe-3 ps-3 transition-colors rounded-none first:rounded-s-lg last:border-r-0 ${
                          isActive
                            ? "text-(--accent) bg-blue-50"
                            : "bg-transparent text-(--bottom-text) hover:bg-blue-50/70"
                        }`}
                      >
                        <img
                          src={item.icon}
                          alt=""
                          className={`w-5 h-5 object-contain shrink-0 ${isActive ? "brightness-0 saturate-100 opacity-90" : ""}`}
                        />
                        <span className="font-['Tajawal'] font-bold text-[12px] lg:text-[13px] xl:text-[14px] whitespace-nowrap">
                          {item.label}
                        </span>
                        <img
                          src={dropdown}
                          alt=""
                          className={`w-4 h-4 object-contain opacity-70 shrink-0 transition-transform ${isActive ? "rotate-180" : ""}`}
                        />
                      </button>
                    );
                  })}
              
                </>
              ) : (
                <div className="text-sm text-slate-500 px-3 py-2">{t("common.loading") || "Loading..."}</div>
              )}
            </div>

            {/* طلباتي، الإشعارات، اللغة */}
            <div className="flex items-center gap-0 flex-1 justify-end shrink-0 ms-2 lg:ms-4 border-s border-(--bottom-divider) ps-2 lg:ps-4">
              {menuItems.map((item) => {
                const isDropdownActive = openDropdown?.key === item.key;
                const isLinkActive = item.to && location.pathname === item.to;
                const isActive = isDropdownActive || isLinkActive;
                const btnClass = `flex items-center gap-2 h-11 xl:h-12 border-r border-(--bottom-divider) pe-3 ps-3 transition-colors rounded-none last:border-r-0 ${
                  isActive
                    ? "bg-(--accent) text-white"
                    : "bg-transparent text-(--bottom-text) hover:bg-blue-50/70"
                }`;
                return (
                  <div key={item.key} className="shrink-0">
                    {(item.children || item.isLanguage) ? (
                      <button
                        type="button"
                        onClick={(e) => openPortalDropdown(e, item)}
                        className={btnClass}
                      >
                        <img
                          src={dropdown}
                          alt=""
                          className={`w-4 h-4 object-contain opacity-70 transition-transform ${isDropdownActive ? "rotate-180" : ""}`}
                        />
                        <span className="font-['Tajawal'] font-bold text-[12px] lg:text-[13px] xl:text-[14px] whitespace-nowrap">
                          {item.label}
                        </span>
                        <img
                          src={item.icon}
                          alt=""
                          className={`w-5 h-5 object-contain shrink-0 ${isActive ? "brightness-0 invert" : ""}`}
                        />
                      </button>
                    ) : (
                      <Link to={item.to || "#"} className={btnClass}>
                        <span className="font-['Tajawal'] font-bold text-[12px] lg:text-[13px] xl:text-[14px] whitespace-nowrap">
                          {item.label}
                        </span>
                        <span className="relative inline-block">
                          <img
                            src={item.icon}
                            alt=""
                            className={`w-5 h-5 object-contain shrink-0 ${isActive ? "brightness-0 invert" : ""}`}
                          />
                          {item.key === "noti" && unreadCount > 0 && (
                            <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden flex items-center justify-between gap-1 overflow-x-auto">
            <div className="flex items-center gap-0.5 shrink-0">
              {categories.length > 0 ? (() => {
                const visibleCategories = categories.slice(0, VISIBLE_CATEGORIES_COUNT);
                return (
                  <>
                    {visibleCategories.map((item) => {
                      const isActive = openDropdown?.key === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={(e) => openPortalDropdown(e, item)}
                          className={`shrink-0 flex items-center gap-1 h-10 px-1.5 sm:px-2 border-r-[0.5px] border-(--bottom-divider) transition-colors ${
                            isActive 
                              ? "bg-(--accent) text-white" 
                              : "bg-transparent text-(--bottom-text) hover:bg-blue-50"
                          }`}
                        >
                          <img 
                            src={item.icon} 
                            alt={item.label} 
                            className={`w-4 h-4 object-contain ${isActive ? "brightness-0 invert" : ""}`}
                          />
                          <span className="font-['Tajawal'] font-bold text-[10px] sm:text-[11px] whitespace-nowrap hidden sm:inline">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                    {categories.length > VISIBLE_CATEGORIES_COUNT && (() => {
                      const moreCategories = categories.slice(VISIBLE_CATEGORIES_COUNT);
                      const moreItem = {
                        key: "more-categories",
                        label: t("categories.moreCategories"),
                        icon: textalign,
                        children: moreCategories.map((cat) => ({
                          label: cat.label,
                          to: `${ROUTES.CATEGORY}/${cat.id}`
                        }))
                      };
                      const isActive = openDropdown?.key === moreItem.key;
                      return (
                        <button
                          key={moreItem.key}
                          type="button"
                          onClick={(e) => openPortalDropdown(e, moreItem)}
                          className={`shrink-0 flex items-center gap-1 h-10 px-1.5 sm:px-2 border-r-[0.5px] border-(--bottom-divider) transition-colors ${
                            isActive 
                              ? "bg-(--accent) text-white" 
                              : "bg-transparent text-(--bottom-text) hover:bg-blue-50"
                          }`}
                        >
                          <img 
                            src={moreItem.icon} 
                            alt={moreItem.label} 
                            className={`w-4 h-4 object-contain ${isActive ? "brightness-0 invert" : ""}`}
                          />
                          <span className="font-['Tajawal'] font-bold text-[10px] sm:text-[11px] whitespace-nowrap hidden sm:inline">
                            {moreItem.label}
                          </span>
                        </button>
                      );
                    })()}
                  </>
                );
              })() : (
                <div className="text-xs text-slate-500 px-2">جاري التحميل...</div>
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {menuItems.map((item) => {
                const isDropdownActive = openDropdown?.key === item.key;
                const isLinkActive = item.to && location.pathname === item.to;
                const isActive = isDropdownActive || isLinkActive;
                
                return (
                  <div key={item.key} className="shrink-0">
                    {(item.children || item.isLanguage) ? (
                      <button
                        type="button"
                        onClick={(e) => openPortalDropdown(e, item)}
                        className={`flex items-center gap-1 h-10 px-1.5 sm:px-2 border-r-[0.5px] border-(--bottom-divider) transition-colors ${
                          isActive 
                            ? "bg-(--accent) text-white" 
                            : "bg-transparent text-(--bottom-text) hover:bg-blue-50"
                        }`}
                      >
                        <img 
                          src={item.icon} 
                          alt={item.label} 
                          className={`w-4 h-4 object-contain ${isActive ? "brightness-0 invert" : ""}`}
                        />
                        <span className="font-['Tajawal'] font-bold text-[10px] sm:text-[11px] whitespace-nowrap hidden sm:inline">
                          {item.label}
                        </span>
                      </button>
                  ) : (
                    <Link
                      to={item.to || "#"}
                      className={`flex items-center gap-1 h-10 px-1.5 sm:px-2 border-r-[0.5px] border-(--bottom-divider) transition-colors ${
                        isActive 
                          ? "text-(--accent)" 
                          : "bg-transparent text-(--bottom-text) hover:bg-blue-50"
                      }`}
                    >
                      <span className="relative inline-block">
                        <img 
                          src={item.icon} 
                          alt={item.label} 
                          className={`w-4 h-4 object-contain ${isActive ? "brightness-0 invert" : ""}`}
                        />
                        {item.key === "noti" && unreadCount > 0 && (
                          <span className="absolute -top-1 -end-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </span>
                      <span className="font-['Tajawal'] font-bold text-[10px] sm:text-[11px] whitespace-nowrap hidden sm:inline">
                        {item.label}
                      </span>
                    </Link>
                  )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <DesktopDropdownPortal
        open={!!openDropdown}
        rect={openDropdown?.rect}
        items={openDropdown?.items || []}
        onClose={() => setOpenDropdown(null)}
        dropdownRef={dropdownRef}
        isLanguage={openDropdown?.isLanguage}
        currentDir={currentDir}
      />
    </div>
  );
}
