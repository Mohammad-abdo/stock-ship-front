import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ROUTES, getOrderTrackingUrl } from "../routes";
import { useStatusFilter } from "../hooks/useStatusFilter";
import { orderService } from "../services/orderService";
import { dealService } from "../services/dealService";
import { useAuth } from "../contexts/AuthContext";

const getStatusBadge = (status, t) => {
  const statusMap = {
    // E-commerce order statuses
    'ORDER_RECEIVED': { label: t("orders.statusBadges.waiting"), className: "bg-amber-100 text-amber-900" },
    'PAYMENT_CONFIRMED': { label: t("orders.statusBadges.waiting"), className: "bg-amber-100 text-amber-900" },
    'IN_PREPARATION': { label: t("orders.statusBadges.waiting"), className: "bg-amber-100 text-amber-900" },
    'IN_SHIPPING': { label: t("orders.statusBadges.shipping"), className: "bg-blue-100 text-blue-900" },
    'READY_FOR_PICKUP': { label: t("orders.statusBadges.shipping"), className: "bg-blue-100 text-blue-900" },
    'COMPLETED': { label: t("orders.statusBadges.done"), className: "bg-emerald-100 text-emerald-900" },
    'CANCELLED': { label: t("orders.status.cancelled"), className: "bg-red-100 text-red-900" },
    // Deal (mediation) statuses for CLIENT
    'NEGOTIATION': { label: t("orders.dealStatus.negotiation") || "تفاوض", className: "bg-amber-100 text-amber-900" },
    'APPROVED': { label: t("orders.dealStatus.approved") || "معتمد", className: "bg-blue-100 text-blue-900" },
    'PAID': { label: t("orders.dealStatus.paid") || "تم الدفع", className: "bg-emerald-100 text-emerald-900" },
    'SETTLED': { label: t("orders.dealStatus.settled") || "تم التسوية", className: "bg-emerald-100 text-emerald-900" },
    'DISPUTED': { label: t("orders.dealStatus.disputed") || "نزاع", className: "bg-red-100 text-red-900" },
  };
  return statusMap[status] || { label: status || "—", className: "bg-slate-100 text-slate-900" };
};

const mapBackendStatusToFrontend = (status) => {
  if (status === 'IN_SHIPPING' || status === 'READY_FOR_PICKUP') return 'shipping';
  if (status === 'COMPLETED' || status === 'PAID' || status === 'SETTLED') return 'done';
  if (status === 'CANCELLED' || status === 'DISPUTED') return 'cancelled';
  return 'waiting';
};

const mapDealStatusToFrontend = (status) => {
  if (status === 'PAID' || status === 'SETTLED') return 'done';
  if (status === 'CANCELLED' || status === 'DISPUTED') return 'cancelled';
  return 'waiting';
};

export default function Orders() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { isAuthenticated, userType } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const isClient = userType === 'CLIENT';

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, isClient]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      if (isClient) {
        // CLIENT: show mediation deals as "orders"
        const response = await dealService.getDeals({ page: 1, limit: 100 });
        const raw = response.data?.data ?? response.data;
        const list = Array.isArray(raw) ? raw : (raw?.deals ?? raw?.list ?? []);
        const transformedOrders = list.map((deal) => ({
          id: deal.id,
          orderNumber: deal.dealNumber,
          companyName: deal.trader?.companyName || deal.trader?.name || t("orders.trader") || "تاجر",
          total: parseFloat(deal.negotiatedAmount) || 0,
          currency: "USD",
          itemsCount: deal._count?.items ?? deal.items?.length ?? 0,
          status: mapDealStatusToFrontend(deal.status),
          backendStatus: deal.status,
          logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
          detailUrl: `${ROUTES.CLIENT_QUOTE}/${deal.id}`,
          order: deal
        }));
        setOrders(transformedOrders);
      } else {
        const response = await orderService.getMyOrders();
        if (response.data.success) {
          const transformedOrders = (response.data.data || []).map((order) => ({
            id: order.orderNumber || order.id,
            orderNumber: order.orderNumber || order.id,
            companyName: order.vendor?.companyName || order.vendor?.name || "تاجر",
            total: parseFloat(order.totalAmount || 0),
            currency: "SAR",
            itemsCount: order.items?.length || 0,
            status: mapBackendStatusToFrontend(order.status),
            backendStatus: order.status,
            logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
            order
          }));
          setOrders(transformedOrders);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const TABS = useMemo(() => [
    { key: "all", label: t("orders.tabs.all") },
    { key: "waiting", label: t("orders.tabs.waiting") },
    { key: "shipping", label: t("orders.tabs.shipping") },
    { key: "done", label: t("orders.tabs.done") },
  ], [t]);

  const { activeStatus, setActiveStatus, filteredItems } = useStatusFilter({
    items: orders,
    statusKey: 'status',
    defaultStatus: 'all',
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white mt-40">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          <div className="text-center text-slate-600">
            {t("orders.noOrders")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white mt-40">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
        <div className={`flex items-center justify-start gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
          {TABS.map((tab) => {
            const active = activeStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveStatus(tab.key)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-100 text-blue-900"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="mt-6 text-center py-12">
            <div className="text-slate-500">جاري التحميل...</div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {filteredItems.map((o, idx) => {
              const badge = getStatusBadge(o.backendStatus || o.status, t);

            return (
              <div
                key={`${o.id}-${idx}`}
                className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200 px-5 py-5"
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-start gap-3">
                      <span className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                      <Link
                        to={o.detailUrl || getOrderTrackingUrl(o.id)}
                        className="inline-block rounded-md bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                      >
                        {t("orders.orderDetails")}
                      </Link>
                    </div>

                    <div className="hidden sm:block text-sm text-slate-600">
                      <span className="text-slate-400">{t("orders.itemsCount")}</span>{" "}
                      <span className="font-semibold text-slate-900">{o.itemsCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className={currentDir === 'rtl' ? 'text-right' : 'text-left'}>
                      <div className="text-sm font-semibold text-slate-900">
                        #{o.orderNumber || o.id}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {o.companyName}
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        {t("orders.orderTotal")}{" "}
                        <span className="font-semibold">{o.total}</span>{" "}
                        {o.currency}
                      </div>

                      <div className="mt-3 sm:hidden text-sm text-slate-600">
                        <span className="text-slate-400">{t("orders.itemsCount")}</span>{" "}
                        <span className="font-semibold text-slate-900">{o.itemsCount}</span>
                      </div>
                    </div>

                    <div className="h-28 w-28 rounded-md bg-slate-200 flex items-center justify-center overflow-hidden">
                      <img src={o.logo} alt="logo" className="h-16 w-16 object-contain opacity-90" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

            {filteredItems.length === 0 && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                {t("orders.noOrders")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
