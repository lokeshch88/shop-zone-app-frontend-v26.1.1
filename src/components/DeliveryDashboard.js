import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import axios from "axios";

const DeliveryDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/deliveries/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDeliveries(res.data);
      } catch (err) {
        console.error("Failed to load deliveries", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, [token]);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        My Assigned Deliveries
      </Typography>

      {deliveries.length === 0 ? (
        <Typography>No deliveries assigned.</Typography>
      ) : (
        deliveries.map((delivery) => {
          const order = delivery.orderResponse;

          return (
            <Card key={delivery.deliveryId} sx={{ mb: 2 }}>
              <CardContent>
                <Typography>
                  <strong>Order ID:</strong> {order?.orderId}
                </Typography>

                <Typography variant="body2">
                  <strong>Total:</strong> ₹{order?.totalAmount}
                </Typography>

                <Chip
                  label={delivery.status}
                  color={
                    delivery.status === "DELIVERED"
                      ? "info" // changed from "success" to "info"
                      : delivery.status === "OUT_FOR_DELIVERY"
                        ? "warning"
                        : "default"
                  }
                  size="small"
                  sx={{ mt: 1 }}
                />

                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* 🔹 Drawer for details */}
      <Drawer
        anchor="right"
        open={Boolean(selectedDelivery)}
        onClose={() => setSelectedDelivery(null)}
      >
        {selectedDelivery && (
          <Box sx={{ width: 350, p: 2 }}>
            <Typography variant="h6">
              Order #{selectedDelivery.orderResponse.orderId}
            </Typography>

            <Divider sx={{ my: 1 }} />

            {/* Address */}
            <Typography variant="subtitle2">Delivery Address</Typography>
            <Typography variant="body2">
              {selectedDelivery.orderResponse.deliveryAddress.addressLine},{" "}
              {selectedDelivery.orderResponse.deliveryAddress.city},{" "}
              {selectedDelivery.orderResponse.deliveryAddress.state}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Items */}
            <Typography variant="subtitle2">Items</Typography>
            <List dense>
              {selectedDelivery.orderResponse.items.map((item, i) => (
                <ListItem key={i}>
                  <ListItemText
                    primary={`Product #${item.productId}`}
                    secondary={`Qty: ${item.quantity} • ₹${item.price}`}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography>
              <strong>Total:</strong> ₹
              {selectedDelivery.orderResponse.totalAmount}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                disabled={selectedDelivery.status === "DELIVERED"}
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Are you sure to change delivery status.",
                  );
                  if (!confirmed) {
                    return;
                  }
                  try {
                    const res = await axios.patch(
                      `http://localhost:8080/api/deliveries/${selectedDelivery.deliveryId}/status`,
                      null,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                        params: {
                          status: "DELIVERED",
                          orderId: selectedDelivery.orderResponse.orderId,
                        },
                      },
                    );

                    // Update local state to reflect change
                    setDeliveries((prev) =>
                      prev.map((d) =>
                        d.deliveryId === selectedDelivery.deliveryId
                          ? { ...d, status: res.data.status }
                          : d,
                      ),
                    );

                    // Update selected delivery in drawer
                    setSelectedDelivery((prev) => ({
                      ...prev,
                      status: res.data.status,
                    }));
                  } catch (err) {
                    console.error("Failed to update delivery status", err);
                  }
                }}
              >
                Mark as Delivered
              </Button>

              <Button
                fullWidth
                sx={{ mt: 1 }}
                onClick={() => setSelectedDelivery(null)}
              >
                Close
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default DeliveryDashboard;
