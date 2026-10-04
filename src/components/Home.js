import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import axios from "../utils/AxiosInstance";

import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  CardActions,
  Button,
  Box,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";

import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ImageNotSupportedOutlined as ImageNotSupportedIcon,
} from "@mui/icons-material";

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" fill="%23f8fafc"><rect width="300" height="200" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" fill="%2394a3b8">No Image Available</text></svg>`;

// import axios from "axios";

const HomeCheck = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(["ALL"]);
  const [sortBy, setSortBy] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [imageLoadingByProduct, setImageLoadingByProduct] = useState({});

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { slug } = useParams();

  //verify store
  const [storeVerified, setStoreVerified] = useState(false);

  // verify store once per slug to avoid duplicate alerts in React StrictMode
  const storeCheckRef = useRef(null);

  useEffect(() => {
    if (!slug) {
      alert("Store URL is missing");
      navigate("/");
      return;
    }

    if (storeCheckRef.current === slug) {
      return;
    }

    storeCheckRef.current = slug;

    const checkStore = async () => {
      try {
        const response = await axios.get("/store/check");

        if (response.data === "ACTIVE") {
          setStoreVerified(true);
        } else if (response.data === "INACTIVE") {
          alert("This store is currently inactive.");
          navigate("/");
        } else {
          alert("Store not found.");
          navigate("/");
        }
      } catch (error) {
        console.error("Store validation failed:", error);
        alert("Unable to verify store.");
        navigate("/");
      }
    };

    checkStore();
  }, [slug, navigate]);

  // Fetch products
  useEffect(() => {
    // if (!storeVerified) return;
    setLoadingProducts(true);
    axios
      .get(`/products/all-active`)
      .then((response) => {
        const prods = response.data.result;
        setProducts(prods);
      })
      .catch((error) => console.error("Error loading products:", error))
      .finally(() => setLoadingProducts(false));
  }, []);

  // Fetch categories
  useEffect(() => {
    // if (!storeVerified) return;
    axios
      .get(`/category/get-all`)
      .then((res) => {
        if (Array.isArray(res.data)) setCategories(res.data);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  // Filter + Sort
  useEffect(() => {
    let filtered = [...products];

    // if (selectedCategories.length > 0) {
    //   filtered = filtered.filter(
    //     (product) =>
    //       product.categoryId !== null &&
    //       selectedCategories.includes(product.categoryId),
    //   );
    // }
    if (selectedCategories.length > 0 && !selectedCategories.includes("ALL")) {
      filtered = filtered.filter(
        (product) =>
          product.categoryId !== null &&
          selectedCategories.includes(product.categoryId),
      );
    }

    if (sortBy === "priceLowToHigh") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "priceHighToLow")
      filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === "nameAZ")
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "nameZA")
      filtered.sort((a, b) => b.name.localeCompare(a.name));

    setFilteredProducts(filtered);
  }, [products, selectedCategories, sortBy]);

  // const handleCategoryChange = (event) => {
  //   const value = event.target.value;

  //   // If All is selected
  //   if (value.includes("ALL")) {
  //     setSelectedCategories(["ALL"]);
  //     return;
  //   }

  //   setSelectedCategories(value);
  // };

  const handleCategoryChange = (event) => {
    const value = event.target.value;

    // If user selects All
    if (value.includes("ALL") && !selectedCategories.includes("ALL")) {
      setSelectedCategories(["ALL"]);
      return;
    }

    // If All was selected and user now selected another category
    if (selectedCategories.includes("ALL") && value.length > 1) {
      setSelectedCategories(value.filter((item) => item !== "ALL"));
      return;
    }

    // If user removes everything
    if (value.length === 0) {
      setSelectedCategories(["ALL"]);
      return;
    }

    setSelectedCategories(value);
  };

  const handleSortChange = (event) => setSortBy(event.target.value);

  const handleAddToCart = (product) => {
    try {
      const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
      const existingIndex = existingCart.findIndex(
        (item) => item.id === product.id,
      );

      let updatedCart;

      if (existingIndex > -1) {
        updatedCart = existingCart.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        updatedCart = [...existingCart, { ...product, quantity: 1 }];
      }

      localStorage.setItem("cart", JSON.stringify(updatedCart));

      // ✅ Immediate update trigger
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleMobileDrawerToggle = () => setMobileOpen(!mobileOpen);

  // ==================== SIDEBAR COMPONENT ====================
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

    if (nextCategories.length === 0) {
      nextCategories = ["ALL"];
    }

    setSelectedCategories(nextCategories);
  };

  const sortOptions = [
    { value: "", label: "Recommended" },
    { value: "priceLowToHigh", label: "Price: Low to High" },
    { value: "priceHighToLow", label: "Price: High to Low" },
    { value: "nameAZ", label: "Name: A to Z" },
    { value: "nameZA", label: "Name: Z to A" },
  ];

  const FilterSidebarContent = () => (
    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        width: { xs: 300, md: 280 },
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: "text.disabled", letterSpacing: 1.2 }}
          >
            Shop
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            Filters
          </Typography>
        </Box>
        {!isMobile && (
          <IconButton
            onClick={toggleSidebar}
            size="small"
            sx={{ border: 1, borderColor: "divider" }}
          >
            {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ mb: 1.5, color: "text.primary" }}
        >
          Categories
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip
            label="All"
            clickable
            onClick={() => toggleCategory("ALL")}
            color={selectedCategories.includes("ALL") ? "primary" : "default"}
            variant={selectedCategories.includes("ALL") ? "filled" : "outlined"}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              px: 0.5,
              py: 0.5,
            }}
          />

          {categories.map((category) => {
            const selected = selectedCategories.includes(category.id);
            return (
              <Chip
                key={category.id}
                label={category.name}
                clickable
                onClick={() => toggleCategory(category.id)}
                color={selected ? "primary" : "default"}
                variant={selected ? "filled" : "outlined"}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 0.5,
                  py: 0.5,
                }}
              />
            );
          })}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ mb: 1.5, color: "text.primary" }}
        >
          Sort by
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {sortOptions.map((option) => (
            <Button
              key={option.value || "recommended"}
              variant={sortBy === option.value ? "contained" : "outlined"}
              onClick={() => setSortBy(option.value)}
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                minWidth: 0,
                px: 1.5,
                py: 0.8,
              }}
            >
              {option.label}
            </Button>
          ))}
        </Box>
      </Box>

      {selectedCategories.length > 0 && !selectedCategories.includes("ALL") && (
        <Button
          variant="text"
          size="small"
          onClick={() => setSelectedCategories(["ALL"])}
          sx={{
            mt: 1,
            color: "primary.main",
            fontWeight: 700,
            textTransform: "none",
            p: 0,
          }}
        >
          Clear filters
        </Button>
      )}
    </Box>
  );

  const [activeImageIndexByProduct, setActiveImageIndexByProduct] = useState(
    {},
  );

  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    const apiBase = axios.defaults.baseURL || "http://192.168.2.106:8080";
    if (url.startsWith("/")) {
      return `${apiBase}${url}`;
    }
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

  const getDisplayImage = (product, selectedIndex) => {
    const images = getProductImages(product);
    const index =
      typeof selectedIndex === "number"
        ? selectedIndex
        : getPrimaryImageIndex(images);
    const primaryImage = images[index] || images[0];

    if (primaryImage?.imageBase64) {
      return `data:image/jpeg;base64,${primaryImage.imageBase64}`;
    }
    if (primaryImage?.imageUrl) return primaryImage.imageUrl;
    if (primaryImage?.preview) return primaryImage.preview;
    if (product?.imageBase64) {
      return `data:image/jpeg;base64,${product.imageBase64}`;
    }
    if (product?.imageUrl) return normalizeImageUrl(product.imageUrl);

    return "https://via.placeholder.com/300?text=No+Image";
  };

  const moveImage = (productId, direction) => {
    setActiveImageIndexByProduct((prev) => {
      const product = products.find((item) => item.id === productId);
      const images = getProductImages(product);
      if (!images.length) return prev;

      const currentIndex = prev[productId] ?? getPrimaryImageIndex(images);
      const nextIndex =
        (currentIndex + direction + images.length) % images.length;

      return {
        ...prev,
        [productId]: nextIndex,
      };
    });
  };

  const getCurrentImageIndex = (productId, product) => {
    const images = getProductImages(product);
    if (!images.length) return 0;
    return activeImageIndexByProduct[productId] ?? getPrimaryImageIndex(images);
  };

  const handleImageDotClick = (event, productId, index) => {
    event.stopPropagation();
    setActiveImageIndexByProduct((prev) => ({
      ...prev,
      [productId]: index,
    }));
  };

  const markImageLoaded = (productId) => {
    setImageLoadingByProduct((prev) => ({
      ...prev,
      [productId]: false,
    }));
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #1e3a8a 100%)`,
          color: "white",
          py: { xs: 2, md: 3 },
          px: { xs: 2, md: 3 },
          textAlign: "center",
        }}
      >
        <Typography
          variant="h3"
          fontWeight={600}
          sx={{ fontSize: { xs: "2rem", md: "2.8rem" } }}
        >
          Discover Best Deals
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>
          Curated essentials, lifestyle &amp; more
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        sx={{ maxWidth: "1480px", mx: "auto", px: { xs: 2, md: 3 }, py: 1.5 }}
      >
        <Box sx={{ display: "flex", gap: 3 }}>
          {/* Desktop Collapsible Sidebar */}
          {!isMobile && (
            <Box
              sx={{
                width: sidebarOpen ? 320 : 60,
                transition: "width 0.3s ease",
                flexShrink: 0,
                borderRight: "1px solid",
                borderColor: "divider",
                backgroundColor: "background.paper",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              {sidebarOpen ? (
                <FilterSidebarContent />
              ) : (
                <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                  <IconButton onClick={toggleSidebar}>
                    <FilterIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}

          {/* Product Grid Area */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Mobile Filter Button */}
            {isMobile && (
              <Button
                startIcon={<FilterIcon />}
                variant="outlined"
                onClick={handleMobileDrawerToggle}
                sx={{ mb: 1, borderRadius: 1.5, textTransform: "none" }}
              >
                Filters &amp; Sort
              </Button>
            )}

            {/* Results Count */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {filteredProducts.length} products found
            </Typography>

            {/* Product Grid */}
            {loadingProducts ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 10,
                  width: "100%",
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <CircularProgress size={40} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    Loading products...
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const comparePrice =
                      product.comparePrice && product.comparePrice > 0
                        ? product.comparePrice
                        : product.price + 100;
                    const productImages = getProductImages(product);
                    const hasImages = productImages.length > 0;
                    const productImageLoading =
                      hasImages && imageLoadingByProduct[product.id] !== false;

                    return (
                      <Grid
                        key={product.id}
                        size={{ xs: 6, sm: 4, md: 3, lg: 2.5, xl: 2 }} // ← New MUI Grid syntax
                      >
                        <Card
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: 4,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            "&:hover": {
                              transform: "translateY(-6px)",
                              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                            },
                          }}
                        >
                          <CardActionArea
                            onClick={() =>
                              navigate(`/store/${slug}/product/${product.id}`)
                            }
                            sx={{
                              flexGrow: 1,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Box
                              sx={{
                                height: 180,
                                width: "100%",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#f8fafc",
                                overflow: "hidden",
                                px: 0,
                                mx: 0,
                              }}
                            >
                              {productImageLoading ? (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: 3,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background:
                                      "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                                  }}
                                >
                                  <CircularProgress size={24} />
                                </Box>
                              ) : null}

                              {!hasImages ? (
                                <Box
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "#f8fafc",
                                    gap: 0.75,
                                    userSelect: "none",
                                  }}
                                >
                                  <ImageNotSupportedIcon
                                    sx={{ fontSize: 38, color: "#94a3b8" }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#94a3b8",
                                      fontWeight: 600,
                                      fontSize: "0.75rem",
                                      letterSpacing: "0.02em",
                                    }}
                                  >
                                    No Image Available
                                  </Typography>
                                </Box>
                              ) : (
                                <Box
                                  sx={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    overflow: "hidden",
                                    borderRadius: "12px 12px 0 0",
                                    opacity: productImageLoading ? 0 : 1,
                                    transition: "opacity 0.25s ease",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      display: "flex",
                                      transition: "transform 0.4s ease-in-out",
                                      transform: `translateX(-${
                                        (getCurrentImageIndex(
                                          product.id,
                                          product,
                                        ) || 0) * 100
                                      }%)`,
                                      willChange: "transform",
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
                                          backgroundColor: "#f5f5f5",
                                          px: 0,
                                        }}
                                      >
                                        <CardMedia
                                          component="img"
                                          image={image.imageUrl}
                                          alt={product.name}
                                          sx={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "contain",
                                            p: 0,
                                            display: "block",
                                          }}
                                          onLoad={() =>
                                            markImageLoaded(product.id)
                                          }
                                          onError={(e) => {
                                            markImageLoaded(product.id);
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src =
                                              FALLBACK_IMAGE;
                                          }}
                                        />
                                      </Box>
                                    ))}
                                  </Box>

                                  {productImages.length > 1 && (
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        bottom: 8,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        display: "flex",
                                        gap: 1,
                                        zIndex: 2,
                                      }}
                                    >
                                      {productImages.map((_, index) => (
                                        <Box
                                          key={index}
                                          sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            backgroundColor:
                                              getCurrentImageIndex(
                                                product.id,
                                                product,
                                              ) === index
                                                ? "primary.main"
                                                : "grey.400",
                                            cursor: "pointer",
                                            transition:
                                              "background-color 0.3s ease",
                                            boxShadow:
                                              "0 1px 3px rgba(0,0,0,0.22)",
                                          }}
                                          onClick={(event) =>
                                            handleImageDotClick(
                                              event,
                                              product.id,
                                              index,
                                            )
                                          }
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
                                        pointerEvents: "none",
                                        px: 1,
                                        zIndex: 2,
                                      }}
                                    >
                                      <IconButton
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          moveImage(product.id, -1);
                                        }}
                                        disabled={
                                          getCurrentImageIndex(
                                            product.id,
                                            product,
                                          ) <= 0
                                        }
                                        sx={{
                                          pointerEvents: "auto",
                                          backgroundColor:
                                            "rgba(255, 255, 255, 0.82)",
                                          boxShadow:
                                            "0 4px 10px rgba(0,0,0,0.12)",
                                          width: 28,
                                          height: 28,
                                          borderRadius: "50%",
                                          "&:hover": {
                                            backgroundColor:
                                              "rgba(255, 255, 255, 0.95)",
                                          },
                                        }}
                                      >
                                        <ChevronLeftIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          moveImage(product.id, 1);
                                        }}
                                        disabled={
                                          getCurrentImageIndex(
                                            product.id,
                                            product,
                                          ) >=
                                          productImages.length - 1
                                        }
                                        sx={{
                                          pointerEvents: "auto",
                                          backgroundColor:
                                            "rgba(255, 255, 255, 0.82)",
                                          boxShadow:
                                            "0 4px 10px rgba(0,0,0,0.12)",
                                          width: 28,
                                          height: 28,
                                          borderRadius: "50%",
                                          "&:hover": {
                                            backgroundColor:
                                              "rgba(255, 255, 255, 0.95)",
                                          },
                                        }}
                                      >
                                        <ChevronRightIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Box>
                              )}
                            </Box>

                            <CardContent
                              sx={{ flexGrow: 1, px: 1, pt: 1, pb: 1 }}
                            >
                              <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                noWrap
                                sx={{ mb: 0.5 }}
                              >
                                {product.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ minHeight: 40 }}
                              >
                                {truncateText(product.description, 60)}
                              </Typography>

                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textDecoration: "line-through",
                                    color: "text.disabled",
                                  }}
                                >
                                  ₹{comparePrice}
                                </Typography>
                                <Typography
                                  variant="h6"
                                  fontWeight={700}
                                  color="primary"
                                >
                                  ₹{product.price}
                                </Typography>
                              </Box>
                            </CardContent>
                          </CardActionArea>

                          <CardActions
                            sx={{
                              px: 1.5,
                              pb: 1,
                              pt: 0,
                              justifyContent: "space-between",
                            }}
                          >
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleAddToCart(product)}
                              sx={{
                                borderRadius: 3,
                                px: 2,
                                textTransform: "none",
                                fontSize: "0.75rem",
                              }}
                            >
                              Cart+
                            </Button>
                            <Button
                              variant="text"
                              size="small"
                              onClick={() =>
                                navigate(`/store/${slug}/product/${product.id}`)
                              }
                              sx={{
                                textTransform: "none",
                                fontSize: "0.75rem",
                              }}
                            >
                              Details
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })
                ) : (
                  <Box sx={{ width: "100%", py: 8, textAlign: "center" }}>
                    <Typography variant="h6" color="text.secondary">
                      No products found
                    </Typography>
                  </Box>
                )}
              </Grid>
            )}
          </Box>
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        <Box sx={{ width: 320 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Filters
            </Typography>
            <IconButton onClick={handleMobileDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <FilterSidebarContent />
        </Box>
      </Drawer>
    </Box>
  );
};

export default HomeCheck;
