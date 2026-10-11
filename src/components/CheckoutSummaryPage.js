import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Divider,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  Chip,
  InputAdornment,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";

import { useParams } from "react-router-dom";
import axios from "../utils/AxiosInstance";
import { fetchLatLong } from "../utils/AddressUtils";
import { validateCartForStore } from "../utils/MerchantCartValidation";

const getAddressList = (data) => {
  const candidates = [
    data,
    data?.result,
    data?.data,
    data?.addresses,
    data?.result?.addresses,
    data?.data?.addresses,
  ];
  return candidates.find(Array.isArray) || [];
};

const CheckoutSummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("authToken");
  const userId = location.state?.userId || localStorage.getItem("userId");
  const stateItems = location.state?.items;
  const items =
    Array.isArray(stateItems) && stateItems.length
      ? stateItems
      : (() => {
          try {
            const savedItems = JSON.parse(localStorage.getItem("cart") || "[]");
            return Array.isArray(savedItems) ? savedItems : [];
          } catch {
            return [];
          }
        })();

  const [cartItems, setCartItems] = useState(items);
  const [totalAmount, setTotalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [deliveryFee] = useState(40);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [cashExtraCharge, setCashExtraCharge] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkoutStoreValidated, setCheckoutStoreValidated] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressErrors, setAddressErrors] = useState({});
  const [addressForm, setAddressForm] = useState({
    addressLine: "",
    addressLine2: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    phone: "",
    name: "",
  });

  // Coupon Success Dialog
  const [couponDialog, setCouponDialog] = useState({
    open: false,
    message: "",
    savedAmount: 0,
    percentage: 0,
  });

  // ==================== FORMAT ADDRESS ====================
  const formatAddress = (addr) => {
    if (!addr) return "";
    return [
      addr.addressLine,
      addr.addressLine2,
      addr.landmark,
      addr.city,
      addr.district,
      addr.state,
      addr.country,
      addr.pincode ? `Pincode: ${addr.pincode}` : "",
    ]
      .filter(Boolean)
      .join(", ");
  };

  const { slug } = useParams();

  useEffect(() => {
    let isCurrent = true;
    const verifyCheckoutStore = async () => {
      if (!token || !userId) {
        navigate(`/store/${slug}/cart`, {
          replace: true,
          state: { checkoutWarning: "Please sign in to continue checkout." },
        });
        return;
      }

      try {
        await validateCartForStore({
          axios,
          slug,
          items: cartItems,
          registeredMerchantId: localStorage.getItem("merchantId"),
        });
        if (isCurrent) setCheckoutStoreValidated(true);
      } catch (error) {
        if (isCurrent) {
          navigate(`/store/${slug}/cart`, {
            replace: true,
            state: {
              checkoutWarning:
                error?.response?.data?.message ||
                error?.message ||
                "This cart could not be verified for the current store.",
              invalidCartItems: error?.invalidCartItems || [],
            },
          });
        }
      }
    };

    verifyCheckoutStore();
    return () => {
      isCurrent = false;
    };
  }, [cartItems, navigate, slug, token, userId]);

  const getLocalPhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.slice(0, 10);
  };

  const updateAddressField = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    setAddressErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const resetAddressForm = () => {
    setAddressForm({
      addressLine: "",
      addressLine2: "",
      landmark: "",
      city: "",
      district: "",
      state: "",
      country: "India",
      pincode: "",
      phone: "",
      name: "",
    });
    setAddressErrors({});
    setEditingAddressId(null);
  };

  const openAddressDialog = (address = null) => {
    if (address) {
      setAddressForm({
        addressLine: address.addressLine || "",
        addressLine2: address.addressLine2 || "",
        landmark: address.landmark || "",
        city: address.city || "",
        district: address.district || "",
        state: address.state || "",
        country: address.country || "India",
        pincode: address.pincode || "",
        phone: getLocalPhone(address.phone),
        name: address.name || "",
      });
      setAddressErrors({});
      setEditingAddressId(address.id || null);
    } else {
      resetAddressForm();
    }
    setAddressDialogOpen(true);
  };

  const loadAddresses = async () => {
    if (!userId || !token) {
      setAddresses([]);
      setSelectedAddress(null);
      return;
    }

    try {
      const res = await axios.get(`/address/user/${userId}`);
      const addrList = getAddressList(res.data);
      setAddresses(addrList);

      if (!addrList.length) {
        setSelectedAddress(null);
        setSelectedAddressIndex(0);
        return;
      }

      const selectedId = selectedAddress?.id ?? selectedAddress?.addressId;
      const fallbackAddress =
        addrList.find(
          (address) =>
            String(address.id ?? address.addressId) === String(selectedId),
        ) ||
        addrList[selectedAddressIndex] ||
        addrList[0];
      setSelectedAddress(fallbackAddress);
      setSelectedAddressIndex(addrList.indexOf(fallbackAddress));
    } catch (error) {
      console.error("Failed to fetch addresses", error);
      setAddresses([]);
      setSelectedAddress(null);
    }
  };

  const saveAddress = async () => {
    if (!userId) {
      alert("Please login to save an address.");
      return;
    }

    const localPhone = getLocalPhone(addressForm.phone);
    const pincodeDigits = String(addressForm.pincode || "").replace(/\D/g, "");
    const errors = {
      name: addressForm.name.trim() ? "" : "Name is required.",
      addressLine: addressForm.addressLine.trim()
        ? ""
        : "Address line is required.",
      city: addressForm.city.trim() ? "" : "City is required.",
      district: addressForm.district.trim() ? "" : "District is required.",
      state: addressForm.state.trim() ? "" : "State is required.",
      pincode: /^\d{6}$/.test(pincodeDigits)
        ? ""
        : "Enter a valid 6-digit PIN code.",
      phone: /^\d{10}$/.test(localPhone)
        ? ""
        : "Enter a valid 10-digit phone number.",
    };
    setAddressErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    try {
      const addressPayload = {
        ...addressForm,
        phone: localPhone,
        pincode: pincodeDigits,
      };
      const coords = await fetchLatLong(addressPayload);
      if (!coords) {
        alert("Could not find latitude and longitude for the entered address.");
        return;
      }

      const payload = {
        ...addressPayload,
        userId: Number(userId),
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      if (editingAddressId) {
        await axios.put(`/address/${editingAddressId}`, payload);
      } else {
        await axios.post("/address/save", payload);
      }

      setAddressDialogOpen(false);
      resetAddressForm();
      await loadAddresses();
    } catch (error) {
      console.error("Failed to save address", error);
      alert("Unable to save address. Please try again.");
    }
  };

  const deleteAddress = async (addressId, index) => {
    if (!addressId) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this address?",
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`/address/${addressId}`);
      const updatedAddresses = addresses.filter((_, i) => i !== index);
      setAddresses(updatedAddresses);

      if (selectedAddress?.id === addressId) {
        setSelectedAddress(updatedAddresses[0] || null);
        setSelectedAddressIndex(0);
      }
    } catch (error) {
      console.error("Failed to delete address", error);
      alert("Failed to delete address.");
    }
  };

  // ==================== CALCULATIONS ====================
  useEffect(() => {
    if (cartItems.length > 0) {
      const total = cartItems.reduce((sum, item) => {
        const price = item.price || item.variant?.price || 0;
        return sum + price * (item.quantity || 1);
      }, 0);
      setTotalAmount(total);
      setFinalAmount(total + deliveryFee - discount);
    }
  }, [cartItems, discount, deliveryFee]);

  // ==================== FETCH ADDRESSES ====================
  useEffect(() => {
    loadAddresses();
  }, [userId]);

  // ==================== DELIVERY DATE ====================
  useEffect(() => {
    if (!selectedAddress?.id) return;

    const fetchDeliveryDate = async () => {
      try {
        const res = await axios.get(
          `/checkout/delivery/estimate/${selectedAddress.id}`,
        );
        setDeliveryDate(
          res.data?.estimatedDate
            ? new Date(res.data.estimatedDate).toDateString()
            : "3-5 days",
        );
      } catch {
        setDeliveryDate("3-5 days");
      }
    };
    fetchDeliveryDate();
  }, [selectedAddress]);

  // ==================== APPLY COUPON ====================
  const applyCoupon = async () => {
    if (!coupon.trim()) return;

    try {
      const res = await axios.get("/coupons/all");

      const coupons = res.data?.result || [];
      const foundCoupon = coupons.find(
        (c) => c.name?.toUpperCase() === coupon.trim().toUpperCase(),
      );

      if (!foundCoupon) {
        alert("Invalid coupon code");
        return;
      }

      if (foundCoupon.isActive !== "true") {
        alert("This coupon is not active");
        return;
      }

      if (
        foundCoupon.minOrderValue &&
        totalAmount < foundCoupon.minOrderValue
      ) {
        alert(`Minimum order value of ₹${foundCoupon.minOrderValue} required`);
        return;
      }

      const today = new Date();
      const validTo = foundCoupon.validTo
        ? new Date(foundCoupon.validTo)
        : null;

      if (validTo && today > validTo) {
        alert("This coupon has expired");
        return;
      }

      const percentage = foundCoupon.percentageOff || 0;
      const percentageDiscount = Math.round((totalAmount * percentage) / 100);
      const maxDiscount = foundCoupon.amount || 0;
      const savedAmount = Math.min(percentageDiscount, maxDiscount);

      if (savedAmount <= 0) {
        alert("Coupon not applicable on this order");
        return;
      }

      setDiscount(savedAmount);
      setCouponDialog({
        open: true,
        message: `Coupon "${foundCoupon.name}" applied successfully!`,
        savedAmount,
        percentage,
      });
    } catch (error) {
      console.error("Coupon error:", error);
      alert("Failed to apply coupon. Please try again.");
    }
  };

  const closeCouponDialog = () => {
    setCouponDialog({ ...couponDialog, open: false });
    setCoupon("");
  };

  // ==================== PAYMENT METHOD NORMALIZATION ====================
  const normalizePaymentCode = (value) =>
    String(value || "")
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");

  const normalizePaymentMethod = (method) => {
    if (typeof method === "string") {
      const value = method.trim();
      return {
        code: value,
        name: value,
        enabled: true,
        active: true,
      };
    }

    const rawName =
      method?.name ||
      method?.label ||
      method?.type ||
      method?.method ||
      method?.code ||
      method?.id ||
      "ONLINE";

    return {
      ...method,
      code:
        method?.code ||
        method?.type ||
        method?.name ||
        method?.method ||
        method?.id ||
        rawName,
      name: rawName,
    };
  };

  // ==================== FETCH PAYMENT METHODS ====================
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        let paymentList = [];

        try {
          const res = await axios.get("/store/payment-methods");
          const payload = res.data;
          paymentList = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.result)
              ? payload.result
              : Array.isArray(payload?.data)
                ? payload.data
                : [];
        } catch {
          // try next endpoint
        }

        const activeMethods = paymentList
          .map((method) => normalizePaymentMethod(method))
          .filter(
            (method) => method.enabled !== false && method.active !== false,
          );

        setPaymentMethods(activeMethods);

        if (activeMethods.length > 0) {
          const defaultMethod =
            activeMethods.find((m) => m.defaultMethod || m.default) ||
            activeMethods[0];

          const selectedValue = String(
            defaultMethod.code ||
              defaultMethod.type ||
              defaultMethod.name ||
              defaultMethod.method ||
              defaultMethod.id ||
              "ONLINE",
          ).toUpperCase();

          setSelectedPaymentMethod(selectedValue);
          setCashExtraCharge(
            Number(
              defaultMethod.extraCharge ??
                defaultMethod.cashExtraCharge ??
                defaultMethod.surcharge ??
                0,
            ) || 0,
          );
        }
      } catch (error) {
        console.error("Failed to fetch payment methods", error);
      }
    };

    fetchPaymentMethods();
  }, [token]);

  // ==================== PROCEED TO PAYMENT ====================
  const handleProceed = async () => {
    if (!selectedAddress) {
      alert("Please select a delivery address");
      return;
    }

    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }

    const methodKey = normalizePaymentCode(selectedPaymentMethod);
    const isCashPayment =
      methodKey === "CASH" ||
      methodKey === "CASH_ON_DELIVERY" ||
      methodKey === "COD";
    const isOnlinePayment =
      methodKey === "ONLINE" ||
      methodKey === "RAZORPAY" ||
      methodKey === "CARD" ||
      methodKey === "UPI" ||
      methodKey === "NETBANKING" ||
      methodKey === "WALLET";

    const payableTotal = Number(
      (finalAmount + (isCashPayment ? cashHandlingFee : 0)).toFixed(2),
    );

    const orderPayload = {
      orderDateTime: new Date().toISOString(),
      products: cartItems.map((item) => ({
        id: item.productId ?? item.id ?? null,
        name: item.name,
        price: Number(item.price || item.variant?.price || 0),
        quantity: Number(item.quantity || 1),
        variantId: item.variant?.id ?? null,
        variantName: item.variant?.name ?? null,
        sku: item.sku ?? null,
      })),
      totalAmount: payableTotal,
      items: cartItems.map((item) => ({
        productId: item.productId ?? item.id ?? null,
        variantId: item.variant?.id ?? null,
        name: item.name,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || item.variant?.price || 0),
        sku: item.sku ?? null,
      })),
      addressId: selectedAddress.id,
      paymentMethod: methodKey,
      paymentStatus: "PENDING",
      paymentId: null,
      paymentSignature: null,
      currency: "INR",
      transactionId: null,
      paymentGateway: isCashPayment
        ? "CASH"
        : isOnlinePayment
          ? "RAZORPAY"
          : "OTHER",
      paymentError: null,
      paymentDateTime: new Date().toISOString(),
      couponCodeApplied: coupon || null,
      couponDiscount: Number(discount || 0),
      shippingCost: Number(deliveryFee || 0),
      taxAmount: 0,
      estimatedDeliveryDate: deliveryDate || null,
      totalItems: cartItems.reduce(
        (sum, item) => sum + Number(item.quantity || 1),
        0,
      ),
    };

    try {
      setPaymentLoading(true);

      if (isCashPayment) {
        const cashOrderRes = await axios.post(
          `/orders/user/${userId}`,
          orderPayload,
        );

        const orderIdBackend =
          cashOrderRes?.data?.orderId || cashOrderRes?.data?.id;

        localStorage.removeItem("cart");
        navigate(`/store/${slug}/payment-result`, {
          state: {
            orderId: orderIdBackend,
            amount: payableTotal,
            paymentMethod: methodKey,
            paymentStatus: "CONFIRMED",
            message:
              "Cash on delivery selected. Your order is placed successfully.",
          },
        });
        return;
      }

      if (isOnlinePayment) {
        const orderRes = await axios.post(
          `/orders/user/${userId}`,
          orderPayload,
        );

        const orderIdBackend = orderRes.data.orderId;

        const razorpayRes = await axios.post("/payments/create-order", {
          amount: payableTotal * 100,
          currency: "INR",
          receipt: String(orderIdBackend),
        });

        const razorpayOrderId = razorpayRes.data.orderId;

        const res = await loadRazorpayScript();
        if (!res) {
          alert("Failed to load Razorpay");
          return;
        }

        const options = {
          key: "rzp_test_iZ3GdWtwylNcFu",
          amount: payableTotal * 100,
          currency: "INR",
          name: "Shopora",
          description: "Order Payment",
          order_id: razorpayOrderId,
          handler: async function (response) {
            try {
              const verifyRes = await axios.post("/payments/verify", {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                id: orderIdBackend,
                paymentMethod: methodKey,

                paymentStatus: "PAID",
                paymentGateway: "RAZORPAY",
                currency: "INR",
                paymentDateTime: new Date().toISOString(),
              });

              if (verifyRes.status === 200) {
                localStorage.removeItem("cart");
                navigate(`/store/${slug}/payment-result`, {
                  state: {
                    orderId: orderIdBackend,
                    amount: payableTotal,
                    paymentId: response.razorpay_payment_id,
                    paymentMethod: methodKey,
                    paymentStatus: "PAID",
                  },
                });
              }
            } catch (error) {
              console.error("Razorpay verify failed", error);
              alert("Payment verification failed. Please contact support.");
            }
          },
          prefill: {
            name: "Test User",
            email: "test@example.com",
            contact: "9999999999",
          },
          theme: { color: "#a1d219" },
        };

        new window.Razorpay(options).open();
        return;
      }

      alert(
        "This payment method is not configured yet. Please choose Online or Cash.",
      );
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const selectedPaymentMeta =
    paymentMethods.find(
      (pm) =>
        normalizePaymentCode(pm.code || pm.type || pm.name || pm.method) ===
        normalizePaymentCode(selectedPaymentMethod),
    ) ||
    paymentMethods[0] ||
    {};

  const cashHandlingFee = Number(
    selectedPaymentMeta.extraCharge ??
      selectedPaymentMeta.cashExtraCharge ??
      selectedPaymentMeta.surcharge ??
      0,
  );

  const displayedTotal = Number(
    (
      finalAmount +
      (normalizePaymentCode(selectedPaymentMethod) === "CASH" ||
      normalizePaymentCode(selectedPaymentMethod) === "CASH_ON_DELIVERY" ||
      normalizePaymentCode(selectedPaymentMethod) === "COD"
        ? cashHandlingFee
        : 0)
    ).toFixed(2),
  );

  if (!checkoutStoreValidated) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <Typography color="text.secondary">
          Verifying store and cart before checkout...
        </Typography>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1.5, sm: 2, md: 3 } }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" }, lineHeight: 1.2 }}
        >
          Checkout Summary
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: { xs: 1.5, sm: 3 }, mt: 0.5 }}
        >
          Review your order, update delivery details, and complete payment.
        </Typography>

        <Grid
          container
          spacing={{ xs: 1.5, sm: 2, md: 3 }}
          alignItems="flex-start"
        >
          <Grid size={{ xs: 12, md: 8 }}>
            <Card
              sx={{
                mb: { xs: 1.5, md: 3 },
                borderRadius: 2,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Delivery Address
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => openAddressDialog()}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  >
                    + Add Address
                  </Button>
                </Box>

                {addresses.length === 0 ? (
                  <Box
                    sx={{
                      border: "2px dashed #d0d7de",
                      borderRadius: 3,
                      p: 3,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      No saved addresses yet.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => openAddressDialog()}
                    >
                      Add your first address
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      gap: { xs: 1, sm: 1.5 },
                      overflowX: "auto",
                      pb: 0.5,
                      scrollSnapType: "x mandatory",
                      overscrollBehaviorX: "contain",
                      "&::-webkit-scrollbar": {
                        height: { xs: "4px", sm: "6px" },
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#d5d9e0",
                        borderRadius: "999px",
                      },
                    }}
                  >
                    {addresses.map((addr, index) => (
                      <Card
                        key={addr.id ?? addr.addressId ?? index}
                        onClick={() => {
                          setSelectedAddressIndex(index);
                          setSelectedAddress(addr);
                        }}
                        sx={{
                          flex: {
                            xs: "0 0 min(78vw, 285px)",
                            sm: "0 0 270px",
                          },
                          minWidth: 0,
                          height: { xs: 120, sm: 150 },
                          cursor: "pointer",
                          border:
                            selectedAddressIndex === index
                              ? "2px solid #1976d2"
                              : "1px solid #e5e7eb",
                          backgroundColor:
                            selectedAddressIndex === index ? "#eef6ff" : "#fff",
                          transition: "all 0.2s ease",
                          borderRadius: 2,
                          position: "relative",
                          scrollSnapAlign: "start",
                        }}
                      >
                        <CardContent
                          sx={{
                            height: "100%",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            p: { xs: 1, sm: 1.25 },
                            "&:last-child": { pb: { xs: 1, sm: 1.25 } },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 0.5,
                              mb: 0.5,
                            }}
                          >
                            <Chip
                              label={`Address ${index + 1}`}
                              size="small"
                              color={
                                selectedAddressIndex === index
                                  ? "primary"
                                  : "default"
                              }
                            />
                            <Box
                              sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}
                            >
                              <Button
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAddressDialog(addr);
                                }}
                                sx={{
                                  minWidth: 0,
                                  px: 0.5,
                                  py: 0.25,
                                  fontSize: "0.68rem",
                                }}
                              >
                                View & Edit
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAddress(
                                    addr.id ?? addr.addressId,
                                    index,
                                  );
                                }}
                                sx={{
                                  minWidth: 0,
                                  px: 0.5,
                                  py: 0.25,
                                  fontSize: "0.72rem",
                                }}
                              >
                                Delete
                              </Button>
                            </Box>
                          </Box>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            noWrap
                            sx={{ mt: 0.5, lineHeight: 1.25 }}
                          >
                            {addr.name || "Customer"}
                          </Typography>
                          {addr.phone && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              sx={{ mt: 0.25, lineHeight: 1.25 }}
                            >
                              +91 {getLocalPhone(addr.phone)}
                            </Typography>
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 0.5,
                              lineHeight: 1.4,
                              fontSize: { xs: "0.78rem", sm: "0.85rem" },
                              overflowWrap: "anywhere",
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 3,
                              overflow: "hidden",
                            }}
                          >
                            {formatAddress(addr)}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}

                    <Card
                      onClick={() => openAddressDialog()}
                      sx={{
                        flex: {
                          xs: "0 0 min(70vw, 250px)",
                          sm: "0 0 220px",
                        },
                        minWidth: 0,
                        height: { xs: 120, sm: 150 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px dashed #1976d2",
                        cursor: "pointer",
                        backgroundColor: "#f8fbff",
                        borderRadius: 2,
                        scrollSnapAlign: "start",
                      }}
                    >
                      <CardContent sx={{ textAlign: "center", p: 1.25 }}>
                        <Typography
                          color="primary"
                          fontWeight={700}
                          sx={{ fontSize: { xs: "0.78rem", sm: "0.9rem" } }}
                        >
                          + Add New Address
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {selectedAddress && (
                  <Typography
                    sx={{
                      mt: { xs: 0.75, sm: 1 },
                      color: "text.secondary",
                      fontSize: { xs: "0.78rem", sm: "0.9rem" },
                    }}
                  >
                    Estimated Delivery By:{" "}
                    <strong>{deliveryDate || "3-5 days"}</strong>
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: { xs: 1.5, md: 3 },
                borderRadius: 2,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Apply Coupon
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <TextField
                    size="small"
                    label="Coupon Code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    sx={{ flex: 1, minWidth: 220 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            onClick={applyCoupon}
                            sx={{ minWidth: 0, px: 1, textTransform: "none" }}
                          >
                            Apply
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: { xs: 1.5, md: 3 },
                borderRadius: 2,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Payment Method
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {paymentMethods.map((method) => {
                    const methodKey = String(
                      method.code ||
                        method.type ||
                        method.name ||
                        method.method ||
                        method.id ||
                        "ONLINE",
                    ).toUpperCase();

                    return (
                      <Button
                        key={methodKey}
                        variant={
                          selectedPaymentMethod === methodKey
                            ? "contained"
                            : "outlined"
                        }
                        onClick={() => setSelectedPaymentMethod(methodKey)}
                        sx={{
                          minWidth: 140,
                          borderRadius: 2,
                          py: 1.25,
                          textTransform: "none",
                          flex: 1,
                          backgroundColor:
                            selectedPaymentMethod === methodKey
                              ? "primary.main"
                              : "transparent",
                          color:
                            selectedPaymentMethod === methodKey
                              ? "white"
                              : "primary.main",
                          borderColor:
                            selectedPaymentMethod === methodKey
                              ? "transparent"
                              : "rgba(25, 118, 210, 0.35)",
                        }}
                      >
                        {method.name || methodKey}
                        {methodKey === "CASH" ||
                        methodKey === "CASH_ON_DELIVERY" ||
                        methodKey === "COD"
                          ? " (COD)"
                          : ""}
                      </Button>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                position: { md: "sticky" },
                top: 24,
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Order Summary
                </Typography>

                <Stack
                  spacing={{ xs: 1, md: 1.5 }}
                  sx={{ my: { xs: 1.25, md: 2 } }}
                >
                  {cartItems.map((item, index) => {
                    const price = item.price || item.variant?.price || 0;
                    return (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          {item.name} × {item.quantity}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          ₹{(price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>

                <Divider sx={{ my: { xs: 1.25, md: 2 } }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography>₹{totalAmount.toFixed(2)}</Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">Delivery Fee</Typography>
                  <Typography>₹{deliveryFee}</Typography>
                </Box>
                {discount > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography color="success.main">Discount</Typography>
                    <Typography color="success.main">− ₹{discount}</Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">
                    Cash Extra Charge
                  </Typography>
                  <Typography>₹{cashExtraCharge}</Typography>
                </Box>

                <Divider sx={{ my: { xs: 1.25, md: 2 } }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    ₹{displayedTotal.toFixed(2)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleProceed}
                  disabled={paymentLoading}
                  sx={{ borderRadius: 2, py: 1.4, fontWeight: 700 }}
                >
                  {paymentLoading ? "Processing..." : "Proceed to Payment"}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { mx: 1, borderRadius: 2 } }}
      >
        <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: 1.5, fontSize: "1.1rem" }}>
          {editingAddressId ? "Edit Address" : "Add New Address"}
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
          <Grid container spacing={{ xs: 1.25, sm: 2 }} sx={{ mt: 0 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                required
                value={addressForm.name}
                error={Boolean(addressErrors.name)}
                helperText={addressErrors.name}
                onChange={(e) => updateAddressField("name", e.target.value)}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Address Line"
                required
                value={addressForm.addressLine}
                error={Boolean(addressErrors.addressLine)}
                helperText={addressErrors.addressLine}
                onChange={(e) =>
                  updateAddressField("addressLine", e.target.value)
                }
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Address Line 2"
                value={addressForm.addressLine2}
                onChange={(e) =>
                  updateAddressField("addressLine2", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="City"
                required
                value={addressForm.city}
                error={Boolean(addressErrors.city)}
                helperText={addressErrors.city}
                onChange={(e) => updateAddressField("city", e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="District"
                required
                value={addressForm.district}
                error={Boolean(addressErrors.district)}
                helperText={addressErrors.district}
                onChange={(e) => updateAddressField("district", e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="State"
                required
                value={addressForm.state}
                error={Boolean(addressErrors.state)}
                helperText={addressErrors.state}
                onChange={(e) => updateAddressField("state", e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Pincode"
                required
                value={addressForm.pincode}
                error={Boolean(addressErrors.pincode)}
                helperText={addressErrors.pincode}
                inputProps={{ inputMode: "numeric", maxLength: 6 }}
                onChange={(e) =>
                  updateAddressField(
                    "pincode",
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Phone Number"
                type="tel"
                required
                value={addressForm.phone}
                error={Boolean(addressErrors.phone)}
                helperText={addressErrors.phone}
                inputProps={{ inputMode: "numeric", maxLength: 10 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography color="text.disabled" fontWeight={700}>
                        +91
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                onChange={(e) =>
                  updateAddressField(
                    "phone",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 1.5, pt: 0.5 }}>
          <Button onClick={() => setAddressDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={saveAddress}>
            Save Address
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={couponDialog.open} onClose={closeCouponDialog}>
        <DialogTitle>Coupon Applied Successfully!</DialogTitle>
        <DialogContent>
          <Typography>{couponDialog.message}</Typography>
          <Typography sx={{ mt: 2 }}>
            You saved <strong>₹{couponDialog.savedAmount}</strong> (
            {couponDialog.percentage}% off)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCouponDialog} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CheckoutSummaryPage;
