import React, { useEffect, useState } from "react";
import axios from "../utils/AxiosInstance";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  ArrowBack,
  Delete,
  Edit,
  LocationOn,
  Store,
  Visibility,
} from "@mui/icons-material";

const API_URL = "/api/merchants";

const token = localStorage.getItem("authToken");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

/* =========================================================
   ENUM VALUES
   Change these according to your backend enums
========================================================= */

const BUSINESS_TYPES = [
  "FOOD",
  "GROCERY",
  "GARMENTS",
  "ELECTRONICS",
  "GENERAL",
];

const SUBSCRIPTION_PLANS = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"];

const SUBSCRIPTION_STATUS = ["ACTIVE", "INACTIVE", "EXPIRED", "CANCELLED"];

const PAYMENT_STATUS = ["PAID", "PENDING", "FAILED", "REFUNDED"];

const MERCHANT_STATUS = ["ACTIVE", "INACTIVE", "SUSPENDED"];

const BRANCH_TYPES = ["OWNED", "FRANCHISE", "WAREHOUSE"];

/* =========================================================
   DEFAULT MERCHANT
========================================================= */

const emptyMerchant = {
  merchantCode: "",
  businessName: "",
  legalBusinessName: "",
  businessType: "",
  businessCategory: "",
  description: "",
  logoUrl: "",
  faviconUrl: "",

  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",

  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  latitude: "",
  longitude: "",

  gstNumber: "",
  panNumber: "",
  businessRegistrationNumber: "",

  storeSlug: "",
  storeUrl: "",
  customDomain: "",
  customDomainEnabled: false,
  sslEnabled: false,

  subscriptionPlan: "",
  subscriptionStatus: "",
  subscriptionStartDate: "",
  subscriptionEndDate: "",

  maxProducts: "",
  maxUsers: "",
  maxOrdersPerMonth: "",
  maxStorageMb: "",
  maxApiRequestsPerMonth: "",

  productCount: 0,
  userCount: 0,
  orderCount: 0,
  storageUsedMb: 0,
  apiRequestsUsed: 0,

  monthlySubscription: "",
  additionalStorageCharges: "",
  additionalUserCharges: "",
  additionalOrderCharges: "",
  totalMonthlyBill: "",

  paymentStatus: "",
  lastPaymentDate: "",
  nextBillingDate: "",
  paymentCustomerId: "",
  paymentSubscriptionId: "",

  currency: "INR",
  timezone: "Asia/Kolkata",
  language: "English",

  taxEnabled: true,
  inventoryEnabled: true,
  deliveryEnabled: true,
  onlinePaymentEnabled: true,
  cashOnDeliveryEnabled: true,
  couponEnabled: true,
  reviewEnabled: true,

  primaryColor: "#1976d2",
  secondaryColor: "#dc004e",
  fontFamily: "",

  status: "ACTIVE",
  active: true,
};

/* =========================================================
   DEFAULT BRANCH
========================================================= */

const emptyBranch = {
  merchantId: "",
  branchName: "",
  branchCode: "",
  branchType: "OWNED",

  franchiseOwnerName: "",
  franchiseOwnerEmail: "",
  franchiseOwnerMobile: "",

  contactPersonName: "",
  contactNumber: "",
  alternateContactNumber: "",
  email: "",

  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  pincode: "",

  latitude: "",
  longitude: "",
  deliveryRadiusKm: "",

  gstNumber: "",
  fssaiNumber: "",
  licenseNumber: "",

  deliveryAvailable: true,
  pickupAvailable: true,
  dineInAvailable: false,

  openingTime: "",
  closingTime: "",
  workingDays: "MON,TUE,WED,THU,FRI,SAT",

  isActive: "Y",
  isDeleted: "N",
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function MerchantManagement() {
  const [merchants, setMerchants] = useState([]);

  const [loading, setLoading] = useState(false);

  const [merchantDialog, setMerchantDialog] = useState(false);
  const [branchDialog, setBranchDialog] = useState(false);

  const [merchant, setMerchant] = useState(emptyMerchant);
  const [branch, setBranch] = useState(emptyBranch);

  const [editingMerchant, setEditingMerchant] = useState(false);
  const [editingBranch, setEditingBranch] = useState(false);

  const [selectedMerchant, setSelectedMerchant] = useState(null);

  const [branches, setBranches] = useState([]);

  const [search, setSearch] = useState("");

  const [tab, setTab] = useState(0);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const phoneRegex = /^[6-9]\d{9}$/;

  const pincodeRegex = /^\d{6}$/;

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  const [merchantErrors, setMerchantErrors] = useState({});
  const [branchErrors, setBranchErrors] = useState({});

  /* =======================================================
     LOAD MERCHANTS
  ======================================================= */

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      setLoading(true);

      const response = await api.get("/");

      setMerchants(response.data || []);
    } catch (error) {
      console.error("Error loading merchants:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD BRANCHES
  ======================================================= */

  const loadBranches = async (merchantId) => {
    try {
      const response = await api.get(`/${merchantId}/branches`);

      setBranches(response.data || []);
    } catch (error) {
      console.error("Error loading branches:", error);
      setBranches([]);
    }
  };

  /* =======================================================
     OPEN ADD MERCHANT
  ======================================================= */

  const validateMerchant = () => {
    const errors = {};

    if (!merchant.merchantCode?.trim()) {
      errors.merchantCode = "Merchant code is required";
    }

    if (!merchant.businessName?.trim()) {
      errors.businessName = "Business name is required";
    }

    if (!merchant.ownerName?.trim()) {
      errors.ownerName = "Owner name is required";
    }

    if (!merchant.ownerEmail?.trim()) {
      errors.ownerEmail = "Owner email is required";
    } else if (!emailRegex.test(merchant.ownerEmail)) {
      errors.ownerEmail = "Enter a valid email address";
    }

    if (!merchant.ownerPhone?.trim()) {
      errors.ownerPhone = "Owner phone is required";
    } else if (!phoneRegex.test(merchant.ownerPhone)) {
      errors.ownerPhone = "Enter a valid 10 digit Indian mobile number";
    }

    if (!merchant.city?.trim()) {
      errors.city = "City is required";
    }

    if (!merchant.state?.trim()) {
      errors.state = "State is required";
    }

    if (!merchant.pincode?.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!pincodeRegex.test(merchant.pincode)) {
      errors.pincode = "Pincode must contain 6 digits";
    }

    if (merchant.latitude !== "") {
      const latitude = Number(merchant.latitude);

      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        errors.latitude = "Latitude must be between -90 and 90";
      }
    }

    if (merchant.longitude !== "") {
      const longitude = Number(merchant.longitude);

      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        errors.longitude = "Longitude must be between -180 and 180";
      }
    }

    // if (
    //   merchant.gstNumber &&
    //   !gstRegex.test(merchant.gstNumber.toUpperCase())
    // ) {
    //   errors.gstNumber = "Invalid GST number";
    // }

    if (
      merchant.panNumber &&
      !panRegex.test(merchant.panNumber.toUpperCase())
    ) {
      errors.panNumber = "Invalid PAN number";
    }

    if (!merchant.subscriptionPlan) {
      errors.subscriptionPlan = "Subscription plan is required";
    }

    if (!merchant.status) {
      errors.status = "Merchant status is required";
    }

    return errors;
  };
  const openAddMerchant = () => {
    setMerchant(emptyMerchant);
    setEditingMerchant(false);
    setTab(0);
    setMerchantDialog(true);
  };

  /* =======================================================
     OPEN EDIT MERCHANT
  ======================================================= */

  const openEditMerchant = (data) => {
    setMerchant({
      ...emptyMerchant,
      ...data,
    });

    setEditingMerchant(true);
    setTab(0);
    setMerchantDialog(true);
  };

  /* =======================================================
     SAVE MERCHANT
  ======================================================= */

  const saveMerchant = async () => {
    const errors = validateMerchant();

    // setMerchantErrors(errors);
    console.log("Merchant validation errors:", errors);
    alert("Merchant validation errors: " + JSON.stringify(errors));

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const payload = {
        ...merchant,

        latitude: merchant.latitude === "" ? null : Number(merchant.latitude),

        longitude:
          merchant.longitude === "" ? null : Number(merchant.longitude),

        maxProducts:
          merchant.maxProducts === "" ? null : Number(merchant.maxProducts),

        maxUsers: merchant.maxUsers === "" ? null : Number(merchant.maxUsers),

        maxOrdersPerMonth:
          merchant.maxOrdersPerMonth === ""
            ? null
            : Number(merchant.maxOrdersPerMonth),

        maxStorageMb:
          merchant.maxStorageMb === "" ? null : Number(merchant.maxStorageMb),

        maxApiRequestsPerMonth:
          merchant.maxApiRequestsPerMonth === ""
            ? null
            : Number(merchant.maxApiRequestsPerMonth),
      };

      if (editingMerchant) {
        await api.put(`/${merchant.id}`, payload);
      } else {
        await api.post("/merchants", payload);
      }

      setMerchantDialog(false);
      setMerchantErrors({});

      await loadMerchants();
    } catch (error) {
      console.error("Error saving merchant:", error);
    }
  };

  /* =======================================================
     DELETE MERCHANT
  ======================================================= */

  const deleteMerchant = async (id) => {
    if (!window.confirm("Are you sure you want to delete this merchant?")) {
      return;
    }

    try {
      await api.delete(`/merchants/${id}`);

      await loadMerchants();
    } catch (error) {
      console.error("Error deleting merchant:", error);
    }
  };

  /* =======================================================
     OPEN BRANCHES
  ======================================================= */

  const openBranches = async (merchantData) => {
    setSelectedMerchant(merchantData);

    await loadBranches(merchantData.id);
  };

  /* =======================================================
     ADD BRANCH
  ======================================================= */

  const openAddBranch = () => {
    setBranch({
      ...emptyBranch,
      merchantId: selectedMerchant.id,
    });

    setEditingBranch(false);
    setBranchDialog(true);
  };

  /* =======================================================
     EDIT BRANCH
  ======================================================= */

  const openEditBranch = (data) => {
    setBranch({
      ...emptyBranch,
      ...data,
      merchantId: selectedMerchant.id,
    });

    setEditingBranch(true);
    setBranchDialog(true);
  };

  /* =======================================================
     SAVE BRANCH
  ======================================================= */
  const validateBranch = () => {
    const errors = {};

    if (!branch.branchName?.trim()) {
      errors.branchName = "Branch name is required";
    }

    if (!branch.branchCode?.trim()) {
      errors.branchCode = "Branch code is required";
    }

    if (!branch.branchType) {
      errors.branchType = "Branch type is required";
    }

    if (!branch.contactPersonName?.trim()) {
      errors.contactPersonName = "Contact person name is required";
    }

    if (!branch.contactNumber?.trim()) {
      errors.contactNumber = "Contact number is required";
    } else if (!phoneRegex.test(branch.contactNumber)) {
      errors.contactNumber = "Enter a valid 10 digit Indian mobile number";
    }

    if (branch.email && !emailRegex.test(branch.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!branch.city?.trim()) {
      errors.city = "City is required";
    }

    if (!branch.state?.trim()) {
      errors.state = "State is required";
    }

    if (!branch.country?.trim()) {
      errors.country = "Country is required";
    }

    if (!branch.pincode?.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!pincodeRegex.test(branch.pincode)) {
      errors.pincode = "Pincode must contain 6 digits";
    }

    if (branch.latitude !== "") {
      const latitude = Number(branch.latitude);

      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        errors.latitude = "Latitude must be between -90 and 90";
      }
    }

    if (branch.longitude !== "") {
      const longitude = Number(branch.longitude);

      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        errors.longitude = "Longitude must be between -180 and 180";
      }
    }

    if (branch.deliveryRadiusKm !== "") {
      const radius = Number(branch.deliveryRadiusKm);

      if (isNaN(radius) || radius <= 0) {
        errors.deliveryRadiusKm = "Delivery radius must be greater than 0";
      }
    }

    if (!branch.openingTime) {
      errors.openingTime = "Opening time is required";
    }

    if (!branch.closingTime) {
      errors.closingTime = "Closing time is required";
    }

    if (!branch.workingDays?.trim()) {
      errors.workingDays = "Working days are required";
    }

    return errors;
  };
  const saveBranch = async () => {
    console.log("Validating branch data:", branch);
    const errors = validateBranch();

    console.log("Branch validation errors:", errors);
    alert("Branch validation errors: " + JSON.stringify(errors));

    // Stop API call if validation fails
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!selectedMerchant?.id) {
      console.error("No merchant selected");
      return;
    }

    try {
      const payload = {
        ...branch,

        latitude: branch.latitude === "" ? null : Number(branch.latitude),

        longitude: branch.longitude === "" ? null : Number(branch.longitude),

        deliveryRadiusKm:
          branch.deliveryRadiusKm === ""
            ? null
            : Number(branch.deliveryRadiusKm),
      };

      // merchant comes from URL
      delete payload.merchantId;

      console.log("Creating/updating branch");
      console.log("Merchant ID:", selectedMerchant.id);
      console.log("Payload:", payload);

      if (editingBranch) {
        await api.put(`/${selectedMerchant.id}/branches/${branch.id}`, payload);
      } else {
        await api.post(`/${selectedMerchant.id}/branches`, payload);
      }

      setBranchDialog(false);
      setBranchErrors({});

      await loadBranches(selectedMerchant.id);
    } catch (error) {
      console.error("Error saving branch:", error);

      console.error("Backend response:", error.response?.data);
    }
  };

  /* =======================================================
     DELETE BRANCH
  ======================================================= */

  const deleteBranch = async (id) => {
    if (!window.confirm("Delete this branch?")) {
      return;
    }

    try {
      await api.delete(`/merchant-branches/${id}`);

      await loadBranches(selectedMerchant.id);
    } catch (error) {
      console.error("Error deleting branch:", error);
    }
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredMerchants = merchants.filter((item) => {
    const value = search.toLowerCase();

    return (
      item.businessName?.toLowerCase().includes(value) ||
      item.merchantCode?.toLowerCase().includes(value) ||
      item.ownerName?.toLowerCase().includes(value) ||
      item.ownerEmail?.toLowerCase().includes(value) ||
      item.city?.toLowerCase().includes(value)
    );
  });

  /* =======================================================
     FORM INPUT
  ======================================================= */

  const handleMerchantChange = (field, value) => {
    setMerchant((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBranchChange = (field, value) => {
    setBranch((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* =================================================
          BRANCH PAGE
      ================================================= */}

      {selectedMerchant ? (
        <>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Box>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => setSelectedMerchant(null)}
                sx={{
                  mb: 1,
                  textTransform: "none",
                }}
              >
                Back to Merchants
              </Button>

              <Typography variant="h5" fontWeight={700}>
                {selectedMerchant.businessName}
              </Typography>

              <Typography color="text.secondary">
                Merchant Code: {selectedMerchant.merchantCode}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openAddBranch}
            >
              Add Branch
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {branches.map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <Card>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {item.branchName}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          {item.branchCode}
                        </Typography>
                      </Box>

                      <Chip
                        label={item.isActive === "Y" ? "Active" : "Inactive"}
                        size="small"
                        color={item.isActive === "Y" ? "success" : "default"}
                      />
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Typography>
                      <b>Contact:</b> {item.contactPersonName || "-"}
                    </Typography>

                    <Typography>
                      <b>Phone:</b> {item.contactNumber || "-"}
                    </Typography>

                    <Typography>
                      <b>Email:</b> {item.email || "-"}
                    </Typography>

                    <Typography>
                      <b>Type:</b> {item.branchType || "-"}
                    </Typography>

                    <Typography>
                      <b>City:</b> {item.city || "-"}
                    </Typography>

                    <Typography>
                      <b>Pincode:</b> {item.pincode || "-"}
                    </Typography>

                    <Stack direction="row" spacing={1} mt={2}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => openEditBranch(item)}
                      >
                        Edit
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => deleteBranch(item.id)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {branches.length === 0 && (
            <Card>
              <CardContent>
                <Typography align="center" color="text.secondary" py={5}>
                  No branches found.
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* BRANCH DIALOG */}

          <BranchDialog
            open={branchDialog}
            onClose={() => setBranchDialog(false)}
            branch={branch}
            editing={editingBranch}
            onChange={handleBranchChange}
            onSave={saveBranch}
          />
        </>
      ) : (
        /* =================================================
           MERCHANT PAGE
        ================================================= */

        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            mb={3}
          >
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Merchants
              </Typography>

              <Typography color="text.secondary">
                Manage merchants, subscriptions and branches
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openAddMerchant}
            >
              Add Merchant
            </Button>
          </Stack>

          {/* SEARCH */}

          <TextField
            fullWidth
            placeholder="Search by merchant name, code, owner or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 3 }}
          />

          {/* TABLE */}

          <Card>
            <Box sx={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Merchant</th>
                    <th style={thStyle}>Owner</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Plan</th>
                    <th style={thStyle}>Payment</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Usage</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMerchants.map((item) => (
                    <tr key={item.id}>
                      <td style={tdStyle}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Store />

                          <Box>
                            <Typography fontWeight={600}>
                              {item.businessName}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.merchantCode}
                            </Typography>
                          </Box>
                        </Stack>
                      </td>

                      <td style={tdStyle}>
                        <Typography>{item.ownerName}</Typography>

                        <Typography variant="caption" color="text.secondary">
                          {item.ownerEmail}
                        </Typography>
                      </td>

                      <td style={tdStyle}>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <LocationOn fontSize="small" />

                          {item.city || "-"}
                        </Stack>
                      </td>

                      <td style={tdStyle}>
                        <Chip
                          label={item.subscriptionPlan || "-"}
                          size="small"
                        />
                      </td>

                      <td style={tdStyle}>
                        <Chip
                          label={item.paymentStatus || "-"}
                          size="small"
                          color={
                            item.paymentStatus === "PAID"
                              ? "success"
                              : "warning"
                          }
                        />
                      </td>

                      <td style={tdStyle}>
                        <Chip
                          label={
                            item.active ? item.status || "ACTIVE" : "INACTIVE"
                          }
                          size="small"
                          color={item.active ? "success" : "error"}
                        />
                      </td>

                      <td style={tdStyle}>
                        <Typography variant="body2">
                          Products: {item.productCount || 0}
                        </Typography>

                        <Typography variant="body2">
                          Users: {item.userCount || 0}
                        </Typography>

                        <Typography variant="body2">
                          Orders: {item.orderCount || 0}
                        </Typography>
                      </td>

                      <td style={tdStyle}>
                        <Stack direction="row" spacing={0.5}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Store />}
                            onClick={() => openBranches(item)}
                          >
                            Branches
                          </Button>

                          <IconButton
                            color="primary"
                            onClick={() => openEditMerchant(item)}
                            title="Edit"
                          >
                            <Edit />
                          </IconButton>

                          <IconButton
                            color="error"
                            onClick={() => deleteMerchant(item.id)}
                            title="Delete"
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            {filteredMerchants.length === 0 && (
              <Box py={6} textAlign="center">
                <Typography color="text.secondary">
                  {loading ? "Loading merchants..." : "No merchants found"}
                </Typography>
              </Box>
            )}
          </Card>

          {/* MERCHANT DIALOG */}

          <MerchantDialog
            open={merchantDialog}
            onClose={() => setMerchantDialog(false)}
            merchant={merchant}
            editing={editingMerchant}
            tab={tab}
            setTab={setTab}
            onChange={handleMerchantChange}
            onSave={saveMerchant}
          />
        </>
      )}
    </Box>
  );
}

/* =========================================================
   MERCHANT DIALOG
========================================================= */

function MerchantDialog({
  open,
  onClose,
  merchant,
  editing,
  tab,
  setTab,
  onChange,
  onSave,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{editing ? "Edit Merchant" : "Add Merchant"}</DialogTitle>

      <DialogContent dividers>
        <Tabs
          value={tab}
          onChange={(e, value) => setTab(value)}
          sx={{ mb: 3 }}
          variant="scrollable"
        >
          <Tab label="Business" />
          <Tab label="Owner" />
          <Tab label="Address" />
          <Tab label="Store" />
          <Tab label="Subscription" />
          <Tab label="Billing" />
          <Tab label="Configuration" />
          <Tab label="Branding" />
        </Tabs>

        {/* BUSINESS */}

        {tab === 0 && (
          <Grid container spacing={2}>
            <Input
              label="Merchant Code"
              field="merchantCode"
              value={merchant.merchantCode}
              onChange={onChange}
              required
            />

            <Input
              label="Business Name"
              field="businessName"
              value={merchant.businessName}
              onChange={onChange}
              required
            />

            <Input
              label="Legal Business Name"
              field="legalBusinessName"
              value={merchant.legalBusinessName}
              onChange={onChange}
            />

            <SelectInput
              label="Business Type"
              field="businessType"
              value={merchant.businessType}
              options={BUSINESS_TYPES}
              onChange={onChange}
            />

            <Input
              label="Business Category"
              field="businessCategory"
              value={merchant.businessCategory}
              onChange={onChange}
            />

            <Input
              label="Logo URL"
              field="logoUrl"
              value={merchant.logoUrl}
              onChange={onChange}
            />

            <Input
              label="Favicon URL"
              field="faviconUrl"
              value={merchant.faviconUrl}
              onChange={onChange}
            />

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={merchant.description}
                onChange={(e) => onChange("description", e.target.value)}
              />
            </Grid>

            <Input
              label="GST Number"
              field="gstNumber"
              value={merchant.gstNumber}
              onChange={onChange}
            />

            <Input
              label="PAN Number"
              field="panNumber"
              value={merchant.panNumber}
              onChange={onChange}
            />

            <Input
              label="Business Registration Number"
              field="businessRegistrationNumber"
              value={merchant.businessRegistrationNumber}
              onChange={onChange}
            />
          </Grid>
        )}

        {/* OWNER */}

        {tab === 1 && (
          <Grid container spacing={2}>
            <Input
              label="Owner Name"
              field="ownerName"
              value={merchant.ownerName}
              onChange={onChange}
              required
            />

            <Input
              label="Owner Email"
              field="ownerEmail"
              value={merchant.ownerEmail}
              onChange={onChange}
              required
              type="email"
            />

            <Input
              label="Owner Phone"
              field="ownerPhone"
              value={merchant.ownerPhone}
              onChange={onChange}
              required
            />
          </Grid>
        )}

        {/* ADDRESS */}

        {tab === 2 && (
          <Grid container spacing={2}>
            <Input
              label="Address Line 1"
              field="addressLine1"
              value={merchant.addressLine1}
              onChange={onChange}
              xs={12}
            />

            <Input
              label="Address Line 2"
              field="addressLine2"
              value={merchant.addressLine2}
              onChange={onChange}
              xs={12}
            />

            <Input
              label="City"
              field="city"
              value={merchant.city}
              onChange={onChange}
            />

            <Input
              label="State"
              field="state"
              value={merchant.state}
              onChange={onChange}
            />

            <Input
              label="Country"
              field="country"
              value={merchant.country}
              onChange={onChange}
            />

            <Input
              label="Pincode"
              field="pincode"
              value={merchant.pincode}
              onChange={onChange}
            />

            <Input
              label="Latitude"
              field="latitude"
              value={merchant.latitude}
              onChange={onChange}
              type="number"
            />

            <Input
              label="Longitude"
              field="longitude"
              value={merchant.longitude}
              onChange={onChange}
              type="number"
            />
          </Grid>
        )}

        {/* STORE */}

        {tab === 3 && (
          <Grid container spacing={2}>
            <Input
              label="Store Slug"
              field="storeSlug"
              value={merchant.storeSlug}
              onChange={onChange}
            />

            <Input
              label="Store URL"
              field="storeUrl"
              value={merchant.storeUrl}
              onChange={onChange}
            />

            <Input
              label="Custom Domain"
              field="customDomain"
              value={merchant.customDomain}
              onChange={onChange}
            />

            <BooleanInput
              label="Custom Domain Enabled"
              field="customDomainEnabled"
              value={merchant.customDomainEnabled}
              onChange={onChange}
            />

            <BooleanInput
              label="SSL Enabled"
              field="sslEnabled"
              value={merchant.sslEnabled}
              onChange={onChange}
            />
          </Grid>
        )}

        {/* SUBSCRIPTION */}

        {tab === 4 && (
          <Grid container spacing={2}>
            <SelectInput
              label="Subscription Plan"
              field="subscriptionPlan"
              value={merchant.subscriptionPlan}
              options={SUBSCRIPTION_PLANS}
              onChange={onChange}
            />

            <SelectInput
              label="Subscription Status"
              field="subscriptionStatus"
              value={merchant.subscriptionStatus}
              options={SUBSCRIPTION_STATUS}
              onChange={onChange}
            />

            <Input
              label="Subscription Start Date"
              field="subscriptionStartDate"
              value={merchant.subscriptionStartDate}
              onChange={onChange}
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <Input
              label="Subscription End Date"
              field="subscriptionEndDate"
              value={merchant.subscriptionEndDate}
              onChange={onChange}
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <Input
              label="Max Products"
              field="maxProducts"
              value={merchant.maxProducts}
              onChange={onChange}
              type="number"
            />

            <Input
              label="Max Users"
              field="maxUsers"
              value={merchant.maxUsers}
              onChange={onChange}
              type="number"
            />

            <Input
              label="Max Orders / Month"
              field="maxOrdersPerMonth"
              value={merchant.maxOrdersPerMonth}
              onChange={onChange}
              type="number"
            />

            <Input
              label="Max Storage MB"
              field="maxStorageMb"
              value={merchant.maxStorageMb}
              onChange={onChange}
              type="number"
            />

            <Input
              label="Max API Requests / Month"
              field="maxApiRequestsPerMonth"
              value={merchant.maxApiRequestsPerMonth}
              onChange={onChange}
              type="number"
            />
          </Grid>
        )}

        {/* BILLING */}

        {tab === 5 && (
          <Grid container spacing={2}>
            <Input
              label="Monthly Subscription"
              field="monthlySubscription"
              value={merchant.monthlySubscription}
              onChange={onChange}
              type="number"
            />

            <Input
              label="Additional Storage Charges"
              field="additionalStorageCharges"
              value={merchant.additionalStorageCharges}
              onChange={onChange}
              type="number"
            />

            <Input
              label="Additional User Charges"
              field="additionalUserCharges"
              value={merchant.additionalUserCharges}
              onChange={onChange}
              type="number"
            />

            <Input
              label="Additional Order Charges"
              field="additionalOrderCharges"
              value={merchant.additionalOrderCharges}
              onChange={onChange}
              type="number"
            />

            <Input
              label="Total Monthly Bill"
              field="totalMonthlyBill"
              value={merchant.totalMonthlyBill}
              onChange={onChange}
              type="number"
            />

            <SelectInput
              label="Payment Status"
              field="paymentStatus"
              value={merchant.paymentStatus}
              options={PAYMENT_STATUS}
              onChange={onChange}
            />

            <Input
              label="Payment Customer ID"
              field="paymentCustomerId"
              value={merchant.paymentCustomerId}
              onChange={onChange}
            />

            <Input
              label="Payment Subscription ID"
              field="paymentSubscriptionId"
              value={merchant.paymentSubscriptionId}
              onChange={onChange}
            />

            <Input
              label="Last Payment Date"
              field="lastPaymentDate"
              value={merchant.lastPaymentDate}
              onChange={onChange}
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <Input
              label="Next Billing Date"
              field="nextBillingDate"
              value={merchant.nextBillingDate}
              onChange={onChange}
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        )}

        {/* CONFIGURATION */}

        {tab === 6 && (
          <Grid container spacing={2}>
            <Input
              label="Currency"
              field="currency"
              value={merchant.currency}
              onChange={onChange}
            />

            <Input
              label="Timezone"
              field="timezone"
              value={merchant.timezone}
              onChange={onChange}
            />

            <Input
              label="Language"
              field="language"
              value={merchant.language}
              onChange={onChange}
            />

            <BooleanInput
              label="Tax Enabled"
              field="taxEnabled"
              value={merchant.taxEnabled}
              onChange={onChange}
            />

            <BooleanInput
              label="Inventory Enabled"
              field="inventoryEnabled"
              value={merchant.inventoryEnabled}
              onChange={onChange}
            />

            <BooleanInput
              label="Delivery Enabled"
              field="deliveryEnabled"
              value={merchant.deliveryEnabled}
              onChange={onChange}
            />

            <BooleanInput
              label="Online Payment"
              field="onlinePaymentEnabled"
              value={merchant.onlinePaymentEnabled}
              onChange={onChange}
            />

            <BooleanInput
              label="Cash on Delivery"
              field="cashOnDeliveryEnabled"
              value={merchant.cashOnDeliveryEnabled}
              onChange={onChange}
            />

            <BooleanInput
              label="Coupon Enabled"
              field="couponEnabled"
              value={merchant.couponEnabled}
              onChange={onChange}
            />

            <BooleanInput
              label="Review Enabled"
              field="reviewEnabled"
              value={merchant.reviewEnabled}
              onChange={onChange}
            />

            <SelectInput
              label="Status"
              field="status"
              value={merchant.status}
              options={MERCHANT_STATUS}
              onChange={onChange}
            />

            <BooleanInput
              label="Active"
              field="active"
              value={merchant.active}
              onChange={onChange}
            />
          </Grid>
        )}

        {/* BRANDING */}

        {tab === 7 && (
          <Grid container spacing={2}>
            <Input
              label="Primary Color"
              field="primaryColor"
              value={merchant.primaryColor}
              onChange={onChange}
            />

            <Input
              label="Secondary Color"
              field="secondaryColor"
              value={merchant.secondaryColor}
              onChange={onChange}
            />

            <Input
              label="Font Family"
              field="fontFamily"
              value={merchant.fontFamily}
              onChange={onChange}
            />
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button variant="contained" onClick={onSave}>
          {editing ? "Update Merchant" : "Create Merchant"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================================================
   BRANCH DIALOG
========================================================= */

function BranchDialog({ open, onClose, branch, editing, onChange, onSave }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{editing ? "Edit Branch" : "Add Branch"}</DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Input
            label="Branch Name"
            field="branchName"
            value={branch.branchName}
            onChange={onChange}
            required
          />

          <Input
            label="Branch Code"
            field="branchCode"
            value={branch.branchCode}
            onChange={onChange}
          />

          <SelectInput
            label="Branch Type"
            field="branchType"
            value={branch.branchType}
            options={BRANCH_TYPES}
            onChange={onChange}
          />

          <Input
            label="Franchise Owner Name"
            field="franchiseOwnerName"
            value={branch.franchiseOwnerName}
            onChange={onChange}
          />

          <Input
            label="Franchise Owner Email"
            field="franchiseOwnerEmail"
            value={branch.franchiseOwnerEmail}
            onChange={onChange}
          />

          <Input
            label="Franchise Owner Mobile"
            field="franchiseOwnerMobile"
            value={branch.franchiseOwnerMobile}
            onChange={onChange}
          />

          <Input
            label="Contact Person"
            field="contactPersonName"
            value={branch.contactPersonName}
            onChange={onChange}
          />

          <Input
            label="Contact Number"
            field="contactNumber"
            value={branch.contactNumber}
            onChange={onChange}
          />

          <Input
            label="Alternate Contact"
            field="alternateContactNumber"
            value={branch.alternateContactNumber}
            onChange={onChange}
          />

          <Input
            label="Email"
            field="email"
            value={branch.email}
            onChange={onChange}
            type="email"
          />

          <Input
            label="Address Line 1"
            field="addressLine1"
            value={branch.addressLine1}
            onChange={onChange}
            xs={12}
          />

          <Input
            label="Address Line 2"
            field="addressLine2"
            value={branch.addressLine2}
            onChange={onChange}
            xs={12}
          />

          <Input
            label="Landmark"
            field="landmark"
            value={branch.landmark}
            onChange={onChange}
          />

          <Input
            label="City"
            field="city"
            value={branch.city}
            onChange={onChange}
          />

          <Input
            label="District"
            field="district"
            value={branch.district}
            onChange={onChange}
          />

          <Input
            label="State"
            field="state"
            value={branch.state}
            onChange={onChange}
          />

          <Input
            label="Country"
            field="country"
            value={branch.country}
            onChange={onChange}
          />

          <Input
            label="Pincode"
            field="pincode"
            value={branch.pincode}
            onChange={onChange}
          />

          <Input
            label="Latitude"
            field="latitude"
            value={branch.latitude}
            onChange={onChange}
            type="number"
          />

          <Input
            label="Longitude"
            field="longitude"
            value={branch.longitude}
            onChange={onChange}
            type="number"
          />

          <Input
            label="Delivery Radius (KM)"
            field="deliveryRadiusKm"
            value={branch.deliveryRadiusKm}
            onChange={onChange}
            type="number"
          />

          <Input
            label="GST Number"
            field="gstNumber"
            value={branch.gstNumber}
            onChange={onChange}
          />

          <Input
            label="FSSAI Number"
            field="fssaiNumber"
            value={branch.fssaiNumber}
            onChange={onChange}
          />

          <Input
            label="License Number"
            field="licenseNumber"
            value={branch.licenseNumber}
            onChange={onChange}
          />

          <Input
            label="Opening Time"
            field="openingTime"
            value={branch.openingTime}
            onChange={onChange}
            type="time"
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Input
            label="Closing Time"
            field="closingTime"
            value={branch.closingTime}
            onChange={onChange}
            type="time"
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Input
            label="Working Days"
            field="workingDays"
            value={branch.workingDays}
            onChange={onChange}
            xs={12}
            helperText="Example: MON,TUE,WED,THU,FRI,SAT"
          />

          <BooleanInput
            label="Delivery Available"
            field="deliveryAvailable"
            value={branch.deliveryAvailable}
            onChange={onChange}
          />

          <BooleanInput
            label="Pickup Available"
            field="pickupAvailable"
            value={branch.pickupAvailable}
            onChange={onChange}
          />

          <BooleanInput
            label="Dine In Available"
            field="dineInAvailable"
            value={branch.dineInAvailable}
            onChange={onChange}
          />

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControl>
              <Typography variant="body2">Branch Active</Typography>

              <Switch
                checked={branch.isActive === "Y"}
                onChange={(e) =>
                  onChange("isActive", e.target.checked ? "Y" : "N")
                }
              />
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button variant="contained" onClick={onSave}>
          {editing ? "Update Branch" : "Create Branch"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================================================
   REUSABLE INPUT
========================================================= */

function Input({
  label,
  field,
  value,
  onChange,
  type = "text",
  xs = 6,
  required = false,
  helperText,
  InputLabelProps,
}) {
  return (
    <Grid item xs={12} md={xs}>
      <TextField
        fullWidth
        label={label}
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        type={type}
        required={required}
        helperText={helperText}
        InputLabelProps={InputLabelProps}
      />
    </Grid>
  );
}

/* =========================================================
   SELECT
========================================================= */

function SelectInput({ label, field, value, options, onChange }) {
  return (
    <Grid item xs={12} md={6}>
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>

        <Select
          value={value || ""}
          label={label}
          onChange={(e) => onChange(field, e.target.value)}
        >
          {options.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  );
}

/* =========================================================
   BOOLEAN
========================================================= */

function BooleanInput({ label, field, value, onChange }) {
  return (
    <Grid item xs={12} md={6}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          border: "1px solid #ddd",
          borderRadius: 1,
          px: 2,
          py: 0.5,
        }}
      >
        <Typography>{label}</Typography>

        <Switch
          checked={Boolean(value)}
          onChange={(e) => onChange(field, e.target.checked)}
        />
      </Stack>
    </Grid>
  );
}

/* =========================================================
   TABLE STYLES
========================================================= */

const thStyle = {
  textAlign: "left",
  padding: "14px",
  borderBottom: "1px solid #ddd",
  whiteSpace: "nowrap",
  fontSize: "14px",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #eee",
  verticalAlign: "middle",
};
