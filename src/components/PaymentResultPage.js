import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Divider,
  Stack,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import { keyframes } from "@emotion/react";

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.26); }
  70% { box-shadow: 0 0 0 18px rgba(46, 125, 50, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
`;

const PaymentResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams();

  const { orderIdBackend, amount, paymentId, message } = location.state || {};

  const isSuccess = paymentId !== null && paymentId !== undefined;
  const storeHomePath = slug ? `/store/${slug}` : "/";

  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
      <Box sx={{ maxWidth: 760, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 5,
            p: { xs: 3, md: 5 },
            textAlign: "center",
            background: isSuccess
              ? "linear-gradient(135deg, #edf9f0 0%, #ffffff 100%)"
              : "linear-gradient(135deg, #fff3f2 0%, #ffffff 100%)",
            border: isSuccess
              ? "1px solid rgba(46,125,50,0.15)"
              : "1px solid rgba(211,47,47,0.12)",
            boxShadow: isSuccess
              ? "0 18px 48px rgba(46, 125, 50, 0.12)"
              : "0 18px 48px rgba(211, 47, 47, 0.08)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: isSuccess
                ? "radial-gradient(circle at top, rgba(76, 175, 80, 0.14), transparent 46%)"
                : "radial-gradient(circle at top, rgba(244, 67, 54, 0.12), transparent 46%)",
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: isSuccess
                  ? "rgba(76,175,80,0.12)"
                  : "rgba(211,47,47,0.08)",
                mb: 3,
                animation: isSuccess ? `${pulse} 2.2s infinite` : "none",
              }}
            >
              {isSuccess ? (
                <CheckCircleIcon sx={{ fontSize: 74, color: "#2e7d32" }} />
              ) : (
                <CancelIcon sx={{ fontSize: 74, color: "#d32f2f" }} />
              )}
            </Box>

            <Chip
              label={isSuccess ? "Order Confirmed" : "Payment Unsuccessful"}
              color={isSuccess ? "success" : "error"}
              sx={{
                mb: 2,
                px: 1.2,
                fontWeight: 700,
                borderRadius: 999,
              }}
            />

            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.05em",
                color: isSuccess ? "#1b5e20" : "#b71c1c",
                mb: 1.5,
              }}
            >
              {isSuccess ? "Thank you for your order!" : "Payment failed"}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 560, mx: "auto", lineHeight: 1.7, mb: 4 }}
            >
              {message ||
                (isSuccess
                  ? "Your order is now being processed and a confirmation has been sent to your account."
                  : "Something went wrong while processing your payment. Please try again.")}
            </Typography>

            {orderIdBackend && (
              <Card
                sx={{
                  maxWidth: 540,
                  mx: "auto",
                  textAlign: "left",
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  mb: 4,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Order ID
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        #{orderIdBackend}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Amount
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        ₹{amount?.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={isSuccess ? "success.main" : "error.main"}
                      >
                        {isSuccess ? "Paid & Confirmed" : "Not Completed"}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingBagOutlinedIcon />}
                onClick={() => navigate(storeHomePath)}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.4,
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                Continue Shopping
              </Button>

              {isSuccess && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<LocalShippingIcon />}
                  onClick={() => navigate(`/store/${slug}/orders`)}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.4,
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  View Orders
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PaymentResultPage;
