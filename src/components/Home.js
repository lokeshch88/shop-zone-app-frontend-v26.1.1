import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import axios from "../utils/AxiosInstance";

import {
  Box,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Paper,
  Tooltip,
  Drawer,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  ThemeProvider,
  createTheme,
} from "@mui/material";

import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ImageNotSupportedOutlined as ImageNotSupportedIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ShoppingCartOutlined as CartIcon,
  CheckCircle as CheckCircleIcon,
  Verified as VerifiedIcon,
  LocationOn as LocationIcon,
  LocalShippingOutlined as ShippingIcon,
  SecurityOutlined as SecurityIcon,
  LocalOfferOutlined as OfferIcon,
  Storefront as StorefrontIcon,
  RestartAlt as ResetIcon,
  Sort as SortIcon,
} from "@mui/icons-material";

/* ─────────────────────────────────────────────────────────────
   COLOR & THEME HELPERS
───────────────────────────────────────────────────────────── */

const DEFAULT_THEME = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#EFF6FF",
  primaryBorder: "#BFDBFE",
  secondary: "#7C3AED",
  secondaryLight: "#F5F3FF",
  accent: "#06B6D4",
  heroGradient:
    "linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #4F46E5 100%)",
};

const BUSINESS_PRESETS = {
  FOOD: {
    primary: "#E11D48",
    primaryDark: "#BE123C",
    primaryLight: "#FFF1F2",
    primaryBorder: "#FECDD3",
    secondary: "#EA580C",
    secondaryLight: "#FFF7ED",
    accent: "#F59E0B",
    heroGradient:
      "linear-gradient(135deg, #881337 0%, #E11D48 55%, #EA580C 100%)",
  },
  GROCERY: {
    primary: "#059669",
    primaryDark: "#047857",
    primaryLight: "#ECFDF5",
    primaryBorder: "#A7F3D0",
    secondary: "#0D9488",
    secondaryLight: "#F0FDFA",
    accent: "#10B981",
    heroGradient:
      "linear-gradient(135deg, #064E3B 0%, #059669 55%, #0D9488 100%)",
  },
  GARMENTS: {
    primary: "#7C3AED",
    primaryDark: "#6D28D9",
    primaryLight: "#F5F3FF",
    primaryBorder: "#DDD6FE",
    secondary: "#DB2777",
    secondaryLight: "#FDF2F8",
    accent: "#EC4899",
    heroGradient:
      "linear-gradient(135deg, #4C1D95 0%, #7C3AED 55%, #DB2777 100%)",
  },
  ELECTRONICS: {
    primary: "#0284C7",
    primaryDark: "#0369A1",
    primaryLight: "#F0F9FF",
    primaryBorder: "#BAE6FD",
    secondary: "#4F46E5",
    secondaryLight: "#EEF2FF",
    accent: "#38BDF8",
    heroGradient:
      "linear-gradient(135deg, #082F49 0%, #0284C7 55%, #4F46E5 100%)",
  },
  GENERAL: DEFAULT_THEME,
};

const hexToRgba = (hex, alpha = 0.1) => {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return `rgba(37, 99, 235, ${alpha})`;
  }
  let c = hex.substring(1);
  if (c.length === 3)
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(37, 99, 235, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const adjustColorBrightness = (hex, percent) => {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return hex;
  let c = hex.substring(1);
  if (c.length === 3)
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round((255 * percent) / 100);
  let g = ((num >> 8) & 0x00ff) + Math.round((255 * percent) / 100);
  let b = (num & 0x0000ff) + Math.round((255 * percent) / 100);
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" fill="%23f8fafc"><rect width="300" height="200" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" fill="%2394a3b8">No Image Available</text></svg>`;

/* ─────────────────────────────────────────────────────────────
   FIXED CARD SIZING
   These are the only numbers you need to tweak to resize cards.
───────────────────────────────────────────────────────────── */
const CARD = {
  // width used on sm+ screens (grid uses auto-fill with this as the column size)
  width: 210,
  imageAspectRatio: "5 / 7",
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */

const HomePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const muiDefaultTheme = useTheme();
  const isMobile = useMediaQuery(muiDefaultTheme.breakpoints.down("sm"));

  // State: Data
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeDetails, setStoreDetails] = useState(null);

  // State: Loading & Status
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [imageLoadingByProduct, setImageLoadingByProduct] = useState({});

  // State: Filters, Search, Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["ALL"]);
  const [sortBy, setSortBy] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // State: Interactions & Carousel
  const [activeImageIndexByProduct, setActiveImageIndexByProduct] = useState(
    {},
  );
  const [addedItemSuccess, setAddedItemSuccess] = useState(null);
  const [cartError, setCartError] = useState("");
  const [variantSelectionProduct, setVariantSelectionProduct] = useState(null);
  const [selectedVariantColor, setSelectedVariantColor] = useState("");
  const [selectedVariantSize, setSelectedVariantSize] = useState("");
  const [variantSelectionError, setVariantSelectionError] = useState("");

  const storeCheckRef = useRef(null);

  /* ─────────── STORE VERIFICATION & THEME FETCHING ─────────── */
  useEffect(() => {
    if (!slug) {
      alert("Store URL is missing");
      navigate("/");
      return;
    }

    if (storeCheckRef.current === slug) return;
    storeCheckRef.current = slug;

    const verifyAndLoadStore = async () => {
      try {
        const response = await axios.get("/store/check");
        if (response.data !== "ACTIVE") {
          alert(
            response.data === "INACTIVE"
              ? "This store is currently inactive."
              : "Store not found.",
          );
          navigate("/");
          return;
        }

        try {
          let merchantData = null;
          try {
            const res = await axios.get("/api/merchants/by-slug/");
            merchantData = res.data?.result || res.data;
          } catch {
            try {
              const res = await axios.get("/api/merchants/by-slug");
              merchantData = res.data?.result || res.data;
            } catch {
              try {
                const res = await axios.get("/store/slug");
                const list = res.data?.result || res.data || [];
                if (Array.isArray(list)) {
                  merchantData = list.find(
                    (m) =>
                      m.storeSlug === slug ||
                      m.slug === slug ||
                      (m.businessName &&
                        m.businessName.toLowerCase().replace(/\s+/g, "-") ===
                          slug),
                  );
                }
              } catch (e) {
                console.warn("Could not fetch store list fallback", e);
              }
            }
          }

          if (merchantData && typeof merchantData === "object") {
            setStoreDetails(merchantData);
          }
        } catch (err) {
          console.warn(
            "Could not load merchant details, using default theme:",
            err,
          );
        }
      } catch (error) {
        console.error("Store validation failed:", error);
        alert("Unable to verify store.");
        navigate("/");
      }
    };

    verifyAndLoadStore();
  }, [slug, navigate]);

  /* ─────────── FETCH CATALOG DATA ─────────── */
  useEffect(() => {
    setLoadingProducts(true);
    axios
      .get("/products/all-active")
      .then((response) => {
        const prods = response.data?.result || response.data || [];
        setProducts(Array.isArray(prods) ? prods : []);
      })
      .catch((error) => console.error("Error loading products:", error))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    axios
      .get("/category/get-all")
      .then((res) => {
        const cats = res.data?.result || res.data || [];
        if (Array.isArray(cats)) setCategories(cats);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  /* ─────────── THEME DERIVATION ─────────── */
  const storeTheme = useMemo(() => {
    const rawType = (
      storeDetails?.businessType ||
      storeDetails?.businessCategory ||
      "GENERAL"
    ).toUpperCase();
    const preset = BUSINESS_PRESETS[rawType] || DEFAULT_THEME;

    const isValidHex = (c) =>
      typeof c === "string" &&
      (/^#([0-9A-F]{3}){1,2}$/i.test(c.trim()) || /^rgb/i.test(c.trim()));

    const rawPrimary = storeDetails?.primaryColor?.trim();
    const rawSecondary = storeDetails?.secondaryColor?.trim();

    const primary = isValidHex(rawPrimary) ? rawPrimary : preset.primary;
    const secondary = isValidHex(rawSecondary)
      ? rawSecondary
      : preset.secondary;

    const primaryDark =
      adjustColorBrightness(primary, -18) || preset.primaryDark;
    const primaryLight = hexToRgba(primary, 0.08) || preset.primaryLight;
    const primaryBorder = hexToRgba(primary, 0.22) || preset.primaryBorder;
    const secondaryLight = hexToRgba(secondary, 0.08) || preset.secondaryLight;

    return {
      primary,
      primaryDark,
      primaryLight,
      primaryBorder,
      secondary,
      secondaryLight,
      accent: preset.accent || "#06B6D4",
      heroGradient: `linear-gradient(135deg, ${adjustColorBrightness(primary, -32)} 0%, ${primary} 55%, ${secondary} 100%)`,
    };
  }, [storeDetails]);

  const dynamicTheme = useMemo(() => {
    return createTheme({
      palette: {
        primary: {
          main: storeTheme.primary,
          dark: storeTheme.primaryDark,
          light: storeTheme.primaryLight,
        },
        secondary: { main: storeTheme.secondary },
      },
      shape: { borderRadius: 14 },
      typography: {
        fontFamily: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ].join(","),
      },
    });
  }, [storeTheme]);

  /* ─────────── IMAGE HELPERS ─────────── */
  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:")
    )
      return url;
    const apiBase = axios.defaults.baseURL || "http://192.168.2.106:8080";
    if (url.startsWith("/")) return `${apiBase}${url}`;
    return url;
  };

  const getProductImages = (product) => {
    const rawImages = Array.isArray(product?.images) ? [...product.images] : [];

    if (
      !rawImages.length &&
      (product?.imageUrl || product?.image || product?.imageBase64)
    ) {
      rawImages.push({
        imageUrl: product.imageUrl || product.image || "",
        imageBase64: product.imageBase64 || null,
        primaryImage: true,
      });
    }

    return rawImages
      .map((image, index) => {
        const imageUrl =
          image?.imageUrl ||
          image?.image ||
          image?.preview ||
          (image?.imageBase64
            ? `data:image/jpeg;base64,${image.imageBase64}`
            : "");

        return {
          ...image,
          imageUrl: imageUrl ? normalizeImageUrl(imageUrl) : "",
          preview: imageUrl ? normalizeImageUrl(imageUrl) : "",
          displayOrder: image?.displayOrder ?? index,
          primaryImage:
            image?.primaryImage === true ||
            image?.isPrimary === true ||
            index === (product?.primaryImageIndex ?? 0),
        };
      })
      .filter((image) => Boolean(image.imageUrl))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  };

  const getPrimaryImageIndex = (images = []) => {
    const primaryIndex = images.findIndex(
      (image) => image?.primaryImage === true || image?.isPrimary === true,
    );
    return primaryIndex >= 0 ? primaryIndex : 0;
  };

  const getCurrentImageIndex = (productId, product) => {
    const images = getProductImages(product);
    if (!images.length) return 0;
    const currentIndex = activeImageIndexByProduct[productId];
    if (
      typeof currentIndex === "number" &&
      currentIndex >= 0 &&
      currentIndex < images.length
    )
      return currentIndex;
    return getPrimaryImageIndex(images);
  };

  const moveImage = (productId, direction) => {
    setActiveImageIndexByProduct((prev) => {
      const product = products.find((item) => item.id === productId);
      const images = getProductImages(product);
      if (!images.length) return prev;

      const currentIndex = prev[productId] ?? getPrimaryImageIndex(images);
      const nextIndex =
        (currentIndex + direction + images.length) % images.length;

      return { ...prev, [productId]: nextIndex };
    });
  };

  const handleImageDotClick = (event, productId, index) => {
    event.stopPropagation();
    setActiveImageIndexByProduct((prev) => ({ ...prev, [productId]: index }));
  };

  const markImageLoaded = (productId) => {
    setImageLoadingByProduct((prev) => ({ ...prev, [productId]: false }));
  };

  /* ─────────── FILTERING & SEARCHING ─────────── */
  useEffect(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q)),
      );
    }

    if (selectedCategories.length > 0 && !selectedCategories.includes("ALL")) {
      result = result.filter(
        (product) =>
          product.categoryId !== null &&
          selectedCategories.includes(product.categoryId),
      );
    }

    if (sortBy === "priceLowToHigh") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "priceHighToLow")
      result.sort((a, b) => b.price - a.price);
    else if (sortBy === "nameAZ")
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "nameZA")
      result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));

    setFilteredProducts(result);
  }, [products, selectedCategories, sortBy, searchQuery]);

  const toggleCategory = (categoryId) => {
    if (categoryId === "ALL") {
      setSelectedCategories(["ALL"]);
      return;
    }

    const hasAll = selectedCategories.includes("ALL");
    if (hasAll) {
      setSelectedCategories([categoryId]);
      return;
    }

    const isSelected = selectedCategories.includes(categoryId);
    let nextCategories = isSelected
      ? selectedCategories.filter((item) => item !== categoryId)
      : [...selectedCategories, categoryId];

    if (nextCategories.length === 0) nextCategories = ["ALL"];
    setSelectedCategories(nextCategories);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategories(["ALL"]);
    setSortBy("");
  };

  /* ─────────── CART ACTION ─────────── */
  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (variants.length > 0) {
      const colors = [
        ...new Set(variants.map((variant) => variant.color).filter(Boolean)),
      ];
      const initialColor =
        variants.length === 1
          ? variants[0].color || ""
          : colors.length === 1
            ? colors[0]
            : "";
      const availableSizes = [
        ...new Set(
          variants
            .filter((variant) => variant.color === initialColor)
            .map((variant) => variant.size)
            .filter(Boolean),
        ),
      ];
      setVariantSelectionProduct(product);
      setSelectedVariantColor(initialColor);
      setSelectedVariantSize(
        variants.length === 1
          ? variants[0].size || ""
          : availableSizes.length === 1
            ? availableSizes[0]
            : "",
      );
      setVariantSelectionError("");
      return;
    }
    addProductToCart(product, null);
  };

  const addProductToCart = (product, selectedVariant) => {
    try {
      if (
        selectedVariant &&
        selectedVariant.stock != null &&
        Number(selectedVariant.stock) <= 0
      ) {
        setVariantSelectionError("This variant is out of stock.");
        return;
      }
      if (
        !selectedVariant &&
        product.quantityInStock != null &&
        Number(product.quantityInStock) <= 0
      ) {
        setCartError("This product is out of stock.");
        return;
      }
      const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
      const variantKey = `${selectedVariant?.size || ""}_${selectedVariant?.color || ""}`;
      const existingIndex = existingCart.findIndex(
        (item) =>
          item.id === product.id &&
          (!item.storeSlug || item.storeSlug === slug) &&
          `${item.variant?.size || ""}_${item.variant?.color || ""}` ===
            variantKey,
      );
      const stockValue = selectedVariant?.stock ?? product.quantityInStock;
      const availableStock =
        stockValue === null || stockValue === undefined || stockValue === ""
          ? Number.NaN
          : Number(stockValue);
      if (
        Number.isFinite(availableStock) &&
        availableStock >= 0 &&
        (existingIndex >= 0
          ? Number(existingCart[existingIndex].quantity || 0)
          : 0) >= availableStock
      ) {
        setVariantSelectionError(
          "The selected quantity is no longer available.",
        );
        return;
      }

      let updatedCart;
      if (existingIndex > -1) {
        updatedCart = existingCart.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                storeSlug: slug,
                storeName:
                  storeDetails?.businessName ||
                  storeDetails?.storeName ||
                  item.storeName ||
                  slug,
                quantity: item.quantity + 1,
              }
            : item,
        );
      } else {
        const variantImage =
          selectedVariant?.imageUrl ||
          selectedVariant?.image ||
          (selectedVariant?.imageBase64
            ? `data:image/jpeg;base64,${selectedVariant.imageBase64}`
            : "");
        updatedCart = [
          ...existingCart,
          {
            ...product,
            storeSlug: slug,
            storeName:
              storeDetails?.businessName ||
              storeDetails?.storeName ||
              product.businessName ||
              product.storeName ||
              slug,
            ...(selectedVariant
              ? {
                  variant: selectedVariant,
                  price: selectedVariant.price ?? product.price,
                  image: variantImage
                    ? normalizeImageUrl(variantImage)
                    : product.image,
                }
              : {}),
            quantity: 1,
          },
        ];
      }

      localStorage.setItem("cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
      setAddedItemSuccess(product.name);
      setCartError("");
      setVariantSelectionProduct(null);
      setVariantSelectionError("");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setCartError("Failed to add this product to the cart.");
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const storeDisplayName =
    storeDetails?.businessName ||
    storeDetails?.shopName ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const storeTagline =
    storeDetails?.description ||
    "Explore handpicked collections, exclusive offers, and seamless doorstep delivery.";
  const storeLocation = [storeDetails?.city, storeDetails?.state]
    .filter(Boolean)
    .join(", ");

  const activeFilterCount =
    (searchQuery.trim() !== "" ? 1 : 0) +
    (selectedCategories.length > 0 && !selectedCategories.includes("ALL")
      ? selectedCategories.length
      : 0) +
    (sortBy !== "" ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;
  const homeVariantOptions = Array.isArray(variantSelectionProduct?.variants)
    ? variantSelectionProduct.variants
    : [];
  const homeVariantColors = [
    ...new Set(
      homeVariantOptions.map((variant) => variant.color).filter(Boolean),
    ),
  ];
  const homeVariantSizes = [
    ...new Set(
      homeVariantOptions
        .filter((variant) => variant.color === selectedVariantColor)
        .map((variant) => variant.size)
        .filter(Boolean),
    ),
  ];
  const selectedHomeVariant = homeVariantOptions.find(
    (variant) =>
      variant.color === selectedVariantColor &&
      variant.size === selectedVariantSize,
  );

  /* ─────────── RENDER ─────────── */
  return (
    <ThemeProvider theme={dynamicTheme}>
      <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100vh", pb: 5 }}>
        {/* ======================= COMPACT HERO ======================= */}
        {/* <Box
          sx={{
            background: storeTheme.heroGradient,
            color: "#ffffff",
            position: "relative",
            overflow: "hidden",
            py: { xs: 2, md: 2.5 },
            px: { xs: 1.5, sm: 2.5, md: 4 },
            borderRadius: { xs: 0, md: 3 },
            mx: { xs: 0, md: 2 },
            mt: { xs: 0, md: 1 },
            boxShadow: "0 8px 22px -10px rgba(0,0,0,0.25)",
          }}
        >
          <Box
            sx={{ maxWidth: 1400, mx: "auto", position: "relative", zIndex: 1 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Avatar
                src={storeDetails?.logoUrl || ""}
                alt={storeDisplayName}
                sx={{
                  width: { xs: 44, md: 54 },
                  height: { xs: 44, md: 54 },
                  bgcolor: "rgba(255,255,255,0.18)",
                  border: "2px solid #ffffff",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {storeDisplayName ? (
                  storeDisplayName.charAt(0)
                ) : (
                  <StorefrontIcon />
                )}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    variant="h6"
                    component="h1"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "1.05rem", md: "1.35rem" },
                      color: "#fff",
                      lineHeight: 1.2,
                    }}
                  >
                    {storeDisplayName}
                  </Typography>
                  <Tooltip title="Verified Store">
                    <VerifiedIcon sx={{ fontSize: 18, color: "#38BDF8" }} />
                  </Tooltip>
                  {storeLocation && (
                    <Chip
                      icon={
                        <LocationIcon
                          sx={{ "&&": { color: "#fff", fontSize: 13 } }}
                        />
                      }
                      label={storeLocation}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.16)",
                        color: "#fff",
                        fontSize: "0.68rem",
                        height: 20,
                        display: { xs: "none", sm: "flex" },
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    mt: 0.25,
                    fontSize: { xs: "0.72rem", md: "0.8rem" },
                    display: { xs: "none", sm: "block" },
                    maxWidth: 560,
                  }}
                >
                  {storeTagline}
                </Typography>
              </Box>

              {/* compact trust badges, desktop only */}
        {/* <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <ShippingIcon sx={{ fontSize: 16, color: "#FDE047" }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Fast Delivery
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <SecurityIcon sx={{ fontSize: 16, color: "#86EFAC" }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    100% Genuine
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <OfferIcon sx={{ fontSize: 16, color: "#F472B6" }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Best Deals
                  </Typography>
                </Box>
              </Box> */}
        {/* </Box>
          </Box>
        </Box> */}

        {/* //end of compact hero */}
        {/* ======================= COMPACT TOOLBAR ======================= */}
        <Box
          sx={{
            maxWidth: 1400,
            mx: "auto",
            px: { xs: 1.25, sm: 2.5, md: 3 },
            mt: 1.5,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1,
              borderRadius: 2.5,
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              mb: 1.5,
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ color: storeTheme.primary, fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#F8FAFC",
                  height: 38,
                },
              }}
            />

            <Badge
              badgeContent={activeFilterCount}
              color="error"
              invisible={!hasActiveFilters}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFilterDrawerOpen(true)}
                startIcon={<FilterIcon fontSize="small" />}
                sx={{
                  flexShrink: 0,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  borderColor: "#E2E8F0",
                  color: "#334155",
                  height: 38,
                  px: 1.5,
                  whiteSpace: "nowrap",
                }}
              >
                Filters
              </Button>
            </Badge>

            <Chip
              label={`${filteredProducts.length} items`}
              size="small"
              sx={{
                flexShrink: 0,
                bgcolor: storeTheme.primaryLight,
                color: storeTheme.primaryDark,
                fontWeight: 700,
                fontSize: "0.72rem",
                border: `1px solid ${storeTheme.primaryBorder}`,
                display: { xs: "none", sm: "flex" },
              }}
            />
          </Paper>

          {/* ======================= PRODUCT GRID — FIXED SIZE CARDS ======================= */}
          {loadingProducts ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 10,
                bgcolor: "#FFFFFF",
                borderRadius: 1,
                border: "1px solid #E2E8F0",
              }}
            >
              <CircularProgress size={36} sx={{ color: storeTheme.primary }} />
              <Typography
                variant="body2"
                sx={{ mt: 2, fontWeight: 600, color: "text.secondary" }}
              >
                Loading products...
              </Typography>
            </Box>
          ) : filteredProducts.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 6 },
                textAlign: "center",
                borderRadius: 3,
                border: "1px dashed #CBD5E1",
                bgcolor: "#FFFFFF",
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: storeTheme.primaryLight,
                  color: storeTheme.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 1.5,
                }}
              >
                <SearchIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ color: "#1E293B", mb: 0.5 }}
              >
                No products found
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 380, mx: "auto", mb: 2 }}
              >
                {searchQuery
                  ? `Nothing matches "${searchQuery}".`
                  : "No products under the selected category."}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleResetFilters}
                sx={{
                  bgcolor: storeTheme.primary,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  "&:hover": { bgcolor: storeTheme.primaryDark },
                }}
              >
                Show All Products
              </Button>
            </Paper>
          ) : (
            /*
              Fixed-size card grid:
              - xs: always exactly 2 columns (even widths, no stretching from image size)
              - sm/md/lg: auto-fill with a FIXED column track (CARD.width), so each card
                is always CARD.width px wide — never grows to match an image.
            */
            <Box
              sx={{
                display: "grid",
                gap: { xs: 1, sm: 1.5, md: 2 },
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: `repeat(auto-fill, ${CARD.width}px)`,
                },
                justifyContent: { sm: "flex-start" },
              }}
            >
              {filteredProducts.map((product) => {
                const comparePrice =
                  product.comparePrice && product.comparePrice > 0
                    ? product.comparePrice
                    : product.price + 100;
                const variantPrices = Array.isArray(product.variants)
                  ? product.variants
                      .map((variant) => Number(variant.price))
                      .filter((price) => Number.isFinite(price) && price > 0)
                  : [];
                const displayPrice = variantPrices.length
                  ? Math.min(...variantPrices)
                  : product.price;
                const discountPercent =
                  comparePrice > displayPrice
                    ? Math.round(
                        ((comparePrice - displayPrice) / comparePrice) * 100,
                      )
                    : 0;

                const productImages = getProductImages(product);
                const hasImages = productImages.length > 0;
                const productImageLoading =
                  hasImages && imageLoadingByProduct[product.id] !== false;
                const activeImageIdx =
                  getCurrentImageIndex(product.id, product) || 0;

                return (
                  <Card
                    key={product.id}
                    sx={{
                      width: "100%",
                      height: "auto",
                      alignSelf: "start",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: 1.5,
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFFFFF",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      overflow: "hidden",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: `0 10px 22px -8px ${hexToRgba(storeTheme.primary, 0.18)}`,
                        borderColor: storeTheme.primaryBorder,
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() =>
                        navigate(`/store/${slug}/product/${product.id}`)
                      }
                      sx={{
                        flex: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        height: "auto",
                      }}
                    >
                      {/* ===== FIXED IMAGE BOX — same size for every card, every image ===== */}
                      <Box
                        sx={{
                          aspectRatio: CARD.imageAspectRatio,
                          width: "100%",
                          flexShrink: 0,
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#F8FAFC",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            right: 6,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            zIndex: 4,
                            pointerEvents: "none",
                          }}
                        >
                          {discountPercent > 0 ? (
                            <Chip
                              label={`${discountPercent}% OFF`}
                              size="small"
                              sx={{
                                bgcolor: "#EF4444",
                                color: "#fff",
                                fontWeight: 800,
                                fontSize: "0.62rem",
                                height: 18,
                                borderRadius: 1,
                              }}
                            />
                          ) : (
                            <Box />
                          )}
                          {product.categoryName && (
                            <Chip
                              label={product.categoryName}
                              size="small"
                              sx={{
                                bgcolor: "rgba(255,255,255,0.9)",
                                color: "#334155",
                                fontWeight: 600,
                                fontSize: "0.6rem",
                                height: 18,
                                borderRadius: 1,
                                border: "1px solid #E2E8F0",
                                maxWidth: 90,
                                "& .MuiChip-label": {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                },
                              }}
                            />
                          )}
                        </Box>

                        {productImageLoading && (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              zIndex: 3,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: "#F1F5F9",
                            }}
                          >
                            <CircularProgress
                              size={22}
                              sx={{ color: storeTheme.primary }}
                            />
                          </Box>
                        )}

                        {!hasImages ? (
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.5,
                            }}
                          >
                            <ImageNotSupportedIcon
                              sx={{ fontSize: 28, color: "#94A3B8" }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#94A3B8",
                                fontWeight: 600,
                                fontSize: "0.62rem",
                              }}
                            >
                              No Image
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              position: "relative",
                              width: "100%",
                              height: "100%",
                              overflow: "hidden",
                              opacity: productImageLoading ? 0 : 1,
                              transition: "opacity 0.2s",
                            }}
                          >
                            <Box
                              sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                transition:
                                  "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
                                transform: `translateX(-${activeImageIdx * 100}%)`,
                              }}
                            >
                              {productImages.map((image, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    flex: "0 0 100%",
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    p: 0,
                                  }}
                                >
                                  {/* Fixed box regardless of native image dimensions */}
                                  <CardMedia
                                    component="img"
                                    image={image.imageUrl}
                                    alt={product.name}
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      display: "block",
                                    }}
                                    onLoad={() => markImageLoaded(product.id)}
                                    onError={(e) => {
                                      markImageLoaded(product.id);
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = FALLBACK_IMAGE;
                                    }}
                                  />
                                </Box>
                              ))}
                            </Box>

                            {productImages.length > 1 && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: 4,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  display: "flex",
                                  gap: 0.5,
                                  zIndex: 2,
                                }}
                              >
                                {productImages.map((_, index) => (
                                  <Box
                                    key={index}
                                    onClick={(event) =>
                                      handleImageDotClick(
                                        event,
                                        product.id,
                                        index,
                                      )
                                    }
                                    sx={{
                                      width: 5,
                                      height: 5,
                                      borderRadius: "50%",
                                      backgroundColor:
                                        activeImageIdx === index
                                          ? storeTheme.primary
                                          : "rgba(0,0,0,0.22)",
                                      cursor: "pointer",
                                    }}
                                  />
                                ))}
                              </Box>
                            )}

                            {productImages.length > 1 && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: "50%",
                                  left: 0,
                                  right: 0,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  transform: "translateY(-50%)",
                                  px: 0.25,
                                  zIndex: 2,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    moveImage(product.id, -1);
                                  }}
                                  disabled={activeImageIdx <= 0}
                                  sx={{
                                    bgcolor: "rgba(255,255,255,0.85)",
                                    width: 20,
                                    height: 20,
                                    "&:hover": { bgcolor: "#fff" },
                                  }}
                                >
                                  <ChevronLeftIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    moveImage(product.id, 1);
                                  }}
                                  disabled={
                                    activeImageIdx >= productImages.length - 1
                                  }
                                  sx={{
                                    bgcolor: "rgba(255,255,255,0.85)",
                                    width: 20,
                                    height: 20,
                                    "&:hover": { bgcolor: "#fff" },
                                  }}
                                >
                                  <ChevronRightIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>

                      {/* ===== DETAILS — fills remaining fixed card height ===== */}
                      <CardContent
                        sx={{
                          p: { xs: 1, sm: 1.25 },
                          pb: 0.5,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-start",
                          "&:last-child": { pb: 0.5 },
                        }}
                      >
                        <Box sx={{ minHeight: 0 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: "0.78rem", sm: "0.85rem" },
                              color: "#0F172A",
                              lineHeight: 1.3,
                              mb: 0.25,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minHeight: { xs: 30, sm: 33 },
                            }}
                          >
                            {product.name}
                          </Typography>
                        </Box>

                        <Box sx={{ pt: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: 0.75,
                              mb: 0.75,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 800,
                                fontSize: { xs: "0.9rem", sm: "1rem" },
                                color: storeTheme.primary,
                              }}
                            >
                              {variantPrices.length ? "From " : ""}₹
                              {displayPrice}
                            </Typography>
                            {comparePrice > product.price && (
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: "line-through",
                                  color: "#94A3B8",
                                  fontSize: "0.68rem",
                                }}
                              >
                                ₹{comparePrice}
                              </Typography>
                            )}
                          </Box>

                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<CartIcon sx={{ fontSize: 15 }} />}
                            onClick={(e) => handleAddToCart(e, product)}
                            sx={{
                              bgcolor: storeTheme.primary,
                              color: "#fff",
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              borderRadius: 1.5,
                              py: 0.5,
                              minHeight: 0,
                              boxShadow: "none",
                              "&:hover": { bgcolor: storeTheme.primaryDark },
                            }}
                          >
                            Add
                          </Button>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>

        {/* ======================= FILTERS DRAWER ======================= */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
        >
          <Box
            sx={{
              width: { xs: 280, sm: 340 },
              p: 2.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={800}>
                Filters
              </Typography>
              <IconButton
                size="small"
                onClick={() => setFilterDrawerOpen(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Sort by
            </Typography>
            <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2.5 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Recommended</MenuItem>
                <MenuItem value="priceLowToHigh">Price: Low to High</MenuItem>
                <MenuItem value="priceHighToLow">Price: High to Low</MenuItem>
                <MenuItem value="nameAZ">Name: A to Z</MenuItem>
                <MenuItem value="nameZA">Name: Z to A</MenuItem>
              </Select>
            </FormControl>

            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Categories
            </Typography>
            <Box
              sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, mb: 2.5 }}
            >
              <Chip
                label="All Products"
                clickable
                onClick={() => toggleCategory("ALL")}
                sx={{
                  borderRadius: 2,
                  fontWeight: selectedCategories.includes("ALL") ? 700 : 500,
                  bgcolor: selectedCategories.includes("ALL")
                    ? storeTheme.primary
                    : "#F1F5F9",
                  color: selectedCategories.includes("ALL")
                    ? "#fff"
                    : "#334155",
                }}
              />
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    clickable
                    onClick={() => toggleCategory(cat.id)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: isSelected ? 700 : 500,
                      bgcolor: isSelected ? storeTheme.primary : "#F1F5F9",
                      color: isSelected ? "#fff" : "#334155",
                    }}
                  />
                );
              })}
            </Box>

            <Box sx={{ mt: "auto", display: "flex", gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ResetIcon fontSize="small" />}
                onClick={handleResetFilters}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                Reset
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setFilterDrawerOpen(false)}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: storeTheme.primary,
                  "&:hover": { bgcolor: storeTheme.primaryDark },
                }}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Drawer>

        <Dialog
          open={Boolean(variantSelectionProduct)}
          onClose={() => {
            setVariantSelectionProduct(null);
            setVariantSelectionError("");
          }}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            Choose options
            {variantSelectionProduct
              ? ` - ${variantSelectionProduct.name}`
              : ""}
          </DialogTitle>
          <DialogContent>
            {variantSelectionError && (
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                {variantSelectionError}
              </Alert>
            )}
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel id="home-variant-color-label">Color</InputLabel>
              <Select
                labelId="home-variant-color-label"
                label="Color"
                value={selectedVariantColor}
                onChange={(event) => {
                  const color = event.target.value;
                  const sizes = [
                    ...new Set(
                      homeVariantOptions
                        .filter((variant) => variant.color === color)
                        .map((variant) => variant.size)
                        .filter(Boolean),
                    ),
                  ];
                  setSelectedVariantColor(color);
                  setSelectedVariantSize(sizes.length === 1 ? sizes[0] : "");
                  setVariantSelectionError("");
                }}
              >
                {homeVariantColors.map((color) => (
                  <MenuItem key={color} value={color}>
                    {color}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{ mt: 2 }}>
              <InputLabel id="home-variant-size-label">Size</InputLabel>
              <Select
                labelId="home-variant-size-label"
                label="Size"
                value={selectedVariantSize}
                onChange={(event) => {
                  setSelectedVariantSize(event.target.value);
                  setVariantSelectionError("");
                }}
                disabled={!selectedVariantColor}
              >
                {homeVariantSizes.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedHomeVariant && (
              <Box sx={{ mt: 2 }}>
                {(selectedHomeVariant.imageUrl ||
                  selectedHomeVariant.image ||
                  selectedHomeVariant.imageBase64) && (
                  <Box
                    component="img"
                    src={normalizeImageUrl(
                      selectedHomeVariant.imageUrl ||
                        selectedHomeVariant.image ||
                        `data:image/jpeg;base64,${selectedHomeVariant.imageBase64}`,
                    )}
                    alt={`${variantSelectionProduct.name} variant`}
                    sx={{
                      width: 88,
                      height: 88,
                      objectFit: "contain",
                      borderRadius: 1,
                      border: "1px solid #e2e8f0",
                      mb: 1,
                    }}
                  />
                )}
                <Typography
                  variant="subtitle1"
                  color="primary"
                  fontWeight={700}
                >
                  ₹{selectedHomeVariant.price ?? variantSelectionProduct.price}
                </Typography>
                {selectedHomeVariant.stock != null && (
                  <Typography
                    variant="caption"
                    color={
                      Number(selectedHomeVariant.stock) > 0
                        ? "text.secondary"
                        : "error"
                    }
                  >
                    {Number(selectedHomeVariant.stock) > 0
                      ? `${selectedHomeVariant.stock} in stock`
                      : "Out of stock"}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setVariantSelectionProduct(null);
                setVariantSelectionError("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={
                !selectedHomeVariant ||
                (selectedHomeVariant?.stock != null &&
                  Number(selectedHomeVariant.stock) <= 0)
              }
              onClick={() => {
                if (!selectedHomeVariant) {
                  setVariantSelectionError(
                    "Please select an available color and size.",
                  );
                  return;
                }
                addProductToCart(variantSelectionProduct, selectedHomeVariant);
              }}
            >
              Add to cart
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(cartError)}
          autoHideDuration={3000}
          onClose={() => setCartError("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="error"
            onClose={() => setCartError("")}
            sx={{ borderRadius: 2 }}
          >
            {cartError}
          </Alert>
        </Snackbar>

        {/* ======================= ADD TO CART SNACKBAR ======================= */}
        <Snackbar
          open={Boolean(addedItemSuccess)}
          autoHideDuration={2500}
          onClose={() => setAddedItemSuccess(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setAddedItemSuccess(null)}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate(`/store/${slug}/cart`)}
                sx={{ fontWeight: 800, textTransform: "none" }}
              >
                View Cart
              </Button>
            }
            sx={{
              borderRadius: 2.5,
              fontWeight: 600,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}
          >
            "{addedItemSuccess}" added to your cart!
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default HomePage;
