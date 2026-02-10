import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../components/Layout';
import { ROUTES } from '../routes';
import { ArrowLeft, ShoppingCart, ChevronLeft } from 'lucide-react';
import { dealService } from '../services/dealService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API_BASE.replace(/\/api$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
};

export default function DealCartPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'ar';
  const isRTL = lang === 'ar';

  const [deal, setDeal] = useState(location.state?.deal || null);
  const [dealId, setDealId] = useState(location.state?.dealId || null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [productState, setProductState] = useState([]);
  const [loading, setLoading] = useState(!location.state?.deal && !!location.state?.dealId);

  useEffect(() => {
    if (deal && deal.items?.length) {
      const products = deal.items.map((dealItem) => {
        const { offerItem } = dealItem;
        if (!offerItem) return null;
        let images = [];
        try {
          const parsed = typeof offerItem.images === 'string' ? JSON.parse(offerItem.images || '[]') : (offerItem.images || []);
          if (Array.isArray(parsed)) {
            images = parsed.map((img) => {
              const url = typeof img === 'string' ? img : (img?.url || img?.src || img);
              return url ? (url.startsWith('http') ? url : getFileUrl(url)) : null;
            }).filter(Boolean);
          }
        } catch (e) {}
        const imageUrl = images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
        return {
          id: dealItem.id,
          image: imageUrl,
          title: offerItem.productName || offerItem.description || t('negotiations.product') || 'منتج',
          itemNumber: offerItem.itemNo || `#${(offerItem.id || '').slice(0, 8)}`,
          quantity: parseInt(offerItem.quantity) || 0,
          piecesPerCarton: parseInt(offerItem.packageQuantity || offerItem.cartons || 1),
          cbm: parseFloat(offerItem.totalCBM || offerItem.cbm || 0),
          negotiationPrice: dealItem.negotiatedPrice ? parseFloat(dealItem.negotiatedPrice) : parseFloat(offerItem.unitPrice) || 0,
          negotiationQuantity: parseInt(dealItem.quantity) || 0,
        };
      }).filter(Boolean);
      setProductState(products);
    } else {
      setProductState([]);
    }
  }, [deal, t]);

  useEffect(() => {
    const stateDeal = location.state?.deal;
    const stateDealId = location.state?.dealId;

    if (stateDeal) {
      setDeal(stateDeal);
      setDealId(stateDeal.id || stateDealId);
      setLoading(false);
      return;
    }
    if (stateDealId) {
      setDealId(stateDealId);
      dealService.getDealById(stateDealId)
        .then((res) => {
          const data = res.data?.data || res.data;
          const d = data?.deal || data;
          setDeal(d);
          if (data?.platformSettings) setPlatformSettings(data.platformSettings);
        })
        .catch(() => navigate(ROUTES.NEGOTIATIONS))
        .finally(() => setLoading(false));
      return;
    }
    navigate(ROUTES.NEGOTIATIONS);
  }, [location.state, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white mt-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!deal) return null;

  const isPaid = deal.status === 'PAID';
  const dealAmount = Number(deal.negotiatedAmount) || 0;
  const platformRate = platformSettings?.platformCommissionRate != null ? parseFloat(platformSettings.platformCommissionRate) : 2.5;
  const shippingRate = platformSettings?.shippingCommissionRate != null ? parseFloat(platformSettings.shippingCommissionRate) : 5;
  const platformComm = (dealAmount * platformRate) / 100;
  const shippingComm = (dealAmount * shippingRate) / 100;
  const totalAmount = dealAmount + platformComm + shippingComm;

  return (
    <MainLayout>
      <div className="min-h-screen bg-white mt-40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={() => navigate(ROUTES.NEGOTIATIONS)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h1 className="text-2xl font-bold text-gray-900">{t('negotiations.dealCart') || 'سلة الصفقة'}</h1>
                  <p className="text-sm text-gray-500">{t('negotiations.dealCartDescription') || 'الصفقة المعتمدة جاهزة للدفع'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <p className="text-xl font-bold text-blue-700 mb-4">Stockship</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">{t('negotiations.dealNumber') || 'رقم الصفقة'}</p><p className="font-semibold text-gray-900">{deal.dealNumber}</p></div>
              <div><p className="text-gray-500">{t('negotiations.client') || 'العميل'}</p><p className="font-semibold text-gray-900">{deal.client?.name || '—'}</p></div>
              <div><p className="text-gray-500">{t('negotiations.trader') || 'التاجر'}</p><p className="font-semibold text-gray-900">{deal.trader?.name || deal.trader?.companyName || '—'}</p></div>
              <div><p className="text-gray-500">{t('negotiations.employee') || 'الموظف'}</p><p className="font-semibold text-gray-900">{deal.employee?.name || '—'}</p></div>
              {deal.shippingType && (
                <div><p className="text-gray-500">{t('payment.shippingType') || 'نوع الشحن'}</p><p className="font-semibold text-gray-900">{deal.shippingType === 'SEA' ? (t('payment.shippingTypeSea') || 'بحري') : (t('payment.shippingTypeLand') || 'بري')}</p></div>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {productState.map((product, index) => {
              const totalQty = product.negotiationQuantity || 0;
              const totalCbmProduct = product.quantity > 0 ? (totalQty / product.quantity) * product.cbm : 0;
              const totalPriceProduct = totalQty * (product.negotiationPrice || 0);
              return (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{product.title}</h3>
                    <p className="text-sm text-gray-500">{product.itemNumber}</p>
                    <p className="text-sm mt-1">
                      {t('negotiations.quantity') || 'الكمية'}: <strong>{totalQty}</strong>
                      {' · '}{t('negotiations.totalPrice') || 'السعر الإجمالي'}: <strong className="text-green-700">${totalPriceProduct.toFixed(2)}</strong>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-600">{t('negotiations.negotiatedAmount') || 'قيمة الصفقة'}</span><span className="font-semibold">${dealAmount.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">{t('negotiations.platformCommission') || 'عمولة المنصة'} ({platformRate}%)</span><span className="font-semibold">${platformComm.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">{t('negotiations.shippingToClient') || 'التوصيل للعميل'} ({shippingRate}%)</span><span className="font-semibold">${shippingComm.toFixed(2)}</span></div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
              <span className="text-lg font-bold text-gray-900">{t('negotiations.grandTotal') || 'الإجمالي'}</span>
              <span className="text-2xl font-bold text-green-700">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {isPaid ? (
            <div className={`p-4 rounded-xl bg-slate-100 border border-slate-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-slate-800 font-semibold">{t('negotiations.paymentCompleted') || 'تم الدفع'}</p>
              <p className="text-slate-600 text-sm mt-1">{t('negotiations.paymentCompletedDesc') || 'تم إتمام دفع هذه الصفقة ولا تظهر في السلة.'}</p>
              <button
                type="button"
                onClick={() => navigate(ROUTES.NEGOTIATIONS)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm"
              >
                {t('negotiations.backToNegotiations') || 'العودة إلى المفاوضات'}
              </button>
            </div>
          ) : (
            <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={() => navigate((deal.id || dealId) ? `${ROUTES.PAYMENT_ONE}/${deal.id || dealId}` : ROUTES.PAYMENT_ONE, { state: { dealId: deal.id || dealId, deal, fromQuote: true, platformSettings } })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                {t('negotiations.proceedToPayment') || 'المتابعة للدفع'}
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
