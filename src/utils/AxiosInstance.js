// utils/axiosInstance.js

import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080",
  // baseURL: "http://192.168.3.118:8080",
//AWS instance
   baseURL: "http://32.236.64.240:8080",
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
    const requestUrl = config.url || "";
    const isLoginRequest = /\/user\/login(?:[?#]|$)/i.test(requestUrl);

    if (token && !isLoginRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isLoginRequest) {
      delete config.headers.Authorization;
    }

    // Get merchant slug from current URL on every request
    const isPlatformRoute =
      window.location.pathname.startsWith("/shopora-control");
    const merchantSlug = isPlatformRoute ? null : getCurrentMerchantSlug();

    if (isPlatformRoute) {
      delete config.headers["X-Merchant-Slug"];
    }

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
    const currentPath = window.location.pathname;
    const isShoporaControl = currentPath.startsWith("/shopora-control");
    const isShoporaLoginRequest =
      isShoporaControl &&
      /\/user\/login(?:[?#]|$)/i.test(error?.config?.url || "");

    // JWT expired / invalid
    if (status === 401 && isShoporaLoginRequest) {
      return Promise.reject(error);
    }

    if (status === 401 && isShoporaControl) {
      [
        "authToken",
        "user",
        "userId",
        "userRole",
        "merchantId",
        "merchantSlug",
        "merchantName",
      ].forEach((key) => localStorage.removeItem(key));
      window.location.reload();
      return Promise.reject(error);
    }

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

      if (hasAuthToken && !isShoporaControl) {
        alert("You are not authorized to access this merchant.");
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default instance;
