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

const CheckoutSummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("authToken");
  const { userId, items = [] } = location.state || {};

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
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    addressLine: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
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

  const resetAddressForm = () => {
    setAddressForm({
      addressLine: "",
      city: "",
      district: "",
      state: "",
      country: "India",
      pincode: "",
    });
    setEditingAddressId(null);
  };

  const openAddressDialog = (address = null) => {
    if (address) {
      setAddressForm({
        addressLine: address.addressLine || "",
        city: address.city || "",
        district: address.district || "",
        state: address.state || "",
        country: address.country || "India",
        pincode: address.pincode || "",
      });
      setEditingAddressId(address.id || null);
    } else {
      resetAddressForm();
    }
    setAddressDialogOpen(true);
  };

  const loadAddresses = async () => {
    if (!userId) return;

    try {
      const res = await axios.get(`/address/user/${userId}`);
      const addrList = res.data || [];
      setAddresses(addrList);

      if (!addrList.length) {
        setSelectedAddress(null);
        setSelectedAddressIndex(0);
        return;
      }

      const fallbackAddress = addrList[selectedAddressIndex] || addrList[0];
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

    const requiredFields = [
      addressForm.addressLine,
      addressForm.city,
      addressForm.district,
      addressForm.state,
      addressForm.pincode,
    ];

    if (requiredFields.some((value) => !String(value).trim())) {
      alert("Please fill in all address details.");
      return;
    }

    try {
      const coords = await fetchLatLong(addressForm);
      if (!coords) {
        alert("Could not find latitude and longitude for the entered address.");
        return;
      }

      const payload = {
        ...addressForm,
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
          theme: { color: "#1976d2" },
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

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Checkout Summary
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Review your order, update delivery details, and complete payment.
        </Typography>

        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                mb: 3,
                borderRadius: 4,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
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
                      gap: 2,
                      overflowX: "auto",
                      pb: 1,
                      "&::-webkit-scrollbar": { height: "8px" },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#d5d9e0",
                        borderRadius: "999px",
                      },
                    }}
                  >
                    {addresses.map((addr, index) => (
                      <Card
                        key={addr.id || index}
                        onClick={() => {
                          setSelectedAddressIndex(index);
                          setSelectedAddress(addr);
                        }}
                        sx={{
                          minWidth: { xs: 220, sm: 240 },
                          flexShrink: 0,
                          cursor: "pointer",
                          border:
                            selectedAddressIndex === index
                              ? "2px solid #1976d2"
                              : "1px solid #e5e7eb",
                          backgroundColor:
                            selectedAddressIndex === index ? "#eef6ff" : "#fff",
                          transition: "all 0.2s ease",
                          borderRadius: 3,
                          position: "relative",
                        }}
                      >
                        <CardContent sx={{ p: 2.2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
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
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Button
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAddressDialog(addr);
                                }}
                                sx={{ minWidth: 0, px: 1 }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAddress(addr.id, index);
                                }}
                                sx={{ minWidth: 0, px: 1 }}
                              >
                                Delete
                              </Button>
                            </Box>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ lineHeight: 1.6, fontSize: "0.88rem" }}
                          >
                            {formatAddress(addr)}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}

                    <Card
                      onClick={() => openAddressDialog()}
                      sx={{
                        minWidth: 200,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px dashed #1976d2",
                        cursor: "pointer",
                        backgroundColor: "#f8fbff",
                        borderRadius: 3,
                      }}
                    >
                      <CardContent sx={{ textAlign: "center", p: 2 }}>
                        <Typography
                          color="primary"
                          fontWeight={700}
                          sx={{ fontSize: "0.92rem" }}
                        >
                          + Add New Address
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {selectedAddress && (
                  <Typography
                    sx={{ mt: 2, color: "text.secondary", fontSize: "0.9rem" }}
                  >
                    Estimated Delivery By:{" "}
                    <strong>{deliveryDate || "3-5 days"}</strong>
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: 3,
                borderRadius: 4,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
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
                mb: 3,
                borderRadius: 4,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
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

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                position: { md: "sticky" },
                top: 24,
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Order Summary
                </Typography>

                <Stack spacing={1.5} sx={{ my: 2 }}>
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

                <Divider sx={{ my: 2 }} />

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

                <Divider sx={{ my: 2 }} />

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
      >
        <DialogTitle>
          {editingAddressId ? "Edit Address" : "Add New Address"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line"
                value={addressForm.addressLine}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    addressLine: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={addressForm.city}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="District"
                value={addressForm.district}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    district: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={addressForm.state}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, state: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pincode"
                value={addressForm.pincode}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    pincode: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
