import React from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes";

import logo from "../assets/imgs/Group25.png";
import paymentMethod from "../assets/imgs/payment-method.png";

function FooterLinks({ title, links, currentDir }) {
  const { i18n } = useTranslation();
  const dir = currentDir || (i18n.language === "ar" ? "rtl" : "ltr");
  const isRTL = dir === "rtl";

  return (
    <div className={isRTL ? "text-right" : "text-left"}>
      <h4 className="mb-5 text-base font-semibold text-slate-800 tracking-tight">
        {title}
      </h4>
      <ul className="space-y-3.5 text-sm text-slate-600">
        {links.map((l, i) => (
          <li key={i}>
            <Link
              to={l.href || ROUTES.HOME}
              className={`group inline-flex items-center gap-2 transition-colors hover:text-amber-600 ${isRTL ? "flex-row-reverse hover:translate-x-1" : "hover:-translate-x-0.5"}`}
            >
              <ChevronLeft
                className={`h-4 w-4 text-slate-400 shrink-0 transition-colors group-hover:text-amber-500 ${isRTL ? "rotate-180" : ""}`}
              />
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
  const currentDir = i18n.language === "ar" ? "rtl" : "ltr";
  const isRTL = currentDir === "rtl";

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

  const contactData = contact || defaultContact;
  const socialLinks = [
    { href: "https://facebook.com", Icon: Facebook, label: "Facebook" },
    { href: "https://instagram.com", Icon: Instagram, label: "Instagram" },
    { href: "https://twitter.com", Icon: Twitter, label: "Twitter" },
    { href: "https://linkedin.com", Icon: Linkedin, label: "LinkedIn" },
  ];

  return (
    <footer
      dir={currentDir}
      className="w-full bg-gradient-to-b from-slate-50 to-blue-50/50 border-t border-slate-200/80"
    >
      <div className="container-stockship py-12 md:py-16 xl:py-20 2xl:py-24">
        {/* Grid */}
        <div className="grid gap-10 sm:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className={isRTL ? "text-right sm:pr-4" : "text-left sm:pl-0"}>
            <Link to={ROUTES.HOME} className="inline-block">
              <img
                src={logo}
                alt="Logo"
                className="h-10 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-slate-600 max-w-xs">
              {description || defaultDescription}
            </p>
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800 mb-3">
                {t("footer.securePayment")}
              </p>
              <img
                src={paymentMethod}
                alt="payment-method"
                className="max-w-[200px] h-auto object-contain opacity-90"
              />
            </div>
          </div>

          <FooterLinks
            {...(columns?.account || defaultColumns.account)}
            currentDir={currentDir}
          />
          <FooterLinks
            {...(columns?.categories || defaultColumns.categories)}
            currentDir={currentDir}
          />

          {/* Contact */}
          <div className={isRTL ? "text-right" : "text-left"}>
            <h4 className="mb-5 text-base font-semibold text-slate-800 tracking-tight">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{contactData.address}</span>
              </li>
              <li className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Phone className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <a
                  href={`tel:${contactData.phone}`}
                  className="hover:text-amber-600 transition-colors"
                >
                  {contactData.phone}
                </a>
              </li>
              <li className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Mail className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <a
                  href={`mailto:${contactData.email}`}
                  className="hover:text-amber-600 transition-colors break-all"
                >
                  {contactData.email}
                </a>
              </li>
              <li className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="whitespace-pre-line leading-relaxed">{contactData.hours}</span>
              </li>
            </ul>

            <div className={`mt-6 flex gap-3 ${isRTL ? "justify-end" : "justify-start"}`}>
              {socialLinks.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/80 text-slate-600 transition-all duration-200 hover:bg-blue-600 hover:text-white hover:scale-105"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 pt-8 border-t border-slate-200/80" />

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 py-4 text-center text-sm text-slate-500">
          <span>
            {t("footer.rights")} © {new Date().getFullYear()}
          </span>
          <span className="hidden sm:inline">·</span>
          <span>
            {t("footer.designedBy")}{" "}
            <a
              href="https://www.qeematech.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-amber-600 transition-colors underline-offset-2 hover:underline"
            >
              QeemaTech
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
