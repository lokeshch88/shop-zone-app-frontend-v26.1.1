import React, { useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
// import axios from "axios";

import { useParams } from "react-router-dom";
import axios from "../utils/AxiosInstance";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { slug } = useParams();

  const handleLogin = () => {
    if (username === "" || password === "") {
      window.alert("Username or Password can't be blank");
      return;
    }
    axios
      .post(`/user/login`, { username, password })
      .then((response) => {
        const token = response.data.token;
        const userInfo = response.data.user; // assuming user details come here
        const username = response.data.username;
        const firstName = response.data.firstName;
        const lastName = response.data.lastName;
        const email = response.data.email;
        const userId = response.data.userId;
        const userRole = response.data.userRole;
        const userAddress = response.data.addresses;
        const merchantId = response.data.merchantId;
        localStorage.setItem("authToken", token);
        // localStorage.setItem("userInfo", JSON.stringify(userInfo));
        // After successful login:
        localStorage.setItem(
          "userAddresses",
          JSON.stringify(response.data.addresses),
        );
        localStorage.setItem("selectedAddress", "Select Address");

        localStorage.setItem("username", username);
        localStorage.setItem("firstName", firstName);
        localStorage.setItem("lastName", lastName);
        localStorage.setItem("email", email);
        localStorage.setItem("userId", userId);
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("merchantId", merchantId);
        if (userRole === "ADMIN") {
          window.location.href = `/store/${slug}/admin-dashboard`;
        } else if (userRole === "Delivery User") {
          window.location.href = `/store/${slug}/delivery-dashboard`;
        } else {
          window.location.href = `/store/${slug}/home`;
        }
      })
      .catch((error) => {
        console.error(error);
        alert(error.msg || "Login failed. Please check your credentials.");
      });
  };

  return (
    <Grid
      container
      sx={{
        height: "50vh",
        overflow: "hidden",
      }}
      alignItems="center"
      justifyContent="center"
    >
      <Grid item xs={10} sm={8} md={4}>
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h5" gutterBottom align="center">
            Login
          </Typography>
          <TextField
            label="Username"
            type="text"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{
              "& .MuiInputLabel-root": {
                color: "rgba(0, 0, 0, 0.6)", // subtle grayish black like placeholder
                fontWeight: "normal",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#2e7dff", // pure black on focus
              },
              "& .MuiOutlinedInput-root:hover fieldset": {
                borderColor: "#2e7dff",
              },
              "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                borderColor: "#2e7dff",
                boxShadow: "none",
              },
            }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              "& .MuiInputLabel-root": {
                color: "rgba(0, 0, 0, 0.6)", // subtle grayish black like placeholder
                fontWeight: "normal",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#2e7dff", // pure black on focus
              },
              "& .MuiOutlinedInput-root:hover fieldset": {
                borderColor: "#2e7dff",
              },
              "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                borderColor: "#2e7dff",
                boxShadow: "none",
              },
            }}
          />
          <Button
            fullWidth
            variant="outlined"
            sx={{
              mt: 3,
              backgroundColor: "#ffffff",
              color: "#2e7dff",
              border: "2px solid #2e7dff",
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#2e7dff",
                color: "#ffffff",
                border: "2px solid #2e7dff",
              },
            }}
            onClick={handleLogin}
          >
            Login
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default LoginPage;
