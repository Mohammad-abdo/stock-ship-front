import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dealService } from '../services/dealService';
import { MainLayout } from '../components/Layout';
import { ArrowLeft, Printer, Video, CheckCircle, XCircle, Download } from 'lucide-react';
import { ROUTES } from '../routes';
import ExcelJS from 'exceljs';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API_BASE.replace(/\/api$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
};

export default function ClientPriceQuotePage() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'ar';
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [productState, setProductState] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await dealService.getDealById(dealId);
      const data = response.data?.data || response.data;
      const dealData = data?.deal || data;
      setDeal(dealData);
      if (data?.platformSettings) setPlatformSettings(data.platformSettings);

      if (dealData?.items?.length) {
        const products = dealData.items.map((dealItem) => {
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
            description: offerItem.description || offerItem.notes || '',
            quantity: parseInt(offerItem.quantity) || 0,
            piecesPerCarton: parseInt(offerItem.packageQuantity || offerItem.cartons || 1),
            pricePerPiece: parseFloat(offerItem.unitPrice) || 0,
            cbm: parseFloat(offerItem.totalCBM || offerItem.cbm || 0),
            negotiationPrice: dealItem.negotiatedPrice ? parseFloat(dealItem.negotiatedPrice) : parseFloat(offerItem.unitPrice) || 0,
            negotiationQuantity: parseInt(dealItem.quantity) || 0,
            currency: offerItem.currency || 'USD',
          };
        }).filter(Boolean);
        setProductState(products);
      } else {
        setProductState([]);
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
      navigate(ROUTES.NEGOTIATIONS);
    } finally {
      setLoading(false);
    }
  };

  // ─── Excel Download ──────────────────────────────────────────────
  const handleDownloadExcel = async () => {
    if (!deal) return;
    setExcelLoading(true);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Stockship';
      workbook.created = new Date();

      const ws = workbook.addWorksheet(lang === 'ar' ? 'عرض السعر' : 'Price Quote', {
        views: [{ rightToLeft: lang === 'ar' }],
        properties: { defaultColWidth: 18 },
      });

      // ── Colors ──
      const brandNavy = '1E3A5F';
      const brandGold = 'F5AF00';
      const white = 'FFFFFF';
      const lightGray = 'F8FAFC';
      const borderGray = 'E2E8F0';
      const textDark = '1E293B';
      const textMid = '475569';
      const greenAccent = '16A34A';

      // ── Column widths ──
      ws.columns = [
        { width: 5 },   // A - #
        { width: 28 },  // B - Product
        { width: 14 },  // C - Item No
        { width: 12 },  // D - Qty
        { width: 14 },  // E - Unit Price
        { width: 14 },  // F - Neg. Price
        { width: 12 },  // G - Neg. Qty
        { width: 10 },  // H - CBM
        { width: 16 },  // I - Total
      ];

      // ── Helper: style a cell ──
      const styleCell = (cell, { font, fill, alignment, border, numFmt } = {}) => {
        if (font) cell.font = font;
        if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
        if (alignment) cell.alignment = alignment;
        if (border) cell.border = border;
        if (numFmt) cell.numFmt = numFmt;
      };

      const thinBorder = {
        top: { style: 'thin', color: { argb: borderGray } },
        left: { style: 'thin', color: { argb: borderGray } },
        bottom: { style: 'thin', color: { argb: borderGray } },
        right: { style: 'thin', color: { argb: borderGray } },
      };

      // ═══════════════════════════════════════════════════════════
      // HEADER - Brand row
      // ═══════════════════════════════════════════════════════════
      let row = 1;
      ws.mergeCells(`A${row}:I${row}`);
      const brandCell = ws.getCell(`A${row}`);
      brandCell.value = 'STOCKSHIP';
      styleCell(brandCell, {
        font: { name: 'Arial', size: 22, bold: true, color: { argb: white } },
        fill: brandNavy,
        alignment: { horizontal: 'center', vertical: 'middle' },
      });
      ws.getRow(row).height = 45;

      // Sub-header with gold accent
      row = 2;
      ws.mergeCells(`A${row}:I${row}`);
      const subBrand = ws.getCell(`A${row}`);
      subBrand.value = lang === 'ar' ? 'منصة الوساطة التجارية' : 'Trade Mediation Platform';
      styleCell(subBrand, {
        font: { name: 'Arial', size: 11, color: { argb: brandNavy } },
        fill: brandGold,
        alignment: { horizontal: 'center', vertical: 'middle' },
      });
      ws.getRow(row).height = 25;

      // ═══════════════════════════════════════════════════════════
      // QUOTE TITLE
      // ═══════════════════════════════════════════════════════════
      row = 4;
      ws.mergeCells(`A${row}:I${row}`);
      const titleCell = ws.getCell(`A${row}`);
      titleCell.value = lang === 'ar' ? 'عرض السعر' : 'PRICE QUOTE';
      styleCell(titleCell, {
        font: { name: 'Arial', size: 16, bold: true, color: { argb: brandNavy } },
        alignment: { horizontal: 'center', vertical: 'middle' },
      });
      ws.getRow(row).height = 35;

      // ═══════════════════════════════════════════════════════════
      // DEAL INFO
      // ═══════════════════════════════════════════════════════════
      row = 6;
      const infoLabels = [
        [lang === 'ar' ? 'رقم الصفقة' : 'Deal Number', deal.dealNumber || '—'],
        [lang === 'ar' ? 'التاريخ' : 'Date', deal.createdAt ? new Date(deal.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—'],
        [lang === 'ar' ? 'العميل' : 'Client', deal.client?.name || '—'],
        [lang === 'ar' ? 'الحالة' : 'Status', deal.status || '—'],
      ];
      if (deal.shippingType) {
        infoLabels.push([
          lang === 'ar' ? 'نوع الشحن' : 'Shipping Type',
          deal.shippingType === 'SEA' ? (lang === 'ar' ? 'بحري' : 'Sea') : (lang === 'ar' ? 'بري' : 'Land')
        ]);
      }

      // Info section with 2-column layout
      for (let i = 0; i < infoLabels.length; i += 2) {
        const r = ws.getRow(row);
        r.height = 22;

        // Left pair
        ws.mergeCells(`A${row}:B${row}`);
        const labelCell1 = ws.getCell(`A${row}`);
        labelCell1.value = infoLabels[i][0];
        styleCell(labelCell1, {
          font: { name: 'Arial', size: 10, bold: true, color: { argb: textMid } },
          fill: lightGray,
          alignment: { horizontal: lang === 'ar' ? 'right' : 'left', vertical: 'middle' },
          border: thinBorder,
        });

        ws.mergeCells(`C${row}:D${row}`);
        const valCell1 = ws.getCell(`C${row}`);
        valCell1.value = infoLabels[i][1];
        styleCell(valCell1, {
          font: { name: 'Arial', size: 10, color: { argb: textDark } },
          alignment: { horizontal: lang === 'ar' ? 'right' : 'left', vertical: 'middle' },
          border: thinBorder,
        });

        // Right pair (if exists)
        if (i + 1 < infoLabels.length) {
          ws.mergeCells(`F${row}:G${row}`);
          const labelCell2 = ws.getCell(`F${row}`);
          labelCell2.value = infoLabels[i + 1][0];
          styleCell(labelCell2, {
            font: { name: 'Arial', size: 10, bold: true, color: { argb: textMid } },
            fill: lightGray,
            alignment: { horizontal: lang === 'ar' ? 'right' : 'left', vertical: 'middle' },
            border: thinBorder,
          });

          ws.mergeCells(`H${row}:I${row}`);
          const valCell2 = ws.getCell(`H${row}`);
          valCell2.value = infoLabels[i + 1][1];
          styleCell(valCell2, {
            font: { name: 'Arial', size: 10, color: { argb: textDark } },
            alignment: { horizontal: lang === 'ar' ? 'right' : 'left', vertical: 'middle' },
            border: thinBorder,
          });
        }

        row++;
      }

      // ═══════════════════════════════════════════════════════════
      // PRODUCTS TABLE HEADER
      // ═══════════════════════════════════════════════════════════
      row += 1;
      const headers = lang === 'ar'
        ? ['#', 'المنتج', 'رقم الصنف', 'الكمية', 'سعر القطعة', 'السعر المتفاوض', 'الكمية المتفاوضة', 'CBM', 'الإجمالي']
        : ['#', 'Product', 'Item No.', 'Quantity', 'Unit Price', 'Neg. Price', 'Neg. Qty', 'CBM', 'Total'];

      const headerRow = ws.getRow(row);
      headerRow.height = 30;
      headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        styleCell(cell, {
          font: { name: 'Arial', size: 10, bold: true, color: { argb: white } },
          fill: brandNavy,
          alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
          border: thinBorder,
        });
      });

      // ═══════════════════════════════════════════════════════════
      // PRODUCTS DATA ROWS
      // ═══════════════════════════════════════════════════════════
      let grandTotalQty = 0;
      let grandTotalCbm = 0;
      let grandTotalPrice = 0;

      productState.forEach((p, idx) => {
        row++;
        const totalPrice = (p.negotiationQuantity || 0) * (p.negotiationPrice || 0);
        const itemCbm = p.quantity > 0 ? ((p.negotiationQuantity || 0) / p.quantity) * p.cbm : 0;
        grandTotalQty += p.negotiationQuantity || 0;
        grandTotalCbm += itemCbm;
        grandTotalPrice += totalPrice;

        const isEven = idx % 2 === 0;
        const rowFill = isEven ? white : lightGray;

        const dataRow = ws.getRow(row);
        dataRow.height = 24;
        const values = [
          idx + 1,
          p.title,
          p.itemNumber,
          p.negotiationQuantity || 0,
          p.pricePerPiece || 0,
          p.negotiationPrice || 0,
          p.negotiationQuantity || 0,
          itemCbm,
          totalPrice,
        ];

        values.forEach((v, ci) => {
          const cell = dataRow.getCell(ci + 1);
          cell.value = v;
          const isNum = ci >= 3;
          styleCell(cell, {
            font: { name: 'Arial', size: 10, color: { argb: textDark } },
            fill: rowFill,
            alignment: { horizontal: isNum ? 'center' : (lang === 'ar' ? 'right' : 'left'), vertical: 'middle' },
            border: thinBorder,
            numFmt: ci >= 4 ? '#,##0.00' : (ci === 7 ? '#,##0.00' : undefined),
          });
        });
      });

      // ═══════════════════════════════════════════════════════════
      // PRODUCTS TOTAL ROW
      // ═══════════════════════════════════════════════════════════
      row++;
      const totalsRow = ws.getRow(row);
      totalsRow.height = 28;
      ws.mergeCells(`A${row}:C${row}`);
      const totLabel = ws.getCell(`A${row}`);
      totLabel.value = lang === 'ar' ? 'الإجمالي' : 'TOTAL';
      styleCell(totLabel, {
        font: { name: 'Arial', size: 11, bold: true, color: { argb: white } },
        fill: brandNavy,
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: thinBorder,
      });

      const totVals = [grandTotalQty, '', '', grandTotalQty, grandTotalCbm, grandTotalPrice];
      [3, 4, 5, 6, 7, 8].forEach((ci, i) => {
        const cell = totalsRow.getCell(ci + 1);
        cell.value = totVals[i] ?? '';
        styleCell(cell, {
          font: { name: 'Arial', size: 10, bold: true, color: { argb: white } },
          fill: brandNavy,
          alignment: { horizontal: 'center', vertical: 'middle' },
          border: thinBorder,
          numFmt: (ci === 7 || ci === 8) ? '#,##0.00' : undefined,
        });
      });

      // ═══════════════════════════════════════════════════════════
      // FINANCIAL SUMMARY
      // ═══════════════════════════════════════════════════════════
      row += 2;
      ws.mergeCells(`A${row}:I${row}`);
      const summaryTitle = ws.getCell(`A${row}`);
      summaryTitle.value = lang === 'ar' ? 'ملخص مالي' : 'Financial Summary';
      styleCell(summaryTitle, {
        font: { name: 'Arial', size: 13, bold: true, color: { argb: brandNavy } },
        alignment: { horizontal: 'center', vertical: 'middle' },
      });
      ws.getRow(row).height = 30;

      const calcDealAmount = Number(deal.negotiatedAmount) || grandTotalPrice;
      const pRate = platformSettings?.platformCommissionRate != null ? parseFloat(platformSettings.platformCommissionRate) : 2.5;
      const sRate = platformSettings?.shippingCommissionRate != null ? parseFloat(platformSettings.shippingCommissionRate) : 5;
      const pComm = (calcDealAmount * pRate) / 100;
      const sComm = (calcDealAmount * sRate) / 100;
      const total = calcDealAmount + pComm + sComm;

      const summaryLines = [
        [lang === 'ar' ? 'قيمة الصفقة' : 'Deal Value', calcDealAmount],
        [lang === 'ar' ? `عمولة المنصة (${pRate}%)` : `Platform Commission (${pRate}%)`, pComm],
        [lang === 'ar' ? `التوصيل للعميل (${sRate}%)` : `Shipping to Client (${sRate}%)`, sComm],
      ];

      row++;
      summaryLines.forEach(([label, value]) => {
        ws.mergeCells(`A${row}:F${row}`);
        const lCell = ws.getCell(`A${row}`);
        lCell.value = label;
        styleCell(lCell, {
          font: { name: 'Arial', size: 11, color: { argb: textMid } },
          fill: lightGray,
          alignment: { horizontal: lang === 'ar' ? 'right' : 'left', vertical: 'middle' },
          border: thinBorder,
        });

        ws.mergeCells(`G${row}:I${row}`);
        const vCell = ws.getCell(`G${row}`);
        vCell.value = value;
        styleCell(vCell, {
          font: { name: 'Arial', size: 11, bold: true, color: { argb: textDark } },
          fill: lightGray,
          alignment: { horizontal: 'center', vertical: 'middle' },
          border: thinBorder,
          numFmt: '$#,##0.00',
        });
        ws.getRow(row).height = 26;
        row++;
      });

      // Grand Total row (highlighted)
      ws.mergeCells(`A${row}:F${row}`);
      const gtLabel = ws.getCell(`A${row}`);
      gtLabel.value = lang === 'ar' ? 'الإجمالي الكلي' : 'GRAND TOTAL';
      styleCell(gtLabel, {
        font: { name: 'Arial', size: 13, bold: true, color: { argb: white } },
        fill: greenAccent,
        alignment: { horizontal: lang === 'ar' ? 'right' : 'left', vertical: 'middle' },
        border: thinBorder,
      });

      ws.mergeCells(`G${row}:I${row}`);
      const gtVal = ws.getCell(`G${row}`);
      gtVal.value = total;
      styleCell(gtVal, {
        font: { name: 'Arial', size: 14, bold: true, color: { argb: white } },
        fill: greenAccent,
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: thinBorder,
        numFmt: '$#,##0.00',
      });
      ws.getRow(row).height = 32;

      // ═══════════════════════════════════════════════════════════
      // FOOTER
      // ═══════════════════════════════════════════════════════════
      row += 2;
      ws.mergeCells(`A${row}:I${row}`);
      const footerCell = ws.getCell(`A${row}`);
      footerCell.value = `Stockship - ${lang === 'ar' ? 'تم إنشاء هذا العرض تلقائياً' : 'This quote was generated automatically'} | ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}`;
      styleCell(footerCell, {
        font: { name: 'Arial', size: 9, italic: true, color: { argb: textMid } },
        alignment: { horizontal: 'center', vertical: 'middle' },
      });

      // ── Generate & Download ──
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Stockship_Quote_${deal.dealNumber || dealId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel generation error:', err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء إنشاء ملف Excel' : 'Error generating Excel file');
    } finally {
      setExcelLoading(false);
    }
  };

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

  const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;
  const quoteExpired = deal.quoteSentAt && (Date.now() - new Date(deal.quoteSentAt).getTime() > SEVENTY_TWO_HOURS_MS);
  const isCancelled72h = deal.status === 'CANCELLED' && deal.cancellationReason && (
    deal.cancellationReason.includes('72') || deal.cancellationReason.includes('hours') || deal.cancellationReason.includes('approval')
  );
  const canAcceptRejectCancel = deal.status === 'NEGOTIATION' && !quoteExpired;
  const isApproved = deal.status === 'APPROVED';
  const isPaid = deal.status === 'PAID';

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      const res = await dealService.clientAcceptDeal(dealId);
      const updatedDeal = res.data?.data ?? res.data;
      navigate(ROUTES.DEAL_CART, { state: { dealId, deal: updatedDeal } });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || (lang === 'ar' ? 'فشل في الموافقة' : 'Failed to accept');
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(t('negotiations.rejectQuote') || 'رفض')) return;
    setActionLoading('reject');
    try {
      await dealService.clientRejectDeal(dealId);
      navigate(ROUTES.NEGOTIATIONS);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || (lang === 'ar' ? 'فشل في الرفض' : 'Failed to reject');
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Calculate deal amount from items if not set ───
  const calculatedFromItems = productState.reduce(
    (sum, p) => sum + ((p.negotiationQuantity || 0) * (p.negotiationPrice || 0)), 0
  );
  const dealAmount = Number(deal.negotiatedAmount) > 0 ? Number(deal.negotiatedAmount) : calculatedFromItems;
  const platformRate = platformSettings?.platformCommissionRate != null ? parseFloat(platformSettings.platformCommissionRate) : 2.5;
  const shippingRate = platformSettings?.shippingCommissionRate != null ? parseFloat(platformSettings.shippingCommissionRate) : 5;
  const platformComm = (dealAmount * platformRate) / 100;
  const shippingComm = (dealAmount * shippingRate) / 100;
  const totalAmount = dealAmount + platformComm + shippingComm;
  const isRTL = lang === 'ar';

  // Currency helper
  const currency = productState[0]?.currency || 'USD';
  const currencySymbol = currency === 'SAR' || currency === 'SR' ? (isRTL ? 'ر.س' : 'SAR') : '$';
  const formatPrice = (val) => `${currencySymbol}${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <MainLayout>
      <div className="min-h-screen bg-white mt-40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
          {/* Top bar */}
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={() => navigate(ROUTES.NEGOTIATIONS)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className={`w-5 h-5 text-slate-700 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h1 className="text-2xl font-bold text-gray-900">{t('negotiations.priceQuote') || 'عرض السعر'}</h1>
                <p className="text-sm text-gray-500">{deal.dealNumber}</p>
              </div>
            </div>
            {/* Download Excel button */}
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={excelLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] disabled:opacity-60 shadow-md transition-colors"
            >
              {excelLoading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {t('negotiations.downloadExcel') || (isRTL ? 'تحميل عرض السعر Excel' : 'Download Quote Excel')}
            </button>
          </div>

          {isCancelled72h && (
            <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-800" role="alert">
              <p className="font-semibold">{t('negotiations.cancelled72h') || 'تم إلغاء الصفقة لمرور 72 ساعة ولم يتم الدفع'}</p>
            </div>
          )}

          {/* Deal Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <p className="text-2xl font-bold text-blue-700 mb-4">Stockship</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">{t('negotiations.dealNumber') || 'رقم الصفقة'}</p>
                <p className="font-semibold text-gray-900">{deal.dealNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('negotiations.client') || 'العميل'}</p>
                <p className="font-semibold text-gray-900">{deal.client?.name || '—'}</p>
              </div>
              {/* Trader name - blurred for client privacy */}
              <div>
                <p className="text-gray-500">{t('negotiations.trader') || 'التاجر'}</p>
                <p className="font-semibold text-gray-900 blur-[5px] select-none pointer-events-none" title={isRTL ? 'معلومات سرية' : 'Confidential'}>
                  {deal.trader?.name || deal.trader?.companyName || '—'}
                </p>
              </div>
              {/* Employee name - blurred for client privacy */}
              <div>
                <p className="text-gray-500">{t('negotiations.employee') || 'الموظف'}</p>
                <p className="font-semibold text-gray-900 blur-[5px] select-none pointer-events-none" title={isRTL ? 'معلومات سرية' : 'Confidential'}>
                  {deal.employee?.name || '—'}
                </p>
              </div>
              {deal.shippingType && (
                <div>
                  <p className="text-gray-500">{t('payment.shippingType') || 'نوع الشحن'}</p>
                  <p className="font-semibold text-gray-900">
                    {deal.shippingType === 'SEA' ? (t('payment.shippingTypeSea') || 'بحري') : (t('payment.shippingTypeLand') || 'بري')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            {productState.map((product, index) => {
              const totalQty = product.negotiationQuantity || 0;
              const totalCbmProduct = product.quantity > 0 ? (totalQty / product.quantity) * product.cbm : 0;
              const totalPriceProduct = totalQty * (product.negotiationPrice || 0);
              return (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
                    <div className="relative">
                      <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-square">
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'; }} />
                        <span className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm font-bold">{index + 1}</span>
                      </div>
                      <div className="w-20 h-20 mt-2 rounded border border-gray-200 flex items-center justify-center bg-gray-50">
                        <Video className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900">{product.title}</h3>
                      <p className="text-sm text-gray-500">{product.itemNumber}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{t('negotiations.quantity') || 'الكمية'}</p>
                          <p className="font-semibold">{product.quantity} ({product.piecesPerCarton} {t('negotiations.piecesInCarton') || 'قطع/كرتون'})</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('negotiations.pricePerPiece') || 'سعر القطعة'}</p>
                          <p className="font-semibold">{formatPrice(product.pricePerPiece)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('negotiations.negotiationPrice') || 'السعر المتفاوض عليه'}</p>
                          <p className="font-semibold">{formatPrice(product.negotiationPrice)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('negotiations.negotiationQuantity') || 'الكمية المتفاوض عليها'}</p>
                          <p className="font-semibold">{product.negotiationQuantity || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">CBM</p>
                          <p className="font-semibold">{(product.cbm || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100 text-sm">
                        <div>
                          <p className="text-gray-500">{t('negotiations.totalQuantity') || 'الكمية الإجمالية'}</p>
                          <p className="font-semibold">{totalQty.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('negotiations.totalCbm') || 'إجمالي CBM'}</p>
                          <p className="font-semibold">{totalCbmProduct.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('negotiations.totalPrice') || 'السعر الإجمالي'}</p>
                          <p className="font-semibold text-green-700">{formatPrice(totalPriceProduct)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('negotiations.negotiatedAmount') || 'قيمة الصفقة'}</span>
              <span className="font-semibold">{formatPrice(dealAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('negotiations.platformCommission') || 'عمولة المنصة'} ({platformRate}%)</span>
              <span className="font-semibold">{formatPrice(platformComm)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('negotiations.shippingToClient') || 'التوصيل للعميل'} ({shippingRate}%)</span>
              <span className="font-semibold">{formatPrice(shippingComm)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
              <span className="text-lg font-bold text-gray-900">{t('negotiations.grandTotal') || 'الإجمالي'}</span>
              <span className="text-2xl font-bold text-green-700">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Accept / Reject */}
          {canAcceptRejectCancel && (
            <div className={`mt-6 flex flex-wrap gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={handleAccept}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-md"
              >
                {actionLoading === 'accept' ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle className="w-6 h-6 shrink-0" strokeWidth={2.5} />
                )}
                <span>{t('negotiations.acceptPriceQuote') || 'قبول عرض السعر'}</span>
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 shadow-md"
              >
                {actionLoading === 'reject' ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <XCircle className="w-6 h-6 shrink-0" strokeWidth={2.5} />
                )}
                <span>{t('negotiations.rejectQuote') || 'رفض'}</span>
              </button>
            </div>
          )}

          {isPaid && (
            <div className={`mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-slate-800 font-semibold">{t('negotiations.paymentCompleted') || 'تم الدفع'}</p>
              <p className="text-slate-600 text-sm mt-1">{t('negotiations.paymentCompletedDesc') || 'تم إتمام دفع هذه الصفقة ولا تظهر في السلة.'}</p>
            </div>
          )}

          {isApproved && !isPaid && (
            <div className={`mt-6 p-4 rounded-xl bg-green-50 border border-green-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-green-800 font-semibold mb-2">{t('negotiations.quoteAcceptedGoToCart') || 'تمت الموافقة على عرض السعر'}</p>
              <button
                type="button"
                onClick={() => navigate(ROUTES.DEAL_CART, { state: { dealId, deal } })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm"
              >
                {t('negotiations.goToDealCart') || 'الذهاب إلى سلة الصفقة'}
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
