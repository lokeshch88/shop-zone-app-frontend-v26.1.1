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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";

const NavBar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole"); // e.g. "ADMIN" or "USER"
    setRole(storedRole);
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

  // Define role-based navigation
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

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#ffffff", // White background
        color: "#000000", // Black text
        boxShadow: "none", // Remove default shadow
        borderBottom: "2px solid #000", // Add black underline
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          ShopZone
        </Typography>

        {isMobile ? (
          <>
            <IconButton color="inherit" onClick={handleMenuOpen}>
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
        ) : (
          <>
            {navItems.map((item) => (
              <Button
                key={item.label}
                color="inherit"
                component={Link}
                to={item.path}
              >
                {item.label}
              </Button>
            ))}
            {isLoggedIn && (
              <IconButton onClick={handleProfileMenuOpen} color="inherit">
                <Avatar sx={{ width: 30, height: 30 }} />
              </IconButton>
            )}
          </>
        )}

        {/* Profile Dropdown Menu */}
        <Menu
          anchorEl={profileAnchorEl}
          open={Boolean(profileAnchorEl)}
          onClose={handleProfileMenuClose}
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
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
