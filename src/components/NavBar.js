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
  Badge,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

import { Link, useNavigate, useLocation } from "react-router-dom";

import axios from "../utils/AxiosInstance";

const NavBar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [role, setRole] = useState(null);

  const [address, setAddress] = useState("Select Address");
  const [openDialog, setOpenDialog] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const [addressList, setAddressList] = useState([]);
  const [detectedAddress, setDetectedAddress] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [merchantDetails, setMerchantDetails] = useState(null);

  const isLoggedIn = !!localStorage.getItem("authToken");

  // ============================================================
  // GET MERCHANT SLUG FROM CURRENT URL
  // ============================================================

  const getMerchantSlug = () => {
    const parts = location.pathname.split("/");

    /*
       Example:

       /store/abc-store
       /store/abc-store/login
       /store/abc-store/product/10
       /store/abc-store/cart

       parts:

       ["", "store", "abc-store", ...]
    */

    if (parts[1] === "store" && parts[2]) {
      return parts[2];
    }

    return null;
  };

  const slug = getMerchantSlug();

  useEffect(() => {
    let active = true;

    if (!slug) {
      setMerchantDetails(null);
      return () => {
        active = false;
      };
    }

    setMerchantDetails(null);
    const loadMerchantBranding = async () => {
      try {
        let response;
        try {
          response = await axios.get("/api/merchants/by-slug/");
        } catch {
          response = await axios.get("/api/merchants/by-slug");
        }

        const merchant =
          response.data?.result || response.data?.data || response.data;
        if (active && merchant && !Array.isArray(merchant)) {
          setMerchantDetails(merchant);
          localStorage.setItem(
            "merchantName",
            merchant.businessName ||
              merchant.storeName ||
              merchant.shopName ||
              slug,
          );
          localStorage.setItem(
            "merchantSlug",
            merchant.storeSlug || merchant.slug || slug,
          );
        }
      } catch (error) {
        if (active) setMerchantDetails(null);
        console.warn("Could not load store branding:", error);
      }
    };

    loadMerchantBranding();
    return () => {
      active = false;
    };
  }, [slug]);

  console.log("Current URL:", location.pathname);
  console.log("Current merchant slug:", slug);

  // ============================================================
  // LOAD ROLE, ADDRESS
  // ============================================================

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");

    setRole(storedRole);

    const storedAddresses = localStorage.getItem("userAddresses");

    let parsed = [];

    try {
      parsed = storedAddresses ? JSON.parse(storedAddresses) : [];
    } catch (e) {
      console.error("Invalid JSON in userAddresses", e);
    }

    setAddressList(parsed);
  }, []);

  // ============================================================
  // CART COUNT
  // ============================================================

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);

    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);

      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  // ============================================================
  // GEOLOCATION
  // ============================================================

  useEffect(() => {
    if (!addressList?.length && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            );

            const data = await res.json();

            const tempDetectedAddress = {
              addressLine: data.display_name || "Detected Address",

              city: data.address?.city || data.address?.town || "",

              district: data.address?.county || "",

              state: data.address?.state || "",

              country: data.address?.country || "",

              pincode: data.address?.postcode || "",

              latitude,
              longitude,
            };

            setDetectedAddress(tempDetectedAddress);

            setTempAddress(formatAddress(tempDetectedAddress));
          } catch (err) {
            console.error("Reverse geocoding failed:", err);

            setDetectedAddress(null);
          }
        },

        (err) => {
          console.warn("Geolocation denied or unavailable:", err);

          setDetectedAddress(null);
        },
      );
    }
  }, [addressList?.length]);

  // ============================================================
  // ADDRESS FORMAT
  // ============================================================

  const formatAddress = (addr) => {
    return [
      addr.addressLine,
      addr.city,
      addr.district,
      addr.state,
      addr.country,

      addr.pincode ? `Pincode: ${addr.pincode}` : "",
    ]
      .filter(Boolean)
      .join(", ");
  };

  // ============================================================
  // MENUS
  // ============================================================

  const handleMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileMenuOpen = (e) => {
    setProfileAnchorEl(e.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.clear();

    handleProfileMenuClose();

    /*
       IMPORTANT:

       If current URL is:

       /store/abc-store/orders

       slug = abc-store

       So logout goes to:

       /store/abc-store/login
    */

    if (slug) {
      navigate(`/store/${slug}/login`);
    } else {
      navigate("/");
    }
  };

  // ============================================================
  // ADDRESS CLICK
  // ============================================================

  const handleAddressClick = () => {
    setTempAddress(address);

    setOpenDialog(true);
  };

  // ============================================================
  // SAVE ADDRESS
  // ============================================================

  const saveAddressToAPI = async (addressObj) => {
    const response = await fetch("/api/save-address", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(addressObj),
    });

    if (!response.ok) {
      throw new Error("Failed to save address");
    }
  };

  // ============================================================
  // NAVIGATION PATHS
  // ============================================================

  const storePath = (path) => {
    if (!slug) {
      return "/";
    }

    return `/store/${slug}${path}`;
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const publicNav = [
    {
      label: "Home",
      path: storePath(""),
    },
    {
      label: "Cart",
      path: storePath("/cart"),
    },
    {
      label: "Login",
      path: storePath("/login"),
    },
    {
      label: "Register",
      path: storePath("/register"),
    },
  ];

  const userNav = [
    {
      label: "Home",
      path: storePath(""),
    },

    {
      label: "Cart",
      path: storePath("/cart"),
    },

    {
      label: "Orders",
      path: storePath("/orders"),
    },
  ];

  const adminNav = [
    {
      label: "Admin Dashboard",
      path: storePath("/admin-dashboard"),
    },
  ];

  const deliveryBoyNav = [
    {
      label: "Delivery Dashboard",
      path: storePath("/delivery-dashboard"),
    },
  ];

  const superAdminNav = [
    {
      label: "Shopora Control",
      path: "/shopora-control",
    },
  ];

  // ============================================================
  // SELECT NAVIGATION
  // ============================================================

  const normalizedRole = String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const navItems = !isLoggedIn
    ? publicNav
    : ["SUPER_ADMIN", "SUPERADMIN"].includes(normalizedRole)
      ? superAdminNav
      : role === "ADMIN"
        ? adminNav
        : role === "Delivery User"
          ? deliveryBoyNav
          : userNav;

  // ============================================================
  // LOGO CLICK
  // ============================================================

  const handleLogoClick = () => {
    if (slug) {
      navigate(`/store/${slug}`);
    } else {
      navigate("/");
    }
  };

  // ============================================================
  // CART PATH
  // ============================================================

  const cartPath = slug ? `/store/${slug}/cart` : "/";

  // ============================================================
  // PROFILE PATH
  // ============================================================

  const profilePath = slug ? `/store/${slug}/profile` : "/";

  const brandName = slug
    ? merchantDetails?.businessName ||
      merchantDetails?.storeName ||
      merchantDetails?.shopName ||
      (localStorage.getItem("merchantSlug") === slug
        ? localStorage.getItem("merchantName")
        : "") ||
      slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Shopora";
  const merchantLogo = slug
    ? merchantDetails?.logoUrl ||
      merchantDetails?.storeLogoUrl ||
      merchantDetails?.logo ||
      ""
    : "";
  const brandLogoSrc = merchantLogo
    ? /^(https?:|data:|blob:)/i.test(merchantLogo)
      ? merchantLogo
      : `${(axios.defaults.baseURL || window.location.origin).replace(/\/+$/, "")}/${merchantLogo.replace(/^\/+/, "")}`
    : "";

  return (
    <>
      {/* ========================================================
          APP BAR
      ======================================================== */}

      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "background.paper",

          borderBottom: "1px solid",

          borderColor: "divider",

          color: "text.primary",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            position: "relative",

            px: {
              xs: 2,
              md: 4,
            },

            height: 72,
            minHeight: 72,
          }}
        >
          {/* ====================================================
              LOGO + ADDRESS
          ==================================================== */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0, md: 3 },
              position: "static",
              maxWidth: { xs: "calc(100% - 120px)", md: "none" },
              minWidth: 0,
              zIndex: 1,
            }}
          >
            <Box
              role="button"
              tabIndex={0}
              aria-label={
                slug ? `Go to ${brandName} store home` : "Go to Shopora home"
              }
              onClick={handleLogoClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleLogoClick();
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.75, md: 1.25 },
                minWidth: 0,
                cursor: "pointer",
                borderRadius: 1,
                outlineOffset: 3,
              }}
            >
              {slug && (
                <Avatar
                  src={brandLogoSrc}
                  alt={`${brandName} logo`}
                  variant="rounded"
                  imgProps={{ style: { objectFit: "contain" } }}
                  sx={{
                    width: { xs: 34, md: 40 },
                    height: { xs: 34, md: 40 },
                    flex: "0 0 auto",
                    bgcolor: "action.hover",
                    color: "primary.main",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {brandName.charAt(0).toUpperCase()}
                </Avatar>
              )}
              <Typography
                variant="h6"
                fontWeight={700}
                noWrap
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: { xs: "0.95rem", md: "1.25rem" },
                  lineHeight: 1.2,
                  minWidth: 0,
                  maxWidth: {
                    xs: "max(0px, min(220px, calc(100vw - 264px)))",
                    md: 280,
                  },
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {brandName}
              </Typography>
            </Box>

            {/* ADDRESS */}

            {isLoggedIn && (
              <Box
                onClick={handleAddressClick}
                sx={{
                  display: {
                    xs: "none",
                    md: "flex",
                  },

                  alignItems: "center",

                  gap: 0.5,

                  cursor: "pointer",

                  px: 1.5,

                  py: 0.5,

                  borderRadius: 2,

                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <LocationOnIcon fontSize="small" color="primary" />

                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: 200,

                    overflow: "hidden",

                    textOverflow: "ellipsis",

                    whiteSpace: "nowrap",

                    color: "text.secondary",
                  }}
                >
                  {address}
                </Typography>
              </Box>
            )}
          </Box>

          {/* ====================================================
              DESKTOP
          ==================================================== */}

          {!isMobile ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  color="inherit"
                  component={Link}
                  to={item.path}
                  sx={{
                    textTransform: "none",

                    fontWeight: 500,

                    px: 2,

                    borderRadius: 2,
                  }}
                >
                  {item.label}
                </Button>
              ))}

              {/* PROFILE */}

              {isLoggedIn && (
                <IconButton onClick={handleProfileMenuOpen} color="inherit">
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                    }}
                  />
                </IconButton>
              )}

              {/* CART */}

              {role !== "ADMIN" && (
                <IconButton component={Link} to={cartPath} color="inherit">
                  <Badge badgeContent={cartCount} color="primary">
                    <ShoppingCartOutlinedIcon />
                  </Badge>
                </IconButton>
              )}
            </Box>
          ) : (
            /* ==================================================
               MOBILE
            ================================================== */

            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  ml: "auto",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {role !== "ADMIN" && (
                  <IconButton component={Link} to={cartPath} color="inherit">
                    <Badge badgeContent={cartCount} color="primary">
                      <ShoppingCartOutlinedIcon />
                    </Badge>
                  </IconButton>
                )}

                <IconButton
                  edge="end"
                  color="inherit"
                  aria-label="Open navigation menu"
                  onClick={handleMenuOpen}
                >
                  <MenuIcon />
                </IconButton>
              </Box>

              <Drawer
                anchor="right"
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    width: "min(320px, 86vw)",
                    pt: 1,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {brandName}
                  </Typography>
                  <IconButton
                    aria-label="Close navigation menu"
                    onClick={handleMenuClose}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Divider />
                <List>
                  {navItems.map((item) => (
                    <ListItemButton
                      key={item.label}
                      component={Link}
                      to={item.path}
                      onClick={handleMenuClose}
                    >
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  ))}

                  {isLoggedIn && (
                    <ListItemButton
                      component={Link}
                      to={profilePath}
                      onClick={handleMenuClose}
                    >
                      <ListItemText primary="Profile" />
                    </ListItemButton>
                  )}
                </List>
              </Drawer>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* ========================================================
          PROFILE MENU
      ======================================================== */}

      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          component={Link}
          to={profilePath}
          onClick={handleProfileMenuClose}
        >
          My Profile
        </MenuItem>

        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>

      {/* ========================================================
          ADDRESS DIALOG
      ======================================================== */}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Set Delivery Address</DialogTitle>

        <DialogContent>
          {addressList?.length > 0 &&
            addressList.map((addr, i) => (
              <Box
                key={i}
                onClick={() => {
                  const formatted = formatAddress(addr);

                  setAddress(formatted);

                  setOpenDialog(false);
                }}
                sx={{
                  border: "1px solid #e0e0e0",

                  p: 2,

                  mb: 1.5,

                  borderRadius: 3,

                  cursor: "pointer",

                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <Typography variant="body2">{formatAddress(addr)}</Typography>
              </Box>
            ))}

          {addressList?.length === 0 && detectedAddress && (
            <Box
              sx={{
                border: "1px dashed #ccc",

                p: 2,

                borderRadius: 3,

                mb: 2,
              }}
            >
              <Typography variant="body2" gutterBottom>
                {formatAddress(detectedAddress)}
              </Typography>

              <Button
                variant="outlined"
                size="small"
                onClick={async () => {
                  try {
                    await saveAddressToAPI(detectedAddress);

                    const updated = [...addressList, detectedAddress];

                    setAddressList(updated);

                    setAddress(formatAddress(detectedAddress));

                    setOpenDialog(false);
                  } catch (err) {
                    console.error("Failed to save address", err);
                  }
                }}
              >
                Save This Address
              </Button>
            </Box>
          )}

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
            sx={{
              mt: 2,
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>

          <Button
            onClick={() => {
              setAddress(tempAddress);

              setOpenDialog(false);
            }}
            variant="contained"
            disabled={!tempAddress.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NavBar;
