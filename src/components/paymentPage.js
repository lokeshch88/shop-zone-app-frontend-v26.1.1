import { useLocation, useNavigate, useParams } from "react-router-dom";
import React, { useState } from "react";
import {
  Button,
  Typography,
  Container,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Box,
  MenuItem,
} from "@mui/material";
// import axios from "axios";
import axios from "../utils/AxiosInstance";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, amount } = location.state || {};

  const token = localStorage.getItem("authToken");

  const [method, setMethod] = useState("card");
  const [formData, setFormData] = useState({
    cardNumber: "",
    upiId: "",
    upiApp: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setMethod(e.target.value);
    setFormData({ cardNumber: "", upiId: "", upiApp: "" }); // reset fields
    setError("");
  };

  const validate = () => {
    if (method === "card" && !/^\d{16}$/.test(formData.cardNumber)) {
      return "Please enter a valid 16-digit card number.";
    }
    if (method === "upiId" && !/^[\w.-]+@[\w.-]+$/.test(formData.upiId)) {
      return "Please enter a valid UPI ID.";
    }
    if (method === "upiApp" && !formData.upiApp) {
      return "Please select a UPI app.";
    }
    return "";
  };

  const userId = localStorage.getItem("userId");

  const { slug } = useParams();

  const handlePayment = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await axios.post(
        "/payments/process",
        {
          orderId,
          amount,
          paymentMethod: method,
          details: formData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.paymentStatus === "SUCCESS") {
        await axios.patch(
          "/orders/",
          { orderId, status: "CONFIRMED", userId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        localStorage.removeItem("cart");
        // setCartItems([]);
        navigate("/payment-result", {
          state: {
            paymentStatus: "success",
            orderId,
            amount,
            message: "Your payment was processed successfully!",
          },
        });
      } else {
        navigate(`store/${slug}/payment-result`, {
          state: {
            paymentStatus: "fail",
            orderId,
            amount,
            message: "Payment failed due to insufficient funds.",
          },
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      navigate("/payment-failed");
    }
  };

  return (
    <Container sx={{ mt: 4, textAlign: "center", maxWidth: 500 }}>
      <Typography variant="h5" gutterBottom>
        Proceed to Payment
      </Typography>
      <Typography sx={{ mb: 3 }}>Amount: ₹{amount?.toFixed(2)}</Typography>

      <FormControl component="fieldset">
        <FormLabel component="legend">Select Payment Method</FormLabel>
        <RadioGroup value={method} onChange={handleChange} sx={{ my: 2 }}>
          <FormControlLabel
            value="card"
            control={<Radio />}
            label="Card Payment"
          />
          <FormControlLabel value="upiId" control={<Radio />} label="UPI ID" />
          <FormControlLabel
            value="upiApp"
            control={<Radio />}
            label="UPI App"
          />
        </RadioGroup>
      </FormControl>

      {/* Payment Inputs */}
      <Box sx={{ mb: 2 }}>
        {method === "card" && (
          <TextField
            label="Card Number"
            fullWidth
            inputProps={{ maxLength: 16 }}
            value={formData.cardNumber}
            onChange={(e) =>
              setFormData({ ...formData, cardNumber: e.target.value })
            }
          />
        )}

        {method === "upiId" && (
          <TextField
            label="UPI ID"
            fullWidth
            value={formData.upiId}
            onChange={(e) =>
              setFormData({ ...formData, upiId: e.target.value })
            }
          />
        )}

        {method === "upiApp" && (
          <TextField
            select
            label="Choose UPI App"
            fullWidth
            value={formData.upiApp}
            onChange={(e) =>
              setFormData({ ...formData, upiApp: e.target.value })
            }
          >
            <MenuItem value="Google Pay">Google Pay</MenuItem>
            <MenuItem value="PhonePe">PhonePe</MenuItem>
            <MenuItem value="Paytm">Paytm</MenuItem>
          </TextField>
        )}
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Button variant="contained" onClick={handlePayment}>
        Pay Now
      </Button>
    </Container>
  );
};

export default PaymentPage;
