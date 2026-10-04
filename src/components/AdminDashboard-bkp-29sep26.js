// AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  People,
  Inventory,
  Category,
  ShoppingCart,
  Dashboard,
  Store,
  Edit,
  Visibility,
  ToggleOnTwoTone,
  CheckCircle,
  Cancel,
  ErrorOutline,
  Search,
  Clear,
} from "@mui/icons-material";

import {
  Stack,
  Avatar,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@mui/material";

import {
  StorefrontOutlined,
  EditOutlined,
  OpenInNewOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  ExpandMore,
  BusinessOutlined,
  CreditCardOutlined,
  ReceiptLongOutlined,
  SecurityOutlined,
  LocationOnOutlined,
  Inventory2Outlined,
  AccountBalanceOutlined,
  SettingsOutlined,
  AddOutlined,
} from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Snackbar,
} from "@mui/material";

import { Close, SaveOutlined } from "@mui/icons-material";
import PaymentsIcon from "@mui/icons-material/Payments";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import { useNavigate } from "react-router-dom";
import axios from "../utils/AxiosInstance";
import { useParams } from "react-router-dom";

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [storeDetails, setStoreDetails] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCategories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const { slug } = useParams();
  const merchantId = localStorage.getItem("merchantId");

  ////////////////////////////////////////////////////////////////

  const API = "http://localhost:8080";

  const [editStoreOpen, setEditStoreOpen] = useState(false);
  const [savingStore, setSavingStore] = useState(false);

  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

  const [savingOther, setSavingOther] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formErrors, setFormErrors] = useState({});

  const [editForm, setEditForm] = useState({
    businessName: "",
    businessType: "",
    description: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    storeSlug: "",
    gstNumber: "",
    panNumber: "",
    licenseNumber: "",
  });

  const [bankForm, setBankForm] = useState({
    bankAccountHolderName: "",
    bankAccountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  const [settingsForm, setSettingsForm] = useState({
    inventoryEnabled: false,
    deliveryEnabled: false,
    onlinePaymentEnabled: false,
    cashOnDeliveryEnabled: false,
    couponEnabled: false,
    reviewEnabled: false,
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    subscriptionPlan: "FREE",
    maxProducts: 50,
    maxUsers: 2,
    maxBranches: 1,
  });

  const showNotification = (message, severity = "success") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleBankChange = (event) => {
    const { name, value } = event.target;

    setBankForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSettingsChange = (event) => {
    const { name, checked } = event.target;

    setSettingsForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubscriptionChange = (event) => {
    const { name, value } = event.target;

    setSubscriptionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditStore = async (merchant = storeDetails) => {
    if (!merchant?.id) {
      showNotification("Merchant ID is missing.", "error");
      return;
    }

    try {
      const response = await axios.get(`${API}/api/merchants/${merchant.id}`);

      const data = response.data?.result || response.data;

      setEditForm({
        businessName: data.businessName || "",
        businessType: data.businessType || "",
        description: data.description || "",
        ownerName: data.ownerName || "",
        ownerEmail: data.ownerEmail || data.email || "",
        ownerPhone: data.ownerPhone || "",
        addressLine1: data.addressLine1 || "",
        addressLine2: data.addressLine2 || "",
        landmark: data.landmark || "",
        city: data.city || "",
        district: data.district || "",
        state: data.state || "",
        country: data.country || "India",
        pincode: data.pincode || "",
        storeSlug: data.storeSlug || "",
        gstNumber: data.gstNumber || "",
        panNumber: data.panNumber || "",
        licenseNumber: data.licenseNumber || "",
      });

      setFormErrors({});
      setEditStoreOpen(true);
    } catch (error) {
      console.error("Failed to load merchant:", error);

      showNotification(
        error.response?.data?.message || "Unable to load merchant details.",
        "error",
      );
    }
  };

  const validateStoreForm = () => {
    const errors = {};

    if (!editForm.businessName.trim()) {
      errors.businessName = "Business name is required";
    }

    if (!editForm.ownerName.trim()) {
      errors.ownerName = "Owner name is required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.ownerEmail)) {
      errors.ownerEmail = "Enter a valid email address";
    }

    if (!/^\d{10}$/.test(editForm.ownerPhone)) {
      errors.ownerPhone = "Enter a valid 10-digit phone number";
    }

    if (!editForm.city.trim()) {
      errors.city = "City is required";
    }

    if (!editForm.state.trim()) {
      errors.state = "State is required";
    }

    if (
      editForm.storeSlug &&
      !/^[a-z]+(?:-[a-z]+)*$/.test(editForm.storeSlug)
    ) {
      errors.storeSlug = "Use lowercase letters separated by single hyphens";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSaveStore = async () => {
    if (!validateStoreForm()) return;

    if (!storeDetails?.id) {
      showNotification("Merchant ID is missing.", "error");
      return;
    }

    setSavingStore(true);

    try {
      const payload = {
        ...editForm,
        storeSlug: editForm.storeSlug.toLowerCase().trim(),
      };

      const response = await axios.put(
        `${API}/api/merchants/${storeDetails.id}`,
        payload,
      );

      const updatedMerchant = response.data?.result || response.data;

      // Refresh the dashboard's merchant state.
      setStoreDetails((prev) => ({
        ...prev,
        ...updatedMerchant,
      }));

      setEditStoreOpen(false);

      showNotification("Store details updated successfully.");
    } catch (error) {
      console.error("Failed to update merchant:", error);

      showNotification(
        error.response?.data?.message || "Failed to update store details.",
        "error",
      );
    } finally {
      setSavingStore(false);
    }
  };

  const handleEditBankDetails = () => {
    setBankForm({
      bankAccountHolderName: storeDetails.bankAccountHolderName || "",
      bankAccountNumber: "",
      ifscCode: storeDetails.ifscCode || "",
      bankName: storeDetails.bankName || "",
    });

    setBankDialogOpen(true);
  };

  const handleSaveBankDetails = async () => {
    setSavingOther(true);

    try {
      await axios.put(
        `${API}/api/merchants/${storeDetails.id}/bank-details`,
        bankForm,
      );

      setStoreDetails((prev) => ({
        ...prev,
        bankAccountHolderName: bankForm.bankAccountHolderName,
        bankName: bankForm.bankName,
        ifscCode: bankForm.ifscCode,
      }));

      setBankDialogOpen(false);
      showNotification("Bank details updated.");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Unable to save bank details.",
        "error",
      );
    } finally {
      setSavingOther(false);
    }
  };
  const handleStoreSettings = () => {
    setSettingsForm({
      inventoryEnabled: !!storeDetails.inventoryEnabled,
      deliveryEnabled: !!storeDetails.deliveryEnabled,
      onlinePaymentEnabled: !!storeDetails.onlinePaymentEnabled,
      cashOnDeliveryEnabled: !!storeDetails.cashOnDeliveryEnabled,
      couponEnabled: !!storeDetails.couponEnabled,
      reviewEnabled: !!storeDetails.reviewEnabled,
    });

    setSettingsDialogOpen(true);
  };

  const handleSaveSettings = async () => {
    setSavingOther(true);

    try {
      await axios.put(
        `${API}/api/merchants/${storeDetails.id}/settings`,
        settingsForm,
      );

      setStoreDetails((prev) => ({
        ...prev,
        ...settingsForm,
      }));

      setSettingsDialogOpen(false);
      showNotification("Store settings updated.");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Unable to save settings.",
        "error",
      );
    } finally {
      setSavingOther(false);
    }
  };

  const handleManageSubscription = () => {
    setSubscriptionForm({
      subscriptionPlan: storeDetails.subscriptionPlan || "FREE",
      maxProducts: storeDetails.maxProducts ?? 50,
      maxUsers: storeDetails.maxUsers ?? 2,
      maxBranches: storeDetails.maxBranches ?? 1,
    });

    setSubscriptionDialogOpen(true);
  };

  const handleSaveSubscription = async () => {
    setSavingOther(true);

    try {
      await axios.put(
        `${API}/api/merchants/${storeDetails.id}/subscription`,
        subscriptionForm,
      );

      setStoreDetails((prev) => ({
        ...prev,
        ...subscriptionForm,
      }));

      setSubscriptionDialogOpen(false);
      showNotification("Subscription updated.");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Unable to update subscription.",
        "error",
      );
    } finally {
      setSavingOther(false);
    }
  };

  <Dialog
    open={bankDialogOpen}
    onClose={() => !savingOther && setBankDialogOpen(false)}
    fullScreen={isMobile}
    fullWidth
    maxWidth="sm"
    PaperProps={{
      sx: { borderRadius: isMobile ? 0 : 3 },
    }}
  >
    <DialogTitle>Bank & payout details</DialogTitle>

    <DialogContent dividers>
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField
          fullWidth
          label="Account holder name"
          name="bankAccountHolderName"
          value={bankForm.bankAccountHolderName}
          onChange={handleBankChange}
        />

        <TextField
          fullWidth
          label="Bank name"
          name="bankName"
          value={bankForm.bankName}
          onChange={handleBankChange}
        />

        <TextField
          fullWidth
          label="Account number"
          name="bankAccountNumber"
          type="password"
          value={bankForm.bankAccountNumber}
          onChange={handleBankChange}
          autoComplete="new-password"
        />

        <TextField
          fullWidth
          label="IFSC code"
          name="ifscCode"
          value={bankForm.ifscCode}
          onChange={handleBankChange}
        />
      </Stack>
    </DialogContent>

    <DialogActions sx={{ p: 2 }}>
      <Button onClick={() => setBankDialogOpen(false)} disabled={savingOther}>
        Cancel
      </Button>

      <Button
        variant="contained"
        onClick={handleSaveBankDetails}
        disabled={savingOther}
      >
        {savingOther ? "Saving..." : "Save bank details"}
      </Button>
    </DialogActions>
  </Dialog>;

  //last //////////////////////////////////////////////--------------------------------

  //store details
  // const handleEditStore = (store) => {
  //   // Open your existing merchant edit form/dialog.
  // };

  // const handleManageSubscription = () => {
  //   // Open subscription plan and limit management page.
  // };

  // const handleStoreSettings = () => {
  //   // Open store settings.
  // };

  // const handleEditBankDetails = () => {
  //   // Open bank details form.
  // };

  const handleBillingHistory = () => {
    // Navigate to billing/payment history.
  };

  const handleManageBranches = () => {
    // Open your existing branch management screen.
  };

  useEffect(() => {
    //fetchAdminDetails();
    fetchStoreDetails();
    fetchStats();
  }, [slug]);

  const fetchAdminDetails = () => {
    axios
      .get("http://localhost:8080/user/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAdmin(res.data))
      .catch((err) => console.error("Failed to load admin info:", err));
  };

  const fetchStoreDetails = async () => {
    try {
      if (!slug) return;
      const response = await axios.get(`/api/merchants/${merchantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStoreDetails(response.data);
    } catch (err) {
      console.error("Failed to load store details:", err);
      setError("Failed to load store details. Please try again.");
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [
        usersRes,
        productsRes,
        categoriesRes,
        totalOrdersRes,
        totalCoupons,
        totalMerchants,
      ] = await Promise.all([
        axios.get("http://localhost:8080/user/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:8080/products/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:8080/category/get-all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:8080/orders/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:8080/coupons/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:8080/api/merchants", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats({
        totalUsers: Array.isArray(usersRes?.data) ? usersRes.data.length : 0,

        totalProducts: Array.isArray(productsRes?.data?.result)
          ? productsRes.data.result.length
          : 0,

        totalCategories: Array.isArray(categoriesRes?.data)
          ? categoriesRes.data.length
          : 0,

        totalOrders: Array.isArray(totalOrdersRes?.data)
          ? totalOrdersRes.data.length
          : 0,

        totalCoupons: Array.isArray(totalCoupons?.data?.result)
          ? totalCoupons.data.result.length
          : 0,

        totalMerchants: Array.isArray(totalMerchants?.data)
          ? totalMerchants.data.length
          : 0,
      });
      setError(null);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("Failed to fetch statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const navigationCards = [
    {
      title: "User Management",
      description: "Manage users, view profiles, and handle user operations",
      icon: <People sx={{ fontSize: { xs: 32, md: 40 } }} />,
      color: "#1976d2",
      route: "users",
      count: stats.totalUsers,
    },
    {
      title: "Product Management",
      description: "Add, edit, and manage product inventory",
      icon: <Inventory sx={{ fontSize: { xs: 32, md: 40 } }} />,
      color: "#388e3c",
      route: "products",
      count: stats.totalProducts,
    },
    {
      title: "Category Management",
      description: "Organize products with categories",
      icon: <Category sx={{ fontSize: { xs: 32, md: 40 } }} />,
      color: "#f57c00",
      route: "categories",
      count: stats.totalCategories,
    },
    {
      title: "Order Management",
      description: "Track and manage customer orders",
      icon: <ShoppingCart sx={{ fontSize: { xs: 32, md: 40 } }} />,
      color: "#7b1fa2",
      route: "orders",
      count: stats.totalOrders,
    },
    {
      title: "Coupon Management",
      description: "Track and manage coupons",
      icon: <PaymentsIcon sx={{ fontSize: { xs: 32, md: 40 } }} />,
      color: "#1976d2",
      route: "coupons",
      count: stats.totalCoupons,
    },
    {
      title: "Gift Cards Management",
      description: "Track and manage gift cards",
      icon: <LocalAtmIcon sx={{ fontSize: { xs: 32, md: 40 } }} />,
      color: "#388e3c",
      route: "gift-card",
      count: stats.totalOrders,
    },

    {
      title: "Merchants Management",
      description: "Track and manage merchants",
      icon: <Store sx={{ fontSize: { xs: 32, md: 40 } }} />,
      color: "#388e3c",
      route: "merchants",
      count: stats.totalMerchants,
    },
  ];

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const truncateTitle = (text) => {
    // Title: 30 chars max (fits nicely on one line, or breaks to 2 lines max)
    return truncateText(text, 10);
  };

  const truncateDescription = (text) => {
    // Description: 50 chars max (fits on 2 lines with ellipsis)
    return truncateText(text, 20);
  };

  const getStatusColor = (isActive) => {
    return isActive ? "#388e3c" : "#d32f2f";
  };

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle /> : <Cancel />;
  };

  const filteredCards = navigationCards.filter(
    (card) =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2 } }}
    >
      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, display: "flex", alignItems: "center" }}
        >
          <ErrorOutline sx={{ mr: 1 }} />
          {error}
        </Alert>
      )}

      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          gutterBottom
          sx={{
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            color: "#1a237e",
          }}
        >
          <Dashboard sx={{ mr: 1, fontSize: { xs: 28, md: 32 } }} />
          Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back! Manage your store and operations from here.
        </Typography>
      </Box>

      {/* Store Details Section */}
      {/* ================= STORE DASHBOARD ================= */}

      {storeDetails &&
        (() => {
          const store = storeDetails;

          // active may arrive as either boolean or string
          const isActive =
            store.active === true ||
            String(store.active).toLowerCase() === "true";

          const storeUrl =
            store.customDomainEnabled && store.customDomain
              ? `https://${store.customDomain}`
              : `${window.location.origin}/store/${store.storeSlug || ""}`;

          const displayValue = (value) =>
            value !== null && value !== undefined && String(value).trim() !== ""
              ? value
              : "Not added";

          const requiredFields = [
            store.businessName,
            store.businessType,
            store.ownerName,
            store.ownerEmail,
            store.ownerPhone,
            store.city,
            store.state,
            store.storeSlug,
          ];

          const completedFields = requiredFields.filter(
            (value) =>
              value !== null &&
              value !== undefined &&
              String(value).trim() !== "",
          ).length;

          const completion = Math.round(
            (completedFields / requiredFields.length) * 100,
          );

          const missing = (value) =>
            value === null ||
            value === undefined ||
            String(value).trim() === "";

          const InfoItem = ({ label, value, action }) => (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.4 }}
              >
                {label}
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                flexWrap="wrap"
              >
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ overflowWrap: "anywhere" }}
                >
                  {displayValue(value)}
                </Typography>

                {missing(value) && action && (
                  <Button
                    size="small"
                    onClick={action}
                    sx={{
                      textTransform: "none",
                      minWidth: 0,
                      p: 0,
                      fontSize: "0.75rem",
                    }}
                  >
                    Add
                  </Button>
                )}
              </Stack>
            </Box>
          );

          const SectionHeading = ({ icon, title, subtitle }) => (
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <Avatar
                sx={{
                  bgcolor: "primary.50",
                  color: "primary.main",
                  width: 40,
                  height: 40,
                }}
              >
                {icon}
              </Avatar>

              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Stack>
          );

          const ManagementAccordion = ({
            icon,
            title,
            description,
            children,
          }) => (
            <Accordion
              disableGutters
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "12px !important",
                mb: 1.5,
                "&:before": { display: "none" },
                overflow: "hidden",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 1,
                  "& .MuiAccordionSummary-content": {
                    alignItems: "center",
                    gap: 1.5,
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "action.hover",
                    color: "text.primary",
                    width: 38,
                    height: 38,
                  }}
                >
                  {icon}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={600}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {description}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
                {children}
              </AccordionDetails>
            </Accordion>
          );

          return (
            <Box sx={{ mb: 4 }}>
              {/* ============ HEADER / STORE OVERVIEW ============ */}

              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: 5,
                    background: "linear-gradient(90deg, #667eea, #764ba2)",
                  }}
                />

                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={store.logoUrl || ""}
                          variant="rounded"
                          sx={{
                            width: { xs: 56, sm: 68 },
                            height: { xs: 56, sm: 68 },
                            bgcolor: "primary.light",
                            color: "primary.contrastText",
                            borderRadius: 2,
                          }}
                        >
                          <StorefrontOutlined fontSize="large" />
                        </Avatar>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="h5"
                            fontWeight={800}
                            sx={{
                              fontSize: { xs: "1.2rem", sm: "1.5rem" },
                              overflowWrap: "anywhere",
                            }}
                          >
                            {store.businessName || "Your Store"}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            Merchant ID: {store.merchantCode || store.id}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ mt: 1 }}
                          >
                            <Chip
                              size="small"
                              icon={
                                isActive ? (
                                  <CheckCircleOutline />
                                ) : (
                                  <WarningAmberOutlined />
                                )
                              }
                              label={isActive ? "Active" : "Inactive"}
                              color={isActive ? "success" : "default"}
                              variant="outlined"
                            />

                            <Chip
                              size="small"
                              label={store.subscriptionPlan || "FREE"}
                              color="primary"
                              variant="outlined"
                            />

                            <Chip
                              size="small"
                              label={
                                store.businessType || "Business type missing"
                              }
                              variant="outlined"
                            />
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Stack
                        direction={{ xs: "row", md: "column" }}
                        spacing={1}
                        alignItems={{ xs: "stretch", md: "flex-end" }}
                      >
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<EditOutlined />}
                          onClick={() => handleEditStore(store)}
                          sx={{
                            textTransform: "none",
                            borderRadius: 2,
                          }}
                        >
                          Edit Store
                        </Button>

                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<OpenInNewOutlined />}
                          onClick={() => window.open(storeUrl, "_blank")}
                          disabled={!store.storeSlug && !store.customDomain}
                          sx={{
                            textTransform: "none",
                            borderRadius: 2,
                          }}
                        >
                          View Store
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  {/* STORE URL */}

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    STOREFRONT URL
                  </Typography>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mt: 0.5 }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {storeUrl}
                    </Typography>

                    <Button
                      size="small"
                      onClick={() => navigator.clipboard.writeText(storeUrl)}
                      sx={{ textTransform: "none", flexShrink: 0 }}
                    >
                      Copy URL
                    </Button>
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  {/* PROFILE COMPLETION */}

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography fontWeight={700}>
                      Store profile completion
                    </Typography>

                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="primary.main"
                    >
                      {completion}%
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={completion}
                    sx={{
                      height: 8,
                      borderRadius: 5,
                      bgcolor: "action.hover",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 5,
                      },
                    }}
                  />

                  {completion < 100 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Complete your business information to keep your store
                      profile up to date.
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* ============ DAILY STORE OPERATIONS ============ */}

              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Store management
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* BUSINESS PROFILE */}

                <Grid item xs={12} md={6}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <SectionHeading
                        icon={<BusinessOutlined />}
                        title="Business information"
                        subtitle="Business and contact details"
                      />

                      <Stack spacing={2}>
                        <InfoItem
                          label="Business name"
                          value={store.businessName}
                          action={() => handleEditStore(store)}
                        />

                        <InfoItem
                          label="Owner name"
                          value={store.ownerName}
                          action={() => handleEditStore(store)}
                        />

                        <InfoItem
                          label="Business email"
                          value={store.ownerEmail || store.email}
                          action={() => handleEditStore(store)}
                        />

                        <InfoItem
                          label="Phone number"
                          value={store.ownerPhone}
                          action={() => handleEditStore(store)}
                        />

                        <InfoItem
                          label="Business type"
                          value={store.businessType}
                          action={() => handleEditStore(store)}
                        />
                      </Stack>

                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<EditOutlined />}
                        onClick={() => handleEditStore(store)}
                        sx={{ mt: 3, textTransform: "none" }}
                      >
                        Complete business profile
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* ADDRESS */}

                <Grid item xs={12} md={6}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <SectionHeading
                        icon={<LocationOnOutlined />}
                        title="Business address"
                        subtitle="Registered business location"
                      />

                      <Stack spacing={2}>
                        <InfoItem
                          label="Address"
                          value={store.addressLine1}
                          action={() => handleEditStore(store)}
                        />

                        <InfoItem
                          label="City"
                          value={store.city}
                          action={() => handleEditStore(store)}
                        />

                        <InfoItem
                          label="State"
                          value={store.state}
                          action={() => handleEditStore(store)}
                        />

                        <InfoItem
                          label="Pincode"
                          value={store.pincode}
                          action={() => handleEditStore(store)}
                        />

                        <InfoItem
                          label="Country"
                          value={store.country}
                          action={() => handleEditStore(store)}
                        />
                      </Stack>

                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<EditOutlined />}
                        onClick={() => handleEditStore(store)}
                        sx={{ mt: 3, textTransform: "none" }}
                      >
                        Update address
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* PLAN SUMMARY */}

                <Grid item xs={12} md={6}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <SectionHeading
                        icon={<CreditCardOutlined />}
                        title="Current plan"
                        subtitle="Your subscription and usage limits"
                      />

                      <Typography
                        variant="h4"
                        fontWeight={800}
                        color="primary.main"
                      >
                        {store.subscriptionPlan || "FREE"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, mb: 2 }}
                      >
                        Current subscription plan
                      </Typography>

                      <Divider sx={{ mb: 2 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <InfoItem
                            label="Product limit"
                            value={store.maxProducts ?? "Not configured"}
                          />
                        </Grid>

                        <Grid item xs={6}>
                          <InfoItem
                            label="User limit"
                            value={store.maxUsers ?? "Not configured"}
                          />
                        </Grid>

                        <Grid item xs={6}>
                          <InfoItem
                            label="Branch limit"
                            value={store.maxBranches ?? "Not configured"}
                          />
                        </Grid>

                        <Grid item xs={6}>
                          <InfoItem
                            label="Subscription status"
                            value={store.subscriptionStatus}
                          />
                        </Grid>
                      </Grid>

                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CreditCardOutlined />}
                        onClick={() => handleManageSubscription()}
                        sx={{ mt: 3, textTransform: "none" }}
                      >
                        Manage plan & limits
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* QUICK BUSINESS SETTINGS */}

                <Grid item xs={12} md={6}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <SectionHeading
                        icon={<SettingsOutlined />}
                        title="Store settings"
                        subtitle="Features and selling preferences"
                      />

                      <Stack spacing={1.5}>
                        {[
                          ["Inventory management", store.inventoryEnabled],
                          ["Delivery", store.deliveryEnabled],
                          ["Online payments", store.onlinePaymentEnabled],
                          ["Cash on delivery", store.cashOnDeliveryEnabled],
                          ["Coupons", store.couponEnabled],
                          ["Customer reviews", store.reviewEnabled],
                        ].map(([label, enabled]) => (
                          <Stack
                            key={label}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="body2">{label}</Typography>

                            <Chip
                              size="small"
                              label={
                                enabled === true || enabled === "true"
                                  ? "Enabled"
                                  : enabled === false || enabled === "false"
                                    ? "Disabled"
                                    : "Not configured"
                              }
                              color={
                                enabled === true || enabled === "true"
                                  ? "success"
                                  : "default"
                              }
                              variant="outlined"
                            />
                          </Stack>
                        ))}
                      </Stack>

                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<SettingsOutlined />}
                        onClick={() => handleStoreSettings()}
                        sx={{ mt: 3, textTransform: "none" }}
                      >
                        Configure store settings
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* ============ LESS FREQUENTLY USED MANAGEMENT ============ */}

              <Typography variant="h6" fontWeight={800} sx={{ mb: 2, mt: 4 }}>
                Business & account management
              </Typography>

              <ManagementAccordion
                icon={<SecurityOutlined />}
                title="Verification & legal documents"
                description="GST, PAN, business registration and verification"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="GST number"
                      value={store.gstNumber}
                      action={() => handleEditStore(store)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="PAN number"
                      value={store.panNumber}
                      action={() => handleEditStore(store)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="Business license"
                      value={store.licenseNumber}
                      action={() => handleEditStore(store)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="Verification status"
                      value={
                        store.isVerified === true ? "Verified" : "Not verified"
                      }
                    />
                  </Grid>
                </Grid>

                <Button
                  variant="outlined"
                  sx={{ mt: 2, textTransform: "none" }}
                  onClick={() => handleEditStore(store)}
                >
                  Update legal details
                </Button>
              </ManagementAccordion>

              <ManagementAccordion
                icon={<AccountBalanceOutlined />}
                title="Bank & payout details"
                description="Manage the account used for settlements"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="Account holder"
                      value={store.bankAccountHolderName}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Bank name" value={store.bankName} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="Account number"
                      value={
                        store.bankAccountNumber
                          ? `••••${String(store.bankAccountNumber).slice(-4)}`
                          : null
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InfoItem label="IFSC" value={store.ifscCode} />
                  </Grid>
                </Grid>

                <Button
                  variant="outlined"
                  sx={{ mt: 2, textTransform: "none" }}
                  onClick={() => handleEditBankDetails()}
                >
                  Manage bank details
                </Button>
              </ManagementAccordion>

              <ManagementAccordion
                icon={<ReceiptLongOutlined />}
                title="Billing & payment history"
                description="Invoices, subscription payments and billing"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="Payment status"
                      value={store.paymentStatus}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="Subscription start"
                      value={
                        store.subscriptionStartDate
                          ? new Date(
                              store.subscriptionStartDate,
                            ).toLocaleDateString()
                          : null
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="Subscription end"
                      value={
                        store.subscriptionEndDate
                          ? new Date(
                              store.subscriptionEndDate,
                            ).toLocaleDateString()
                          : null
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Currency" value={store.currency} />
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  startIcon={<ReceiptLongOutlined />}
                  sx={{ mt: 2, textTransform: "none" }}
                  onClick={() => handleBillingHistory()}
                >
                  View billing history
                </Button>
              </ManagementAccordion>

              <ManagementAccordion
                icon={<StorefrontOutlined />}
                title="Branches & locations"
                description="Manage outlets, branches and franchise locations"
              >
                {store.branches?.length > 0 ? (
                  <Stack spacing={1}>
                    {store.branches.map((branch) => (
                      <Card
                        key={branch.id}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      >
                        <CardContent>
                          <Typography fontWeight={700}>
                            {branch.branchName}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            {branch.city || "Location not added"}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No branches have been added yet.
                  </Typography>
                )}

                <Button
                  variant="outlined"
                  startIcon={<AddOutlined />}
                  sx={{ mt: 2, textTransform: "none" }}
                  onClick={() => handleManageBranches()}
                >
                  Manage branches
                </Button>
              </ManagementAccordion>
            </Box>
          );
        })()}
      {/* Loading State */}
      {loading && !storeDetails && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Stats Section */}
      {!loading && (
        <>
          {/* Quick Stats Cards */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant={isMobile ? "body1" : "h6"}
              sx={{ fontWeight: 600, mb: 2, color: "#1a237e" }}
            >
              📊 Quick Statistics
            </Typography>
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
              {[
                {
                  label: "Total Users",
                  value: stats.totalUsers,
                  icon: <People sx={{ fontSize: { xs: 24, md: 28 } }} />,
                  color: "#1976d2",
                },
                {
                  label: "Total Products",
                  value: stats.totalProducts,
                  icon: <Inventory sx={{ fontSize: { xs: 24, md: 28 } }} />,
                  color: "#388e3c",
                },
                {
                  label: "Total Orders",
                  value: stats.totalOrders,
                  icon: <ShoppingCart sx={{ fontSize: { xs: 24, md: 28 } }} />,
                  color: "#7b1fa2",
                },
                {
                  label: "Categories",
                  value: stats.totalCategories,
                  icon: <Category sx={{ fontSize: { xs: 24, md: 28 } }} />,
                  color: "#f57c00",
                },
              ].map((stat, index) => (
                <Grid item xs={6} sm={6} md={3} key={index}>
                  <Paper
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      textAlign: "center",
                      background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                      border: `1px solid ${stat.color}30`,
                      borderRadius: 2,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 2,
                        borderColor: stat.color,
                      },
                    }}
                  >
                    <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: stat.color,
                        fontSize: { xs: "1.25rem", md: "1.5rem" },
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Management Sections */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant={isMobile ? "body1" : "h6"}
                sx={{ fontWeight: 600, mb: 2, color: "#1a237e" }}
              >
                ⚙️ Management Sections
              </Typography>

              {/* Search Box */}
              <Paper
                component="form"
                onSubmit={(e) => e.preventDefault()}
                sx={{
                  p: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                  background: "#f5f5f5",
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                <Search sx={{ ml: 1.5, color: "text.secondary" }} />
                <Box
                  component="input"
                  type="text"
                  placeholder="Search management sections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    flex: 1,
                    ml: 1.5,
                    fontSize: { xs: "0.85rem", md: "0.95rem" },
                    py: 1,
                    "&::placeholder": { color: "#999" },
                  }}
                />
                {searchTerm && (
                  <Button
                    size="small"
                    onClick={() => setSearchTerm("")}
                    sx={{ color: "text.secondary", minWidth: "auto", p: 0.5 }}
                  >
                    <Clear />
                  </Button>
                )}
              </Paper>

              {/* No Results Message */}
              {filteredCards.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No management sections found matching "{searchTerm}"
                </Alert>
              )}
            </Box>

            <Grid
              container
              spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
              sx={{ mb: 3 }}
            >
              {filteredCards.map((card) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={6}
                  lg={6}
                  key={card.route}
                  sx={{ display: "flex" }}
                >
                  <Card
                    onClick={() =>
                      navigate(`/store/${slug}/admin/${card.route}`)
                    }
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: `1px solid ${card.color}30`,
                      background: `linear-gradient(135deg, ${card.color}08 0%, ${card.color}02 100%)`,
                      "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: `0 12px 24px ${card.color}30`,
                        borderColor: card.color,
                      },
                    }}
                  >
                    <CardContent
                      sx={{ flexGrow: 1, pb: 1, p: { xs: 1, sm: 1.5 } }}
                    >
                      <Box
                        sx={{
                          color: card.color,
                          mb: 1,
                          display: "flex",
                          justifyContent: "center",
                          fontSize: { xs: "28px", sm: "32px" },
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                          textAlign: "center",
                          fontSize: {
                            xs: "0.85rem",
                            sm: "0.9rem",
                            md: "0.95rem",
                          },
                          width: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: 1.3,
                        }}
                      >
                        {truncateTitle(card.title)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          textAlign: "center",
                          width: "100%",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          mb: 1,
                          fontSize: { xs: "0.65rem", sm: "0.7rem" },
                          lineHeight: 1.2,
                        }}
                      >
                        {truncateDescription(card.description)}
                      </Typography>
                      <Divider sx={{ my: 0.75 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          color: card.color,
                          fontWeight: 700,
                          textAlign: "center",
                          fontSize: {
                            xs: "1.25rem",
                            sm: "1.35rem",
                            md: "1.5rem",
                          },
                          mt: 0.75,
                        }}
                      >
                        {card.count}
                      </Typography>
                    </CardContent>
                    <CardActions
                      sx={{ justifyContent: "center", pt: 0.5, pb: 1 }}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          backgroundColor: card.color,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: { xs: "0.75rem", sm: "0.8rem" },
                          px: 2,
                          py: 0.5,
                          "&:hover": {
                            backgroundColor: card.color,
                            filter: "brightness(0.9)",
                          },
                        }}
                      >
                        Manage
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Quick Actions */}
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            }}
          >
            <Typography
              variant={isMobile ? "body1" : "h6"}
              sx={{
                fontWeight: 600,
                mb: 2,
                color: "#1a237e",
              }}
            >
              🚀 Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<People />}
                  onClick={() => navigate(`/store/${slug}/admin/users`)}
                  sx={{
                    py: { xs: 1, md: 1.2 },
                    fontSize: { xs: "0.8rem", md: "0.9rem" },
                  }}
                >
                  Add New User
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Inventory />}
                  onClick={() => navigate(`/store/${slug}/admin/products`)}
                  sx={{
                    py: { xs: 1, md: 1.2 },
                    fontSize: { xs: "0.8rem", md: "0.9rem" },
                  }}
                >
                  Add New Product
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Category />}
                  onClick={() => navigate(`/store/${slug}/admin/categories`)}
                  sx={{
                    py: { xs: 1, md: 1.2 },
                    fontSize: { xs: "0.8rem", md: "0.9rem" },
                  }}
                >
                  Add Category
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ShoppingCart />}
                  onClick={() => navigate(`/store/${slug}/admin/orders`)}
                  sx={{
                    py: { xs: 1, md: 1.2 },
                    fontSize: { xs: "0.8rem", md: "0.9rem" },
                  }}
                >
                  View Orders
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}

      <Dialog
        open={bankDialogOpen}
        onClose={() => !savingOther && setBankDialogOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 3 },
        }}
      >
        <DialogTitle>Bank & payout details</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Account holder name"
              name="bankAccountHolderName"
              value={bankForm.bankAccountHolderName}
              onChange={handleBankChange}
            />

            <TextField
              fullWidth
              label="Bank name"
              name="bankName"
              value={bankForm.bankName}
              onChange={handleBankChange}
            />

            <TextField
              fullWidth
              label="Account number"
              name="bankAccountNumber"
              type="password"
              value={bankForm.bankAccountNumber}
              onChange={handleBankChange}
              autoComplete="new-password"
            />

            <TextField
              fullWidth
              label="IFSC code"
              name="ifscCode"
              value={bankForm.ifscCode}
              onChange={handleBankChange}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setBankDialogOpen(false)}
            disabled={savingOther}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveBankDetails}
            disabled={savingOther}
          >
            {savingOther ? "Saving..." : "Save bank details"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={editStoreOpen}
        onClose={() => {
          if (!savingStore) setEditStoreOpen(false);
        }}
        fullScreen={isMobile}
        fullWidth
        maxWidth="md"
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? "100%" : "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800}>
                Edit store details
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Manage your business profile and storefront information.
              </Typography>
            </Box>

            <IconButton
              aria-label="Close edit store"
              disabled={savingStore}
              onClick={() => setEditStoreOpen(false)}
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: 2, sm: 3 },
            py: 3,
          }}
        >
          <Stack spacing={3}>
            {/* Business information */}

            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Business information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Business name"
                    name="businessName"
                    value={editForm.businessName}
                    onChange={handleFormChange}
                    error={!!formErrors.businessName}
                    helperText={formErrors.businessName}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    required
                    label="Business type"
                    name="businessType"
                    value={editForm.businessType}
                    onChange={handleFormChange}
                  >
                    {[
                      "FOOD",
                      "GROCERY",
                      "GARMENTS",
                      "ELECTRONICS",
                      "GENERAL",
                    ].map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Business description"
                    name="description"
                    value={editForm.description}
                    onChange={handleFormChange}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Contact information */}

            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Owner & contact information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Owner name"
                    name="ownerName"
                    value={editForm.ownerName}
                    onChange={handleFormChange}
                    error={!!formErrors.ownerName}
                    helperText={formErrors.ownerName}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Owner email"
                    name="ownerEmail"
                    value={editForm.ownerEmail}
                    onChange={handleFormChange}
                    error={!!formErrors.ownerEmail}
                    helperText={formErrors.ownerEmail}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Phone number"
                    name="ownerPhone"
                    value={editForm.ownerPhone}
                    onChange={handleFormChange}
                    inputProps={{ maxLength: 10, inputMode: "numeric" }}
                    error={!!formErrors.ownerPhone}
                    helperText={formErrors.ownerPhone}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Store URL */}

            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Storefront URL
              </Typography>

              <TextField
                fullWidth
                label="Store slug"
                name="storeSlug"
                value={editForm.storeSlug}
                onChange={(event) => {
                  const value = event.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z-]/g, "")
                    .replace(/^-+/, "");

                  setEditForm((prev) => ({
                    ...prev,
                    storeSlug: value,
                  }));

                  setFormErrors((prev) => ({
                    ...prev,
                    storeSlug: "",
                  }));
                }}
                error={!!formErrors.storeSlug}
                helperText={
                  formErrors.storeSlug ||
                  `Your store URL: ${window.location.origin}/store/${editForm.storeSlug}`
                }
                InputProps={{
                  startAdornment: (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mr: 0.5, whiteSpace: "nowrap" }}
                    >
                      /store/
                    </Typography>
                  ),
                }}
              />
            </Box>

            <Divider />

            {/* Business address */}

            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Business address
              </Typography>

              <Grid container spacing={2}>
                {[
                  ["addressLine1", "Address line 1"],
                  ["addressLine2", "Address line 2"],
                  ["landmark", "Landmark"],
                  ["city", "City"],
                  ["district", "District"],
                  ["state", "State"],
                  ["pincode", "Pincode"],
                  ["country", "Country"],
                ].map(([name, label]) => (
                  <Grid item xs={12} sm={6} key={name}>
                    <TextField
                      fullWidth
                      required={["city", "state"].includes(name)}
                      label={label}
                      name={name}
                      value={editForm[name]}
                      onChange={handleFormChange}
                      error={!!formErrors[name]}
                      helperText={formErrors[name]}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* Legal details */}

            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Legal & tax information
              </Typography>

              <Grid container spacing={2}>
                {[
                  ["gstNumber", "GST number"],
                  ["panNumber", "PAN number"],
                  ["licenseNumber", "Business license number"],
                ].map(([name, label]) => (
                  <Grid item xs={12} sm={6} key={name}>
                    <TextField
                      fullWidth
                      label={label}
                      name={name}
                      value={editForm[name]}
                      onChange={handleFormChange}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row" },
            "& > button": {
              width: { xs: "100%", sm: "auto" },
            },
          }}
        >
          <Button
            fullWidth={isMobile}
            variant="outlined"
            disabled={savingStore}
            onClick={() => setEditStoreOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>

          <Button
            fullWidth={isMobile}
            variant="contained"
            startIcon={
              savingStore ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveOutlined />
              )
            }
            disabled={savingStore}
            onClick={handleSaveStore}
            sx={{ textTransform: "none" }}
          >
            {savingStore ? "Saving..." : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>

    ///////////////////////////////////////
  );
};
//29sep 26 design chaneg from claue code

export default AdminDashboard;
