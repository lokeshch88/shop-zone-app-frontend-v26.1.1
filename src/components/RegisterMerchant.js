import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  LinearProgress,
  Select,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  StorefrontOutlined,
  PersonOutlined,
  LocationOnOutlined,
  LockOutlined,
  LinkOutlined,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "../utils/AxiosInstance";

// const API = "http://localhost:8080";

const sanitizeSlug = (value) =>
  value
    // .toLowerCase()
    // .trim()
    // .replace(/\s+/g, "-")
    // .replace(/[^a-z0-9-]/g, "")
    // .replace(/^-+|-+$/g, "");
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-.]/g, "");

/* ─── Design tokens ─────────────────────────────── */
const C = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#EFF6FF",
  primaryBorder: "#BFDBFE",
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFC",
  border: "#E2E8F0",
  borderFocus: "#2563EB",
  text: "#0F172A",
  textMuted: "#64748B",
  textLight: "#94A3B8",
  success: "#16A34A",
  successBg: "#F0FDF4",
  successBorder: "#BBF7D0",
  error: "#DC2626",
  errorBg: "#FEF2F2",
  errorBorder: "#FECACA",
  warn: "#D97706",
  warnBg: "#FFFBEB",
  sectionBg: "#F1F5F9",
};

/* ─── Section label ─────────────────────────────── */
const SectionLabel = ({ icon: Icon, label, step }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.25,
      mt: { xs: 3, sm: 3.5 },
      mb: 2,
      pb: 1.25,
      borderBottom: `1.5px solid ${C.border}`,
    }}
  >
    <Box
      sx={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: C.primaryLight,
        border: `1.5px solid ${C.primaryBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Typography
        sx={{ fontSize: "0.7rem", fontWeight: 700, color: C.primary }}
      >
        {step}
      </Typography>
    </Box>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      {Icon && <Icon sx={{ fontSize: "1.05rem", color: C.primary }} />}
      <Typography
        sx={{
          fontSize: "0.9rem",
          fontWeight: 700,
          color: C.text,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
);

/* ─── Field wrapper ─────────────────────────────── */
const fieldSx = {
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: C.surface,
    fontSize: "0.875rem",
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: "#94A3B8" },
    "&.Mui-focused fieldset": {
      borderColor: C.borderFocus,
      borderWidth: "1.5px",
    },
    "&.Mui-disabled": { backgroundColor: C.surfaceAlt },
    "&.Mui-disabled fieldset": { borderColor: C.border },
  },
  "& .MuiInputBase-input": {
    padding: "10px 13px",
    fontSize: "0.875rem",
    color: C.text,
    "&::placeholder": { color: C.textLight, opacity: 1 },
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.825rem",
    color: C.textMuted,
    "&.Mui-focused": { color: C.primary },
    "&.MuiInputLabel-shrink": { fontSize: "0.8rem" },
  },
  "& .MuiFormHelperText-root": {
    marginLeft: 0,
    marginTop: "4px",
    fontSize: "0.72rem",
    lineHeight: 1.4,
    color: C.textMuted,
  },
  "& .MuiSelect-select": {
    padding: "10px 13px",
    fontSize: "0.875rem",
    color: C.text,
    minHeight: "unset !important",
    display: "flex",
    alignItems: "center",
  },
  "& .MuiInputAdornment-root": { color: C.textMuted },
  "& .MuiSelect-icon": { color: C.textMuted },
};

/* ─── Select sx — no floating label, label sits above the box ── */
// MUI's floating label on Select causes overlap when value is empty
// because the notch cutout and label position depend on shrink state
// which breaks at certain font/size combos. Solution: no InputLabel at
// all — render a plain <Typography> above each select instead.
const selectSx = {
  width: "100%",
  borderRadius: "8px",
  backgroundColor: C.surface,
  fontSize: "0.875rem",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: C.border },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94A3B8" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: C.borderFocus,
    borderWidth: "1.5px",
  },
  "& .MuiSelect-select": {
    padding: "9px 13px",
    fontSize: "0.875rem",
    color: C.text,
    minHeight: "unset !important",
    lineHeight: "1.5",
  },
  "& .MuiSelect-icon": { color: C.textMuted },
};

/* ─── Tiny label shown above a select ───────────── */
const SelectLabel = ({ children, required }) => (
  <Typography
    component="label"
    sx={{
      display: "block",
      fontSize: "0.775rem",
      fontWeight: 600,
      color: C.textMuted,
      mb: 0.6,
      letterSpacing: "0.01em",
    }}
  >
    {children}
    {required && <span style={{ color: C.error, marginLeft: 2 }}>*</span>}
  </Typography>
);

/* ─── Password strength ─────────────────────────── */
const passwordStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "", color: "transparent" },
    { label: "Too weak", color: "#DC2626" },
    { label: "Weak", color: "#F97316" },
    { label: "Fair", color: "#EAB308" },
    { label: "Good", color: "#22C55E" },
    { label: "Strong", color: "#16A34A" },
  ];
  return { score, ...map[score] };
};

const RegisterMerchant = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    businessName: "",
    storeSlug: "",
    customUrl: "",
    urlType: "slug",
    username: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    password: "",
    confirmPassword: "",
    businessType: "",
    country: "India",
    state: "",
    city: "",
    termsAccepted: false,
  });

  const [slugStatus, setSlugStatus] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugLocked, setSlugLocked] = useState(false);

  const [emailVerified, setEmailVerified] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const [registerLoading, setRegisterLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeSlug =
    form.urlType === "custom" ? form.customUrl : form.storeSlug;
  const pwStrength = passwordStrength(form.password);

  /* ─── handlers (all original logic preserved) ─── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "storeSlug" || name === "customUrl") {
      finalValue = sanitizeSlug(value);
    }
    setForm((prev) => ({ ...prev, [name]: finalValue }));
    if (name === "storeSlug" || name === "customUrl") {
      setSlugStatus(null);
      setSlugLocked(false);
    }
    if (name === "ownerEmail") {
      setEmailVerified(false);
      setOtpSent(false);
    }
    setError("");
    setMessage("");
  };

  const handleUrlTypeChange = (event) => {
    const nextType = event.target.value;
    setForm((prev) => ({
      ...prev,
      urlType: nextType,
      customUrl:
        nextType === "custom"
          ? prev.customUrl || prev.storeSlug
          : prev.customUrl,
      storeSlug:
        nextType === "slug" ? prev.storeSlug || prev.customUrl : prev.storeSlug,
    }));
    setSlugStatus(null);
    setSlugLocked(false);
    setError("");
    setMessage("");
  };

  const validateSlugFormat = (value = activeSlug) => {
    if (!value) {
      setError("Store URL is required");
      return false;
    }
    const regex = /^[a-z0-9.]+(?:-[a-z0-9.]+)*$/;
    if (!regex.test(value)) {
      setError(
        "Store URL can contain only lowercase letters, numbers and hyphens",
      );
      return false;
    }
    if (value.length < 3) {
      setError("Store URL must contain at least 3 characters");
      return false;
    }
    if (value.length > 50) {
      setError("Store URL cannot exceed 50 characters");
      return false;
    }
    return true;
  };

  const checkSlugAvailability = async () => {
    const value = activeSlug;
    if (!validateSlugFormat(value)) return;
    try {
      setSlugChecking(true);
      setSlugStatus(null);
      setError("");
      const response = await axios.get(`/api/merchants/check-slug`, {
        params: { slug: value },
      });
      const isAvailable = response?.data?.available ?? response?.data === true;
      if (isAvailable) {
        setSlugStatus("available");
        setSlugLocked(true);
        setMessage("Store URL is available");
      } else {
        setSlugStatus("taken");
        setSlugLocked(false);
        setError("This store URL is already taken");
      }
    } catch (err) {
      console.error(err);
      setSlugStatus(null);
      setSlugLocked(false);
      setError("Unable to check store URL");
    } finally {
      setSlugChecking(false);
    }
  };

  const validatePassword = () => {
    if (form.password.length < 8)
      return "Password must contain at least 8 characters";
    if (!/[A-Z]/.test(form.password))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(form.password))
      return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(form.password))
      return "Password must contain at least one number";
    return null;
  };

  const sendOtp = async () => {
    setError("");
    setMessage("");
    if (!form.ownerEmail) {
      setError("Owner email is required");
      return;
    }
    if (otpCooldown > 0) {
      setError(`Please wait ${otpCooldown}s before resending OTP`);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.ownerEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    try {
      setOtpLoading(true);
      await axios.post(`/user/send-otp`, { email: form.ownerEmail });
      setOtpSent(true);
      setOtpCooldown(60);
      setMessage("OTP sent to your email");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setMessage("");
    if (!otp || otp.length !== 6) {
      setError("Enter the 6 digit OTP");
      return;
    }
    try {
      setOtpLoading(true);
      const verifyRes = await axios.post(`/user/verify-otp`, {
        email: form.ownerEmail,
        otp,
      });
      if (verifyRes.data.msg === "OTP verified successfully") {
        setOtpVerified(true);
        setEmailVerified(true);
        setMessage("Email verified successfully");
      } else {
        setOtpVerified(false);
        setEmailVerified(false);
        setError("Invalid or expired OTP");
      }
    } catch (err) {
      console.error(err);
      setEmailVerified(false);
      setOtpVerified(false);
      setError(err?.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const validateForm = () => {
    if (!form.businessName.trim()) return "Business name is required";
    if (!activeSlug.trim()) return "Store URL is required";
    if (form.urlType === "slug" && !slugLocked && slugStatus !== "available")
      return "Please check and confirm that the store URL is available";
    if (!form.username.trim()) return "Username is required";
    if (!form.ownerName.trim()) return "Owner name is required";
    if (!form.ownerEmail.trim()) return "Owner email is required";
    if (!emailVerified) return "Please verify your email before registration";
    if (!/^\d{10}$/.test(form.ownerPhone))
      return "Owner phone must contain exactly 10 digits";
    if (!form.businessType) return "Please select business type";
    if (!form.state.trim()) return "State is required";
    if (!form.city.trim()) return "City is required";
    const passwordError = validatePassword();
    if (passwordError) return passwordError;
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    if (!form.termsAccepted)
      return "Please accept the terms and conditions to continue";
    return null;
  };

  const handleRegister = async () => {
    setError("");
    setMessage("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setRegisterLoading(true);
      const response = await axios.post(`/api/merchants/`, {
        businessName: form.businessName,
        storeSlug: activeSlug,
        customUrl: form.urlType === "custom" ? activeSlug : "",
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone,
        password: form.password,
        businessType: form.businessType,
        country: form.country,
        state: form.state,
        city: form.city,
        username: form.username,
      });
      const slug = response.data.storeSlug || activeSlug;
      if (response.status === 201) {
        setMessage(
          "Merchant registered successfully, Login with username and password",
        );
        setTimeout(() => {
          navigate(`/store/${slug}/login/`);
        }, 5000);
      } else {
        setMessage(response.data.msg || "Merchant registration failed");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.msg || "Merchant registration failed");
    } finally {
      setRegisterLoading(false);
    }
  };

  const dialogOpen = Boolean(error || message);
  const dialogType = error ? "error" : "success";
  const dialogText = error || message;

  const isRegisterDisabled =
    registerLoading || !emailVerified || !form.termsAccepted;
  // ||!slugLocked ||
  // slugStatus !== "available"
  /* ─── render ───────────────────────────────────── */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(145deg, #F0F7FF 0%, #F8FAFC 50%, #EFF6FF 100%)",
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* ── Dialog ────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setError("");
          setMessage("");
        }}
        aria-labelledby="merchant-dialog"
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "14px",
            overflow: "hidden",
            borderTop: `4px solid ${dialogType === "error" ? C.error : C.success}`,
          },
        }}
      >
        <DialogTitle
          id="merchant-dialog"
          sx={{
            textAlign: "center",
            fontSize: "1rem",
            fontWeight: 700,
            pt: 2.5,
            pb: 0.5,
            color: dialogType === "error" ? C.error : C.success,
          }}
        >
          {dialogType === "error" ? "Something went wrong" : "✓  All good!"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <DialogContentText
            sx={{
              textAlign: "center",
              color: dialogType === "error" ? "#7F1D1D" : "#14532D",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              whiteSpace: "pre-line",
              background: dialogType === "error" ? C.errorBg : C.successBg,
              border: `1px solid ${dialogType === "error" ? C.errorBorder : C.successBorder}`,
              borderRadius: "8px",
              px: 2,
              py: 1.5,
            }}
          >
            {dialogText}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2.5, px: 3 }}>
          <Button
            onClick={() => {
              setError("");
              setMessage("");
            }}
            variant="contained"
            disableElevation
            sx={{
              minWidth: 120,
              borderRadius: "8px",
              py: 0.9,
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
              background: dialogType === "error" ? C.error : C.success,
              "&:hover": {
                background: dialogType === "error" ? "#B91C1C" : "#15803D",
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Header above card ─────────────────────── */}
      <Box sx={{ textAlign: "center", mb: 3, maxWidth: 560 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "14px",
            background: C.primary,
            mb: 1.5,
          }}
        >
          <StorefrontOutlined sx={{ color: "#fff", fontSize: "1.5rem" }} />
        </Box>
        <Typography
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
            fontWeight: 800,
            color: C.text,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
          }}
        >
          Open your store
        </Typography>
        <Typography
          sx={{
            mt: 0.75,
            fontSize: "0.875rem",
            color: C.textMuted,
            lineHeight: 1.55,
          }}
        >
          Create your ShopZone merchant account and start selling online in
          minutes.
        </Typography>
      </Box>

      {/* ── Card ─────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 780,
          borderRadius: "16px",
          border: `1px solid ${C.border}`,
          boxShadow:
            "0 4px 24px rgba(15, 23, 42, 0.07), 0 1px 4px rgba(15,23,42,0.04)",
          overflow: "visible",
        }}
      >
        <CardContent
          sx={{
            p: { xs: 2.5, sm: 4 },
            pt: { xs: 1, sm: 2 },
            "&:last-child": { pb: { xs: 2.5, sm: 4 } },
          }}
        >
          {/* ══ Section 1: Business Information ═══ */}
          <SectionLabel
            icon={StorefrontOutlined}
            label="Business Information"
            step="1"
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box>
                <SelectLabel required>Business Name</SelectLabel>
                <TextField
                  fullWidth
                  required
                  size="small"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Rajesh Sweets"
                  sx={{
                    ...fieldSx,
                    "& .MuiInputLabel-root": { display: "none" },
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <SelectLabel required>Business Type</SelectLabel>
                <Select
                  fullWidth
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  displayEmpty
                  size="small"
                  sx={selectSx}
                  renderValue={(val) =>
                    val ? (
                      <span>
                        {
                          {
                            FOOD: "Food & Beverages",
                            GROCERY: "Grocery",
                            GARMENTS: "Garments & Fashion",
                            ELECTRONICS: "Electronics",
                            GENERAL: "General Retail",
                          }[val]
                        }
                      </span>
                    ) : (
                      <span style={{ color: C.textLight }}>
                        Select business type…
                      </span>
                    )
                  }
                >
                  <MenuItem value="FOOD" sx={{ fontSize: "0.875rem" }}>
                    Food & Beverages
                  </MenuItem>
                  <MenuItem value="GROCERY" sx={{ fontSize: "0.875rem" }}>
                    Grocery
                  </MenuItem>
                  <MenuItem value="GARMENTS" sx={{ fontSize: "0.875rem" }}>
                    Garments & Fashion
                  </MenuItem>
                  <MenuItem value="ELECTRONICS" sx={{ fontSize: "0.875rem" }}>
                    Electronics
                  </MenuItem>
                  <MenuItem value="GENERAL" sx={{ fontSize: "0.875rem" }}>
                    General Retail
                  </MenuItem>
                </Select>
              </Box>
            </Grid>

            {/* ── Store URL ───────────────────────── */}
            <Grid item xs={12}>
              <Box
                sx={{
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  borderRadius: "10px",
                  p: { xs: 1.75, sm: 2 },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.775rem",
                    fontWeight: 600,
                    color: C.textMuted,
                    mb: 1.25,
                  }}
                >
                  Store URL Format *
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={4}>
                    <Box>
                      {/* <SelectLabel>URL format</SelectLabel> */}
                      <Select
                        fullWidth
                        value={form.urlType}
                        onChange={handleUrlTypeChange}
                        size="small"
                        sx={selectSx}
                        renderValue={(val) => (
                          <span>
                            {val === "custom"
                              ? "Custom URL"
                              : "Slug -/store/abc-store"}
                          </span>
                        )}
                      >
                        <MenuItem value="slug">
                          <Box>
                            <Typography
                              sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                            >
                              Slug
                            </Typography>
                            <Typography
                              sx={{ fontSize: "0.72rem", color: C.textMuted }}
                            >
                              /store/abc-store
                            </Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="custom">
                          <Box>
                            <Typography
                              sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                            >
                              Custom URL
                            </Typography>
                            <Typography
                              sx={{ fontSize: "0.72rem", color: C.textMuted }}
                            >
                              your-own-domain
                            </Typography>
                          </Box>
                        </MenuItem>
                      </Select>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={8}>
                    <Box>
                      {/* <SelectLabel required>
                        {form.urlType === "custom"
                          ? "Custom Store URL"
                          : "Store URL"}
                      </SelectLabel> */}
                      <TextField
                        fullWidth
                        required
                        size="small"
                        name={
                          form.urlType === "custom" ? "customUrl" : "storeSlug"
                        }
                        value={
                          form.urlType === "custom"
                            ? form.customUrl
                            : form.storeSlug
                        }
                        onChange={handleChange}
                        disabled={false}
                        helperText={
                          slugStatus === "available"
                            ? "Your custom store URL is available"
                            : "Use lowercase, numbers, and hyphens (-) only. Example: my-store-12"
                        }
                        InputProps={{
                          // startAdornment: (
                          //   <InputAdornment position="start" sx={{ mr: 0 }}>
                          //     <Typography
                          //       sx={{
                          //         fontSize: "0.875rem",
                          //         color: C.textMuted,
                          //         userSelect: "none",
                          //         whiteSpace: "nowrap",
                          //         pr: 0,
                          //         mr: 0,
                          //       }}
                          //     >
                          //       shopzone.com/store/
                          //     </Typography>
                          //   </InputAdornment>
                          // ),
                          startAdornment:
                            form.urlType === "slug" ? (
                              <InputAdornment position="start" sx={{ mr: 0 }}>
                                <Typography
                                  sx={{
                                    fontSize: "0.875rem",
                                    color: C.textMuted,
                                    userSelect: "none",
                                    whiteSpace: "nowrap",
                                    pr: 0,
                                    mr: 0,
                                  }}
                                >
                                  shopzone.com/store/
                                </Typography>
                              </InputAdornment>
                            ) : (
                              <InputAdornment position="start" sx={{ mr: 0 }}>
                                <Typography
                                  sx={{
                                    fontSize: "0.875rem",
                                    color: C.textMuted,
                                    userSelect: "none",
                                    whiteSpace: "nowrap",
                                    pr: 0,
                                    mr: 0,
                                  }}
                                >
                                  https://
                                </Typography>
                              </InputAdornment>
                            ),
                          endAdornment: (
                            <InputAdornment position="end">
                              {slugStatus === "available" && (
                                <CheckCircle
                                  sx={{ color: C.success, fontSize: "1.1rem" }}
                                />
                              )}
                              {slugStatus === "taken" && (
                                <Cancel
                                  sx={{ color: C.error, fontSize: "1.1rem" }}
                                />
                              )}
                            </InputAdornment>
                          ),
                          sx: {
                            "& .MuiInputAdornment-positionStart": { mr: "2px" },
                          },
                        }}
                        sx={{
                          ...fieldSx,
                          "& .MuiInputLabel-root": { display: "none" },
                          "& .MuiInputBase-input": {
                            ...fieldSx["& .MuiInputBase-input"],
                            paddingLeft: "2px",
                          },
                          "& .MuiFormHelperText-root": {
                            ...fieldSx["& .MuiFormHelperText-root"],
                            color:
                              slugStatus === "available"
                                ? C.success
                                : C.textMuted,
                            fontWeight: slugStatus === "available" ? 500 : 400,
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    mt: 1.25,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {form.urlType === "slug" && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={checkSlugAvailability}
                      disabled={slugChecking || !activeSlug || slugLocked}
                      startIcon={
                        slugChecking ? (
                          <CircularProgress size={12} color="inherit" />
                        ) : (
                          <LinkOutlined
                            sx={{ fontSize: "0.95rem !important" }}
                          />
                        )
                      }
                      sx={{
                        borderRadius: "7px",
                        py: "6px",
                        px: 1.75,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        textTransform: "none",
                        borderColor: C.primaryBorder,
                        color: C.primary,
                        "&:hover": {
                          borderColor: C.primary,
                          background: C.primaryLight,
                        },
                        "&.Mui-disabled": { opacity: 0.5 },
                      }}
                    >
                      {slugChecking ? "Checking…" : "Check availability"}
                    </Button>
                  )}

                  {slugLocked && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setSlugLocked(false);
                        setSlugStatus(null);
                        setMessage("");
                        setError("");
                      }}
                      sx={{
                        borderRadius: "7px",
                        py: "6px",
                        px: 1.5,
                        fontSize: "0.78rem",
                        fontWeight: 500,
                        textTransform: "none",
                        color: C.textMuted,
                        "&:hover": { color: C.text, background: C.sectionBg },
                      }}
                    >
                      Change URL
                    </Button>
                  )}

                  {slugLocked && (
                    <Chip
                      label="Reserved"
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        background: C.successBg,
                        color: C.success,
                        border: `1px solid ${C.successBorder}`,
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* ══ Section 2: Owner Information ══════ */}
          <SectionLabel
            icon={PersonOutlined}
            label="Owner Information"
            step="2"
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                size="small"
                label="Owner Name"
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                placeholder="Full name"
                sx={fieldSx}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                size="small"
                label="Phone Number"
                name="ownerPhone"
                value={form.ownerPhone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                inputProps={{ maxLength: 10, inputMode: "numeric" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        sx={{ fontSize: "0.825rem", color: C.textMuted }}
                      >
                        +91
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                helperText="Enter 10 digits without country code"
                sx={fieldSx}
              />
            </Grid>

            {/* ── Email + OTP ──────────────────────── */}
            <Grid item xs={12}>
              <Box
                sx={{
                  background: emailVerified ? C.successBg : C.surfaceAlt,
                  border: `1px solid ${emailVerified ? C.successBorder : C.border}`,
                  borderRadius: "10px",
                  p: { xs: 1.75, sm: 2 },
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.25,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.775rem",
                      fontWeight: 600,
                      color: emailVerified ? C.success : C.textMuted,
                    }}
                  >
                    {emailVerified ? "✓ Email verified" : "Email verification"}
                  </Typography>
                  {emailVerified && (
                    <Chip
                      label="Verified"
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        background: C.successBg,
                        color: C.success,
                        border: `1px solid ${C.successBorder}`,
                      }}
                    />
                  )}
                </Box>

                <Grid container spacing={1.5} alignItems="flex-start">
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      type="email"
                      label="Owner Email"
                      name="ownerEmail"
                      value={form.ownerEmail}
                      onChange={handleChange}
                      disabled={emailVerified}
                      placeholder="owner@example.com"
                      InputProps={{
                        endAdornment: emailVerified ? (
                          <InputAdornment position="end">
                            <CheckCircle
                              sx={{ color: C.success, fontSize: "1.1rem" }}
                            />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={fieldSx}
                    />
                  </Grid>

                  {!emailVerified && (
                    <Grid item xs={12} sm={4}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        onClick={sendOtp}
                        disabled={
                          otpLoading || !form.ownerEmail || otpCooldown > 0
                        }
                        sx={{
                          borderRadius: "8px",
                          py: "9.5px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          textTransform: "none",
                          borderColor: C.primaryBorder,
                          color: C.primary,
                          "&:hover": {
                            borderColor: C.primary,
                            background: C.primaryLight,
                          },
                          "&.Mui-disabled": { opacity: 0.5 },
                        }}
                      >
                        {otpLoading ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : otpCooldown > 0 ? (
                          `Resend in ${otpCooldown}s`
                        ) : otpSent ? (
                          "Resend OTP"
                        ) : (
                          "Send OTP"
                        )}
                      </Button>
                    </Grid>
                  )}

                  {otpSent && !emailVerified && (
                    <>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          size="small"
                          label="6-digit OTP"
                          value={otp}
                          onChange={(e) =>
                            setOtp(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                          inputProps={{ maxLength: 6, inputMode: "numeric" }}
                          placeholder="Enter OTP sent to your email"
                          helperText="Check your inbox (and spam folder)"
                          sx={fieldSx}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button
                          fullWidth
                          variant="contained"
                          disableElevation
                          size="small"
                          onClick={verifyOtp}
                          disabled={otpLoading || otp.length !== 6}
                          sx={{
                            borderRadius: "8px",
                            py: "9.5px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            textTransform: "none",
                            background: C.primary,
                            "&:hover": { background: C.primaryDark },
                            "&.Mui-disabled": { opacity: 0.5 },
                          }}
                        >
                          {otpLoading ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            "Verify email"
                          )}
                        </Button>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            </Grid>
          </Grid>

          {/* ══ Section 3: Business Location ══════ */}
          <SectionLabel
            icon={LocationOnOutlined}
            label="Business Location"
            step="3"
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                size="small"
                label="Country"
                name="country"
                disabled
                value={form.country}
                onChange={handleChange}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                size="small"
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="e.g. Maharashtra"
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                size="small"
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Pune"
                sx={fieldSx}
              />
            </Grid>
          </Grid>

          {/* ══ Section 4: Account Security ═══════ */}
          <SectionLabel icon={LockOutlined} label="Account Security" step="4" />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                size="small"
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Unique login username"
                helperText="Used to log in to your admin panel"
                sx={fieldSx}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                size="small"
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                helperText="Min 8 chars, one uppercase, one number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: "1rem" }} />
                        ) : (
                          <Visibility sx={{ fontSize: "1rem" }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />
              {/* Password strength bar */}
              {form.password && (
                <Box sx={{ mt: 0.75 }}>
                  <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: 1,
                          height: 3,
                          borderRadius: "2px",
                          background:
                            i <= pwStrength.score ? pwStrength.color : C.border,
                          transition: "background 0.2s",
                        }}
                      />
                    ))}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.68rem",
                      color: pwStrength.color,
                      fontWeight: 500,
                    }}
                  >
                    {pwStrength.label}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                size="small"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                helperText={
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? "Passwords do not match"
                    : form.confirmPassword &&
                        form.password === form.confirmPassword
                      ? "✓ Passwords match"
                      : ""
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff sx={{ fontSize: "1rem" }} />
                        ) : (
                          <Visibility sx={{ fontSize: "1rem" }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  ...fieldSx,
                  "& .MuiFormHelperText-root": {
                    ...fieldSx["& .MuiFormHelperText-root"],
                    color:
                      form.confirmPassword &&
                      form.password === form.confirmPassword
                        ? C.success
                        : form.confirmPassword
                          ? C.error
                          : C.textMuted,
                    fontWeight: form.confirmPassword ? 500 : 400,
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* ══ Terms & Submit ════════════════════ */}
          <Box
            sx={{
              mt: 3,
              pt: 2.5,
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.75,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.termsAccepted}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      termsAccepted: e.target.checked,
                    }))
                  }
                  size="small"
                  sx={{
                    color: C.textLight,
                    "&.Mui-checked": { color: C.primary },
                    padding: "4px 8px",
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontSize: "0.825rem",
                    color: C.textMuted,
                    lineHeight: 1.5,
                  }}
                >
                  I agree to the{" "}
                  <Link
                    component={RouterLink}
                    to="/terms-and-conditions"
                    underline="hover"
                    sx={{ color: C.primary, fontWeight: 500 }}
                  >
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    component={RouterLink}
                    to="/privacy-policy"
                    underline="hover"
                    sx={{ color: C.primary, fontWeight: 500 }}
                  >
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ margin: 0, alignItems: "flex-start" }}
            />

            {/* Readiness checklist */}
            <Box
              sx={{
                width: "100%",
                background: C.surfaceAlt,
                border: `1px solid ${C.border}`,
                borderRadius: "10px",
                p: 1.5,
                display: "flex",
                gap: { xs: 1, sm: 2.5 },
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {[
                { label: "Email verified", done: emailVerified },
                {
                  label: "URL confirmed",
                  done: slugLocked && slugStatus === "available",
                },
                { label: "Terms accepted", done: form.termsAccepted },
              ].map(({ label, done }) => (
                <Box
                  key={label}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  {done ? (
                    <CheckCircle
                      sx={{ fontSize: "0.9rem", color: C.success }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: `2px solid ${C.border}`,
                      }}
                    />
                  )}
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: done ? C.success : C.textMuted,
                      fontWeight: done ? 600 : 400,
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Button
              fullWidth
              variant="contained"
              disableElevation
              size="large"
              onClick={handleRegister}
              disabled={isRegisterDisabled}
              sx={{
                borderRadius: "10px",
                py: 1.3,
                fontWeight: 700,
                fontSize: "0.925rem",
                textTransform: "none",
                letterSpacing: "-0.01em",
                background: `linear-gradient(135deg, ${C.primary} 0%, #1D4ED8 100%)`,
                boxShadow: isRegisterDisabled
                  ? "none"
                  : "0 4px 14px rgba(37,99,235,0.35)",
                transition: "box-shadow 0.2s, background 0.2s",
                "&:hover:not(:disabled)": {
                  background: `linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)`,
                  boxShadow: "0 6px 20px rgba(37,99,235,0.45)",
                },
                "&.Mui-disabled": {
                  background: C.border,
                  color: C.textLight,
                  boxShadow: "none",
                },
              }}
            >
              {registerLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Create merchant account"
              )}
            </Button>

            <Typography sx={{ fontSize: "0.8rem", color: C.textMuted }}>
              Already have an account?{" "}
              <Link
                component={RouterLink}
                to="/login"
                underline="hover"
                sx={{ color: C.primary, fontWeight: 600 }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterMerchant;
