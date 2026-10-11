import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  useTheme,
  Grid,
  Divider,
  Stack,
  Drawer,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/AxiosInstance";

const ORDER_FLOW = [
  "PLACED",
  "CONFIRMED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const MOBILE_ORDER_LABELS = ["Placed", "Confirm", "Shipped", "Out", "Done"];

const OrderDetails = () => {
  const { orderId, slug } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState("address");
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data);
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token]);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Order not found.
        </Typography>
        <Button onClick={() => navigate(-1)} variant="contained">
          Go Back
        </Button>
      </Box>
    );
  }

  const currentStep = ORDER_FLOW.indexOf(order.status?.toUpperCase());

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return "success";
      case "OUT_FOR_DELIVERY":
        return "info";
      case "SHIPPED":
        return "primary";
      case "CONFIRMED":
        return "warning";
      default:
        return "default";
    }
  };

  const openDrawer = (type) => {
    setDrawerType(type);
    setDrawerOpen(true);
  };

  const renderAddressBlock = () => (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {/* <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        Delivery location
      </Typography> */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
          borderRadius: 3,
          p: 2,
          border: "1px solid #e2e8f0",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            lineHeight: 1.7,
            wordBreak: "break-word",
            color: "text.primary",
          }}
        >
          {order.deliveryAddress?.name || "Customer Name"}
          <br />
          {order.deliveryAddress?.addressLine || "-"},
          <br />
          {order.deliveryAddress?.city || ""},{" "}
          {order.deliveryAddress?.state || ""} -{" "}
          {order.deliveryAddress?.pincode || ""}
          <br />
          {order.deliveryAddress?.phone || ""}
        </Typography>
      </Box>
    </Box>
  );

  const renderItemsPanel = () => (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {order.items?.length > 0 ? (
        <List disablePadding sx={{ display: "grid", gap: 1.5 }}>
          {order.items.map((item, index) => (
            <React.Fragment key={`${item.productId || index}-${index}`}>
              <ListItem
                disablePadding
                sx={{
                  borderRadius: 2,
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <ListItemButton
                  disabled={!item.productId && !item.id}
                  onClick={() => {
                    const productId = item.productId || item.id;
                    if (productId) {
                      navigate(`/store/${slug}/product/${productId}`);
                    }
                  }}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1.5,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ wordBreak: "break-word" }}
                    >
                      {item.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, lineHeight: 1.6 }}
                    >
                      Qty: {item.quantity} • ₹
                      {Number(item.price || 0).toFixed(2)}
                      {item.size ? ` • Size: ${item.size}` : ""}
                      {item.color ? ` • ${item.color}` : ""}
                    </Typography>
                  </Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    color="primary.main"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    ₹
                    {(
                      Number(item.price || 0) * Number(item.quantity || 1)
                    ).toFixed(2)}
                  </Typography>
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary">
          No items found in this order.
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 1, sm: 1.5, md: 1.5 } }}>
      <Button
        onClick={() => navigate(-1)}
        sx={{ mb: 0, textTransform: "none", fontWeight: 600, px: 0 }}
      >
        ← Back to Orders
      </Button>

      <Grid
        container
        spacing={{ xs: 1.25, sm: 2 }}
        sx={{ alignItems: "stretch" }}
      >
        <Grid size={12}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: "0 5px 18px rgba(15,23,42,0.05)",
              border: "1px solid rgba(148, 163, 184, 0.16)",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      color: "text.secondary",
                    }}
                  >
                    Order Overview
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{ mt: 0.5, wordBreak: "break-word" }}
                  >
                    #{order.orderId}
                  </Typography>
                </Box>
                <Chip
                  label={order.status || "Processing"}
                  color={getStatusColor(order.status)}
                  sx={{
                    fontWeight: 700,
                    px: 1,
                    borderRadius: 999,
                    textTransform: "capitalize",
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: { xs: 0.75, sm: 1.25 },
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
                    borderRadius: 1.5,
                    p: { xs: 1, sm: 1.5 },
                    border: "1px solid #e2e8f0",
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.62rem", sm: "0.75rem" } }}
                  >
                    Placed on
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{
                      mt: 0.25,
                      fontSize: { xs: "0.75rem", sm: "1rem" },
                      lineHeight: 1.25,
                    }}
                  >
                    {new Date(order.createdAt).toLocaleDateString(
                      undefined,
                      isMobile ? { month: "short", day: "numeric" } : undefined,
                    )}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #ecfeff 100%)",
                    borderRadius: 1.5,
                    p: { xs: 1, sm: 1.5 },
                    border: "1px solid #e2e8f0",
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.62rem", sm: "0.75rem" } }}
                  >
                    Total
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{
                      mt: 0.25,
                      fontSize: { xs: "0.75rem", sm: "1rem" },
                      lineHeight: 1.25,
                      overflowWrap: "anywhere",
                    }}
                  >
                    ₹{Number(order.totalAmount || 0).toFixed(2)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #fefce8 100%)",
                    borderRadius: 1.5,
                    p: { xs: 1, sm: 1.5 },
                    border: "1px solid #e2e8f0",
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.62rem", sm: "0.75rem" } }}
                  >
                    Items
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{
                      mt: 0.25,
                      fontSize: { xs: "0.75rem", sm: "1rem" },
                      lineHeight: 1.25,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {order.items?.length || 0} products
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: "0 5px 18px rgba(15,23,42,0.05)",
              border: "1px solid rgba(148, 163, 184, 0.16)",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
              <Typography variant="h6" sx={{ mb: 1 }} fontWeight={700}>
                Delivery Status
              </Typography>

              <Stepper
                activeStep={currentStep >= 0 ? currentStep : 0}
                alternativeLabel
                orientation="horizontal"
                sx={{
                  mt: 0.5,
                  width: "100%",
                  minWidth: 0,
                  "& .MuiStepLabel-root": {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 0,
                  },
                  "& .MuiStepLabel-labelContainer": {
                    width: "100%",
                    minWidth: 0,
                  },
                  "& .MuiStepLabel-label": {
                    mt: 0.5,
                    mx: 0,
                    fontSize: isMobile ? "0.62rem" : "0.78rem",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    textAlign: "center",
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                    maxWidth: isMobile ? 58 : 110,
                  },
                  "& .MuiStepLabel-iconContainer": {
                    paddingRight: 0,
                  },
                  "& .MuiStepIcon-root": {
                    fontSize: isMobile ? 20 : 24,
                  },
                  "& .MuiStepConnector-line": {
                    borderColor: "#cbd5e1",
                    borderTopWidth: 2,
                  },
                  "& .MuiStep-root": {
                    px: { xs: 0, sm: 0.5 },
                    minWidth: 0,
                    flex: 1,
                  },
                }}
              >
                {ORDER_FLOW.map((label, index) => (
                  <Step
                    key={label}
                    completed={currentStep >= ORDER_FLOW.indexOf(label)}
                  >
                    <StepLabel>
                      {isMobile
                        ? MOBILE_ORDER_LABELS[index]
                        : label.replace(/_/g, " ")}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* grid section of address items button to open side navbar */}
        {/* <Grid size={12}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              mt: 0.5,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => openDrawer("address")}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 700,
                px: 2,
              }}
            >
              View Address
            </Button>
            <Button
              variant="contained"
              onClick={() => openDrawer("items")}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 700,
                px: 2,
                boxShadow: "none",
              }}
            >
              View Items
            </Button>
          </Box>
        </Grid> */}

        <Grid size={{ xs: 12, md: 5 }} sx={{ minWidth: 0 }}>
          <Card
            sx={{
              borderRadius: 2.5,
              height: "100%",
              boxShadow: "0 5px 18px rgba(15,23,42,0.05)",
              border: "1px solid rgba(148, 163, 184, 0.16)",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
              <Typography variant="h6" sx={{ mb: 1 }} fontWeight={700}>
                Shipping Address
              </Typography>
              {renderAddressBlock()}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }} sx={{ minWidth: 0 }}>
          <Card
            sx={{
              borderRadius: 2.5,
              height: "100%",
              boxShadow: "0 5px 18px rgba(15,23,42,0.05)",
              border: "1px solid rgba(148, 163, 184, 0.16)",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
              <Typography variant="h6" sx={{ mb: 1 }} fontWeight={700}>
                Order Items
              </Typography>
              {renderItemsPanel()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          backdrop: { sx: { backgroundColor: "rgba(15, 23, 42, 0.28)" } },
        }}
      >
        <Box
          sx={{
            width: { xs: "85vw", sm: 420 },
            p: 2.5,
            height: "100%",
            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              {drawerType === "address" ? "Shipping Address" : "Order Items"}
            </Typography>
            <Button
              onClick={() => setDrawerOpen(false)}
              sx={{ minWidth: 0, px: 1 }}
            >
              Close
            </Button>
          </Box>
          <Divider sx={{ my: 2 }} />
          {drawerType === "address" ? renderAddressBlock() : renderItemsPanel()}
        </Box>
      </Drawer>
    </Box>
  );
};

export default OrderDetails;
