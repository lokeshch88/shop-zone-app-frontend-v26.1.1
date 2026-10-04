import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import HomePage from "./components/Home";
import RegisterPage from "./components/RegisterPage";
import ProfilePage from "./components/ProfilePage";
import CartPage from "./components/CartPage";
import ProductPage from "./components/ProductPage";
import PaymentPage from "./components/paymentPage";
import PaymentResultPage from "./components/PaymentResultPage";
import OrdersPage from "./components/OrderPage";
import UserManagement from "./components/UserManagement";
import ProductManagement from "./components/ProductManagement";
import CategoryManagement from "./components/CategoryManagement";
import OrderManagement from "./components/OrderManagent";
import CouponManagement from "./components/CouponManagement";
// import HomeCheck from "./components/HomeCheck";
import CheckoutSummaryPage from "./components/CheckoutSummaryPage";
import OrderDetails from "./components/OrderDetails";
import DeliveryDashboard from "./components/DeliveryDashboard";
import Footer from "./components/Footer";
import MerchantManagement from "./components/MerchantManagement";
import LandingPage from "./components/LandingPage";
import RegisterMerchant from "./components/RegisterMerchant";
import TermsAndConditions from "./components/TermsAndConditions";

function App() {
  return (
    <Router>
      <NavBar />
      <div style={{ padding: "10px 10px 60px 10px" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />
          <Route path="/store/:slug/" element={<HomePage />} />
          {/* <Route path="/check" element={<HomeCheck />} /> */}
          <Route path="/store/:slug/login" element={<LoginPage />} />
          <Route
            path="/store/:slug/admin-dashboard"
            element={<AdminDashboard />}
          />
          <Route path="/store/:slug/home" element={<HomePage />} />
          <Route path="/store/:slug/register" element={<RegisterPage />} />
          <Route path="/store/:slug/profile" element={<ProfilePage />} />
          <Route path="/store/:slug/cart" element={<CartPage />} />
          <Route path="/store/:slug/product/:id" element={<ProductPage />} />
          <Route
            path="/store/:slug/proceed-payment"
            element={<PaymentPage />}
          />
          <Route
            path="/store/:slug/payment-result"
            element={<PaymentResultPage />}
          />
          <Route path="/store/:slug/orders" element={<OrdersPage />} />
          <Route path="/store/:slug/admin/users" element={<UserManagement />} />
          <Route
            path="/store/:slug/admin/products"
            element={<ProductManagement />}
          />
          <Route
            path="/store/:slug/admin/categories"
            element={<CategoryManagement />}
          />
          <Route
            path="/store/:slug/admin/orders"
            element={<OrderManagement />}
          />
          <Route
            path="/store/:slug/admin/coupons"
            element={<CouponManagement />}
          />
          <Route
            path="/store/:slug/order/checkout"
            element={<CheckoutSummaryPage />}
          />
          <Route
            path="/store/:slug/orders/:orderId"
            element={<OrderDetails />}
          />
          <Route
            path="/store/:slug/delivery-dashboard"
            element={<DeliveryDashboard />}
          />
          <Route path="*" element={<h1>404 Not Found</h1>} />
          <Route
            path="/store/:slug/admin/merchants"
            element={<MerchantManagement />}
          />

          <Route path="/register-merchants" element={<RegisterMerchant />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
