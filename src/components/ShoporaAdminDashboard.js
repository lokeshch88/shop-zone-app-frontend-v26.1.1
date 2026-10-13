import React, { useEffect, useMemo, useCallback, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Category,
  CreditCard,
  DeleteOutline,
  EditOutlined,
  Refresh,
  SettingsOutlined,
  Storefront,
  WorkspacePremium,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "../utils/AxiosInstance";
import MerchantManagement from "./MerchantManagement";

const PLATFORM_RESOURCES = {
  categories: {
    title: "Merchant categories",
    endpoint: "/api/platform/merchant-categories",
    icon: Category,
    fields: [
      { name: "code", label: "Code", required: true },
      { name: "name", label: "Category name", required: true },
      { name: "slug", label: "URL slug", required: true },
      { name: "description", label: "Description", multiline: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: ["ACTIVE", "INACTIVE"],
      },
    ],
  },
  payments: {
    title: "Merchant payments",
    endpoint: "/api/platform/payments",
    icon: CreditCard,
    fields: [
      { name: "merchantId", label: "Merchant ID", required: true },
      { name: "amount", label: "Amount", type: "number", required: true },
      { name: "currency", label: "Currency", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      },
      { name: "gateway", label: "Payment gateway" },
      { name: "gatewayReference", label: "Gateway reference" },
      { name: "paidAt", label: "Paid at", type: "datetime-local" },
      { name: "notes", label: "Notes", multiline: true },
    ],
  },
  plans: {
    title: "Subscription plans",
    endpoint: "/api/platform/subscription-plans",
    icon: WorkspacePremium,
    fields: [
      { name: "code", label: "Plan code", required: true },
      { name: "name", label: "Plan name", required: true },
      { name: "description", label: "Description", multiline: true },
      { name: "monthlyPrice", label: "Monthly price", type: "number" },
      { name: "annualPrice", label: "Annual price", type: "number" },
      { name: "maxProducts", label: "Maximum products", type: "number" },
      { name: "maxUsers", label: "Maximum users", type: "number" },
      { name: "maxOrdersPerMonth", label: "Orders per month", type: "number" },
      {
        name: "features",
        label: "Features (one per line)",
        type: "list",
        multiline: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["ACTIVE", "INACTIVE"],
      },
    ],
  },
  landing: {
    title: "Landing page options",
    endpoint: "/api/platform/landing-page-options",
    icon: SettingsOutlined,
    fields: [
      { name: "key", label: "Option key", required: true },
      { name: "heroTitle", label: "Hero title" },
      { name: "heroSubtitle", label: "Hero subtitle", multiline: true },
      { name: "heroImageUrl", label: "Hero image URL" },
      { name: "primaryActionLabel", label: "Primary action label" },
      { name: "primaryActionUrl", label: "Primary action URL" },
      {
        name: "featuredMerchantIds",
        label: "Featured merchant IDs (one per line)",
        type: "list",
        multiline: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["ACTIVE", "INACTIVE"],
      },
    ],
  },
};

const getPayload = (data) => data?.result ?? data?.data ?? data;

const getRows = (data) => {
  const payload = getPayload(data);
  if (Array.isArray(payload)) return payload;
  for (const key of ["items", "content", "records", "payments", "merchants"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return payload && typeof payload === "object" && Object.keys(payload).length
    ? [payload]
    : [];
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Request failed. Please try again.";

const roleIsSuperAdmin = (role = localStorage.getItem("userRole")) =>
  ["SUPER_ADMIN", "SUPERADMIN"].includes(
    String(role || "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_"),
  );

function ResourceManager({ resource }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState({});
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [notice, setNotice] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await axios.get(resource.endpoint);
      setRows(getRows(response.data));
    } catch (error) {
      setRows([]);
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [resource.endpoint]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const openCreateDialog = () => {
    setEditingRow(null);
    setForm({});
    setDialogOpen(true);
  };

  const openEditDialog = (row) => {
    setEditingRow(row);
    setForm(
      Object.fromEntries(
        resource.fields.map((field) => {
          const value = row[field.name];
          return [
            field.name,
            field.type === "list" && Array.isArray(value)
              ? value.join("\n")
              : (value ?? ""),
          ];
        }),
      ),
    );
    setDialogOpen(true);
  };

  const saveRow = async () => {
    const missing = resource.fields.find(
      (field) => field.required && !String(form[field.name] ?? "").trim(),
    );
    if (missing) {
      setNotice(`${missing.label} is required.`);
      return;
    }

    const payload = { ...(editingRow || {}) };
    for (const field of resource.fields) {
      const value = form[field.name];
      if (field.type === "number") {
        payload[field.name] =
          value === "" || value == null ? null : Number(value);
      } else if (field.type === "list") {
        payload[field.name] = String(value || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
      } else {
        payload[field.name] = value;
      }
    }

    try {
      setSaving(true);
      const id = editingRow?.id ?? editingRow?.resourceId;
      if (id == null) {
        await axios.post(resource.endpoint, payload);
      } else {
        await axios.put(
          `${resource.endpoint}/${encodeURIComponent(id)}`,
          payload,
        );
      }
      setDialogOpen(false);
      setNotice(editingRow ? "Changes saved." : "Record created.");
      await loadRows();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async () => {
    const id = deleteCandidate?.id ?? deleteCandidate?.resourceId;
    if (id == null) {
      setNotice("This record has no ID and cannot be deleted.");
      setDeleteCandidate(null);
      return;
    }
    try {
      await axios.delete(`${resource.endpoint}/${encodeURIComponent(id)}`);
      setDeleteCandidate(null);
      setNotice("Record deleted.");
      await loadRows();
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  };

  const columns = useMemo(() => {
    if (!rows.length) return resource.fields.slice(0, 4);
    const first = rows[0];
    const preferred = resource.fields.map((field) => field.name);
    const present = preferred.filter((key) => key in first);
    const additional = Object.keys(first).filter(
      (key) => !preferred.includes(key) && typeof first[key] !== "object",
    );
    return [...present, ...additional].slice(0, 5).map((name) => ({
      name,
      label:
        resource.fields.find((field) => field.name === name)?.label ||
        name
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (char) => char.toUpperCase()),
    }));
  }, [resource.fields, rows]);

  const formatCell = (value) => {
    if (value == null || value === "") return "-";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const ResourceIcon = resource.icon;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <ResourceIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>
              {resource.title}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage platform records. Changes are saved through the Shopora API.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh records">
            <IconButton
              onClick={loadRows}
              disabled={loading}
              aria-label="Refresh"
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Add record
          </Button>
        </Stack>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load {resource.title.toLowerCase()}: {loadError}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 1.5 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.name}
                  sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  align="center"
                  sx={{ py: 5 }}
                >
                  <CircularProgress size={26} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  align="center"
                  sx={{ py: 5 }}
                >
                  <Typography color="text.secondary">
                    {loadError
                      ? "No data available until the API is configured."
                      : "No records found."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow hover key={row.id ?? row.resourceId ?? index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.name}
                      sx={{ maxWidth: 280, overflowWrap: "anywhere" }}
                    >
                      {column.name === "status" ? (
                        <Chip
                          size="small"
                          label={formatCell(row[column.name])}
                          variant="outlined"
                        />
                      ) : (
                        formatCell(row[column.name])
                      )}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(row)}
                        aria-label="Edit record"
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteCandidate(row)}
                        aria-label="Delete record"
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingRow
            ? `Edit ${resource.title.toLowerCase()}`
            : `Add ${resource.title.toLowerCase()}`}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {resource.fields.map((field) =>
              field.type === "select" ? (
                <TextField
                  key={field.name}
                  select
                  fullWidth
                  label={field.label}
                  required={field.required}
                  value={form[field.name] ?? ""}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      [field.name]: event.target.value,
                    }))
                  }
                >
                  {field.options.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  key={field.name}
                  fullWidth
                  label={field.label}
                  type={field.type === "list" ? "text" : field.type || "text"}
                  required={field.required}
                  multiline={field.multiline}
                  minRows={field.multiline ? 3 : undefined}
                  value={form[field.name] ?? ""}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      [field.name]: event.target.value,
                    }))
                  }
                  InputLabelProps={
                    field.type === "datetime-local"
                      ? { shrink: true }
                      : undefined
                  }
                />
              ),
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveRow} disabled={saving}>
            {saving
              ? "Saving..."
              : editingRow
                ? "Save changes"
                : "Create record"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete this record?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This action cannot be undone. The change will be sent to the
            backend.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteCandidate(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteRow}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice("")}
        message={notice}
      />
    </Box>
  );
}

export default function ShoporaAdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [merchantRows, setMerchantRows] = useState([]);
  const [merchantLoading, setMerchantLoading] = useState(true);
  const [merchantError, setMerchantError] = useState("");
  const [authorized, setAuthorized] = useState(
    Boolean(localStorage.getItem("authToken")) && roleIsSuperAdmin(),
  );
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSuperAdminLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await axios.post("/user/login", loginForm);
      const payload = getPayload(response.data);
      const token = payload?.token;
      const userRole = payload?.userRole || payload?.role;

      if (!token || !roleIsSuperAdmin(userRole)) {
        setLoginError("These credentials do not have Shopora access.");
        return;
      }

      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", userRole);
      if (payload.username) localStorage.setItem("username", payload.username);
      if (payload.userId) localStorage.setItem("userId", payload.userId);
      if (payload.email) localStorage.setItem("email", payload.email);
      localStorage.removeItem("merchantId");
      localStorage.removeItem("merchantSlug");
      localStorage.removeItem("merchantName");
      setAuthorized(true);
      window.location.assign("/shopora-control");
    } catch (error) {
      setLoginError(getErrorMessage(error));
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    if (!authorized || activeSection !== "overview") return;
    let active = true;
    setMerchantLoading(true);
    axios
      .get("/api/merchants", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      .then((response) => {
        if (active) setMerchantRows(getRows(response.data));
      })
      .catch((error) => {
        if (active) setMerchantError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setMerchantLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeSection, authorized]);

  const stats = useMemo(() => {
    const activeMerchants = merchantRows.filter(
      (merchant) => String(merchant.status || "").toUpperCase() === "ACTIVE",
    ).length;
    const subscriptions = merchantRows.filter(
      (merchant) =>
        String(merchant.subscriptionStatus || "").toUpperCase() === "ACTIVE",
    ).length;
    const paid = merchantRows.filter(
      (merchant) =>
        String(merchant.paymentStatus || "").toUpperCase() === "PAID",
    ).length;
    return [
      { label: "Total merchants", value: merchantRows.length },
      { label: "Active stores", value: activeMerchants },
      { label: "Active subscriptions", value: subscriptions },
      { label: "Paid merchant accounts", value: paid },
    ];
  }, [merchantRows]);

  if (!authorized) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 5, sm: 8 } }}>
        <Paper
          component="form"
          onSubmit={handleSuperAdminLogin}
          variant="outlined"
          sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 2 }}
        >
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Storefront color="primary" />
                <Typography variant="h5" fontWeight={700}>
                  Shopora Control
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.75 }}
              >
                Sign in with a Shopora account.
              </Typography>
            </Box>
            {loginError && <Alert severity="error">{loginError}</Alert>}
            <TextField
              autoComplete="username"
              autoFocus
              fullWidth
              label="Username"
              value={loginForm.username}
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              required
            />
            <TextField
              autoComplete="current-password"
              fullWidth
              label="Password"
              type="password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              required
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={
                loginLoading || !loginForm.username || !loginForm.password
              }
            >
              {loginLoading ? "Signing in..." : "Sign in"}
            </Button>
            <Button onClick={() => navigate("/")} color="inherit">
              Back to Shopora
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "merchants", label: "Merchants" },
    { id: "categories", label: "Merchant categories" },
    { id: "payments", label: "Payments" },
    { id: "plans", label: "Subscription plans" },
    { id: "landing", label: "Landing page" },
  ];

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 150px)",
        bgcolor: "#F6F7F9",
        py: { xs: 2, md: 3 },
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Storefront color="primary" />
              <Typography
                variant="h4"
                fontWeight={750}
                sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
              >
                Shopora Control
              </Typography>
              <Chip
                size="small"
                label="SUPER ADMIN"
                color="primary"
                variant="outlined"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Platform operations, merchant accounts, billing and storefront
              configuration.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate("/")}>
            Public storefront
          </Button>
        </Stack>

        <Paper
          variant="outlined"
          sx={{ borderRadius: 1.5, mb: 2, overflow: "hidden" }}
        >
          <Tabs
            value={activeSection}
            onChange={(_, value) => setActiveSection(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Shopora platform management sections"
          >
            {sections.map((section) => (
              <Tab key={section.id} value={section.id} label={section.label} />
            ))}
          </Tabs>
        </Paper>

        {activeSection === "overview" && (
          <Box>
            {merchantError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Could not load merchant summary: {merchantError}
              </Alert>
            )}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
                gap: 1.5,
                mb: 2.5,
              }}
            >
              {stats.map((stat) => (
                <Paper
                  key={stat.label}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 1.5 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} sx={{ mt: 0.75 }}>
                    {merchantLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      stat.value
                    )}
                  </Typography>
                </Paper>
              ))}
            </Box>
            <Alert severity="info">
              Payment totals and revenue are intentionally not estimated from
              merchant status fields. Connect the platform payments API to
              report reconciled amounts.
            </Alert>
          </Box>
        )}
        {activeSection === "merchants" && <MerchantManagement />}
        {activeSection === "categories" && (
          <ResourceManager resource={PLATFORM_RESOURCES.categories} />
        )}
        {activeSection === "payments" && (
          <ResourceManager resource={PLATFORM_RESOURCES.payments} />
        )}
        {activeSection === "plans" && (
          <ResourceManager resource={PLATFORM_RESOURCES.plans} />
        )}
        {activeSection === "landing" && (
          <ResourceManager resource={PLATFORM_RESOURCES.landing} />
        )}
      </Container>
    </Box>
  );
}
