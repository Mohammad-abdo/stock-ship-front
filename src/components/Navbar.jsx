// Navbar.jsx
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../routes";
import logo from "../assets/imgs/Group20.png";
import SearchBar from "./SearchBar";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { categoryService } from "../services/categoryService";

import hugeicons from "../assets/imgs/hugeicons_notification-01.png";
import lucide_box from "../assets/imgs/lucide_box.png";
import LanguageSwitcher from "./LanguageSwitcher";
import translate from "../assets/imgs/translate.png";

import Vector from "../assets/imgs/Vector.png";
import lamp from "../assets/imgs/lamp.png";
import smartphone from "../assets/imgs/smart-phone-01.png";
import shoes from "../assets/imgs/running-shoes.png";
import shirt from "../assets/imgs/shirt-01.png";
import textalign from "../assets/imgs/textalign-left.png";
import dropdown from "../assets/imgs/arrow-down.png";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [userDropdown, setUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const rootRef = useRef(null);

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

  // Sync search field from URL when on products list
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q != null) setSearchQuery(q);
  }, [location.pathname, location.search]);

  const menuItems = useMemo(
    () => [
      {
        key: "lang",
        label: t("nav.language"),
        icon: translate,
        isLanguage: true,
      },
      { key: "noti", label: t("nav.notifications"), icon: hugeicons, to: ROUTES.NOTIFICATION },
      { key: "orders", label: t("nav.orders"), icon: lucide_box, to: ROUTES.ORDERS },
    ],
    [t]
  );

  // Categories are now fetched from API in useEffect above

  useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpenDropdown(null);
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
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const toggleDropdown = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setOpenDropdown(null);
  };

  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <header dir={currentDir} className="w-full relative z-[60]" ref={rootRef}>
      <nav className="w-full bg-(--nav-bg) py-2 sm:py-2.5 md:py-3">
        <div className="container-stockship flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
        <Link to={ROUTES.HOME} className="flex items-center justify-end shrink-0">
          <img src={logo} alt="logo" className="h-6 sm:h-7 md:h-8 lg:h-9 xl:h-10 2xl:h-11 w-auto" />
        </Link>

        <div className="hidden lg:flex flex-1 max-w-md lg:max-w-lg xl:max-w-2xl 2xl:max-w-3xl mx-2 lg:mx-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full"
          />
        </div>

        <div className="hidden lg:flex items-center gap-2 sm:gap-3 shrink-0">
          {!isAuthenticated ? (
            <>
              <Link to={ROUTES.LOGIN}>
                <button className="h-8 sm:h-9 md:h-10 lg:h-11 px-2 sm:px-3 md:px-4 lg:px-5 rounded-[5px] bg-(--white) border border-(--primary) flex items-center justify-center">
                  <span className="text-(--primary) font-bold text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] leading-[150%] whitespace-nowrap">
                    {t("nav.login")}
                  </span>
                </button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              {user?.userType !== 'TRADER' && (
                <Link to={ROUTES.SIGNUP_BANK_INFO}>
                  <button className="h-8 sm:h-9 md:h-10 lg:h-11 px-2 sm:px-3 md:px-4 lg:px-5 rounded-[5px] bg-(--accent) flex items-center justify-center">
                    <span className="text-(--primary) font-bold text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] leading-[150%] whitespace-nowrap">
                      {t("nav.registerAsTrader")}
                    </span>
                  </button>
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="h-8 sm:h-9 md:h-10 lg:h-11 px-2 sm:px-3 md:px-4 lg:px-5 rounded-[5px] bg-(--white) border border-(--primary) flex items-center justify-center gap-2"
                >
                  <span className="text-(--primary) font-bold text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] leading-[150%] whitespace-nowrap">
                    {user?.name || user?.email || t("common.user") || "User"}
                  </span>
                  <img src={dropdown} alt="dropdown" className={`w-4 h-4 transition ${userDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {userDropdown && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                    <Link
                      to={ROUTES.PROFILE}
                      onClick={() => setUserDropdown(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {t("common.profile") || "Profile"}
                    </Link>
                    {user?.userType === 'CLIENT' && (
                      <Link
                        to={ROUTES.NEGOTIATIONS}
                        onClick={() => setUserDropdown(false)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {t("negotiations.title") || "طلبات التفاوض"}
                      </Link>
                    )}
                    {user?.userType === 'TRADER' && (
                      <>
                      <Link
                        to={ROUTES.TRADER_DASHBOARD}
                        onClick={() => setUserDropdown(false)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {t("common.dashboard") || "Dashboard"}
                      </Link>
                      <Link
                        to={ROUTES.PUBLISH_AD}
                        onClick={() => setUserDropdown(false)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {t("seller.publishAd") || "Publish Ad"}
                      </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setUserDropdown(false);
                        logout();
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Language switcher for mobile/tablet */}
        {/* <div className="md:hidden">
          <LanguageSwitcher className="h-8 sm:h-9 px-2 sm:px-3" />
        </div> */}

        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="
            lg:hidden
            inline-flex min-h-[44px] min-w-[44px] items-center justify-center
            rounded-lg border border-white/30
            bg-black/20 backdrop-blur-md text-white
            touch-manipulation
          "
          aria-label={t("nav.openMenu") || "Open menu"}
        >
          <span className="text-xl leading-none">☰</span>
        </button>
        </div>
      </nav>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeSidebar} />

          <aside
            dir={currentDir}
            className={`
              absolute ${currentDir === 'rtl' ? 'right-0' : 'left-0'}
                  h-dvh w-[85%] max-w-sm
              bg-white shadow-2xl
              flex flex-col
            `}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b shrink-0 bg-blue-900">
              <div className="font-['Tajawal'] font-bold text-lg text-white">{t("nav.menu")}</div>

              <button
                onClick={closeSidebar}
                className="w-10 h-10 rounded-full grid place-items-center hover:bg-black/5 text-white font-bold bg-(--accent)"
                aria-label={t("nav.closeMenu") || "Close menu"}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              <div className="space-y-2">
                <div className="font-['Tajawal'] font-bold text-sm opacity-70">{t("categories.shortcuts")}</div>

                <div className="grid gap-2">
                  {menuItems.map((item) => (
                    <div key={item.key} className="w-full">
                      {item.isLanguage ? (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleDropdown(item.key)}
                            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-black/5"
                          >
                            <div className="flex items-center gap-3">
                              <img src={item.icon} alt={item.label} className="w-6 h-6 object-contain" />
                              <span className="font-['Tajawal'] font-bold">{item.label}</span>
                            </div>
                            <img
                              src={dropdown}
                              alt="arrow"
                              className={`w-5 h-5 object-contain opacity-70 transition ${
                                openDropdown === item.key ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {openDropdown === item.key && (
                            <div className="mt-1 ms-3 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                              <LanguageSwitcher variant="dropdown" />
                            </div>
                          )}
                        </>
                      ) : (
                        <Link to={item.to || "#"} className="block" onClick={closeSidebar}>
                          <div className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5">
                            <img src={item.icon} alt={item.label} className="w-6 h-6 object-contain" />
                            <span className="font-['Tajawal'] font-bold">{item.label}</span>
                          </div>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-['Tajawal'] font-bold text-sm opacity-70">{t("categories.sections")}</div>

                <div className="grid gap-2">
                  {loadingCategories ? (
                    <div className="text-sm text-slate-500 px-4 py-2">جاري التحميل...</div>
                  ) : categories.length > 0 ? (
                    categories.map((item) => (
                    <div key={item.key} className="w-full">
                      <button
                        type="button"
                        onClick={() => toggleDropdown(item.key)}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-black/5"
                      >
                        <div className="flex items-center gap-3">
                          <img src={item.icon} alt={item.label} className="w-6 h-6 object-contain" />
                          <span className="font-['Tajawal'] font-bold">{item.label}</span>
                        </div>
                        <img
                          src={dropdown}
                          alt="arrow"
                          className={`w-5 h-5 object-contain opacity-70 transition ${
                            openDropdown === item.key ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {item.children && item.children.length > 0 && openDropdown === item.key && (
                        <div className="mt-1 ms-3 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                          {item.children.map((c, i) => (
                            <Link
                              key={i}
                              to={c.to || `${ROUTES.CATEGORY}/${item.id}`}
                              className="block px-4 py-3 text-sm text-slate-700 hover:bg-white"
                              onClick={closeSidebar}
                            >
                              {c.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex  gap-3">
                {isAuthenticated && user?.userType !== 'TRADER' && (
                  <Link
                    to={ROUTES.SIGNUP_BANK_INFO}
                    onClick={closeSidebar}
                    className="w-full rounded-xl bg-(--accent) px-4 py-3 text-center font-['Tajawal'] font-bold text-(--primary) block"
                  >
                    {t("nav.registerAsTrader")}
                  </Link>
                )}

                {!isAuthenticated ? (
                  <Link
                    to={ROUTES.LOGIN}
                    onClick={closeSidebar}
                    className="w-full rounded-xl border border-(--primary) text-white px-4 py-3 text-center font-['Tajawal'] font-bold bg-(--primary) block"
                  >
                    {t("nav.login")}
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to={ROUTES.PROFILE}
                      onClick={closeSidebar}
                      className="block w-full rounded-xl border border-(--primary) text-white px-4 py-3 text-center font-['Tajawal'] font-bold bg-(--primary)"
                    >
                      الملف الشخصي
                    </Link>
                    {user?.userType === 'CLIENT' && (
                      <Link
                        to={ROUTES.NEGOTIATIONS}
                        onClick={closeSidebar}
                        className="block w-full rounded-xl border border-(--primary) text-white px-4 py-3 text-center font-['Tajawal'] font-bold bg-(--primary)"
                      >
                        {t("negotiations.title") || "طلبات التفاوض"}
                      </Link>
                    )}
                    {user?.userType === 'TRADER' && (
                      <Link
                        to={ROUTES.PUBLISH_AD}
                        onClick={closeSidebar}
                        className="block w-full rounded-xl border border-(--primary) text-white px-4 py-3 text-center font-['Tajawal'] font-bold bg-(--primary)"
                      >
                        نشر إعلان
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        closeSidebar();
                        logout();
                      }}
                      className="w-full rounded-xl border border-red-600 text-red-600 px-4 py-3 text-center font-['Tajawal'] font-bold bg-white"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                )}
                </div>
                

                <div className="mt-1 w-full">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    compact
                    className="rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="h-6" />
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
