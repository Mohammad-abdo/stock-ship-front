import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { dealService } from "../services/dealService";

export default function PaymentCardForm({ deal = null, dealId = null, fromQuote = false, platformSettings = null }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const [submitting, setSubmitting] = useState(false);

  const summary = useMemo(() => {
    if (deal && fromQuote) {
      const dealAmount = Number(deal.negotiatedAmount) || 0;
      const platformRate = platformSettings?.platformCommissionRate != null ? parseFloat(platformSettings.platformCommissionRate) : 2.5;
      const shippingRate = platformSettings?.shippingCommissionRate != null ? parseFloat(platformSettings.shippingCommissionRate) : 5;
      const platformComm = (dealAmount * platformRate) / 100;
      const shippingComm = (dealAmount * shippingRate) / 100;
      const total = dealAmount + platformComm + shippingComm;
      const currency = i18n.language === 'ar' ? 'دولار' : 'USD';
      return {
        amount: dealAmount,
        tax: platformComm + shippingComm,
        total,
        currency,
        platformRate,
        shippingRate,
      };
    }
    return {
      amount: 10000,
      tax: 10000,
      total: 20000,
      currency: i18n.language === 'ar' ? 'جنيه مصري' : 'EGP',
      platformRate: 2.5,
      shippingRate: 5,
    };
  }, [deal, fromQuote, i18n.language, platformSettings]);

  const [method, setMethod] = useState("card"); // card (فيزا) | transfer (تحويل بنكي) | paybal (باي بال)
  const [cardNumber, setCardNumber] = useState("");
  const [address, setAddress] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [country, setCountry] = useState("United States");
  const [postal, setPostal] = useState("90210");
  const [receipt, setReceipt] = useState(null);

  const handleSubmitPayment = async () => {
    if (!dealId || !fromQuote) {
      navigate(ROUTES.REQUEST_SENT);
      return;
    }
    setSubmitting(true);
    try {
      const amountToSend = Number(Number(summary.total).toFixed(2));
      const methodValue = method === "card" ? "BANK_CARD" : method === "paybal" ? "PAYBAL" : "BANK_TRANSFER";
      // transactionId must be unique (DB unique constraint) - never use file name (causes "Duplicate field value" on retry)
      const transactionId = method === "transfer"
        ? `transfer-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
        : method === "paybal"
          ? `paybal-${Date.now()}`
          : (cardNumber || `card-${Date.now()}`);
      
      const formData = new FormData();
      formData.append('amount', String(amountToSend));
      formData.append('method', methodValue);
      formData.append('transactionId', transactionId || '');
      if (receipt) {
        formData.append('receipt', receipt);
      }

      await dealService.processDealPayment(dealId, formData);
      alert(t("payment.paymentSuccess") || "تم إرسال طلب الدفع بنجاح");
      // محاولة إغلاق الصفحة (تعمل إن فُتحت بنافذة منبثقة/تاب من رابط)
      window.close();
      navigate(ROUTES.REQUEST_SENT);
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      const msg = serverMsg || err.message || t("payment.paymentError");
      const fullMsg = err.response?.status === 401
        ? (t("payment.loginRequired") || "يجب تسجيل الدخول أولاً. سجّل الدخول ثم أعد المحاولة.")
        : msg;
      alert(fullMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const dealItems = useMemo(() => {
    if (!deal?.items?.length) return [];
    return deal.items.map((di) => {
      const offerItem = di.offerItem || {};
      const qty = Number(di.quantity) || 0;
      const price = Number(di.negotiatedPrice) || Number(offerItem.unitPrice) || 0;
      return {
        title: offerItem.productName || offerItem.description || t("negotiations.product"),
        quantity: qty,
        price,
        total: qty * price
      };
    });
  }, [deal, t]);

  return (
    <div dir={currentDir} className="min-h-screen bg-white pt-20 sm:pt-32 md:pt-40">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
        <h1 className={`text-2xl font-bold text-slate-900 mb-6 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
          {t("payment.pageTitle") || (i18n.language === 'ar' ? 'صفحة الدفع' : 'Payment page')}
        </h1>

        {deal && fromQuote && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6" dir={currentDir}>
            <h2 className={`text-lg font-bold text-slate-900 mb-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {t("payment.dealContents") || "محتويات الصفقة"}
            </h2>
            <p className={`text-sm text-slate-600 mb-4 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {t("payment.dealNumber") || "رقم الصفقة"}: <strong>{deal.dealNumber}</strong>
            </p>
            <ul className="space-y-2">
              {dealItems.map((item, i) => (
                <li key={i} className={`flex justify-between text-sm ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <span>{item.title} × {item.quantity}</span>
                  <span className="font-semibold">${item.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className={`mt-4 pt-4 border-t border-slate-200 space-y-1 text-sm ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
              <p>{t("negotiations.negotiatedAmount") || "قيمة الصفقة"}: <strong>${(summary.amount || 0).toFixed(2)}</strong></p>
              <p>{t("payment.tax") || "العمولات"}: <strong>${(summary.tax || 0).toFixed(2)}</strong></p>
              <p className="font-bold text-green-700">{t("payment.totalPayment") || "إجمالي الدفع"}: ${(summary.total || 0).toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-10">
            {/* Right: summary */}
          <div className="w-full lg:w-auto space-y-4 sm:space-y-5" dir={currentDir}>
            <div className="space-y-2 sm:space-y-3">
              <div className={`flex items-center justify-between text-xs sm:text-sm ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className={`font-semibold text-blue-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("payment.amount")}</div>
                <div className={`text-slate-900 ${currentDir === 'rtl' ? 'text-left' : 'text-right'}`}>
                  {summary.amount.toLocaleString()} {summary.currency}
                </div>
              </div>

              <div className={`flex items-center justify-between text-xs sm:text-sm ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className={`font-semibold text-blue-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("payment.tax")}</div>
                <div className={`text-slate-900 ${currentDir === 'rtl' ? 'text-left' : 'text-right'}`}>
                  {summary.tax.toLocaleString()} {summary.currency}
                </div>
              </div>

              <div className={`flex items-center justify-between text-xs sm:text-sm ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className={`font-semibold text-blue-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("payment.totalPayment")}</div>
                <div className={`text-slate-900 ${currentDir === 'rtl' ? 'text-left' : 'text-right'}`}>
                  {summary.total.toLocaleString()} {summary.currency}
                </div>
              </div>
            </div>

            {(fromQuote || deal) && (
              <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 sm:px-4 py-3 text-sm">
                <p className={`font-semibold text-slate-800 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                  {t("payment.platformRateLabel") || "نسبة ستوك شيب (المنصة)"}: <strong>{summary.platformRate}%</strong>
                </p>
                <p className={`font-semibold text-slate-800 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                  {t("payment.shippingRateLabel") || "نسبة الشحن"}: <strong>{summary.shippingRate}%</strong>
                </p>
              </div>
            )}
          </div>
          {/* Left: form */}
          <div className="w-full lg:w-auto rounded-xl border border-slate-100 bg-white shadow-sm p-4 sm:p-6 md:p-8" dir={currentDir}>
            <div className={`flex items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm font-semibold flex-wrap ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <button 
                type="button" 
                onClick={() => setMethod("card")}
                className={`relative pb-2 whitespace-nowrap ${
                  method === "card"
                    ? "text-blue-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("payment.visa")}
                {method === "card" && (
                  <span className="absolute -bottom-0.5 right-0 left-0 mx-auto h-[2px] w-10 sm:w-14 md:w-16 bg-amber-500" />
                )}
              </button>

              <button 
                type="button" 
                onClick={() => setMethod("transfer")}
                className={`relative pb-2 whitespace-nowrap ${
                  method === "transfer"
                    ? "text-blue-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("payment.bankTransfer")}
                {method === "transfer" && (
                  <span className="absolute -bottom-0.5 right-0 left-0 mx-auto h-[2px] w-10 sm:w-14 md:w-16 bg-amber-500" />
                )}
              </button>

              <button 
                type="button" 
                onClick={() => setMethod("paybal")}
                className={`relative pb-2 whitespace-nowrap ${
                  method === "paybal"
                    ? "text-blue-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("payment.paybal")}
                {method === "paybal" && (
                  <span className="absolute -bottom-0.5 right-0 left-0 mx-auto h-[2px] w-10 sm:w-14 md:w-16 bg-amber-500" />
                )}
              </button>
            </div>

            {/* Bank Card Form */}
            {method === "card" && (
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
                {/* Card number */}
                <div>
                <div className={`text-xs text-slate-500 mb-1 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                  {t("payment.cardNumber")}
                </div>

                <div className="relative">
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder={t("payment.cardNumberPlaceholder")}
                    className={`w-full rounded-md border border-blue-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-200 ${currentDir === 'rtl' ? 'text-right pr-16 sm:pr-20' : 'text-left pl-16 sm:pl-20'}`}
                    dir={currentDir}
                  />

                  <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2 ${currentDir === 'rtl' ? 'right-2 sm:right-3' : 'left-2 sm:left-3'}`}>
                    <span className="inline-flex h-4 w-6 sm:h-5 sm:w-8 items-center justify-center rounded bg-slate-100 text-[8px] sm:text-[10px] font-bold text-slate-700">
                      VISA
                    </span>
                    <span className="inline-flex h-4 w-5 sm:h-5 sm:w-6 items-center justify-center rounded bg-amber-100 text-[8px] sm:text-[10px] font-bold text-amber-800">
                      MC
                    </span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <div className={`text-xs text-slate-500 mb-1 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("payment.address")}</div>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("payment.addressPlaceholder")}
                  className={`w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}
                  dir={currentDir}
                />
              </div>

              {/* Expiry + CVC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className={`text-xs text-slate-500 mb-1 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("payment.expiry")}</div>
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder={t("payment.expiryPlaceholder")}
                    className={`w-full rounded-md border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-200 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}
                    dir={currentDir}
                  />
                </div>

                <div>
                  <div className={`text-xs text-slate-500 mb-1 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("payment.cvc")}</div>
                  <input
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder={t("payment.cvcPlaceholder")}
                    className={`w-full rounded-md border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-200 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}
                    dir={currentDir}
                  />
                </div>
              </div>

              {/* Country + Postal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className={`text-xs text-slate-500 mb-1 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("payment.country")}</div>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={`w-full rounded-md border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-200 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}
                    dir={currentDir}
                  >
                    <option>United States</option>
                    <option>Egypt</option>
                    <option>Saudi Arabia</option>
                    <option>United Arab Emirates</option>
                  </select>
                </div>

                <div>
                  <div className={`text-xs text-slate-500 mb-1 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("payment.postal")}</div>
                  <input
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    placeholder={t("payment.postalPlaceholder")}
                    className={`w-full rounded-md border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-200 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}
                    dir={currentDir}
                  />
                </div>
              </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    if (fromQuote && dealId) handleSubmitPayment();
                    else navigate(ROUTES.REQUEST_SENT);
                  }}
                  className="mt-4 w-full rounded-md bg-amber-500 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-blue-900 hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? (i18n.language === 'ar' ? 'جاري الإرسال...' : 'Sending...') : t("payment.pay")}
                </button>
              </div>
            )}

            {/* Bank Transfer Form */}
            {/* PayBal Form */}
            {method === "paybal" && (
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
                <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                  {t("payment.paybalNote")}
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    if (fromQuote && dealId) handleSubmitPayment();
                    else navigate(ROUTES.REQUEST_SENT);
                  }}
                  className="mt-4 w-full rounded-md bg-amber-500 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-blue-900 hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? (i18n.language === 'ar' ? 'جاري الإرسال...' : 'Sending...') : t("payment.payWithPaybal")}
                </button>
              </div>
            )}

            {method === "transfer" && (
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
                <div className={`space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-800 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                  <div className="font-semibold break-words">
                    {t("payment.bank")}: <span className="font-normal">FAB</span>
                  </div>
                  <div className="font-semibold break-words">
                    {t("payment.accountNumber")}:{" "}
                    <span className="font-normal text-[10px] sm:text-xs">
                      AE12 3456 7890 1234 5678 901
                    </span>
                  </div>
                  <div className="font-semibold break-words">
                    {t("payment.beneficiary")}:{" "}
                    <span className="font-normal">Mazadat Abu Dhabi LLC</span>
                  </div>
                  <div className="font-semibold break-words">
                    {t("payment.amount")}:{" "}
                    <span className="font-normal">
                      {summary.amount.toLocaleString()} {summary.currency}
                    </span>
                  </div>
                </div>

                <div className={`mt-4 sm:mt-6 text-xs sm:text-sm font-semibold text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                  {t("payment.uploadReceipt")}
                </div>

                <div className="flex items-center justify-center">
                  <label className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-4 sm:p-6 text-center hover:bg-slate-50">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                    />
                    <div className="mx-auto flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-100">
                      <svg
                        width="18"
                        height="18"
                        className="sm:w-5 sm:h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2v6h6"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-700">
                      {t("payment.dragOrClick")}
                    </div>
                    <div className="mt-1 text-[10px] sm:text-xs text-slate-500">{t("payment.maxSize")}</div>

                    {receipt && (
                      <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-semibold text-blue-900 break-words">
                        {receipt.name}
                      </div>
                    )}
                  </label>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    if (fromQuote && dealId) {
                      if (!receipt) {
                        alert(t("payment.uploadReceiptAlert"));
                        return;
                      }
                      handleSubmitPayment();
                    } else {
                      navigate(ROUTES.REQUEST_SENT);
                    }
                  }}
                  className="mt-4 w-full rounded-md bg-amber-500 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-blue-900 hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? (i18n.language === 'ar' ? 'جاري الإرسال...' : 'Sending...') : t("payment.confirmPaymentSend")}
                </button>
              </div>
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
}
