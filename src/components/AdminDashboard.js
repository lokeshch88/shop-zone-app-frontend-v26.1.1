// AdminDashboard.jsx — Production-ready merchant admin dashboard
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Paper,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Snackbar,
  Switch,
  FormControlLabel,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Collapse,
} from "@mui/material";
import {
  People,
  Inventory,
  Category,
  ShoppingCart,
  Store,
  CheckCircle,
  Cancel,
  ErrorOutline,
  Search,
  Clear,
  ExpandMore,
  BusinessOutlined,
  CreditCardOutlined,
  ReceiptLongOutlined,
  SecurityOutlined,
  LocationOnOutlined,
  AccountBalanceOutlined,
  SettingsOutlined,
  AddOutlined,
  StorefrontOutlined,
  EditOutlined,
  OpenInNewOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  SaveOutlined,
  Close,
  Dashboard,
  Menu as MenuIcon,
  ChevronRight,
  NotificationsOutlined,
  BarChart,
  LocalOffer,
  CardGiftcard,
  Tune,
  ContentCopy,
  Refresh,
  MoreVert,
  ExpandLess,
} from "@mui/icons-material";
import PaymentsIcon from "@mui/icons-material/Payments";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../utils/AxiosInstance";

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */
const T = {
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F3F6",
  border: "#E3E6EC",
  borderStrong: "#C8CDD8",
  primary: "#2E5BFF",
  primaryDark: "#1A3FCC",
  primaryLight: "#EEF2FF",
  primaryBorder: "#C0CDFF",
  success: "#00A86B",
  successBg: "#F0FBF6",
  successBorder: "#B3EDD7",
  warn: "#F59E0B",
  warnBg: "#FFFBEB",
  error: "#E53E3E",
  errorBg: "#FFF5F5",
  text: "#111827",
  text2: "#4B5563",
  text3: "#9CA3AF",
  sidebar: "#0F172A",
  sidebarHover: "rgba(255,255,255,0.07)",
  sidebarActive: "rgba(46,91,255,0.18)",
};

const ManagementAccordion = ({
  id,
  title,
  action,
  actionLabel = "Edit",
  openSection,
  setOpenSection,
  children,
}) => {
  const isOpen = openSection === id;

  return (
    <Accordion
      expanded={isOpen}
      onChange={() => setOpenSection((prev) => (prev === id ? null : id))}
      disableGutters
      elevation={0}
      sx={{
        mb: 1.25,
        background: T.surface,
        border: `1px solid ${isOpen ? T.primary : T.border}`,
        borderRadius: "12px !important",
        overflow: "hidden",

        "&:before": {
          display: "none",
        },

        transition: "border-color 0.2s ease",
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMore
            sx={{
              color: isOpen ? T.primary : T.text3,
            }}
          />
        }
        sx={{
          minHeight: 58,
          px: { xs: 1.75, sm: 2.25 },

          "&.Mui-expanded": {
            minHeight: 58,
          },

          "& .MuiAccordionSummary-content": {
            my: 1.25,
            alignItems: "center",
          },

          "& .MuiAccordionSummary-content.Mui-expanded": {
            my: 1.25,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            minWidth: 0,
            pr: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "0.82rem", sm: "0.86rem" },
              fontWeight: 700,
              color: T.text,
              letterSpacing: "0.01em",
            }}
          >
            {title}
          </Typography>

          {action && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                action();
              }}
              sx={{
                flexShrink: 0,
                ml: 1,
                minWidth: "auto",
                px: 1.25,
                py: 0.55,
                borderRadius: "7px",
                textTransform: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#1976d2",
                backgroundColor: "rgba(25, 118, 210, 0.08)",

                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.14)",
                },
              }}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          px: { xs: 1.75, sm: 2.25 },
          pt: 0,
          pb: 2,
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <Box sx={{ pt: 1.25 }}>{children}</Box>
      </AccordionDetails>
    </Accordion>
  );
};
/* ─────────────────────────────────────────────────────────────
   SIDEBAR WIDTH
───────────────────────────────────────────────────────────── */
const SIDEBAR_W = 228;

/* ─────────────────────────────────────────────────────────────
   SMALL HELPERS
───────────────────────────────────────────────────────────── */
const displayValue = (v) =>
  v !== null && v !== undefined && String(v).trim() !== "" ? v : "—";

const InfoRow = ({ label, value, mono }) => (
  <Box
    sx={{
      py: 0.85,
      borderBottom: `1px solid ${T.border}`,
      "&:last-child": { borderBottom: "none" },
    }}
  >
    <Typography
      sx={{
        fontSize: "0.68rem",
        fontWeight: 600,
        color: T.text3,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        mb: 0.3,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.82rem",
        fontWeight: 500,
        color: T.text,
        fontFamily: mono
          ? "'JetBrains Mono','Courier New',monospace"
          : "inherit",
        wordBreak: "break-all",
      }}
    >
      {displayValue(value)}
    </Typography>
  </Box>
);

const StatPill = ({ label, value, color }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      py: 0.75,
      borderBottom: `1px solid ${T.border}`,
      "&:last-child": { borderBottom: "none" },
    }}
  >
    <Typography sx={{ fontSize: "0.8rem", color: T.text2 }}>{label}</Typography>
    <Typography
      sx={{ fontSize: "0.82rem", fontWeight: 700, color: color || T.primary }}
    >
      {value ?? "—"}
    </Typography>
  </Box>
);

const SectionHeading = ({ title, action, actionLabel }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      mb: 1.75,
    }}
  >
    <Typography
      sx={{
        fontSize: "0.78rem",
        fontWeight: 700,
        color: T.text,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {title}
    </Typography>
    {action && (
      <Button
        size="small"
        onClick={action}
        sx={{
          fontSize: "0.72rem",
          textTransform: "none",
          color: T.primary,
          p: 0,
          minWidth: 0,
          fontWeight: 600,
        }}
      >
        {actionLabel || "Edit"}
      </Button>
    )}
  </Box>
);

const ToggleRow = ({ label, sub, checked, onChange }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      py: 1,
      borderBottom: `1px solid ${T.border}`,
      "&:last-child": { borderBottom: "none" },
    }}
  >
    <Box>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: T.text }}>
        {label}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: "0.7rem", color: T.text3, mt: 0.2 }}>
          {sub}
        </Typography>
      )}
    </Box>
    <Switch
      size="small"
      checked={!!checked}
      onChange={onChange}
      sx={{
        "& .MuiSwitch-switchBase.Mui-checked": { color: T.success },
        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
          backgroundColor: T.success,
        },
      }}
    />
  </Box>
);

/* ─────────────────────────────────────────────────────────────
   SIDEBAR NAV CONFIG
───────────────────────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    group: "Operations",
    items: [
      {
        id: "overview",
        label: "Overview",
        icon: <Dashboard sx={{ fontSize: 18 }} />,
        route: null,
      },
      {
        id: "orders",
        label: "Orders",
        icon: <ShoppingCart sx={{ fontSize: 18 }} />,
        route: "orders",
        statKey: "totalOrders",
      },
      {
        id: "products",
        label: "Products",
        icon: <Inventory sx={{ fontSize: 18 }} />,
        route: "products",
        statKey: "totalProducts",
      },
      {
        id: "categories",
        label: "Categories",
        icon: <Category sx={{ fontSize: 18 }} />,
        route: "categories",
        statKey: "totalCategories",
      },
    ],
  },
  {
    group: "Marketing",
    items: [
      {
        id: "coupons",
        label: "Coupons",
        icon: <LocalOffer sx={{ fontSize: 18 }} />,
        route: "coupons",
        statKey: "totalCoupons",
      },
      {
        id: "gift-cards",
        label: "Gift Cards",
        icon: <CardGiftcard sx={{ fontSize: 18 }} />,
        route: "gift-card",
      },
    ],
  },
  {
    group: "Store",
    items: [
      {
        id: "users",
        label: "Users",
        icon: <People sx={{ fontSize: 18 }} />,
        route: "users",
        statKey: "totalUsers",
      },
      {
        id: "merchants",
        label: "Merchants",
        icon: <Store sx={{ fontSize: 18 }} />,
        route: "merchants",
        statKey: "totalMerchants",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: <BarChart sx={{ fontSize: 18 }} />,
        route: "analytics",
      },
      {
        id: "settings",
        label: "Settings",
        icon: <SettingsOutlined sx={{ fontSize: 18 }} />,
        route: "settings",
      },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   FIELD SX
───────────────────────────────────────────────────────────── */
const fsx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: "0.875rem",
    "& fieldset": { borderColor: T.border },
    "&:hover fieldset": { borderColor: T.borderStrong },
    "&.Mui-focused fieldset": { borderColor: T.primary, borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": {
    padding: "9px 12px",
    fontSize: "0.875rem",
    color: T.text,
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.825rem",
    color: T.text2,
    "&.Mui-focused": { color: T.primary },
  },
  "& .MuiFormHelperText-root": {
    marginLeft: 0,
    fontSize: "0.7rem",
    marginTop: "3px",
  },
  "& .MuiSelect-select": { padding: "9px 12px", fontSize: "0.875rem" },
};

/* ─────────────────────────────────────────────────────────────
   DIALOGS
───────────────────────────────────────────────────────────── */

// Settings dialog
const SettingsDialog = ({ open, onClose, form, onChange, onSave, saving }) => (
  <Dialog
    open={open}
    onClose={() => !saving && onClose()}
    fullWidth
    maxWidth="xs"
    PaperProps={{ sx: { borderRadius: "14px" } }}
  >
    <DialogTitle sx={{ pb: 0, fontWeight: 700, fontSize: "1rem" }}>
      Store settings
      <Typography sx={{ fontSize: "0.78rem", color: T.text3, mt: 0.3 }}>
        Toggle features on or off for your storefront
      </Typography>
    </DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      <Box sx={{ mt: 1 }}>
        {[
          [
            "inventoryEnabled",
            "Inventory tracking",
            "Track stock levels per product",
          ],
          ["deliveryEnabled", "Delivery", "Accept delivery orders"],
          ["onlinePaymentEnabled", "Online payments", "Razorpay / UPI / cards"],
          ["cashOnDeliveryEnabled", "Cash on delivery", "Accept COD orders"],
          ["couponEnabled", "Coupons & offers", "Discount code engine"],
          ["reviewEnabled", "Customer reviews", "Allow product ratings"],
        ].map(([name, label, sub]) => (
          <ToggleRow
            key={name}
            label={label}
            sub={sub}
            checked={form[name]}
            onChange={(e) =>
              onChange({ target: { name, checked: e.target.checked } })
            }
          />
        ))}
      </Box>
    </DialogContent>
    <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
      <Button
        onClick={onClose}
        disabled={saving}
        variant="outlined"
        sx={{ textTransform: "none", borderRadius: "8px", fontSize: "0.82rem" }}
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        disabled={saving}
        variant="contained"
        sx={{
          textTransform: "none",
          borderRadius: "8px",
          fontSize: "0.82rem",
          background: T.primary,
          "&:hover": { background: T.primaryDark },
        }}
      >
        {saving ? (
          <CircularProgress size={14} color="inherit" />
        ) : (
          "Save settings"
        )}
      </Button>
    </DialogActions>
  </Dialog>
);

// Subscription dialog
const SubscriptionDialog = ({
  open,
  onClose,
  form,
  onChange,
  onSave,
  saving,
}) => (
  <Dialog
    open={open}
    onClose={() => !saving && onClose()}
    fullWidth
    maxWidth="xs"
    PaperProps={{ sx: { borderRadius: "14px" } }}
  >
    <DialogTitle sx={{ pb: 0, fontWeight: 700, fontSize: "1rem" }}>
      Manage plan & limits
      <Typography sx={{ fontSize: "0.78rem", color: T.text3, mt: 0.3 }}>
        Change subscription tier and resource caps
      </Typography>
    </DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          fullWidth
          select
          label="Subscription plan"
          name="subscriptionPlan"
          value={form.subscriptionPlan}
          onChange={onChange}
          size="small"
          sx={fsx}
        >
          {["FREE", "BASIC", "PRO", "ENTERPRISE"].map((p) => (
            <MenuItem key={p} value={p} sx={{ fontSize: "0.875rem" }}>
              {p}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          label="Max products"
          name="maxProducts"
          type="number"
          value={form.maxProducts}
          onChange={onChange}
          size="small"
          sx={fsx}
          inputProps={{ min: 0 }}
        />
        <TextField
          fullWidth
          label="Max users"
          name="maxUsers"
          type="number"
          value={form.maxUsers}
          onChange={onChange}
          size="small"
          sx={fsx}
          inputProps={{ min: 0 }}
        />
        <TextField
          fullWidth
          label="Max branches"
          name="maxBranches"
          type="number"
          value={form.maxBranches}
          onChange={onChange}
          size="small"
          sx={fsx}
          inputProps={{ min: 0 }}
        />
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
      <Button
        onClick={onClose}
        disabled={saving}
        variant="outlined"
        sx={{ textTransform: "none", borderRadius: "8px", fontSize: "0.82rem" }}
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        disabled={saving}
        variant="contained"
        sx={{
          textTransform: "none",
          borderRadius: "8px",
          fontSize: "0.82rem",
          background: T.primary,
          "&:hover": { background: T.primaryDark },
        }}
      >
        {saving ? (
          <CircularProgress size={14} color="inherit" />
        ) : (
          "Update plan"
        )}
      </Button>
    </DialogActions>
  </Dialog>
);

// Bank details dialog
const BankDialog = ({ open, onClose, form, onChange, onSave, saving }) => (
  <Dialog
    open={open}
    onClose={() => !saving && onClose()}
    fullWidth
    maxWidth="xs"
    PaperProps={{ sx: { borderRadius: "14px" } }}
  >
    <DialogTitle sx={{ pb: 0, fontWeight: 700, fontSize: "1rem" }}>
      Bank & payout details
      <Typography sx={{ fontSize: "0.78rem", color: T.text3, mt: 0.3 }}>
        Used for settlement transfers to your account
      </Typography>
    </DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      <Stack spacing={2} sx={{ mt: 1 }}>
        {[
          ["bankAccountHolderName", "Account holder name", "text"],
          ["bankName", "Bank name", "text"],
          ["bankAccountNumber", "Account number", "password"],
          ["ifscCode", "IFSC code", "text"],
        ].map(([name, label, type]) => (
          <TextField
            key={name}
            fullWidth
            label={label}
            name={name}
            type={type}
            value={form[name]}
            onChange={onChange}
            size="small"
            sx={fsx}
            autoComplete={type === "password" ? "new-password" : "off"}
          />
        ))}
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
      <Button
        onClick={onClose}
        disabled={saving}
        variant="outlined"
        sx={{ textTransform: "none", borderRadius: "8px", fontSize: "0.82rem" }}
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        disabled={saving}
        variant="contained"
        sx={{
          textTransform: "none",
          borderRadius: "8px",
          fontSize: "0.82rem",
          background: T.primary,
          "&:hover": { background: T.primaryDark },
        }}
      >
        {saving ? (
          <CircularProgress size={14} color="inherit" />
        ) : (
          "Save bank details"
        )}
      </Button>
    </DialogActions>
  </Dialog>
);

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const [storeDetails, setStoreDetails] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCategories: 0,
    totalCoupons: 0,
    totalMerchants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();
  const theme = useTheme();
  // Only show persistent sidebar on lg+ screens; everything smaller gets the drawer
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const { slug } = useParams();
  const merchantId = localStorage.getItem("merchantId");
  // const API = "http://localhost:8080";

  // Dialog states
  const [editStoreOpen, setEditStoreOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [savingOther, setSavingOther] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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

  const showNotification = (message, severity = "success") =>
    setNotification({ open: true, message, severity });

  /* ── handlers (all original logic preserved) ── */
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
    setFormErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSettingsChange = (e) => {
    const { name, checked } = e.target;
    setSettingsForm((p) => ({ ...p, [name]: checked }));
  };

  const handleSubscriptionChange = (e) => {
    const { name, value } = e.target;
    setSubscriptionForm((p) => ({ ...p, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankForm((p) => ({ ...p, [name]: value }));
  };

  const handleEditStore = async (merchant = storeDetails) => {
    if (!merchant?.id) {
      showNotification("Merchant ID is missing.", "error");
      return;
    }
    try {
      const response = await axios.get(`/api/merchants/${merchant.id}`);
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
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Unable to load merchant details.",
        "error",
      );
    }
  };
  const [openInfoSection, setOpenInfoSection] = useState("business");

  const validateStoreForm = () => {
    const errors = {};
    if (!editForm.businessName.trim())
      errors.businessName = "Business name is required";
    if (!editForm.ownerName.trim()) errors.ownerName = "Owner name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.ownerEmail))
      errors.ownerEmail = "Enter a valid email";
    if (!/^\d{10}$/.test(editForm.ownerPhone))
      errors.ownerPhone = "10-digit phone required";
    if (!editForm.city.trim()) errors.city = "City is required";
    if (!editForm.state.trim()) errors.state = "State is required";
    if (editForm.storeSlug && !/^[a-z]+(?:-[a-z]+)*$/.test(editForm.storeSlug))
      errors.storeSlug = "Lowercase letters and hyphens only";
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
      const response = await axios.put(`/api/merchants/${storeDetails.id}`, {
        ...editForm,
        storeSlug: editForm.storeSlug.toLowerCase().trim(),
      });
      const updated = response.data?.result || response.data;
      setStoreDetails((p) => ({ ...p, ...updated }));
      setEditStoreOpen(false);
      showNotification("Store details updated successfully.");
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to update store details.",
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
        `/api/merchants/${storeDetails.id}/bank-details`,
        bankForm,
      );
      setStoreDetails((p) => ({
        ...p,
        bankAccountHolderName: bankForm.bankAccountHolderName,
        bankName: bankForm.bankName,
        ifscCode: bankForm.ifscCode,
      }));
      setBankDialogOpen(false);
      showNotification("Bank details updated.");
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Unable to save bank details.",
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
        `/api/merchants/${storeDetails.id}/settings`,
        settingsForm,
      );
      setStoreDetails((p) => ({ ...p, ...settingsForm }));
      setSettingsDialogOpen(false);
      showNotification("Store settings updated.");
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Unable to save settings.",
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
        `/api/merchants/${storeDetails.id}/subscription`,
        subscriptionForm,
      );
      setStoreDetails((p) => ({ ...p, ...subscriptionForm }));
      setSubscriptionDialogOpen(false);
      showNotification("Subscription updated.");
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Unable to update subscription.",
        "error",
      );
    } finally {
      setSavingOther(false);
    }
  };

  const handleBillingHistory = () => {
    /* navigate to billing page */
  };
  const handleManageBranches = () => {
    navigate(`/store/${slug}/admin/branches`);
  };

  const copyStoreUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  /* ── data fetching (all original logic) ── */
  useEffect(() => {
    fetchStoreDetails();
    fetchStats();
  }, [slug]);

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
        axios.get("/user/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/products/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/category/get-all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/orders/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/coupons/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/merchants", {
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

  /* ── computed ── */
  const store = storeDetails;
  const isActive =
    store?.active === true || String(store?.active).toLowerCase() === "true";
  const storeUrl = store
    ? store.customDomainEnabled && store.customDomain
      ? `https://${store.customDomain}`
      : `${window.location.origin}/store/${store.storeSlug || ""}`
    : "";

  const requiredFields = store
    ? [
        store.businessName,
        store.businessType,
        store.ownerName,
        store.ownerEmail,
        store.ownerPhone,
        store.city,
        store.state,
        store.storeSlug,
      ]
    : [];
  const completedFields = requiredFields.filter(
    (v) => v !== null && v !== undefined && String(v).trim() !== "",
  ).length;
  const completion = requiredFields.length
    ? Math.round((completedFields / requiredFields.length) * 100)
    : 0;

  const navItems = NAV_SECTIONS.flatMap((s) => s.items);
  const filteredNavItems = searchTerm
    ? navItems.filter((i) =>
        i.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  /* ── SIDEBAR ── */
  const SidebarContent = () => (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: T.sidebar,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "8px",
            background: T.primary,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <StorefrontOutlined sx={{ color: "#fff", fontSize: "1rem" }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {store?.businessName || "Admin Panel"}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.35)",
              mt: 0.1,
            }}
          >
            {store?.subscriptionPlan || "FREE"} plan
          </Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          py: 1.5,
          "&::-webkit-scrollbar": { width: 0 },
        }}
      >
        {NAV_SECTIONS.map((section) => (
          <Box key={section.group} sx={{ mb: 0.5 }}>
            <Typography
              sx={{
                px: 2.5,
                pt: 1.25,
                pb: 0.5,
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.09em",
                color: "rgba(255,255,255,0.28)",
                textTransform: "uppercase",
              }}
            >
              {section.group}
            </Typography>
            {section.items.map((item) => {
              const isActive2 = activeSection === item.id;
              const count = item.statKey ? stats[item.statKey] : null;
              return (
                <Box
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    if (item.route)
                      navigate(`/store/${slug}/admin/${item.route}`);
                    if (isMobile) setMobileDrawerOpen(false);
                  }}
                  sx={{
                    mx: 1,
                    mb: 0.25,
                    px: 1.5,
                    py: 0.9,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: isActive2 ? T.sidebarActive : "transparent",
                    "&:hover": {
                      background: isActive2 ? T.sidebarActive : T.sidebarHover,
                    },
                  }}
                >
                  <Box
                    sx={{
                      color: isActive2 ? T.primary : "rgba(255,255,255,0.45)",
                      flexShrink: 0,
                      display: "flex",
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: "0.82rem",
                      fontWeight: isActive2 ? 600 : 400,
                      color: isActive2 ? "#fff" : "rgba(255,255,255,0.6)",
                      lineHeight: 1,
                    }}
                  >
                    {item.label}
                  </Typography>
                  {count !== null && count !== undefined && (
                    <Typography
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: isActive2 ? T.primary : "rgba(255,255,255,0.3)",
                        background: isActive2
                          ? T.primaryLight
                          : "rgba(255,255,255,0.07)",
                        px: 0.75,
                        py: 0.15,
                        borderRadius: "20px",
                        minWidth: 22,
                        textAlign: "center",
                      }}
                    >
                      {count}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 2,
          py: 1.75,
          borderTop: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: "0.72rem",
              fontWeight: 700,
              background: T.primary,
            }}
          >
            {store?.ownerName?.charAt(0)?.toUpperCase() || "A"}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#fff",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {store?.ownerName || "Admin"}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.62rem",
                color: "rgba(255,255,255,0.3)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {store?.ownerEmail || ""}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  /* ── TOPBAR ── */
  const Topbar = () => (
    <Box
      sx={{
        height: 54,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        px: { xs: 1.5, sm: 2.5 },
        gap: 1.5,
        position: "sticky",
        top: 0,
        zIndex: 100,
        /* Needed so the search dropdown positions relative to this bar */
      }}
    >
      {/* Hamburger — shown whenever sidebar is hidden (< lg) */}
      {isTablet && (
        <IconButton
          size="small"
          onClick={() => setMobileDrawerOpen(true)}
          sx={{ color: T.text2, flexShrink: 0 }}
        >
          <MenuIcon sx={{ fontSize: "1.2rem" }} />
        </IconButton>
      )}

      {/* Search wrapper — position:relative anchors the dropdown */}
      <Box sx={{ position: "relative", flex: 1, maxWidth: 340 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            background: T.surfaceAlt,
            border: `1px solid ${T.border}`,
            borderRadius: "8px",
            px: 1.25,
            py: 0.6,
          }}
        >
          <Search sx={{ fontSize: "1rem", color: T.text3, flexShrink: 0 }} />
          <Box
            component="input"
            type="text"
            placeholder="Search sections…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              border: "none",
              background: "transparent",
              outline: "none",
              flex: 1,
              fontSize: "0.82rem",
              color: T.text,
              fontFamily: "inherit",
              minWidth: 0,
              "&::placeholder": { color: T.text3 },
            }}
          />
          {searchTerm && (
            <IconButton
              size="small"
              onClick={() => setSearchTerm("")}
              sx={{ p: 0, color: T.text3 }}
            >
              <Clear sx={{ fontSize: "0.9rem" }} />
            </IconButton>
          )}
        </Box>

        {/* Dropdown anchored under the search box, not the page */}
        {searchTerm && filteredNavItems.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 300,
              overflow: "hidden",
            }}
          >
            {filteredNavItems.map((item) => (
              <Box
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.route)
                    navigate(`/store/${slug}/admin/${item.route}`);
                  setSearchTerm("");
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  cursor: "pointer",
                  "&:hover": { background: T.surfaceAlt },
                  borderBottom: `1px solid ${T.border}`,
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Box sx={{ color: T.text3, display: "flex" }}>{item.icon}</Box>
                <Typography sx={{ fontSize: "0.82rem", color: T.text }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          ml: "auto",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexShrink: 0,
        }}
      >
        <Tooltip title="Refresh data">
          <IconButton
            size="small"
            onClick={() => {
              fetchStoreDetails();
              fetchStats();
            }}
            sx={{ color: T.text3 }}
          >
            <Refresh sx={{ fontSize: "1.1rem" }} />
          </IconButton>
        </Tooltip>
        <IconButton size="small" sx={{ color: T.text3 }}>
          <NotificationsOutlined sx={{ fontSize: "1.1rem" }} />
        </IconButton>
        {store && (
          <Tooltip title="View storefront">
            <IconButton
              size="small"
              onClick={() => window.open(storeUrl, "_blank")}
              disabled={!store.storeSlug && !store.customDomain}
              sx={{ color: T.text3 }}
            >
              <OpenInNewOutlined sx={{ fontSize: "1.1rem" }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  /* ── OVERVIEW CONTENT — plain render function, not a React component
       (avoids remount/layout-thrash from nested component definitions) ── */
  const renderOverview = () => {
    if (!store) return null;

    const planColor =
      {
        FREE: T.text3,
        BASIC: "#0891B2",
        PRO: T.primary,
        ENTERPRISE: "#7C3AED",
      }[store.subscriptionPlan] || T.text3;

    return (
      <Box>
        {/* Store header card */}
        <Box
          sx={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: "12px",
            overflow: "hidden",
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              height: 4,
              background: `linear-gradient(90deg, ${T.primary}, #7C3AED)`,
            }}
          />
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Avatar
                variant="rounded"
                src={store.logoUrl || ""}
                sx={{
                  width: { xs: 44, sm: 52 },
                  height: { xs: 44, sm: 52 },
                  bgcolor: T.primaryLight,
                  color: T.primary,
                  borderRadius: "10px",
                  flexShrink: 0,
                }}
              >
                <StorefrontOutlined />
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.2rem" },
                      fontWeight: 800,
                      color: T.text,
                      lineHeight: 1.2,
                    }}
                  >
                    {store.businessName || "Your Store"}
                  </Typography>
                  <Chip
                    size="small"
                    label={isActive ? "Live" : "Offline"}
                    icon={
                      isActive ? (
                        <CheckCircleOutline
                          sx={{ fontSize: "0.8rem !important" }}
                        />
                      ) : (
                        <WarningAmberOutlined
                          sx={{ fontSize: "0.8rem !important" }}
                        />
                      )
                    }
                    sx={{
                      height: 20,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      background: isActive ? T.successBg : T.errorBg,
                      color: isActive ? T.success : T.error,
                      border: `1px solid ${isActive ? T.successBorder : "#FEB2B2"}`,
                      "& .MuiChip-icon": {
                        color: isActive ? T.success : T.error,
                      },
                    }}
                  />
                </Box>
                <Typography
                  sx={{ fontSize: "0.75rem", color: T.text3, mt: 0.3 }}
                >
                  ID: {store.merchantCode || store.id} ·{" "}
                  {store.businessType || "Type not set"}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.75,
                    mt: 1,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Chip
                    size="small"
                    label={store.subscriptionPlan || "FREE"}
                    sx={{
                      height: 20,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      background: T.primaryLight,
                      color: planColor,
                      border: `1px solid ${T.primaryBorder}`,
                    }}
                  />
                  {store.city && (
                    <Typography sx={{ fontSize: "0.72rem", color: T.text3 }}>
                      📍 {store.city}, {store.state}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Stack
                direction={{ xs: "row", sm: "column" }}
                gap={1}
                sx={{ flexShrink: 0 }}
              >
                <Button
                  size="small"
                  variant="contained"
                  startIcon={
                    <EditOutlined sx={{ fontSize: "0.9rem !important" }} />
                  }
                  onClick={() => handleEditStore(store)}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    borderRadius: "8px",
                    py: 0.7,
                    px: 1.5,
                    background: T.primary,
                    "&:hover": { background: T.primaryDark },
                    boxShadow: "none",
                  }}
                >
                  Edit store
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    <OpenInNewOutlined sx={{ fontSize: "0.9rem !important" }} />
                  }
                  onClick={() => window.open(storeUrl, "_blank")}
                  disabled={!store.storeSlug && !store.customDomain}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    borderRadius: "8px",
                    py: 0.7,
                    px: 1.5,
                    borderColor: T.border,
                    color: T.text2,
                    "&:hover": { borderColor: T.primary, color: T.primary },
                  }}
                >
                  View store
                </Button>
              </Stack>
            </Box>

            {/* Store URL strip */}
            <Box
              sx={{
                mt: 2,
                p: 1.25,
                background: T.surfaceAlt,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                border: `1px solid ${T.border}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: T.text3,
                  flexShrink: 0,
                }}
              >
                URL
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  color: T.text,
                  flex: 1,
                  wordBreak: "break-all",
                  fontFamily: "'Courier New',monospace",
                }}
              >
                {storeUrl}
              </Typography>
              <Button
                size="small"
                onClick={() => copyStoreUrl(storeUrl)}
                startIcon={
                  <ContentCopy sx={{ fontSize: "0.8rem !important" }} />
                }
                sx={{
                  textTransform: "none",
                  fontSize: "0.7rem",
                  color: copiedUrl ? T.success : T.primary,
                  fontWeight: 600,
                  minWidth: 0,
                  py: 0.3,
                  flexShrink: 0,
                }}
              >
                {copiedUrl ? "Copied!" : "Copy"}
              </Button>
            </Box>

            {/* Profile completion */}
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.6,
                }}
              >
                <Typography
                  sx={{ fontSize: "0.75rem", fontWeight: 600, color: T.text2 }}
                >
                  Profile completion
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: completion >= 100 ? T.success : T.primary,
                  }}
                >
                  {completion}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completion}
                sx={{
                  height: 5,
                  borderRadius: 4,
                  background: T.surfaceAlt,
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    background:
                      completion >= 100
                        ? T.success
                        : `linear-gradient(90deg, ${T.primary}, #7C3AED)`,
                  },
                }}
              />
              {completion < 100 && (
                <Typography
                  sx={{ fontSize: "0.7rem", color: T.text3, mt: 0.6 }}
                >
                  Complete business info, address, and store URL to finish
                  setup.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        {/* Stats row */}
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {[
            {
              label: "Orders",
              value: stats.totalOrders,
              color: "#7C3AED",
              route: "orders",
            },
            {
              label: "Products",
              value: stats.totalProducts,
              color: T.success,
              route: "products",
            },
            {
              label: "Users",
              value: stats.totalUsers,
              color: T.primary,
              route: "users",
            },
            {
              label: "Categories",
              value: stats.totalCategories,
              color: T.warn,
              route: "categories",
            },
            {
              label: "Coupons",
              value: stats.totalCoupons,
              color: "#0891B2",
              route: "coupons",
            },
            {
              label: "Merchants",
              value: stats.totalMerchants,
              color: "#DB2777",
              route: "merchants",
            },
          ].map((s) => (
            <Grid item xs={6} sm={4} md={2} key={s.label}>
              <Box
                onClick={() => navigate(`/store/${slug}/admin/${s.route}`)}
                sx={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: "10px",
                  p: { xs: 1.25, sm: 1.5 },
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  "&:hover": {
                    borderColor: s.color,
                    transform: "translateY(-2px)",
                    boxShadow: `0 4px 16px ${s.color}20`,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: "1.5rem", sm: "1.8rem" },
                    fontWeight: 800,
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    color: T.text3,
                    mt: 0.4,
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        {/* Main management grid */}
        <Grid container spacing={2} sx={{ mb: 2.5 }} alignItems="stretch">
          {/* Business info */}
          {/* <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
            <Box
              sx={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                p: 2,
                width: "100%",
              }}
            >
              <SectionHeading
                title="Business info"
                action={() => handleEditStore(store)}
                actionLabel="Edit"
              />
              <InfoRow label="Business name" value={store.businessName} />
              <InfoRow label="Owner" value={store.ownerName} />
              <InfoRow label="Email" value={store.ownerEmail || store.email} />
              <InfoRow label="Phone" value={store.ownerPhone} />
              <InfoRow label="Type" value={store.businessType} />
            </Box>
          </Grid> */}

          {/* ============================================================
    STORE INFORMATION - COLLAPSIBLE SECTIONS
============================================================ */}

          <Box sx={{ mb: 2.5 }}>
            {/* Business Info */}
            <ManagementAccordion
              id="business"
              title="Business info"
              action={() => handleEditStore(store)}
              actionLabel="Edit"
              openSection={openInfoSection}
              setOpenSection={setOpenInfoSection}
            >
              <InfoRow label="Business name" value={store.businessName} />

              <InfoRow label="Owner" value={store.ownerName} />

              <InfoRow label="Email" value={store.ownerEmail || store.email} />

              <InfoRow label="Phone" value={store.ownerPhone} />

              <InfoRow label="Type" value={store.businessType} />
            </ManagementAccordion>

            {/* Address */}
            <ManagementAccordion
              id="address"
              title="Address"
              action={() => handleEditStore(store)}
              actionLabel="Edit"
              openSection={openInfoSection}
              setOpenSection={setOpenInfoSection}
            >
              <InfoRow label="Street" value={store.addressLine1} />

              <InfoRow label="City" value={store.city} />

              <InfoRow label="State" value={store.state} />

              <InfoRow label="Pincode" value={store.pincode} />

              <InfoRow label="Country" value={store.country} />
            </ManagementAccordion>

            {/* Store Features */}
            <ManagementAccordion
              id="features"
              title="Store features"
              action={handleStoreSettings}
              actionLabel="Manage"
              openSection={openInfoSection}
              setOpenSection={setOpenInfoSection}
            >
              {[
                ["Inventory", store.inventoryEnabled],
                ["Delivery", store.deliveryEnabled],
                ["Online pay", store.onlinePaymentEnabled],
                ["COD", store.cashOnDeliveryEnabled],
                ["Coupons", store.couponEnabled],
                ["Reviews", store.reviewEnabled],
              ].map(([label, val]) => {
                const on = val === true || val === "true";

                return (
                  <Box
                    key={label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1,
                      borderBottom: `1px solid ${T.border}`,

                      "&:last-child": {
                        borderBottom: "none",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        color: T.text2,
                      }}
                    >
                      {label}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: on ? T.success : T.text3,
                      }}
                    >
                      {val === null ||
                      val === undefined ||
                      String(val).trim() === ""
                        ? "—"
                        : on
                          ? "On"
                          : "Off"}
                    </Typography>
                  </Box>
                );
              })}
            </ManagementAccordion>

            {/* Subscription */}
            <ManagementAccordion
              id="subscription"
              title="Subscription"
              action={handleManageSubscription}
              actionLabel="Manage"
              openSection={openInfoSection}
              setOpenSection={setOpenInfoSection}
            >
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    color: planColor,
                    lineHeight: 1,
                  }}
                >
                  {store.subscriptionPlan || "FREE"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: T.text3,
                    mt: 0.5,
                  }}
                >
                  {store.subscriptionStatus || "Active"}
                </Typography>
              </Box>

              <StatPill label="Max products" value={store.maxProducts} />

              <StatPill label="Max users" value={store.maxUsers} />

              <StatPill label="Max branches" value={store.maxBranches} />

              <StatPill
                label="Payment"
                value={store.paymentStatus}
                color={store.paymentStatus === "PAID" ? T.success : T.warn}
              />
            </ManagementAccordion>

            {/* Legal */}
            <ManagementAccordion
              id="legal"
              title="Legal & tax"
              action={() => handleEditStore(store)}
              actionLabel="Edit"
              openSection={openInfoSection}
              setOpenSection={setOpenInfoSection}
            >
              <InfoRow label="GST number" value={store.gstNumber} mono />

              <InfoRow label="PAN number" value={store.panNumber} mono />

              <InfoRow label="License no." value={store.licenseNumber} mono />

              <InfoRow
                label="Verified"
                value={
                  store.isVerified === true ? "Verified ✓" : "Not verified"
                }
              />
            </ManagementAccordion>

            {/* Bank */}
            <ManagementAccordion
              id="bank"
              title="Bank & payouts"
              action={handleEditBankDetails}
              actionLabel="Edit"
              openSection={openInfoSection}
              setOpenSection={setOpenInfoSection}
            >
              <InfoRow
                label="Account holder"
                value={store.bankAccountHolderName}
              />

              <InfoRow label="Bank name" value={store.bankName} />

              <InfoRow
                label="Account no."
                value={
                  store.bankAccountNumber
                    ? `••••${String(store.bankAccountNumber).slice(-4)}`
                    : null
                }
              />

              <InfoRow label="IFSC" value={store.ifscCode} mono />
            </ManagementAccordion>

            {/* Billing */}
            <ManagementAccordion
              id="billing"
              title="Billing"
              action={handleBillingHistory}
              actionLabel="History"
              openSection={openInfoSection}
              setOpenSection={setOpenInfoSection}
            >
              <InfoRow label="Payment status" value={store.paymentStatus} />

              <InfoRow label="Currency" value={store.currency} />

              <InfoRow
                label="Subscription from"
                value={
                  store.subscriptionStartDate
                    ? new Date(store.subscriptionStartDate).toLocaleDateString()
                    : null
                }
              />

              <InfoRow
                label="Renews"
                value={
                  store.subscriptionEndDate
                    ? new Date(store.subscriptionEndDate).toLocaleDateString()
                    : null
                }
              />

              <InfoRow
                label="Monthly charge"
                value={
                  store.monthlySubscription
                    ? `₹${store.monthlySubscription}`
                    : null
                }
              />
            </ManagementAccordion>

            {/* Branches */}
            <ManagementAccordion
              id="branches"
              title="Branches & locations"
              action={handleManageBranches}
              actionLabel="Manage"
              openSection={openInfoSection}
              setOpenSection={setOpenInfoSection}
            >
              {store.branches?.length > 0 ? (
                <Grid container spacing={1}>
                  {store.branches.map((branch) => (
                    <Grid item xs={12} sm={6} key={branch.id}>
                      <Box
                        sx={{
                          p: 1.25,
                          border: `1px solid ${T.border}`,
                          borderRadius: "8px",

                          "&:hover": {
                            borderColor: T.primary,
                            background: T.primaryLight,
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: T.text,
                          }}
                        >
                          {branch.branchName}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: "0.72rem",
                            color: T.text3,
                            mt: 0.2,
                          }}
                        >
                          {branch.city || "Location not set"}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 2.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.82rem",
                      color: T.text3,
                      mb: 1.25,
                    }}
                  >
                    No branches added yet.
                  </Typography>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      <AddOutlined
                        sx={{
                          fontSize: "0.9rem !important",
                        }}
                      />
                    }
                    onClick={handleManageBranches}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.78rem",
                      borderRadius: "8px",
                      borderColor: T.border,
                      color: T.text2,
                    }}
                  >
                    Add first branch
                  </Button>
                </Box>
              )}
            </ManagementAccordion>
          </Box>

          {/* Address
          <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
            <Box
              sx={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                p: 2,
                width: "100%",
              }}
            >
              <SectionHeading
                title="Address"
                action={() => handleEditStore(store)}
                actionLabel="Edit"
              />
              <InfoRow label="Street" value={store.addressLine1} />
              <InfoRow label="City" value={store.city} />
              <InfoRow label="State" value={store.state} />
              <InfoRow label="Pincode" value={store.pincode} />
              <InfoRow label="Country" value={store.country} />
            </Box>
          </Grid>

          {/* Store settings */}
          {/* <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
            <Box
              sx={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                p: 2,
                width: "100%",
              }}
            >
              <SectionHeading
                title="Store features"
                action={handleStoreSettings}
                actionLabel="Configure"
              />
              {[
                ["Inventory", store.inventoryEnabled],
                ["Delivery", store.deliveryEnabled],
                ["Online pay", store.onlinePaymentEnabled],
                ["COD", store.cashOnDeliveryEnabled],
                ["Coupons", store.couponEnabled],
                ["Reviews", store.reviewEnabled],
              ].map(([label, val]) => {
                const on = val === true || val === "true";
                return (
                  <Box
                    key={label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 0.75,
                      borderBottom: `1px solid ${T.border}`,
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Typography sx={{ fontSize: "0.8rem", color: T.text2 }}>
                      {label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: on ? T.success : T.text3,
                      }}
                    >
                      {val === null ||
                      val === undefined ||
                      String(val).trim() === ""
                        ? "—"
                        : on
                          ? "On"
                          : "Off"}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Grid> */}

          {/* Plan */}
          {/* <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
            <Box
              sx={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                p: 2,
                width: "100%",
              }}
            >
              <SectionHeading
                title="Subscription"
                action={handleManageSubscription}
                actionLabel="Manage"
              />
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: planColor,
                    lineHeight: 1,
                  }}
                >
                  {store.subscriptionPlan || "FREE"}
                </Typography>
                <Typography
                  sx={{ fontSize: "0.7rem", color: T.text3, mt: 0.3 }}
                >
                  {store.subscriptionStatus || "Active"}
                </Typography>
              </Box>
              <StatPill label="Max products" value={store.maxProducts} />
              <StatPill label="Max users" value={store.maxUsers} />
              <StatPill label="Max branches" value={store.maxBranches} />
              <StatPill
                label="Payment"
                value={store.paymentStatus}
                color={store.paymentStatus === "PAID" ? T.success : T.warn}
              />
            </Box>
          </Grid> */}

          {/* Legal */}
          {/* <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
            <Box
              sx={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                p: 2,
                width: "100%",
              }}
            >
              <SectionHeading
                title="Legal & tax"
                action={() => handleEditStore(store)}
                actionLabel="Edit"
              />
              <InfoRow label="GST number" value={store.gstNumber} mono />
              <InfoRow label="PAN number" value={store.panNumber} mono />
              <InfoRow label="License no." value={store.licenseNumber} mono />
              <InfoRow
                label="Verified"
                value={
                  store.isVerified === true ? "Verified ✓" : "Not verified"
                }
              />
            </Box>
          </Grid>

          {/* Bank */}
          {/* <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
            <Box
              sx={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                p: 2,
                width: "100%",
              }}
            >
              <SectionHeading
                title="Bank & payouts"
                action={handleEditBankDetails}
                actionLabel="Edit"
              />
              <InfoRow
                label="Account holder"
                value={store.bankAccountHolderName}
              />
              <InfoRow label="Bank name" value={store.bankName} />
              <InfoRow
                label="Account no."
                value={
                  store.bankAccountNumber
                    ? `••••${String(store.bankAccountNumber).slice(-4)}`
                    : null
                }
              />
              <InfoRow label="IFSC" value={store.ifscCode} mono />
            </Box>
          </Grid> */}

          {/* Billing */}
          {/* <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
            <Box
              sx={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                p: 2,
                width: "100%",
              }}
            >
              <SectionHeading
                title="Billing"
                action={handleBillingHistory}
                actionLabel="History"
              />
              <InfoRow label="Payment status" value={store.paymentStatus} />
              <InfoRow label="Currency" value={store.currency} />
              <InfoRow
                label="Subscription from"
                value={
                  store.subscriptionStartDate
                    ? new Date(store.subscriptionStartDate).toLocaleDateString()
                    : null
                }
              />
              <InfoRow
                label="Renews"
                value={
                  store.subscriptionEndDate
                    ? new Date(store.subscriptionEndDate).toLocaleDateString()
                    : null
                }
              />
              <InfoRow
                label="Monthly charge"
                value={
                  store.monthlySubscription
                    ? `₹${store.monthlySubscription}`
                    : null
                }
              />
            </Box>
          </Grid> */}

          {/* Branches */}
          {/* <Grid item xs={12} sm={6} md={8} sx={{ display: "flex" }}>
            <Box
              sx={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                p: 2,
                width: "100%",
              }}
            >
              <SectionHeading
                title="Branches & locations"
                action={handleManageBranches}
                actionLabel="Manage all"
              />
              {store.branches?.length > 0 ? (
                <Grid container spacing={1}>
                  {store.branches.map((branch) => (
                    <Grid item xs={12} sm={6} key={branch.id}>
                      <Box
                        sx={{
                          p: 1.25,
                          border: `1px solid ${T.border}`,
                          borderRadius: "8px",
                          "&:hover": {
                            borderColor: T.primary,
                            background: T.primaryLight,
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: T.text,
                          }}
                        >
                          {branch.branchName}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.72rem", color: T.text3, mt: 0.2 }}
                        >
                          {branch.city || "Location not set"}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography
                    sx={{ fontSize: "0.82rem", color: T.text3, mb: 1.25 }}
                  >
                    No branches added yet.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      <AddOutlined sx={{ fontSize: "0.9rem !important" }} />
                    }
                    onClick={handleManageBranches}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.78rem",
                      borderRadius: "8px",
                      borderColor: T.border,
                      color: T.text2,
                    }}
                  >
                    Add first branch
                  </Button>
                </Box>
              )}
            </Box> 
          </Grid> */}
        </Grid>

        {/* Quick actions */}
        <Box
          sx={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: "12px",
            p: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: T.text,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              mb: 1.5,
            }}
          >
            Quick actions
          </Typography>
          <Grid container spacing={1}>
            {[
              {
                label: "Add product",
                icon: <Inventory sx={{ fontSize: 16 }} />,
                route: "products",
              },
              {
                label: "View orders",
                icon: <ShoppingCart sx={{ fontSize: 16 }} />,
                route: "orders",
              },
              {
                label: "Add user",
                icon: <People sx={{ fontSize: 16 }} />,
                route: "users",
              },
              {
                label: "Add category",
                icon: <Category sx={{ fontSize: 16 }} />,
                route: "categories",
              },
              {
                label: "Add coupon",
                icon: <LocalOffer sx={{ fontSize: 16 }} />,
                route: "coupons",
              },
              {
                label: "Gift cards",
                icon: <CardGiftcard sx={{ fontSize: 16 }} />,
                route: "gift-card",
              },
            ].map((a) => (
              <Grid item xs={6} sm={4} md={2} key={a.label}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={a.icon}
                  onClick={() => navigate(`/store/${slug}/admin/${a.route}`)}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    borderRadius: "8px",
                    py: 0.9,
                    borderColor: T.border,
                    color: T.text2,
                    justifyContent: "flex-start",
                    "&:hover": {
                      borderColor: T.primary,
                      color: T.primary,
                      background: T.primaryLight,
                    },
                  }}
                >
                  {a.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  };

  /* ── LAYOUT ── */
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'Inter','system-ui',sans-serif",
        /* Prevent any child from escaping horizontally */
        overflow: "hidden",
      }}
    >
      {/* Desktop sidebar — fixed, only on lg+ */}
      {!isTablet && (
        <Box
          sx={{
            width: SIDEBAR_W,
            flexShrink: 0,
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 200,
            /* Don't let sidebar affect flow of sibling content box */
          }}
        >
          <SidebarContent />
        </Box>
      )}

      {/* Mobile / tablet sidebar — always a Drawer, never fixed */}
      <Drawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{ sx: { width: SIDEBAR_W, border: "none" } }}
      >
        <SidebarContent />
      </Drawer>

      {/* Main content — pushes right of sidebar with margin-left on lg+ */}
      <Box
        sx={{
          /* ml exactly matches the fixed sidebar width on large screens */
          ml: isTablet ? 0 : `${SIDEBAR_W}px`,
          /* Take all remaining horizontal space */
          flex: 1,
          /* Prevent content from being wider than the available space */
          minWidth: 0,
          width: isTablet ? "100%" : `calc(100% - ${SIDEBAR_W}px)`,
          display: "flex",
          flexDirection: "column",
          /* Scroll the content, not the whole page, so topbar stays fixed */
          overflowX: "hidden",
        }}
      >
        <Topbar />

        {/* Scrollable content area */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: { xs: 1.5, sm: 2, md: 2.5 },
            /* Cap content width, centre it */
            maxWidth: 1280,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, borderRadius: "10px", fontSize: "0.82rem" }}
            >
              {error}
            </Alert>
          )}

          {loading && !storeDetails ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 280,
              }}
            >
              <CircularProgress size={32} sx={{ color: T.primary }} />
            </Box>
          ) : (
            /* Render overview inline — avoids nested-component remount bug */
            renderOverview()
          )}
        </Box>
      </Box>

      {/* ── DIALOGS ── */}
      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        form={settingsForm}
        onChange={handleSettingsChange}
        onSave={handleSaveSettings}
        saving={savingOther}
      />

      <SubscriptionDialog
        open={subscriptionDialogOpen}
        onClose={() => setSubscriptionDialogOpen(false)}
        form={subscriptionForm}
        onChange={handleSubscriptionChange}
        onSave={handleSaveSubscription}
        saving={savingOther}
      />

      <BankDialog
        open={bankDialogOpen}
        onClose={() => setBankDialogOpen(false)}
        form={bankForm}
        onChange={handleBankChange}
        onSave={handleSaveBankDetails}
        saving={savingOther}
      />

      {/* Edit store full dialog */}
      <Dialog
        open={editStoreOpen}
        onClose={() => !savingStore && setEditStoreOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="md"
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : "14px",
            maxHeight: isMobile ? "100%" : "92vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{ fontWeight: 800, fontSize: "1rem", color: T.text }}
              >
                Edit store details
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: T.text3, mt: 0.2 }}>
                Update business profile and storefront information
              </Typography>
            </Box>
            <IconButton
              size="small"
              disabled={savingStore}
              onClick={() => setEditStoreOpen(false)}
              sx={{ color: T.text3 }}
            >
              <Close sx={{ fontSize: "1.1rem" }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Stack spacing={3}>
            {/* Business info */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: T.text,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  mb: 1.5,
                }}
              >
                Business information
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label="Business name"
                    name="businessName"
                    value={editForm.businessName}
                    onChange={handleFormChange}
                    error={!!formErrors.businessName}
                    helperText={formErrors.businessName}
                    sx={fsx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    required
                    size="small"
                    label="Business type"
                    name="businessType"
                    value={editForm.businessType}
                    onChange={handleFormChange}
                    sx={fsx}
                  >
                    {[
                      "FOOD",
                      "GROCERY",
                      "GARMENTS",
                      "ELECTRONICS",
                      "GENERAL",
                    ].map((t) => (
                      <MenuItem key={t} value={t} sx={{ fontSize: "0.875rem" }}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    label="Description"
                    name="description"
                    value={editForm.description}
                    onChange={handleFormChange}
                    sx={fsx}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Contact */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: T.text,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  mb: 1.5,
                }}
              >
                Owner & contact
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label="Owner name"
                    name="ownerName"
                    value={editForm.ownerName}
                    onChange={handleFormChange}
                    error={!!formErrors.ownerName}
                    helperText={formErrors.ownerName}
                    sx={fsx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    type="email"
                    label="Owner email"
                    name="ownerEmail"
                    value={editForm.ownerEmail}
                    onChange={handleFormChange}
                    error={!!formErrors.ownerEmail}
                    helperText={formErrors.ownerEmail}
                    sx={fsx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label="Phone"
                    name="ownerPhone"
                    value={editForm.ownerPhone}
                    onChange={handleFormChange}
                    inputProps={{ maxLength: 10, inputMode: "numeric" }}
                    error={!!formErrors.ownerPhone}
                    helperText={formErrors.ownerPhone}
                    sx={fsx}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Store slug */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: T.text,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  mb: 1.5,
                }}
              >
                Store URL
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Store slug"
                name="storeSlug"
                value={editForm.storeSlug}
                onChange={(e) => {
                  const value = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z-]/g, "")
                    .replace(/^-+/, "");
                  setEditForm((p) => ({ ...p, storeSlug: value }));
                  setFormErrors((p) => ({ ...p, storeSlug: "" }));
                }}
                error={!!formErrors.storeSlug}
                helperText={
                  formErrors.storeSlug ||
                  `${window.location.origin}/store/${editForm.storeSlug}`
                }
                InputProps={{
                  startAdornment: (
                    <Typography
                      sx={{
                        fontSize: "0.82rem",
                        color: T.text3,
                        mr: "2px",
                        whiteSpace: "nowrap",
                        fontFamily: "monospace",
                      }}
                    >
                      /store/
                    </Typography>
                  ),
                }}
                sx={{
                  ...fsx,
                  "& .MuiInputBase-input": {
                    ...fsx["& .MuiInputBase-input"],
                    paddingLeft: "2px",
                  },
                }}
              />
            </Box>

            <Divider />

            {/* Address */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: T.text,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  mb: 1.5,
                }}
              >
                Business address
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  ["addressLine1", "Address line 1", 12, false],
                  ["addressLine2", "Address line 2", 12, false],
                  ["landmark", "Landmark", 6, false],
                  ["city", "City", 6, true],
                  ["district", "District", 6, false],
                  ["state", "State", 6, true],
                  ["pincode", "Pincode", 6, false],
                  ["country", "Country", 6, false],
                ].map(([name, label, sm, required]) => (
                  <Grid item xs={12} sm={sm} key={name}>
                    <TextField
                      fullWidth
                      required={required}
                      size="small"
                      label={label}
                      name={name}
                      value={editForm[name]}
                      onChange={handleFormChange}
                      error={!!formErrors[name]}
                      helperText={formErrors[name]}
                      sx={fsx}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* Legal */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: T.text,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  mb: 1.5,
                }}
              >
                Legal & tax
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  ["gstNumber", "GST number"],
                  ["panNumber", "PAN number"],
                  ["licenseNumber", "License number"],
                ].map(([name, label]) => (
                  <Grid item xs={12} sm={6} key={name}>
                    <TextField
                      fullWidth
                      size="small"
                      label={label}
                      name={name}
                      value={editForm[name]}
                      onChange={handleFormChange}
                      sx={{
                        ...fsx,
                        "& .MuiInputBase-input": {
                          ...fsx["& .MuiInputBase-input"],
                          fontFamily: "'Courier New',monospace",
                        },
                      }}
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
            borderTop: `1px solid ${T.border}`,
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row" },
            "& > button": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          <Button
            variant="outlined"
            disabled={savingStore}
            onClick={() => setEditStoreOpen(false)}
            sx={{
              textTransform: "none",
              fontSize: "0.82rem",
              borderRadius: "8px",
              borderColor: T.border,
              color: T.text2,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={savingStore}
            onClick={handleSaveStore}
            startIcon={
              savingStore ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <SaveOutlined sx={{ fontSize: "1rem !important" }} />
              )
            }
            sx={{
              textTransform: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              borderRadius: "8px",
              background: T.primary,
              "&:hover": { background: T.primaryDark },
              boxShadow: "none",
            }}
          >
            {savingStore ? "Saving…" : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() => setNotification((p) => ({ ...p, open: false }))}
          sx={{ width: "100%", borderRadius: "10px", fontSize: "0.82rem" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
