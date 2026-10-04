// CouponManagement.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Chip,
} from "@mui/material";
import { ArrowBack, Add, Search } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "../utils/AxiosInstance";
const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [searchCoupon, setSearchCoupon] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view"); // "add", "update", "view"

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = () => {
    axios
      .get("http://localhost:8080/coupons/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCoupons(res.data.result))
      .catch((err) => console.error("Failed to fetch coupons:", err));
  };

  const handleDeleteCoupon = (id) => {
    const confirmDelete = window.confirm("Delete this coupon?");
    if (!confirmDelete) return;

    axios
      .delete(`http://localhost:8080/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("Coupon deleted");
        fetchCoupons();
      })
      .catch((err) => {
        alert("Failed to delete coupon");
        console.error(err);
      });
  };

  const handleCouponSubmit = () => {
    if (
      !selectedCoupon.name ||
      !selectedCoupon.validFrom ||
      !selectedCoupon.validTo
    ) {
      alert("Please fill all required fields.");
      return;
    }

    const payload = {
      ...selectedCoupon,
    };

    const url =
      dialogMode === "add"
        ? "http://localhost:8080/coupons/create"
        : `http://localhost:8080/coupons/${selectedCoupon.id}`;
    const method = dialogMode === "add" ? "post" : "patch";

    axios[method](url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        alert(
          `Coupon ${dialogMode === "add" ? "added" : "updated"} successfully`,
        );
        setDialogOpen(false);
        fetchCoupons();
      })
      .catch((err) => {
        alert("Error while saving coupon");
        console.error(err);
      });
  };

  const filteredCoupons = coupons.filter((c) =>
    c.name?.toLowerCase().includes(searchCoupon.toLowerCase()),
  );

  return (
    <Container>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <IconButton onClick={() => navigate("/admin-dashboard")}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Coupon Management
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            label="Search Coupons"
            variant="outlined"
            value={searchCoupon}
            onChange={(e) => setSearchCoupon(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            size="small"
            sx={{ flexGrow: 1, minWidth: 250 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setDialogMode("add");
              setSelectedCoupon({
                name: "",
                description: "",
                validFrom: "",
                validTo: "",
                percentageOff: 0,
                amount: 0,
                minOrderValue: 0,
                eligibilityCriteria: "",
                validCategories: "",
                isActive: "true",
              });
              setDialogOpen(true);
            }}
            size="small"
          >
            Add Coupon
          </Button>
        </Box>
      </Paper>

      {/* Coupons Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>
                <strong>ID</strong>
              </TableCell>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Validity</strong>
              </TableCell>
              <TableCell>
                <strong>Discount</strong>
              </TableCell>
              <TableCell>
                <strong>Min Order</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCoupons.length > 0 ? (
              filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id} hover>
                  <TableCell>{coupon.id}</TableCell>
                  <TableCell>{coupon.name}</TableCell>
                  <TableCell>
                    {coupon.validFrom} - {coupon.validTo}
                  </TableCell>
                  <TableCell>
                    {coupon.percentageOff
                      ? `${coupon.percentageOff}%`
                      : `₹${coupon.amount}`}
                  </TableCell>
                  <TableCell>₹{coupon.minOrderValue}</TableCell>
                  <TableCell>
                    <Chip
                      label={coupon.isActive === "true" ? "Active" : "Inactive"}
                      color={coupon.isActive === "true" ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setDialogMode("view");
                        setSelectedCoupon(coupon);
                        setDialogOpen(true);
                      }}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setDialogMode("update");
                        setSelectedCoupon(coupon);
                        setDialogOpen(true);
                      }}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No coupons found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {dialogMode === "add"
            ? "Add Coupon"
            : dialogMode === "update"
              ? "Update Coupon"
              : "Coupon Details"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              label="Coupon Name *"
              fullWidth
              value={selectedCoupon?.name || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedCoupon({ ...selectedCoupon, name: e.target.value })
              }
            />
            <TextField
              label="Percentage Off"
              type="number"
              fullWidth
              value={selectedCoupon?.percentageOff || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedCoupon({
                  ...selectedCoupon,
                  percentageOff: e.target.value,
                })
              }
            />
            <TextField
              label="Amount Off"
              type="number"
              fullWidth
              value={selectedCoupon?.amount || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedCoupon({ ...selectedCoupon, amount: e.target.value })
              }
            />
            <TextField
              label="Min Order Value"
              type="number"
              fullWidth
              value={selectedCoupon?.minOrderValue || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedCoupon({
                  ...selectedCoupon,
                  minOrderValue: e.target.value,
                })
              }
            />
            <TextField
              label="Valid From"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={selectedCoupon?.validFrom || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedCoupon({
                  ...selectedCoupon,
                  validFrom: e.target.value,
                })
              }
            />
            <TextField
              label="Valid To"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={selectedCoupon?.validTo || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedCoupon({
                  ...selectedCoupon,
                  validTo: e.target.value,
                })
              }
            />
            <TextField
              label="Eligibility Criteria"
              fullWidth
              value={selectedCoupon?.eligibilityCriteria || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedCoupon({
                  ...selectedCoupon,
                  eligibilityCriteria: e.target.value,
                })
              }
            />
            <TextField
              label="Valid Categories (comma-separated)"
              fullWidth
              value={selectedCoupon?.validCategories || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedCoupon({
                  ...selectedCoupon,
                  validCategories: e.target.value,
                })
              }
            />
            <TextField
              label="Status (true / false)"
              fullWidth
              value={selectedCoupon?.isActive || "true"}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedCoupon({
                  ...selectedCoupon,
                  isActive: e.target.value,
                })
              }
            />
          </Box>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
            value={selectedCoupon?.description || ""}
            disabled={dialogMode === "view"}
            onChange={(e) =>
              setSelectedCoupon({
                ...selectedCoupon,
                description: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          {(dialogMode === "add" || dialogMode === "update") && (
            <Button onClick={handleCouponSubmit} variant="contained">
              {dialogMode === "add" ? "Add Coupon" : "Update Coupon"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CouponManagement;
