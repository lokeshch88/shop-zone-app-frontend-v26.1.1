import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Link, useNavigate } from "react-router-dom";

const NavBar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [role, setRole] = useState(null);
  const [address, setAddress] = useState("Select Address");
  const [openDialog, setOpenDialog] = useState(false);
  const [tempAddress, setTempAddress] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedAddress =
      localStorage.getItem("userAddress") || "Select Address";
    setRole(storedRole);
    setAddress(storedAddress);
  }, []);

  const isLoggedIn = !!localStorage.getItem("authToken");

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleProfileMenuOpen = (e) => setProfileAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setProfileAnchorEl(null);

  const handleLogout = () => {
    localStorage.clear();
    handleProfileMenuClose();
    navigate("/login");
  };

  const handleAddressClick = () => {
    setTempAddress(address === "Select Address" ? "" : address);
    setOpenDialog(true);
  };

  const handleAddressSave = () => {
    setAddress(tempAddress);
    localStorage.setItem("userAddress", tempAddress);
    setOpenDialog(false);
  };

  const publicNav = [
    { label: "Home", path: "/home" },
    { label: "Login", path: "/login" },
    { label: "Register", path: "/register-user" },
  ];

  const userNav = [
    { label: "Home", path: "/home" },
    { label: "Cart", path: "/cart" },
    { label: "Orders", path: "/orders" },
  ];

  const adminNav = [
    ...userNav,
    { label: "Admin Dashboard", path: "/admin-dashboard" },
  ];

  const navItems = !isLoggedIn
    ? publicNav
    : role === "ADMIN"
    ? adminNav
    : userNav;

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedAddress = localStorage.getItem("userAddress");

    setRole(storedRole);

    if (storedAddress && storedAddress !== "Select Address") {
      setAddress(storedAddress);
    } else {
      // Auto-detect location if address is not set
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await res.json();
              const readableAddress = data.display_name || "Your Location";

              setAddress(readableAddress);
              localStorage.setItem("userAddress", readableAddress);
            } catch (err) {
              console.error("Reverse geocoding failed:", err);
              setAddress("Location Unavailable");
            }
          },
          (err) => {
            console.warn("Geolocation denied or unavailable:", err);
            setAddress("Location Permission Denied");
          }
        );
      } else {
        setAddress("Geolocation Not Supported");
      }
    }
  }, []);

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: "#2e7dff",
          color: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            py: isMobile ? 1.2 : 0.8,
          }}
        >
          {/* Left Section: Brand + Location */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                fontFamily: "'Poppins', sans-serif",
                cursor: "pointer",
                color: "#fff",
              }}
              onClick={() => navigate("/home")}
            >
              ShopZone
            </Typography>

            {/* Location Badge */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mt: 0.2,
                px: 1,
                py: 0.3,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                cursor: "pointer",
                color: "#fff",
                fontSize: "0.8rem",
                transition: "background 0.2s",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                },
              }}
              onClick={handleAddressClick}
            >
              <LocationOnIcon fontSize="small" />
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {address}
              </Typography>
            </Box>
          </Box>

          {/* Right Section: Nav Items & Avatar */}
          {!isMobile ? (
            <Box>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  color="inherit"
                  component={Link}
                  to={item.path}
                  sx={{
                    mx: 1,
                    textTransform: "none",
                    fontWeight: 500,
                    fontFamily: "'Poppins', sans-serif",
                    ":hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
              {isLoggedIn && (
                <IconButton onClick={handleProfileMenuOpen} color="inherit">
                  <Avatar sx={{ width: 32, height: 32 }} />
                </IconButton>
              )}
            </Box>
          ) : (
            <>
              <IconButton edge="end" color="inherit" onClick={handleMenuOpen}>
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                {navItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    component={Link}
                    to={item.path}
                    onClick={handleMenuClose}
                  >
                    {item.label}
                  </MenuItem>
                ))}
                {isLoggedIn && (
                  <MenuItem onClick={handleProfileMenuOpen}>Profile</MenuItem>
                )}
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Profile Dropdown */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          component={Link}
          to="/profile"
          onClick={handleProfileMenuClose}
        >
          My Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>

      {/* Address Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            minWidth: 350,
            maxWidth: 400,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: 600,
            fontSize: "1.2rem",
          }}
        >
          <LocationOnIcon color="primary" />
          Set Delivery Address
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1, fontSize: "0.85rem" }}
          >
            This helps us show the best products near you.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            variant="outlined"
            label="Enter full address"
            placeholder="e.g., 123 Street, Area, City, Pincode"
            value={tempAddress}
            onChange={(e) => setTempAddress(e.target.value)}
          />
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: "flex-end",
            pr: 2,
            pb: 1,
          }}
        >
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleAddressSave}
            variant="contained"
            disabled={!tempAddress.trim()}
          >
            Save Address
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NavBar;
