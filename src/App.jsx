import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import './App.css'
import { ROUTES } from './routes'
import NotificationPoll from "./components/NotificationPoll";

import Home from './pages/Home'
import ProductDetails from './pages/ProductDetails'
import LogIn from './pages/Login'
import SignUp from "./pages/SignUp";
import TermsPoliciesPage from "./pages/TermsPoliciesPage";
import Notification from "./pages/Notification";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import OrderCheckout from "./pages/OrderCheckout";
import OrdersPage from "./pages/OrdersPage";
import ProductsListPage from "./pages/ProductsListPage";
import CategoryPage from "./pages/CategoryPage";
import OrderCheckoutPageTwo from "./pages/OrderCheckoutPageTwo";
import PaymentPageOne from "./pages/PaymentPageOne";
import OrderTrackingCardPage from "./pages/OrderTrackingCardPage";
import SignupBankInfoFormPage from "./pages/SignupBankInfoFormPage";
import Seller from "./pages/Seller";
import SellerProductsPage from "./pages/SellerProductsPage";
import PublishAdPage from "./pages/PublishAdPage";
import RequestSent from "./pages/RequestSent";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import TraderDashboard from "./pages/trader/TraderDashboard";
import TraderOffers from "./pages/trader/TraderOffers";
import TraderDeals from "./pages/trader/TraderDeals";
import TraderViewOffer from "./pages/trader/TraderViewOffer";
import TraderViewDeal from "./pages/trader/TraderViewDeal";
import NegotiationsPage from "./pages/NegotiationsPage";
import NegotiationDetailPage from "./pages/NegotiationDetailPage";
import ClientPriceQuotePage from "./pages/ClientPriceQuotePage";
import DealCartPage from "./pages/DealCartPage";
//new
function AppContent() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  console.log("AppContent Rendered. Path:", location.pathname);
  
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.HOME_ALT} element={<Home />} />
      <Route path={`${ROUTES.PRODUCT_DETAILS}/:id`} element={<ProductDetails />} />
      <Route path={`${ROUTES.OFFER_DETAILS}/:id`} element={<ProductDetails />} />
      <Route path={ROUTES.LOGIN} element={<LogIn />} />
      <Route path={ROUTES.MULTI_LOGIN} element={<LogIn />} />
      <Route path={ROUTES.SIGNUP} element={<SignUp />} />
      <Route path={ROUTES.TERMS_AND_POLICIES} element={<TermsPoliciesPage />} />
      <Route path={ROUTES.NOTIFICATION} element={<Notification />} />
      <Route path={ROUTES.COMPANY_PROFILE} element={<CompanyProfilePage />} />
      <Route path={`${ROUTES.COMPANY_PROFILE}/:traderId`} element={<CompanyProfilePage />} />
      <Route path={ROUTES.ORDER_CHECKOUT} element={<OrderCheckout />} />
      <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
      <Route path={ROUTES.PRODUCTS_LIST} element={<ProductsListPage />} />
      <Route path={`${ROUTES.CATEGORY}/:categoryId`} element={<CategoryPage />} />
      <Route path={ROUTES.ORDER_CHECKOUT_TWO} element={<OrderCheckoutPageTwo />} />
      <Route path={ROUTES.PAYMENT_ONE_DEAL} element={<PaymentPageOne />} />
      <Route path={ROUTES.PAYMENT_ONE} element={<PaymentPageOne />} />
      <Route path={`${ROUTES.ORDER_TRACKING}/:id`} element={<OrderTrackingCardPage />} />
      <Route path={ROUTES.SIGNUP_BANK_INFO} element={<SignupBankInfoFormPage />} />
      <Route path={ROUTES.SELLER} element={<Seller />} />
      <Route path={`${ROUTES.SELLER_PRODUCTS}/:sellerId`} element={<SellerProductsPage />} />
      <Route path={ROUTES.PUBLISH_AD} element={<ProtectedRoute allowedRoles={['TRADER']}><PublishAdPage /></ProtectedRoute>} />
      <Route path={ROUTES.TRADER_DASHBOARD} element={<ProtectedRoute allowedRoles={['TRADER']}><TraderDashboard /></ProtectedRoute>} />
      <Route path={ROUTES.TRADER_OFFERS} element={<ProtectedRoute allowedRoles={['TRADER']}><TraderOffers /></ProtectedRoute>} />
      <Route path={ROUTES.TRADER_OFFER_DETAILS} element={<ProtectedRoute allowedRoles={['TRADER']}><TraderViewOffer /></ProtectedRoute>} />
      <Route path={ROUTES.TRADER_DEALS} element={<ProtectedRoute allowedRoles={['TRADER']}><TraderDeals /></ProtectedRoute>} />
      <Route path={ROUTES.TRADER_DEAL_DETAILS} element={<ProtectedRoute allowedRoles={['TRADER', 'EMPLOYEE']}><TraderViewDeal /></ProtectedRoute>} />
      <Route path={ROUTES.MODERATOR_DASHBOARD} element={<ProtectedRoute allowedRoles={['MODERATOR']}><ModeratorDashboard /></ProtectedRoute>} />
      <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
      <Route path={ROUTES.REQUEST_SENT} element={<RequestSent />} />
      <Route path={ROUTES.NEGOTIATIONS} element={<NegotiationsPage />} />
      <Route path={`${ROUTES.NEGOTIATION_DETAIL}/:dealId`} element={<NegotiationDetailPage />} />
      <Route path={`${ROUTES.CLIENT_QUOTE}/:dealId`} element={<ClientPriceQuotePage />} />
      <Route path={ROUTES.DEAL_CART} element={<DealCartPage />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <>
      <AppContent />
      <Toaster richColors position="top-center" />
      <NotificationPoll />
    </>
  );
}

export default App
