// utils/axiosInstance.js

import axios from "axios";

const instance = axios.create({
  // baseURL: "http://localhost:8080",
  baseURL: "http://192.168.2.106:8080",
});

const getCurrentMerchantSlug = () => {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  return pathParts[1];
};

const isPublicRoute = (slug) =>
  ["login", "register", "forgot-password", "home"].includes(slug);

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Get merchant slug from current URL on every request
    const merchantSlug = getCurrentMerchantSlug();

    // Don't treat normal application routes as merchant slugs
    if (merchantSlug && !isPublicRoute(merchantSlug)) {
      config.headers["X-Merchant-Slug"] = merchantSlug;
    } else {
      delete config.headers["X-Merchant-Slug"];
    }

    return config;
  },

  (error) => Promise.reject(error),
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

let isHandlingSessionTimeout = false;

instance.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error?.response?.status;

    // JWT expired / invalid
    if (status === 401 && !isHandlingSessionTimeout) {
      isHandlingSessionTimeout = true;

      alert("Session expired. Please login again.");

      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      const redirectSlug = getCurrentMerchantSlug();
      if (redirectSlug && !isPublicRoute(redirectSlug)) {
        window.location.href = `/store/${redirectSlug}/login`;
      } else {
        window.location.href = "/login";
      }
    }

    // Merchant doesn't belong to logged-in user
    if (status === 403) {
      const hasAuthToken = !!localStorage.getItem("authToken");

      if (hasAuthToken) {
        alert("You are not authorized to access this merchant.");
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default instance;
