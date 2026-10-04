import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    axios
      .get(`http://localhost:8080/products/${id}`)
      .then((response) => {
        setProduct(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch product", error);
        setSnackbar({
          open: true,
          message: "Failed to load product details.",
          severity: "error",
        });
      });
  }, [id]);

  const sizes = [...new Set(product?.variants?.map((v) => v.size))];
  const colors = [
    ...new Set(
      product?.variants
        ?.filter((v) => v.size === selectedSize)
        .map((v) => v.color),
    ),
  ];

  const selectedVariant = product?.variants?.find(
    (v) => v.size === selectedSize && v.color === selectedColor,
  );

  const handleAddToCart = () => {
    if (!selectedVariant) {
      setSnackbar({
        open: true,
        message: "Please select size and color",
        severity: "warning",
      });
      return;
    }

    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    const itemKey = `${product.id}_${selectedVariant.size}_${selectedVariant.color}`;

    const index = existingCart.findIndex(
      (item) =>
        `${item.id}_${item.variant?.size}_${item.variant?.color}` === itemKey,
    );

    let updatedCart;
    if (index > -1) {
      updatedCart = existingCart.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + 1 } : item,
      );
    } else {
      updatedCart = [
        ...existingCart,
        {
          id: product.id,
          name: product.name,
          image: product.imageUrl,
          description: product.description,
          variant: selectedVariant,
          quantity: 1,
        },
      ];
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setSnackbar({
      open: true,
      message: "Added to cart!",
      severity: "success",
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!product) {
    return (
      <Container sx={{ py: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  const renderOptionBox = (label, selected, onClick) => (
    <Box
      onClick={onClick}
      sx={{
        border: selected ? "2px solid #1976d2" : "1px solid #ccc",
        borderRadius: "8px",
        padding: "8px 16px",
        margin: "4px",
        cursor: "pointer",
        fontWeight: selected ? "bold" : "normal",
        backgroundColor: selected ? "#e3f2fd" : "#fff",
        "&:hover": {
          backgroundColor: "#f1f1f1",
        },
      }}
    >
      {label}
    </Box>
  );

  return (
    <Container sx={{ py: 5 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <img
            src={
              selectedVariant?.image ||
              product.image ||
              "https://via.placeholder.com/500"
            }
            alt={product.name}
            style={{ width: "100%", borderRadius: 8 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            {product.name}
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            ₹{selectedVariant?.price?.toFixed(2) ?? product.price?.toFixed(2)}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {product.description}
          </Typography>
        </Grid>
      </Grid>

      {/* Variant Selector */}
      {product.variants?.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Select Color:
          </Typography>
          <Box display="flex" flexWrap="wrap">
            {[...new Set(product.variants.map((variant) => variant.color))].map(
              (color) =>
                renderOptionBox(color, selectedColor === color, () => {
                  setSelectedColor(color);
                  setSelectedSize(""); // reset size when color changes
                }),
            )}
          </Box>

          {selectedColor && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Select Size:
              </Typography>
              <Box display="flex" flexWrap="wrap">
                {[
                  ...new Set(
                    product.variants
                      .filter((v) => v.color === selectedColor)
                      .map((v) => v.size),
                  ),
                ].map((size) =>
                  renderOptionBox(size, selectedSize === size, () =>
                    setSelectedSize(size),
                  ),
                )}
              </Box>
            </>
          )}

          {selectedVariant && (
            <Box mt={2}>
              <Typography variant="h6" color="primary">
                ₹{selectedVariant.price?.toFixed(2)}
              </Typography>
              {selectedVariant.stock < 10 && (
                <Typography variant="body2" color="warning.main">
                  Stock left: {selectedVariant.stock ?? "N/A"}
                </Typography>
              )}
            </Box>
          )}

          <Box mt={3} display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedColor || !selectedSize}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
            <Button variant="outlined" onClick={() => navigate("/cart")}>
              Go to Cart
            </Button>
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
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

export default ProductPage;
