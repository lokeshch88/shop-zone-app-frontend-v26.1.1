import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Edit, Delete, ShoppingBagOutlined } from "@mui/icons-material";

import { fetchLatLong } from "../utils/AddressUtils";
import axios from "../utils/AxiosInstance";

const getAddressId = (address) => address?.id ?? address?.addressId ?? null;

const getAddressList = (data) => {
  const candidates = [
    data,
    data?.result,
    data?.data,
    data?.addresses,
    data?.result?.addresses,
    data?.data?.addresses,
  ];
  return candidates.find(Array.isArray) || null;
};

const getLocalPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.slice(0, 10);
};

const ProfilePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const username = localStorage.getItem("username");
  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastName");
  const email = localStorage.getItem("email");

  const [addresses, setAddresses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();
  const { slug } = useParams();
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formData, setFormData] = useState({
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
    latitude: "",
    longitude: "",
  });

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    navigate(`/store/${slug}/login`);
  };

  useEffect(() => {
    let active = true;

    const loadAddresses = async () => {
      setLoadingAddresses(true);
      setAddressError("");
      if (!userId || !token) {
        if (active) {
          setAddresses([]);
          setAddressError("Sign in again to view your saved addresses.");
          setLoadingAddresses(false);
        }
        return;
      }

      try {
        const response = await axios.get(`/address/user/${userId}`);
        const list = getAddressList(response.data);
        if (!list) throw new Error("Unexpected address response format");
        if (active) setAddresses(list);
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
        if (active) {
          setAddresses([]);
          setAddressError("Could not load saved addresses. Please try again.");
        }
      } finally {
        if (active) setLoadingAddresses(false);
      }
    };

    loadAddresses();
    return () => {
      active = false;
    };
  }, [userId, token]);

  const resetAddressForm = () => {
    setFormData({
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
      latitude: "",
      longitude: "",
    });
    setFormErrors({});
    setEditingAddressId(null);
  };

  const handleOpenDialog = (address = null) => {
    if (address) {
      setFormData({
        addressLine: address.addressLine || "",
        addressLine2: address.addressLine2 || "",
        landmark: address.landmark || "",
        city: address.city || "",
        district: address.district || "",
        state: address.state || "",
        country: address.country || "India",
        pincode: String(address.pincode || "")
          .replace(/\D/g, "")
          .slice(0, 6),
        phone: getLocalPhone(address.phone),
        name: address.name || "",
        latitude: address.latitude || "",
        longitude: address.longitude || "",
      });
      setEditingAddressId(getAddressId(address));
    } else {
      resetAddressForm();
    }
    setFormErrors({});
    setAddressError("");
    setOpenDialog(true);
  };

  const updateFormField = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setFormErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const handleSaveAddress = async () => {
    const phone = getLocalPhone(formData.phone);
    const pincode = String(formData.pincode || "").replace(/\D/g, "");
    const errors = {
      name: formData.name.trim() ? "" : "Name is required.",
      phone: /^\d{10}$/.test(phone)
        ? ""
        : "Enter a valid 10-digit phone number.",
      addressLine: formData.addressLine.trim()
        ? ""
        : "Address line is required.",
      city: formData.city.trim() ? "" : "City is required.",
      district: formData.district.trim() ? "" : "District is required.",
      state: formData.state.trim() ? "" : "State is required.",
      pincode: /^\d{6}$/.test(pincode) ? "" : "Enter a valid 6-digit PIN code.",
    };
    setFormErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    if (!userId) {
      setAddressError("Your account ID is missing. Please sign in again.");
      return;
    }

    setSavingAddress(true);
    setAddressError("");
    try {
      const normalizedForm = { ...formData, phone, pincode };
      const coords = await fetchLatLong(normalizedForm);
      if (!coords) {
        setAddressError("Could not find coordinates for this address.");
        return;
      }

      const payload = {
        ...normalizedForm,
        userId: Number(userId),
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      if (editingAddressId) {
        await axios.put(`/address/${editingAddressId}`, payload);
      } else {
        await axios.post("/address/save", payload);
      }

      const response = await axios.get(`/address/user/${userId}`);
      const list = getAddressList(response.data);
      if (!list) throw new Error("Unexpected address response format");
      setAddresses(list);
      setOpenDialog(false);
      resetAddressForm();
    } catch (error) {
      console.error("Failed to save address:", error);
      setAddressError("Unable to save address. Please try again.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDelete = async (address) => {
    const idToDelete = getAddressId(address);
    if (!idToDelete) {
      setAddressError("This address is missing its ID and cannot be deleted.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;

    try {
      await axios.delete(`/address/${idToDelete}`);
      setAddresses((current) =>
        current.filter(
          (item) => String(getAddressId(item)) !== String(idToDelete),
        ),
      );
    } catch (error) {
      console.error("Failed to delete address", error);
      setAddressError("Failed to delete this address. Please try again.");
    }
  };

  if (!username || !email) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="warning">Please log in to access your profile.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
      <Card
        sx={{ borderRadius: 2, border: "1px solid #E2E8F0", boxShadow: "none" }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Avatar
              sx={{
                width: { xs: 44, sm: 52 },
                height: { xs: 44, sm: 52 },
                flexShrink: 0,
                bgcolor: "primary.main",
              }}
            >
              {username.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ lineHeight: 1.2 }}
              >
                Account
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  fontSize: { xs: "1.05rem", sm: "1.25rem" },
                  lineHeight: 1.25,
                  overflowWrap: "anywhere",
                }}
              >
                {firstName || lastName
                  ? `${firstName || ""} ${lastName || ""}`.trim()
                  : username}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.25,
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  lineHeight: 1.4,
                  overflowWrap: "anywhere",
                }}
              >
                {email}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              size="small"
            >
              Logout
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card
        sx={{
          mt: 1.5,
          borderRadius: 2,
          border: "1px solid #E2E8F0",
          boxShadow: "none",
        }}
      >
        <CardContent
          sx={{
            p: { xs: 1.5, sm: 2 },
            "&:last-child": { pb: { xs: 1.5, sm: 2 } },
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <ShoppingBagOutlined color="primary" />
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
            Orders
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate(`/store/${slug}/orders`)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            View orders
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ mt: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Saved Addresses
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your delivery details.
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => handleOpenDialog()}>
            Add Address
          </Button>
        </Box>

        {addressError && !openDialog && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {addressError}
          </Alert>
        )}

        {loadingAddresses ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={28} />
          </Box>
        ) : addresses.length === 0 ? (
          <Card
            sx={{
              borderRadius: 2,
              border: "1px dashed #CBD5E1",
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary" sx={{ mb: 1.5 }}>
                No saved addresses yet.
              </Typography>
              <Button variant="outlined" onClick={() => handleOpenDialog()}>
                Add your first address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: 1.5,
            }}
          >
            {addresses.map((address) => (
              <Card
                key={
                  getAddressId(address) ??
                  `${address.addressLine}-${address.pincode}`
                }
                sx={{
                  minWidth: 0,
                  borderRadius: 2,
                  border: "1px solid #E2E8F0",
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{
                          fontSize: { xs: "0.95rem", sm: "1rem" },
                          lineHeight: 1.3,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {address.name || "Delivery address"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                          lineHeight: 1.45,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {address.addressLine}
                        {address.addressLine2
                          ? `, ${address.addressLine2}`
                          : ""}
                        {address.landmark ? `, ${address.landmark}` : ""}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                          lineHeight: 1.45,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {[
                          address.city,
                          address.district,
                          address.state,
                          address.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}{" "}
                        {address.pincode ? `- ${address.pincode}` : ""}
                      </Typography>
                      {address.phone && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.5,
                            fontSize: { xs: "0.8rem", sm: "0.875rem" },
                            overflowWrap: "anywhere",
                          }}
                        >
                          +91 {getLocalPhone(address.phone)}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", flexShrink: 0, ml: -0.5 }}>
                      <IconButton
                        aria-label="Edit address"
                        size="small"
                        onClick={() => handleOpenDialog(address)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label="Delete address"
                        size="small"
                        color="error"
                        onClick={() => handleDelete(address)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2, mx: 1 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>Log out of your account?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
            You will need to sign in again to access your profile and orders.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmLogout} variant="contained" color="error">
            Log out
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog}
        onClose={() => !savingAddress && setOpenDialog(false)}
        fullWidth
        fullScreen={isMobile}
        maxWidth="sm"
        PaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
            maxHeight: { xs: "100dvh", sm: "calc(100dvh - 64px)" },
            borderRadius: { xs: 0, sm: 2 },
            mx: { xs: 0, sm: 1 },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, flexShrink: 0 }}>
          {editingAddressId ? "Edit Address" : "Add New Address"}
        </DialogTitle>
        <DialogContent
          sx={{
            flex: "1 1 auto",
            overflowY: "auto",
            "& .MuiInputBase-input": {
              fontSize: { xs: "0.9rem", sm: "1rem" },
            },
          }}
        >
          {addressError && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {addressError}
            </Alert>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.5,
              pt: 1,
            }}
          >
            <TextField
              fullWidth
              required
              label="Full name"
              value={formData.name}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name}
              onChange={(event) => updateFormField("name", event.target.value)}
            />
            <TextField
              fullWidth
              required
              type="tel"
              label="Phone number"
              value={formData.phone}
              error={Boolean(formErrors.phone)}
              helperText={formErrors.phone}
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
              onChange={(event) =>
                updateFormField(
                  "phone",
                  event.target.value.replace(/\D/g, "").slice(0, 10),
                )
              }
            />
            <TextField
              fullWidth
              required
              label="Address line"
              value={formData.addressLine}
              error={Boolean(formErrors.addressLine)}
              helperText={formErrors.addressLine}
              sx={{ gridColumn: { sm: "1 / -1" } }}
              onChange={(event) =>
                updateFormField("addressLine", event.target.value)
              }
            />
            <TextField
              fullWidth
              label="Address line 2"
              value={formData.addressLine2}
              onChange={(event) =>
                updateFormField("addressLine2", event.target.value)
              }
            />
            <TextField
              fullWidth
              label="Landmark"
              value={formData.landmark}
              onChange={(event) =>
                updateFormField("landmark", event.target.value)
              }
            />
            <TextField
              fullWidth
              required
              label="City"
              value={formData.city}
              error={Boolean(formErrors.city)}
              helperText={formErrors.city}
              onChange={(event) => updateFormField("city", event.target.value)}
            />
            <TextField
              fullWidth
              required
              label="District"
              value={formData.district}
              error={Boolean(formErrors.district)}
              helperText={formErrors.district}
              onChange={(event) =>
                updateFormField("district", event.target.value)
              }
            />
            <TextField
              fullWidth
              required
              label="State"
              value={formData.state}
              error={Boolean(formErrors.state)}
              helperText={formErrors.state}
              onChange={(event) => updateFormField("state", event.target.value)}
            />
            <TextField
              fullWidth
              required
              label="PIN code"
              value={formData.pincode}
              error={Boolean(formErrors.pincode)}
              helperText={formErrors.pincode}
              inputProps={{ inputMode: "numeric", maxLength: 6 }}
              onChange={(event) =>
                updateFormField(
                  "pincode",
                  event.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexShrink: 0 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={savingAddress}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAddress}
            disabled={savingAddress}
          >
            {savingAddress ? "Saving..." : "Save address"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
