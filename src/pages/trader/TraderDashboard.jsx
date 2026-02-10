import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { traderService } from "../../services/traderService";
import { dealService } from "../../services/dealService";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  CheckCircle,
  ShoppingCart,
  Users,
  Activity,
  BarChart3,
  PieChart
} from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// --- UI Components (Locally defined to match Shadcn UI) ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Card = ({ className, ...props }) => (
  <div className={cn("rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm", className)} {...props} />
);

const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
);

const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

// -----------------------------------------------------------

export default function TraderDashboard() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    offers: { total: 0, active: 0, pending: 0, rejected: 0 },
    deals: { total: 0, active: 0, completed: 0 },
    recentOffers: [],
    recentDeals: [],
    statistics: {
      offersByStatus: [],
      dealsByStatus: [],
      totalPayments: 0,
      paymentCount: 0,
      totalTraderAmount: 0,
      transactionCount: 0
    },
    employee: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (!user?.id) return;
        
        // Get full trader details with statistics
        const traderRes = await traderService.getTraderById(user.id);
        const trader = traderRes.data.data || traderRes.data;
        
        const offers = trader.offers || [];
        const deals = trader.deals || [];
        const statistics = trader.statistics || {};
        
        // Also fetch deals filtered by traderId if needed
        let allDeals = deals;
        if (deals.length === 0) {
          try {
            const dealsRes = await dealService.getDeals({ traderId: user.id, limit: 100 });
            allDeals = dealsRes.data.data || dealsRes.data || [];
          } catch (err) {
            console.warn('Could not fetch deals:', err);
          }
        }

        setStats({
          offers: {
            total: trader._count?.offers || offers.length,
            active: offers.filter(o => o.status === 'ACTIVE').length,
            pending: offers.filter(o => o.status === 'PENDING_VALIDATION').length,
            rejected: offers.filter(o => o.status === 'REJECTED').length
          },
          deals: {
            total: trader._count?.deals || allDeals.length,
            active: allDeals.filter(d => ['NEGOTIATION', 'APPROVED', 'PAID'].includes(d.status)).length,
            completed: allDeals.filter(d => d.status === 'SETTLED').length
          },
          recentOffers: offers.slice(0, 5),
          recentDeals: allDeals.slice(0, 5),
          statistics,
          employee: trader.employee
        });
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadDashboard();
    }
  }, [user]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    try {
      return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return amount;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING_VALIDATION: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
      DRAFT: 'bg-slate-100 text-slate-800',
      NEGOTIATION: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-purple-100 text-purple-800',
      SETTLED: 'bg-indigo-100 text-indigo-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-50 pb-12"
      dir={currentDir}
    >
      {/* Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${currentDir === 'rtl' ? 'sm:flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {t('trader.dashboard', 'لوحة تحكم التاجر')}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-slate-600">
                {t('common.welcome', 'مرحباً بعودتك')}، <span className="font-semibold text-slate-900">{user?.name}</span>
              </p>
              {user?.traderCode && (
                <span className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded text-sm font-mono shadow-sm">
                  {user.traderCode}
                </span>
              )}
            </div>
            {stats.employee && (
              <p className="text-sm text-slate-500 mt-1">
                 {t('trader.assignedEmployee', 'الموظف المسؤول')}: <span className="font-medium text-slate-700">{stats.employee.name} ({stats.employee.employeeCode})</span>
              </p>
            )}
          </div>
          <Link
            to={ROUTES.PUBLISH_AD}
            className={`flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-semibold ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}
          >
            <Plus className="w-5 h-5" />
            <span>{t('trader.createOffer', 'إنشاء إعلان')}</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Offers */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                       {t('trader.totalOffers', 'إجمالي الإعلانات')}
                    </p>
                    <h3 className="text-3xl font-bold text-slate-900">{stats.offers.total}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
                         <CheckCircle className="w-3 h-3" />
                         {stats.offers.active} {t('common.active', 'نشط')}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Deals */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      {t('trader.totalDeals', 'إجمالي الصفقات')}
                    </p>
                    <h3 className="text-3xl font-bold text-slate-900">{stats.deals.total}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
                          <Activity className="w-3 h-3" />
                          {stats.deals.active} {t('common.active', 'نشط')}
                       </span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <ShoppingCart className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Payments */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                       {t('trader.totalPayments', 'إجمالي المدفوعات')}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900 truncate" title={formatCurrency(stats.statistics.totalPayments)}>
                      {formatCurrency(stats.statistics.totalPayments)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2">
                      {stats.statistics.paymentCount} {t('common.payments', 'دفعة')}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Net Earnings */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                       {t('trader.netEarnings', 'صافي الأرباح')}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900 truncate" title={formatCurrency(stats.statistics.totalTraderAmount)}>
                       {formatCurrency(stats.statistics.totalTraderAmount)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2">
                      {stats.statistics.transactionCount || 0} {t('common.transactions', 'معاملة')}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts and Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Offers by Status Chart */}
          <Card>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className={`flex items-center gap-2 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <BarChart3 className="w-5 h-5 text-slate-600" />
                {t('trader.offersByStatus', 'الإعلانات حسب الحالة')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {stats.statistics.offersByStatus && stats.statistics.offersByStatus.length > 0 ? (
                <div className="space-y-4">
                  {stats.statistics.offersByStatus.map((item, index) => {
                    const total = stats.statistics.offersByStatus.reduce((sum, i) => sum + (i._count?.status || 0), 0);
                    const percentage = total > 0 ? ((item._count?.status || 0) / total) * 100 : 0;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{item.status}</span>
                          <span className="text-sm font-bold text-slate-900">{item._count?.status || 0}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`h-2.5 rounded-full ${
                              item.status === 'ACTIVE' ? 'bg-green-500' :
                              item.status === 'PENDING_VALIDATION' ? 'bg-yellow-500' :
                              item.status === 'REJECTED' ? 'bg-red-500' :
                              'bg-slate-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">{t('common.noData', 'لا توجد بيانات')}</p>
              )}
            </CardContent>
          </Card>

          {/* Deals by Status Chart */}
          <Card>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className={`flex items-center gap-2 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <PieChart className="w-5 h-5 text-slate-600" />
                {t('trader.dealsByStatus', 'الصفقات حسب الحالة')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
               {stats.statistics.dealsByStatus && stats.statistics.dealsByStatus.length > 0 ? (
                <div className="space-y-4">
                  {stats.statistics.dealsByStatus.map((item, index) => {
                    const total = stats.statistics.dealsByStatus.reduce((sum, i) => sum + (i._count?.status || 0), 0);
                    const percentage = total > 0 ? ((item._count?.status || 0) / total) * 100 : 0;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{item.status}</span>
                          <span className="text-sm font-bold text-slate-900">{item._count?.status || 0}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`h-2.5 rounded-full ${
                              item.status === 'SETTLED' ? 'bg-indigo-500' :
                              item.status === 'PAID' ? 'bg-purple-500' :
                              item.status === 'APPROVED' ? 'bg-green-500' :
                              item.status === 'NEGOTIATION' ? 'bg-blue-500' :
                              'bg-slate-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">{t('common.noData', 'لا توجد بيانات')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Offers */}
          <Card>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className={`flex items-center justify-between ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <CardTitle className={`flex items-center gap-2 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <Package className="w-5 h-5 text-slate-600" />
                  {t('trader.recentOffers', 'الإعلانات الأخيرة')}
                </CardTitle>
                <Link to={ROUTES.TRADER_OFFERS} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  {t('common.viewAll', 'عرض الكل')}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {stats.recentOffers.length > 0 ? (
                  stats.recentOffers.map((offer) => (
                    <motion.div 
                      key={offer.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => navigate(ROUTES.TRADER_OFFER_DETAILS.replace(':id', offer.id))}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{offer.title || 'Untitled Offer'}</h4>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(offer.status)}`}>
                            {offer.status}
                          </span>
                          <span className="text-xs text-slate-500">
                             {offer._count?.items || 0} {t('common.items', 'عنصر')}
                          </span>
                          {offer.totalCBM && (
                             <span className="text-xs text-slate-500">
                               {parseFloat(offer.totalCBM).toFixed(2)} CBM
                             </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-right ${currentDir === 'rtl' ? 'text-left' : ''}`}>
                        <span className="text-xs text-slate-500">
                           {new Date(offer.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                     <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                     <p>{t('trader.noOffers', 'لا توجد إعلانات حتى الان')}</p>
                     <Link to={ROUTES.PUBLISH_AD} className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                        {t('trader.createFirstOffer', 'إنشاء أول إعلان')}
                     </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Deals */}
          <Card>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className={`flex items-center justify-between ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <CardTitle className={`flex items-center gap-2 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                  {t('trader.recentDeals', 'الصفقات الأخيرة')}
                </CardTitle>
                <Link to={ROUTES.TRADER_DEALS} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  {t('common.viewAll', 'عرض الكل')}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {stats.recentDeals.length > 0 ? (
                  stats.recentDeals.map((deal) => (
                    <motion.div 
                      key={deal.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => navigate(ROUTES.TRADER_DEAL_DETAILS.replace(':id', deal.id))}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 font-mono mb-1">{deal.dealNumber || 'NO-NUMBER'}</h4>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(deal.status)}`}>
                            {deal.status}
                          </span>
                          {deal.client && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {deal.client.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-right ${currentDir === 'rtl' ? 'text-left' : ''}`}>
                         <p className="font-bold text-slate-900 text-sm">
                          {formatCurrency(deal.negotiatedAmount || 0)}
                         </p>
                         <p className="text-xs text-slate-400">
                           {new Date(deal.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                         </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                     <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                     <p>{t('trader.noDeals', 'لا توجد صفقات حتى الان')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
