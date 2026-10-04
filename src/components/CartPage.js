import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
  Box,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Stack,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";

import { useParams } from "react-router-dom";
import axios from "../utils/AxiosInstance";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState(0);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const token = localStorage.getItem("authToken");
  const userId = localStorage.getItem("userId");

  // const slug = window.location.pathname.split("/")[2]; // Extract slug from URL
  const { slug } = useParams();
  // Load cart
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(storedCart);
  }, []);

  const updateCart = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const getItemKey = (item) =>
    `${item.id}_${item.variant?.size || ""}_${item.variant?.color || ""}`;

  const incrementQty = (itemKey) => {
    const updated = cartItems.map((item) =>
      getItemKey(item) === itemKey
        ? { ...item, quantity: item.quantity + 1 }
        : item,
    );
    updateCart(updated);
  };

  const decrementQty = (itemKey) => {
    const updated = cartItems
      .map((item) =>
        getItemKey(item) === itemKey
          ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 }
          : item,
      )
      .filter((item) => item.quantity > 0);
    updateCart(updated);
  };

  const removeFromCart = (itemKey) => {
    const updated = cartItems.filter((item) => getItemKey(item) !== itemKey);
    updateCart(updated);
  };

  const totalAmount = cartItems
    .reduce(
      (sum, item) =>
        sum + (item.variant?.price || item.price || 0) * (item.quantity || 1),
      0,
    )
    .toFixed(2);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleQuickLogin = async () => {
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setSnackbar({
        open: true,
        message: "Username and password are required.",
        severity: "error",
      });
      return;
    }

    setLoginLoading(true);

    try {
      const response = await axios.post("/user/login", {
        username: loginForm.username,
        password: loginForm.password,
      });

      const token = response.data.token;
      const userRole = response.data.userRole;
      const userIdValue = response.data.userId;

      localStorage.setItem("authToken", token);
      localStorage.setItem(
        "userAddresses",
        JSON.stringify(response.data.addresses || []),
      );
      localStorage.setItem("selectedAddress", "Select Address");
      localStorage.setItem(
        "username",
        response.data.username || loginForm.username,
      );
      localStorage.setItem("firstName", response.data.firstName || "");
      localStorage.setItem("lastName", response.data.lastName || "");
      localStorage.setItem("email", response.data.email || "");
      localStorage.setItem("userId", userIdValue || "");
      localStorage.setItem("userRole", userRole || "User");
      localStorage.setItem("merchantId", response.data.merchantId || "");

      setAuthModalOpen(false);
      setSnackbar({
        open: true,
        message: "Login successful. Continuing to checkout...",
        severity: "success",
      });

      setTimeout(() => {
        navigate(`/store/${slug}/order/checkout`, {
          state: {
            userId: userIdValue,
            items: cartItems.map((item) => ({
              productId: item.id,
              size: item.variant?.size || null,
              color: item.variant?.color || null,
              quantity: item.quantity,
              price: item.variant?.price || item.price,
              name: item.name,
            })),
            totalAmount: parseFloat(totalAmount),
            itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          },
        });
      }, 400);
    } catch (error) {
      console.error("Quick login failed:", error);
      setSnackbar({
        open: true,
        message:
          error?.response?.data?.msg ||
          "Login failed. Please check your credentials.",
        severity: "error",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleInitialRegister = async () => {
    const { username, email, password } = registerForm;

    if (!username || !email || !password) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields.",
        severity: "error",
      });
      return;
    }

    if (!validateEmail(email)) {
      setSnackbar({
        open: true,
        message: "Please enter a valid email address.",
        severity: "error",
      });
      return;
    }

    setRegisterLoading(true);

    try {
      const checkRes = await axios.post("/user/check-availability", {
        username,
        email,
      });

      if (checkRes.data?.msg) {
        setSnackbar({
          open: true,
          message: checkRes.data.msg,
          severity: "error",
        });
        return;
      }

      const resp = await axios.post("/user/send-otp", { email });
      if (resp.data?.msg === "Otp sent on email") {
        setOtpSent(true);
        setSnackbar({
          open: true,
          message: "OTP sent to your email.",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: resp.data?.msg || "Unable to send OTP.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Registration setup failed:", error);
      setSnackbar({
        open: true,
        message: "Error during registration setup.",
        severity: "error",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    const { firstName, lastName, username, email, password, otp } =
      registerForm;

    if (!firstName || !lastName || !username || !email || !password) {
      setSnackbar({
        open: true,
        message: "Please complete all required details.",
        severity: "error",
      });
      return;
    }

    if (!/^[0-9]{6}$/.test(otp || "")) {
      setSnackbar({
        open: true,
        message: "Enter a valid 6-digit OTP.",
        severity: "error",
      });
      return;
    }

    setRegisterLoading(true);

    try {
      const verifyRes = await axios.post("/user/verify-otp", {
        email,
        otp,
      });

      if (verifyRes.data?.msg === "OTP verified successfully") {
        setOtpVerified(true);

        await axios.post("/user/register", {
          firstName,
          lastName,
          username,
          email,
          password,
          userRole: "User",
        });

        setSnackbar({
          open: true,
          message: "Registration complete. Please login to continue.",
          severity: "success",
        });

        setRegisterForm({
          firstName: "",
          lastName: "",
          username: "",
          email: "",
          password: "",
          otp: "",
        });
        setOtpSent(false);
        setOtpVerified(false);
        setAuthTab(0);
      } else {
        setSnackbar({
          open: true,
          message: "OTP verification failed. Please check your OTP.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Register verification failed:", error);
      setSnackbar({
        open: true,
        message: "OTP verification failed.",
        severity: "error",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!userId) {
      setAuthModalOpen(true);
      return;
    }

    const items = cartItems.map((item) => ({
      productId: item.id,
      size: item.variant?.size || null,
      color: item.variant?.color || null,
      quantity: item.quantity,
      price: item.variant?.price || item.price,
      name: item.name,
    }));

    navigate(`/store/${slug}/order/checkout`, {
      state: {
        userId,
        items,
        totalAmount: parseFloat(totalAmount),
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  };

  // Save cart to backend
  useEffect(() => {
    if (!userId || cartItems.length === 0) return;

    const saveCartToBackend = async () => {
      try {
        await axios.post(
          `/cart/save/${userId}`,
          { items: cartItems },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (error) {
        console.error("Failed to save cart:", error);
      }
    };

    saveCartToBackend();
  }, [cartItems, userId, token]);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // Navigate to product details
  const handleProductClick = (productId) => {
    navigate(`/store/${slug}/product/${productId}`);
  };

  // ==================== MOBILE LIST VIEW ====================
  const renderMobileList = () => (
    <Box>
      {cartItems.map((item) => {
        const itemKey = getItemKey(item);
        const price = item.variant?.price || item.price || 0;

        return (
          <Card key={itemKey} sx={{ mb: 2, borderRadius: 3 }}>
            <CardActionArea onClick={() => handleProductClick(item.id)}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  {/* <Box
                    sx={{
                      width: 80,
                      height: 80,
                      flexShrink: 0,
                      borderRadius: 2,
                      overflow: "hidden",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    <img
                      src={item.image || "https://via.placeholder.com/80"}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box> */}

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {item.name}
                    </Typography>

                    {item.variant?.size && (
                      <Typography variant="body2" color="text.secondary">
                        Size: {item.variant.size}
                      </Typography>
                    )}
                    {item.variant?.color && (
                      <Typography variant="body2" color="text.secondary">
                        Color: {item.variant.color}
                      </Typography>
                    )}

                    <Typography
                      variant="subtitle2"
                      color="primary"
                      sx={{ mt: 1 }}
                    >
                      ₹{price} × {item.quantity} = ₹
                      {(price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </CardActionArea>

            <Divider />

            <CardActions sx={{ justifyContent: "space-between", px: 2, py: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton size="small" onClick={() => decrementQty(itemKey)}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: 24, textAlign: "center" }}>
                  {item.quantity}
                </Typography>
                <IconButton size="small" onClick={() => incrementQty(itemKey)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <IconButton color="error" onClick={() => removeFromCart(itemKey)}>
                <DeleteOutlineIcon />
              </IconButton>
            </CardActions>
          </Card>
        );
      })}
    </Box>
  );

  // ==================== DESKTOP GRID VIEW ====================
  const renderDesktopGrid = () => (
    <Grid container spacing={3}>
      {cartItems.map((item) => {
        const itemKey = getItemKey(item);
        const price = item.variant?.price || item.price || 0;

        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={itemKey}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
              }}
            >
              <CardActionArea onClick={() => handleProductClick(item.id)}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {item.name}
                  </Typography>

                  {item.variant?.size && (
                    <Typography variant="body2">
                      Size: {item.variant.size}
                    </Typography>
                  )}
                  {item.variant?.color && (
                    <Typography variant="body2">
                      Color: {item.variant.color}
                    </Typography>
                  )}

                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mt: 2 }}
                  >
                    ₹{price} × {item.quantity} = ₹
                    {(price * item.quantity).toFixed(2)}
                  </Typography>
                </CardContent>
              </CardActionArea>

              <CardActions
                sx={{ justifyContent: "space-between", px: 2, pb: 2 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button size="small" onClick={() => decrementQty(itemKey)}>
                    -
                  </Button>
                  <Typography>{item.quantity}</Typography>
                  <Button size="small" onClick={() => incrementQty(itemKey)}>
                    +
                  </Button>
                </Box>
                <Button
                  size="small"
                  color="error"
                  onClick={() => removeFromCart(itemKey)}
                >
                  Remove
                </Button>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Your Cart
      </Typography>

      {cartItems.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your cart is empty
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(`/store/${slug}`)}
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Box>
      ) : (
        <>
          {isMobile ? renderMobileList() : renderDesktopGrid()}
          <Divider sx={{ my: { xs: 1, md: 2 } }} />
          <Box
            sx={{
              mt: 2,
              p: 3,
              borderRadius: 3,
              backgroundColor: "background.paper",
              boxShadow: 1,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Total: ₹{totalAmount}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {cartItems.length} item(s)
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth={isMobile}
              sx={{ mt: 3, borderRadius: 3, py: 1.5 }}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
          </Box>
        </>
      )}

      <Dialog
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              Continue to checkout
            </Typography>
            <Button
              variant="text"
              color="inherit"
              onClick={() => setAuthModalOpen(false)}
            >
              Close
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: 1 }}>
          <Paper
            elevation={0}
            sx={{ borderRadius: 3, backgroundColor: "#f5f7ff", p: 1.5, mb: 2 }}
          >
            <Typography variant="body2" color="text.secondary">
              Sign in or create a quick account to place your order faster.
            </Typography>
          </Paper>

          <Tabs
            value={authTab}
            onChange={(e, newValue) => setAuthTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {authTab === 0 ? (
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                fullWidth
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleQuickLogin}
                disabled={loginLoading}
                sx={{ borderRadius: 2, py: 1.2 }}
              >
                {loginLoading ? "Logging in..." : "Login & Continue"}
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    value={registerForm.firstName}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    value={registerForm.lastName}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    fullWidth
                  />
                </Grid>
              </Grid>

              <TextField
                label="Username"
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Email"
                type="email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                fullWidth
                disabled={otpSent}
              />

              {!otpSent && (
                <Button
                  variant="outlined"
                  onClick={handleInitialRegister}
                  disabled={registerLoading}
                  sx={{ borderRadius: 2, py: 1.2 }}
                >
                  {registerLoading ? "Sending OTP..." : "Send OTP"}
                </Button>
              )}

              {otpSent && (
                <>
                  <TextField
                    label="Enter 6-digit OTP"
                    value={registerForm.otp}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        otp: e.target.value,
                      }))
                    }
                    fullWidth
                    inputProps={{ maxLength: 6 }}
                  />

                  <Button
                    variant="contained"
                    onClick={verifyOtpAndRegister}
                    disabled={registerLoading}
                    sx={{ borderRadius: 2, py: 1.2 }}
                  >
                    {registerLoading
                      ? "Registering..."
                      : "Verify OTP & Register"}
                  </Button>
                </>
              )}

              {otpSent && (
                <Button
                  variant="text"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpVerified(false);
                    setRegisterForm((prev) => ({ ...prev, otp: "" }));
                  }}
                >
                  Change email
                </Button>
              )}

              <TextField
                label="Password"
                type="password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAuthModalOpen(false)} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CartPage;
