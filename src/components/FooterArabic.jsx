import React from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes";

import logo from "../assets/imgs/Group25.png";
import paymentMethod from "../assets/imgs/payment-method.png";

function FooterLinks({ title, links, currentDir }) {
  const { i18n } = useTranslation();
  const dir = currentDir || (i18n.language === 'ar' ? 'rtl' : 'ltr');
  
  return (
    <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
      <h4 className="mb-4 text-lg font-semibold text-slate-900">{title}</h4>
      <ul className="space-y-3 text-sm text-slate-600">
        {links.map((l, i) => (
          <li key={i}>
            <Link 
              to={l.href || ROUTES.HOME}
              className={`group inline-flex items-center gap-2 transition-colors hover:text-(--accent) hover:translate-x-1 ${dir === 'rtl' ? 'flex-row-reverse hover:translate-x-[-4px]' : ''}`}
            >
              <ChevronLeft className={`h-4 w-4 text-slate-400 group-hover:text-(--accent) transition-colors ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              <span>{l.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FooterArabic({
  description,
  contact,
  columns,
}) {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  
  const defaultDescription = t("footer.description");
  const defaultContact = {
    address: t("footer.contactInfo.address"),
    phone: t("footer.contactInfo.phone"),
    email: t("footer.contactInfo.email"),
    hours: t("footer.contactInfo.hours"),
  };
  const defaultColumns = {
    account: {
      title: t("footer.account.title"),
      links: [
        { label: t("footer.account.myAccount"), href: ROUTES.HOME },
        { label: t("footer.account.returnCenter"), href: ROUTES.HOME },
        { label: t("footer.account.shippingCenter"), href: ROUTES.HOME },
        { label: t("footer.account.supportTickets"), href: ROUTES.HOME },
        { label: t("footer.account.trackOrder"), href: ROUTES.ORDERS },
        { label: t("footer.account.supportCenter"), href: ROUTES.HOME },
        { label: t("footer.account.paymentMethod"), href: ROUTES.PAYMENT_ONE },
      ],
    },
    categories: {
      title: t("footer.categories.title"),
      links: [
        { label: t("footer.categories.about"), href: ROUTES.COMPANY_PROFILE },
        { label: t("footer.categories.deliveryInfo"), href: ROUTES.HOME },
        { label: t("footer.categories.privacy"), href: ROUTES.TERMS_AND_POLICIES },
        { label: t("footer.categories.terms"), href: ROUTES.TERMS_AND_POLICIES },
        { label: t("footer.categories.contact"), href: ROUTES.HOME },
        { label: t("footer.categories.support"), href: ROUTES.HOME },
        { label: t("footer.categories.jobs"), href: ROUTES.HOME },
      ],
    },
    company: {
      title: t("footer.company.title"),
      links: [
        { label: t("footer.company.about"), href: ROUTES.COMPANY_PROFILE },
        { label: t("footer.company.deliveryInfo"), href: ROUTES.HOME },
        { label: t("footer.company.privacy"), href: ROUTES.TERMS_AND_POLICIES },
        { label: t("footer.company.terms"), href: ROUTES.TERMS_AND_POLICIES },
        { label: t("footer.company.contact"), href: ROUTES.HOME },
        { label: t("footer.company.support"), href: ROUTES.HOME },
        { label: t("footer.company.jobs"), href: ROUTES.HOME },
      ],
    },
  };
  
  return (
    <footer dir={currentDir} className="w-full bg-[#EEF4FF] ">
      <div className="mx-2 sm:mx-6 md:mx-10 lg:mx-16 xl:mx-24 2xl:mx-25  px-4 py-12 md:py-14">
        {/* ✅ Responsive grid: 1 / 2 / 4 columns */}
        <div className="grid gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">
          {/* Brand (عمود) */}
          <div className={currentDir === 'rtl' ? 'text-right' : 'text-left'}>
            <Link to={ROUTES.HOME}>
              <img src={logo} alt="logo" className="inline-block h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {description || defaultDescription}
            </p>

            <div className="mt-6">
              <div className="text-sm font-semibold text-slate-900">
                {t("footer.securePayment")}
              </div>
              <div className="mt-3 flex justify-start">
                <img
                  src={paymentMethod}
                  alt="payment-method"
                  className=" w-[60%] "
                />
              </div>
            </div>
          </div>

          {/* Account (عمود) */}
          <div>
            <FooterLinks {...(columns?.account || defaultColumns.account)} currentDir={currentDir} />
          </div>

          {/* Categories (عمود) */}
          <div>
            <FooterLinks {...(columns?.categories || defaultColumns.categories)} currentDir={currentDir} />
          </div>

          {/* Contact (عمود) */}
          <div className={currentDir === 'rtl' ? 'text-right' : 'text-left'}>
            <h4 className="mb-4 text-lg font-semibold text-slate-900">
              {t("footer.contact")}
            </h4>

            <ul className="space-y-4 text-sm text-slate-600">
              <li className={`flex items-start ${currentDir === 'rtl' ? 'justify-start' : 'justify-end'} gap-3`}>
                <span className="leading-relaxed">{(contact || defaultContact).address}</span>
              </li>
              <li className={`flex items-start ${currentDir === 'rtl' ? 'justify-start' : 'justify-end'} gap-3`}>
                <a 
                  href={`tel:${(contact || defaultContact).phone}`}
                  className="hover:text-(--accent) transition-colors"
                >
                  {(contact || defaultContact).phone}
                </a>
              </li>
              <li className={`flex items-start ${currentDir === 'rtl' ? 'justify-start' : 'justify-end'} gap-3`}>
                <a 
                  href={`mailto:${(contact || defaultContact).email}`}
                  className="hover:text-(--accent) transition-colors"
                >
                  {(contact || defaultContact).email}
                </a>
              </li>
              <li className={`flex items-start ${currentDir === 'rtl' ? 'justify-start' : 'justify-end'} gap-3 whitespace-pre-line`}>
                <span>{(contact || defaultContact).hours}</span>
              </li>
            </ul>

            <div className="mt-6 flex justify-start gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid h-10 w-10 place-items-center rounded-full bg-blue-500 text-white shadow-sm ring-1 ring-slate-200 hover:bg-blue-600 hover:scale-110 transition-all duration-200"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-10 w-10 place-items-center rounded-full bg-blue-500 text-white shadow-sm ring-1 ring-slate-200 hover:bg-blue-600 hover:scale-110 transition-all duration-200"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="grid h-10 w-10 place-items-center rounded-full bg-blue-500 text-white shadow-sm ring-1 ring-slate-200 hover:bg-blue-600 hover:scale-110 transition-all duration-200"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="grid h-10 w-10 place-items-center rounded-full bg-blue-500 text-white shadow-sm ring-1 ring-slate-200 hover:bg-blue-600 hover:scale-110 transition-all duration-200"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 h-px w-full bg-blue-400/60" />

        <div className="py-6 text-center text-sm text-blue-500">
          {t("footer.rights")} © {t("footer.designedBy")}{" "}
          <a 
            href="https://www.qeematech.net/" 
            target="_blank" 
            rel="dofollow noreferrer"
            className="hover:text-(--accent) hover:underline transition-colors"
          >
            Qeematech
          </a>
        </div>
      </div>
    </footer>
  );
}
