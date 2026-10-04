// src/pages/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
// import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
// import { useParams } from "react-router-dom";
import axios from "../utils/AxiosInstance";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const { slug } = useParams();
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`/orders/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Sort by createdAt descending (newest first)
        const sortedOrders = res.data
          .filter((order) => order.status !== "PENDING")
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setOrders(sortedOrders);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" gutterBottom>
        My Orders
      </Typography>

      {orders.length === 0 ? (
        <Typography>No orders found.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {orders.map((order, index) => (
            <Card
              key={index}
              sx={{
                cursor: "pointer",
                transition: "0.3s",
                "&:hover": { boxShadow: 6 },
              }}
              onClick={() => navigate(`/store/${slug}/orders/${order.orderId}`)}
            >
              <CardContent>
                <Typography variant="subtitle1">
                  <strong>Order ID:</strong> {order.orderId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date:{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Total:</strong> ₹{order.totalAmount}
                </Typography>
                <Typography variant="body2">
                  <strong>Items:</strong> {order.items?.length || 0}
                </Typography>
                <Chip
                  label={order.status}
                  size="small"
                  color={
                    order.status === "CONFIRMED"
                      ? "success"
                      : order.status === "PENDING"
                        ? "warning"
                        : "default"
                  }
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default OrdersPage;
