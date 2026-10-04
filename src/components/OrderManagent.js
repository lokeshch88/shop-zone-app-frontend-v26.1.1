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
  TablePagination,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { ArrowBack, Search, Visibility } from "@mui/icons-material";

import axios from "../utils/AxiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const OrderManagement = () => {
  const { slug } = useParams();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const orderStatuses = [
    { value: "PENDING", label: "Pending", color: "warning" },
    { value: "CONFIRMED", label: "Confirmed", color: "info" },
    { value: "SHIPPED", label: "Shipped", color: "info" },
    { value: "ASSIGNED", label: "Assigned", color: "info" },
    { value: "DELIVERED", label: "Delivered", color: "info" },
    { value: "CANCELLED", label: "Cancel", color: "danger" },
  ];

  const [deliveryPartners, setDeliveryPartners] = useState([]);

  useEffect(() => {
    axios
      .get("/user/delivery-partners")
      .then((res) => setDeliveryPartners(res.data))
      .catch((err) => console.error(err));
    console.log("Delivery Partners:", deliveryPartners);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/orders/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const transformed = res.data.map((o, idx) => ({
        ...o,
        id: o.orderId || `temp-${idx}`,
      }));
      setOrders(transformed);
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(
        "/orders/",
        { orderId, status: newStatus, userId: selectedOrder.userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      alert("Status updated");
      fetchOrders();
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  // Filter orders based on search and status
  const filtered = orders.filter((order) => {
    const matchesSearch =
      order.orderId?.toString().includes(searchTerm) ||
      order.userId?.toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort filtered orders by createdAt (latest first)
  const sortedOrders = [...filtered].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA; // Descending order: newest first
  });

  // Paginate
  const paginatedOrders = sortedOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  //to assign delivery partner only if order is SHIPPED or CONFIRMED
  const canAssignDelivery =
    selectedOrder?.status === "SHIPPED" ||
    selectedOrder?.status === "CONFIRMED";

  return (
    <Container sx={{ mt: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <IconButton
          onClick={() => navigate(`/store/${slug}/admin-dashboard`)}
          sx={{ mr: 2 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Order Management</Typography>
      </Box>

      <Paper
        sx={{
          p: 2,
          mb: 1,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          label="Search Order ID / User ID"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
          size="small" // minimize height
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            label="Status Filter"
            size="small" // minimize height
          >
            <MenuItem value="all">All</MenuItem>
            {orderStatuses.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#eee" }}>
              <TableCell>
                <strong>Order ID</strong>
              </TableCell>
              <TableCell>
                <strong>User ID</strong>
              </TableCell>
              <TableCell>
                <strong>Total Amount</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Product Count</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
              <TableCell>
                <strong>Created At</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell>{o.orderId || o.id}</TableCell>
                <TableCell>{o.userId}</TableCell>
                <TableCell>₹{o.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={o.status}
                    color={
                      orderStatuses.find((s) => s.value === o.status)?.color ||
                      "default"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {Array.isArray(o.items) ? o.items.length : 0}
                </TableCell>
                <TableCell>
                  {/* <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => {
                      setSelectedOrder(o);
                      setDialogOpen(true);
                    }}
                  >
                    View
                  </Button> */}

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => {
                      setSelectedOrder(o);
                      setDialogOpen(true);
                    }}
                  >
                    Modify
                  </Button>
                </TableCell>
                <TableCell>
                  {new Date(o.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
              </TableRow>
            ))}
            {paginatedOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[]}
        />
      </TableContainer>

      <Dialog
        open={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Order Details - {selectedOrder?.orderId || selectedOrder?.id}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography>
                        <strong>User ID:</strong> {selectedOrder.userId}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography>
                        <strong>Total:</strong> ₹
                        {selectedOrder.totalAmount.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography>
                        <strong>Products Count:</strong>{" "}
                        {selectedOrder.items?.length || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography>
                        <strong>Status:</strong> {selectedOrder.status}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      label="Status"
                      value={selectedOrder.status}
                      onChange={(e) => {
                        if (
                          window.confirm(`Change status to ${e.target.value}?`)
                        ) {
                          updateOrderStatus(selectedOrder.id, e.target.value);
                        }
                      }}
                    >
                      {orderStatuses.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                          {s.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>

              {/* Items table */}
              {/* Ordered Items Accordion */}
              <Card sx={{ mb: 2 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="subtitle1">
                        <strong>Ordered Items</strong>
                      </Typography>

                      <Chip
                        label={`${selectedOrder?.items?.length || 0} items`}
                        size="small"
                        color="info"
                      />
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>#</TableCell>
                              <TableCell>Product ID</TableCell>
                              <TableCell>SKU</TableCell>
                              <TableCell>Size</TableCell>
                              <TableCell>Color</TableCell>
                              <TableCell>Price</TableCell>
                              <TableCell>Quantity</TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {selectedOrder.items.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>{item.productId}</TableCell>
                                <TableCell>{item.sku}</TableCell>
                                <TableCell>{item.size || "-"}</TableCell>
                                <TableCell>{item.color || "-"}</TableCell>
                                <TableCell>
                                  ₹
                                  {item.price !== null &&
                                  item.price !== undefined
                                    ? item.price
                                    : "-"}
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography>No item details available</Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Card>

              {/* Delivery Address Accordion */}
              <Card sx={{ mb: 2 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box>
                      <Typography variant="subtitle1">
                        <strong>Delivery Address</strong>
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {selectedOrder?.deliveryAddress
                          ? `${selectedOrder.deliveryAddress.city}, ${selectedOrder.deliveryAddress.state}`
                          : "No address available"}
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    {selectedOrder?.deliveryAddress ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography>
                            <strong>Address:</strong>{" "}
                            {selectedOrder.deliveryAddress.addressLine}
                          </Typography>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography>
                            <strong>City:</strong>{" "}
                            {selectedOrder.deliveryAddress.city}
                          </Typography>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography>
                            <strong>District:</strong>{" "}
                            {selectedOrder.deliveryAddress.district}
                          </Typography>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography>
                            <strong>State:</strong>{" "}
                            {selectedOrder.deliveryAddress.state}
                          </Typography>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography>
                            <strong>Pincode:</strong>{" "}
                            {selectedOrder.deliveryAddress.pincode || "-"}
                          </Typography>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography>
                            <strong>Country:</strong>{" "}
                            {selectedOrder.deliveryAddress.country}
                          </Typography>
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography>No address details available</Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Card>

              {/* delivery partner selection */}
              <Card sx={{ mb: 2, opacity: canAssignDelivery ? 1 : 0.6 }}>
                <CardContent>
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={!canAssignDelivery}
                  >
                    <InputLabel>Delivery Partner</InputLabel>
                    <Select
                      label="Delivery Partner"
                      value={selectedOrder.deliveryDetailsDto?.deliveryId || ""}
                      onChange={async (e) => {
                        const deliveryBoyId = e.target.value;

                        if (!selectedOrder?.orderId) {
                          alert("Order ID not found");
                          return;
                        }

                        const confirm = window.confirm(
                          "Assign this order to selected delivery partner?",
                        );

                        if (!confirm) return;

                        try {
                          await axios.post(
                            `/api/deliveries/assign`,
                            null,
                            {
                              params: {
                                orderId: selectedOrder.orderId,
                                deliveryBoyId: deliveryBoyId,
                              },
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem(
                                  "authToken",
                                )}`,
                              },
                            },
                          );

                          alert("Delivery partner assigned successfully!");
                          fetchOrders();
                          setDialogOpen(false);
                          //  refresh order / delivery data here
                        } catch (err) {
                          console.error(
                            "Failed to assign delivery partner",
                            err,
                          );
                          alert("Assignment failed");
                        }
                      }}
                    >
                      {deliveryPartners.map((p) => (
                        <MenuItem key={p.id} value={p.userId}>
                          {p.username}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderManagement;
