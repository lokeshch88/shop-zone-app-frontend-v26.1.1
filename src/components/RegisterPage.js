import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
// import axios from "axios";
import { useNavigate } from "react-router-dom";

import { useParams } from "react-router-dom";
import axios from "../utils/AxiosInstance";

const RegisterPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    otp: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const [changingEmail, setChangingEmail] = useState(false);

  const { slug } = useParams();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "username" || name === "lastName" || name === "firstName") {
      // Allow only alphanumeric characters
      if (/^[a-zA-Z0-9]*$/.test(value)) {
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
      }
    } else {
      // setForm((prevForm) => ({ ...prevForm, [name]: value }));

      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInitialRegister = async () => {
    const { username, email, password } = form;

    if (!username || !email || !password) {
      alert("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Check if username or email is already taken
      const checkRes = await axios.post("/user/check-availability", {
        username,
        email,
      });
      console.log(checkRes.data);
      if (checkRes.data.msg) {
        alert(checkRes.data.msg);
        return;
      }

      // Send OTP
      const resp = await axios.post("/user/send-otp", {
        email,
      });
      setOtpSent(true);
      if (resp.data.msg === "Otp sent on email") {
        setOtpSent(true);
        // alert('OTP sent to your email');
        setChangingEmail(false); // ⬅ Lock the email field again
      } else {
        //alert(resp.data.msg);
        return;
      }
    } catch (error) {
      console.error(error);
      alert("Error during registration");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      // Step 1: Verify OTP

      if (form.otp === null || form.otp.trim() === "") {
        alert("Enter otp");
        return;
      }

      if (!/^\d{6}$/.test(form.otp)) {
        alert("Enter a valid 6-digit numeric OTP");
        return;
      }
      const verifyRes = await axios.post("/user/verify-otp", {
        email: form.email,
        otp: form.otp,
      });

      if (verifyRes.data.msg === "OTP verified successfully") {
        setOtpVerified(true);
        // alert("OTP verified successfully");

        // Step 2: Final registration
        try {
          await axios.post("/user/register", {
            firstName: form.firstName,
            lastName: form.lastName,
            username: form.username,
            email: form.email,
            password: form.password,
            userRole: "User",
          });

          alert("Registration complete");
          setForm({
            username: "",
            email: "",
            password: "",
            otp: "",
          });
          setOtpSent(false);
          setOtpVerified(false);

          // Redirect to /home
          navigate(`/store/${slug}/login`);
        } catch (regErr) {
          console.error("Registration failed:", regErr);
          alert("OTP was verified, but registration failed.");
        }
      } else {
        alert("OTP verification failed. Please check your OTP.");
      }
    } catch (otpErr) {
      console.error(
        "OTP verification error:",
        otpErr?.response?.data || otpErr.message,
      );
      alert("OTP verification failed ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mt: { xs: 4, sm: 6 } }}>
        <Typography
          variant={isMobile ? "h6" : "h5"}
          gutterBottom
          textAlign="center"
        >
          Register
        </Typography>

        <TextField
          label="First Name"
          name="firstName"
          fullWidth
          margin="normal"
          value={form.firstName}
          onChange={handleChange}
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
          label="Last Name"
          name="lastName"
          fullWidth
          margin="normal"
          value={form.lastName}
          onChange={handleChange}
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
          label="Username"
          name="username"
          fullWidth
          margin="normal"
          value={form.username}
          onChange={handleChange}
          inputProps={{ maxLength: 15 }}
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
          label="Email"
          name="email"
          type="email"
          fullWidth
          margin="normal"
          value={form.email}
          onChange={handleChange}
          disabled={otpSent && !changingEmail}
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

        {otpSent && !changingEmail && (
          <Button
            variant="text"
            onClick={() => {
              setChangingEmail(true);
              setOtpSent(false); // ⬅ Show "Send OTP" button again
              setOtpVerified(false); // ⬅ Optional: reset verification
              setForm((prev) => ({ ...prev, otp: "" })); // ⬅ Clear OTP input
            }}
          >
            Change Email
          </Button>
        )}

        <TextField
          label="Password"
          name="password"
          type="password"
          fullWidth
          margin="normal"
          value={form.password}
          onChange={handleChange}
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

        {!otpSent && (
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
            onClick={handleInitialRegister}
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Register & Send OTP"}
          </Button>
        )}

        {otpSent && (
          <>
            <TextField
              label="Enter OTP"
              name="otp"
              fullWidth
              margin="normal"
              value={form.otp}
              onChange={handleChange}
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

            {!otpVerified && (
              <Button
                variant="outlined"
                fullWidth
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
                onClick={verifyOtp}
                disabled={loading}
              >
                {loading
                  ? "Verifying..."
                  : "Verify OTP & Complete Registration"}
              </Button>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default RegisterPage;
