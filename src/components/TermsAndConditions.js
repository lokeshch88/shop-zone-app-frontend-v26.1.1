import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const TermsAndConditions = () => {
  const navigate = useNavigate();

  const points = [
    "Merchant Registration: You must provide accurate business, owner, and contact details while registering on ShopZone.",
    "Store URL: A valid store URL or custom URL must be unique, active, and compliant with platform naming rules before activation.",
    "Account Security: You are responsible for maintaining the confidentiality of your login username and password and for all actions taken through your merchant account.",
    "Product Listings: Merchants must list only genuine products, provide correct pricing, and ensure legal compliance for all items sold on the platform.",
    "Payments and Fees: All transaction, commission, and payment terms are subject to the current ShopZone fee policy and may change with prior notice.",
    "Order Fulfillment: Merchants must process and deliver orders within the agreed timelines and maintain a reliable support process for customers.",
    "Prohibited Content: Sellers must not list illegal, unsafe, counterfeit, or misleading items, and must comply with local laws and platform rules.",
    "Privacy and Data: Merchant data, customer information, and transaction records must be handled securely and responsibly in line with privacy obligations.",
    "Platform Rights: ShopZone may review store activity, suspend non-compliant stores, or restrict access if policies are violated.",
    "Termination: ShopZone may cancel or deactivate a merchant account if there is repeated misconduct, fraud, or failure to meet operational requirements.",
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f7f9ff 0%, #eef4ff 100%)",
        py: { xs: 3, sm: 5 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Card elevation={3} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Typography
              variant="h4"
              fontWeight={700}
              textAlign="center"
              gutterBottom
              sx={{ fontSize: { xs: "2rem", sm: "2.5rem" } }}
            >
              Terms & Conditions
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 3 }}
            >
              Please review the key merchant policies below before continuing.
            </Typography>

            <List sx={{ pl: 1 }}>
              {points.map((point, index) => (
                <ListItem key={index} alignItems="flex-start" sx={{ py: 1.2 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {index + 1}. {point}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/register-merchants")}
                sx={{ borderRadius: 2, px: 4 }}
              >
                Back to Registration
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default TermsAndConditions;
