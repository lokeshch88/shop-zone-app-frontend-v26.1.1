import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  CardActions,
  Button,
  Snackbar,
  Alert,
  useTheme,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import axios from "axios";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
    duration: 1500,
  });

  const token = localStorage.getItem("authToken");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      console.log("Latitude:", pos.coords.latitude);
      console.log("Longitude:", pos.coords.longitude);
      console.log("Accuracy (meters):", pos.coords.accuracy);
    });
  });

  useEffect(() => {
    axios
      .get("http://localhost:8080/products/all")
      .then((response) => {
        const prods = response.data.result;
        setProducts(prods);
        setFilteredProducts(prods);

        const uniqueCategories = [
          ...new Set(prods.map((p) => p.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      })
      .catch((error) => {
        console.error("Error loading products:", error);
        setSnackbar({
          open: true,
          message: "Failed to load products.",
          severity: "error",
        });
      });
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) =>
        selectedCategories.includes(product.category),
      );
    }

    if (sortBy === "priceLowToHigh") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "priceHighToLow") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "nameAZ") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "nameZA") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    setFilteredProducts(filtered);
  }, [selectedCategories, sortBy, products]);

  const handleCategoryChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedCategories(typeof value === "string" ? value.split(",") : value);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

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

      setSnackbar({
        open: true,
        message: "Added to cart!",
        severity: "success",
        duration: 1000,
      });
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setSnackbar({
        open: true,
        message: "Unable to add to cart. Please try again.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography
        variant="h3"
        fontWeight="bold"
        gutterBottom
        textAlign="center"
        sx={{
          color: theme.palette.primary.main,
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        Discover Best Deals
      </Typography>
      <Typography
        variant="subtitle1"
        textAlign="center"
        gutterBottom
        sx={{ color: "text.secondary", mb: 4 }}
      >
        Browse the best offers for you – food, lifestyle, and more!
      </Typography>

      {/* Main 3-column layout */}
      <Grid container spacing={6}>
        {/* Column 1: Filter & Sort */}
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              borderRight: { md: `1px solid ${theme.palette.divider}` },
              pr: { md: 2 },
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Filter by Category
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="category-filter-label">Categories</InputLabel>
              <Select
                labelId="category-filter-label"
                multiple
                value={selectedCategories}
                onChange={handleCategoryChange}
                input={<OutlinedInput label="Categories" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    <Checkbox checked={selectedCategories.includes(category)} />
                    <ListItemText primary={category} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box mt={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Sort By
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="sort-by-label">Sort</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={sortBy}
                  label="Sort"
                  onChange={handleSortChange}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="priceLowToHigh">Price: Low to High</MenuItem>
                  <MenuItem value="priceHighToLow">Price: High to Low</MenuItem>
                  <MenuItem value="nameAZ">Name: A to Z</MenuItem>
                  <MenuItem value="nameZA">Name: Z to A</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Grid>

        {/* Column 2: Product Cards */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={4} justifyContent="center">
            {filteredProducts.map((product) => (
              <Grid item key={product.id} xs={12} sm={6}>
                <Card
                  sx={{
                    height: 350,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      transform: "scale(1.02)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/product/${product.id}`)}
                    sx={{ flexGrow: 1 }}
                  >
                    <CardMedia
                      component="img"
                      image={product.image || "https://via.placeholder.com/300"}
                      alt={product.name}
                      height="150"
                      sx={{ objectFit: "cover" }}
                    />
                    <CardContent sx={{ flexGrow: 1, px: 2 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {product.name}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        variant="body2"
                        sx={{ mb: 1 }}
                      >
                        {truncateText(product.description, 25)}
                      </Typography>
                      <Typography variant="subtitle1" color="primary">
                        ₹{product.price}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <CardActions
                    sx={{ justifyContent: "space-between", px: 2, pb: 2 }}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {filteredProducts.length === 0 && (
              <Typography textAlign="center" sx={{ width: "100%", mt: 5 }}>
                No products found.
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* Column 3: Reserved (empty for now) */}
        <Grid item xs={false} md={3}>
          {/* Future content */}
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.duration || 2500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HomePage;
