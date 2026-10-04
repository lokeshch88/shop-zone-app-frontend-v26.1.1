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
  CircularProgress,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const CheckoutSummaryPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { orderId } = state || {};

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [deliveryFee] = useState(50);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  useEffect(() => {
    const fetchAddresses = async () => {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      try {
        const res = await axios.get(
          `http://localhost:8080/address/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setAddresses(res.data || []);
      } catch (error) {
        console.error("Failed to fetch addresses", error);
      }
    };

    fetchAddresses();
  }, []);

  const formatAddress = (addr) => {
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

  // === Fetch order details ===
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(`http://localhost:8080/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = res.data;
        setOrder(data);
        setCartItems(data.items || []);
        setTotalAmount(data.totalAmount || 0);
        setFinalAmount((data.totalAmount || 0) + deliveryFee);
      } catch (err) {
        console.error("Failed to load order summary:", err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, deliveryFee]);

  // === Apply Coupon ===
  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "SAVE50") {
      const newDiscount = 50;
      setDiscount(newDiscount);
      setFinalAmount(totalAmount + deliveryFee - newDiscount);
    } else {
      alert("Invalid coupon code");
      setDiscount(0);
      setFinalAmount(totalAmount + deliveryFee);
    }
  };

  const handleProceed = () => {
    if (selectedAddressIndex == 0 || addresses.length > 0) {
      alert("Please select a delivery address.");
      return;
    }
    navigate("/proceed-payment", {
      state: {
        orderId,
        amount: finalAmount,
        coupon,
        discount,
      },
    });
  };

  // === Format Functions ===
  const formatDateTime = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleString() : "N/A";

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Checkout Summary
      </Typography>

      {/* === Address Section (placeholder for future) === */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Delivery Address</Typography>
          <Typography color="text.secondary" mt={1}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Delivery Address
                </Typography>

                <Box
                  sx={{
                    overflowX: "auto",
                    whiteSpace: "nowrap",
                    display: "flex",
                    gap: 2,
                    pb: 5,
                  }}
                >
                  {addresses.map((addr, index) => (
                    <Box
                      key={index}
                      component="label"
                      sx={{
                        display: "inline-block",
                        minWidth: 200,
                        maxWidth: 200,
                        maxHeight: 50,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="selectedAddress"
                        value={index}
                        checked={selectedAddressIndex === index}
                        onChange={() => setSelectedAddressIndex(index)}
                        style={{ display: "none" }}
                      />
                      <Card
                        variant="outlined"
                        sx={{
                          p: 2,
                          backgroundColor:
                            selectedAddressIndex === index ? "#e3f2fd" : "#fff",
                          border:
                            selectedAddressIndex === index
                              ? "2px solid #1976d2"
                              : "1px solid #ccc",
                          transition: "all 0.3s",
                          height: "100%",
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold">
                          Address {index + 1}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {formatAddress(addr)}
                        </Typography>
                      </Card>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Typography>
        </CardContent>
      </Card>

      {/* === Offers Section === */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Apply Coupon</Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
              mt: 2,
            }}
          >
            <TextField
              size="small"
              label="Coupon Code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={applyCoupon}
              disabled={!coupon.trim()}
            >
              Apply
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* === Order Summary Section === */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order #{order.orderId}
          </Typography>
          <Typography color="text.secondary">
            Placed On: {formatDateTime(order.createdAt)}
          </Typography>
          <Typography sx={{ mb: 2 }}>Status: {order.status}</Typography>

          {cartItems.map((item, index) => (
            <Box
              key={index}
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography>
                Product #{item.productId} × {item.quantity}
              </Typography>
              <Typography>
                ₹{item.price ? (item.price * item.quantity).toFixed(2) : "N/A"}
              </Typography>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography>Total</Typography>
            <Typography>₹{totalAmount.toFixed(2)}</Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography>Delivery Fee</Typography>
            <Typography>₹{deliveryFee}</Typography>
          </Box>

          {discount > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Coupon Discount</Typography>
              <Typography color="green">− ₹{discount}</Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Final Amount
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold">
              ₹{finalAmount.toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* === Proceed Button Section === */}
      <Box sx={{ textAlign: "right" }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleProceed}
        >
          Proceed to Payment
        </Button>
      </Box>
    </Container>
  );
};

export default CheckoutSummaryPage;
