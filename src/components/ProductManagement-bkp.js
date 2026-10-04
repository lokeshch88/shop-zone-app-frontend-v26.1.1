import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  Chip,
  Checkbox,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ArrowBack, Add, Search } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductDialogOpen, setProductDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view"); // "add", "update", "view"

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();
  const [tempColor, setTempColor] = useState("");
  const [tempSize, setTempSize] = useState("");
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = () => {
    axios
      .get("http://localhost:8080/products/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProducts(res.data.result))
      .catch((err) => console.error("Product fetch error:", err));
  };

  const fetchCategories = () => {
    axios
      .get("http://localhost:8080/category/get-all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setCategories(response.data);
      })
      .catch((err) => {
        console.error("Failed to fetch categories", err);
      });
  };

  const handleDeleteProduct = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );
    if (confirmed) {
      axios
        .delete(`http://localhost:8080/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          alert("Product deleted successfully");
          fetchProducts();
        })
        .catch((err) => {
          alert("Failed to delete product");
          console.error(err);
        });
    }
  };

  const handleProductSubmit = () => {
    if (!selectedProduct.name || !selectedProduct.price) {
      alert("Please fill all required fields (Name and Price)");
      return;
    }

    if (dialogMode === "add") {
      axios
        .post("http://localhost:8080/products/create", selectedProduct, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          alert("Product added successfully");
          setProductDialogOpen(false);
          fetchProducts();
        })
        .catch((err) => {
          alert(err.response?.data?.error || "Failed to add product");
          console.error(err);
        });
    } else if (dialogMode === "update") {
      axios
        .put(
          `http://localhost:8080/products/${selectedProduct.id}`,
          selectedProduct,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        .then(() => {
          alert("Product updated successfully");
          setProductDialogOpen(false);
          fetchProducts();
        })
        .catch((err) => {
          alert("Failed to update product");
          console.error(err);
        });
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchProduct.toLowerCase()),
  );

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };

  useEffect(() => {
    // Replace with your actual endpoint
    fetch("http://localhost:8080/products/productvariant")
      .then((res) => res.json())
      .then((data) => {
        setVariantOptions({
          colors: data.colors || [],
          sizes: data.sizes || [],
        });
      })
      .catch((err) => {
        console.error("Failed to fetch variant options", err);
      });
  }, []);
  const [variantOptions, setVariantOptions] = useState({
    colors: [],
    sizes: [],
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/admin-dashboard")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Product Management
        </Typography>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <TextField
            label="Search Products"
            variant="outlined"
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 250 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setDialogMode("add");
              setSelectedProduct({
                name: "",
                price: "",
                description: "",
                quantityInStock: "",
                brand: "",
                categoryId: "",
                sku: "",
                mrp: "",
                isActive: true,
              });
              setProductDialogOpen(true);
            }}
          >
            Add Product
          </Button>
        </Box>
      </Paper>

      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>
                <strong>ID</strong>
              </TableCell>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Price</strong>
              </TableCell>
              <TableCell>
                <strong>Stock</strong>
              </TableCell>
              <TableCell>
                <strong>Category</strong>
              </TableCell>
              <TableCell>
                <strong>Brand</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>₹{product.price}</TableCell>
                  <TableCell>{product.quantityInStock || 0}</TableCell>
                  <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                  <TableCell>{product.brand || "N/A"}</TableCell>
                  <TableCell>
                    <Chip
                      label={product.isActive ? "Active" : "Inactive"}
                      color={product.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={() => {
                        setDialogMode("view");
                        setSelectedProduct(product);
                        setProductDialogOpen(true);
                      }}
                      sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setDialogMode("update");
                        setSelectedProduct(product);
                        setProductDialogOpen(true);
                      }}
                      sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" color="text.secondary">
                    No products found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Product Dialog */}
      <Dialog
        open={isProductDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {dialogMode === "add"
            ? "Add New Product"
            : dialogMode === "update"
              ? "Update Product"
              : "Product Details"}
        </DialogTitle>
        <DialogContent dividers>
          {/* --- Main Product Fields --- */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
            }}
          >
            <TextField
              label="Product Name *"
              fullWidth
              variant="outlined"
              value={selectedProduct?.name || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedProduct({ ...selectedProduct, name: e.target.value })
              }
              size="small"
            />
            <TextField
              label="Price *"
              type="number"
              fullWidth
              variant="outlined"
              value={selectedProduct?.price || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedProduct({
                  ...selectedProduct,
                  price: e.target.value,
                })
              }
              size="small"
            />
            <TextField
              label="MRP"
              type="number"
              fullWidth
              variant="outlined"
              value={selectedProduct?.mrp || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedProduct({ ...selectedProduct, mrp: e.target.value })
              }
              size="small"
            />
            <TextField
              label="Quantity in Stock"
              type="number"
              fullWidth
              variant="outlined"
              value={selectedProduct?.quantityInStock || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedProduct({
                  ...selectedProduct,
                  quantityInStock: e.target.value,
                })
              }
              size="small"
            />
            <TextField
              label="Brand"
              fullWidth
              variant="outlined"
              value={selectedProduct?.brand || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedProduct({
                  ...selectedProduct,
                  brand: e.target.value,
                })
              }
              size="small"
            />
            <TextField
              label="SKU"
              fullWidth
              variant="outlined"
              value={selectedProduct?.sku || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedProduct({ ...selectedProduct, sku: e.target.value })
              }
              size="small"
            />
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category-select"
                label="Category"
                value={selectedProduct?.categoryId || ""}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    categoryId: e.target.value,
                  })
                }
                disabled={dialogMode === "view"}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status-select"
                label="Status"
                value={selectedProduct?.isActive || true}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    isActive: e.target.value,
                  })
                }
                disabled={dialogMode === "view"}
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={selectedProduct?.description || ""}
            disabled={dialogMode === "view"}
            onChange={(e) =>
              setSelectedProduct({
                ...selectedProduct,
                description: e.target.value,
              })
            }
            sx={{ mt: 3 }}
            size="small"
          />
          {/* --- Variants Accordion --- */}
          <Box sx={{ mt: 4 }}>
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={<Add />}
                sx={{ bgcolor: "#f9f9f9" }}
              >
                <Typography variant="subtitle1">
                  Product Variants ({selectedProduct?.variants?.length || 0})
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                {/* Add Variant Inputs */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    mb: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <FormControl fullWidth size="small">
                    <InputLabel id="color-multiselect-label">Colors</InputLabel>
                    <Select
                      labelId="color-multiselect-label"
                      multiple
                      value={selectedProduct?.variantColors || []}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          variantColors: e.target.value,
                        })
                      }
                      renderValue={(selected) => selected.join(", ")}
                    >
                      {variantOptions.colors.map((color) => (
                        <MenuItem key={color} value={color}>
                          <Checkbox
                            checked={selectedProduct?.variantColors?.includes(
                              color,
                            )}
                          />
                          <ListItemText primary={color} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel id="size-multiselect-label">Sizes</InputLabel>
                    <Select
                      labelId="size-multiselect-label"
                      multiple
                      value={selectedProduct?.variantSizes || []}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          variantSizes: e.target.value,
                        })
                      }
                      renderValue={(selected) => selected.join(", ")}
                    >
                      {variantOptions.sizes.map((size) => (
                        <MenuItem key={size} value={size}>
                          <Checkbox
                            checked={selectedProduct?.variantSizes?.includes(
                              size,
                            )}
                          />
                          <ListItemText primary={size} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      const colors = selectedProduct.variantColors || [];
                      const sizes = selectedProduct.variantSizes || [];
                      const basePrice = selectedProduct.price || 0;
                      const baseStock = selectedProduct.quantityInStock || 0;

                      const combinations = [];

                      for (const color of colors) {
                        for (const size of sizes) {
                          combinations.push({
                            color,
                            size,
                            price: basePrice,
                            stock: baseStock,
                          });
                        }
                      }

                      setSelectedProduct({
                        ...selectedProduct,
                        variants: combinations,
                      });
                    }}
                    disabled={
                      !selectedProduct.variantColors?.length ||
                      !selectedProduct.variantSizes?.length ||
                      dialogMode === "view"
                    }
                    sx={{ height: "fit-content", alignSelf: "center" }}
                  >
                    Generate Variants
                  </Button>
                </Box>

                {/* Variant List */}
                <Box sx={{ mt: 1 }}>
                  {selectedProduct?.variants?.length > 0 ? (
                    selectedProduct.variants.map((variant, index) => (
                      <Box
                        key={`${variant.color}-${variant.size}-${index}`}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 1,
                          border: "1px solid #ddd",
                          borderRadius: 1,
                          px: 2,
                          py: 1,
                        }}
                      >
                        <Typography sx={{ width: "120px", fontWeight: 500 }}>
                          {variant.color} / {variant.size}
                        </Typography>

                        <TextField
                          label="Price"
                          type="number"
                          size="small"
                          sx={{ width: "100px" }}
                          value={variant.price}
                          onChange={(e) => {
                            const updated = [...selectedProduct.variants];
                            updated[index].price = parseFloat(e.target.value);
                            setSelectedProduct({
                              ...selectedProduct,
                              variants: updated,
                            });
                          }}
                          disabled={dialogMode === "view"}
                        />

                        <TextField
                          label="Stock"
                          type="number"
                          size="small"
                          sx={{ width: "100px" }}
                          value={variant.stock}
                          onChange={(e) => {
                            const updated = [...selectedProduct.variants];
                            updated[index].stock = parseInt(e.target.value);
                            setSelectedProduct({
                              ...selectedProduct,
                              variants: updated,
                            });
                          }}
                          disabled={dialogMode === "view"}
                        />

                        {dialogMode !== "view" && (
                          <IconButton
                            onClick={() => {
                              const confirmed = window.confirm(
                                "Delete this variant?",
                              );
                              if (confirmed) {
                                const updated = [...selectedProduct.variants];
                                updated.splice(index, 1);
                                setSelectedProduct({
                                  ...selectedProduct,
                                  variants: updated,
                                });
                              }
                            }}
                            size="small"
                          >
                            ❌
                          </IconButton>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No variants added yet.
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          {(dialogMode === "add" || dialogMode === "update") && (
            <Button onClick={handleProductSubmit} variant="contained">
              {dialogMode === "add" ? "Add Product" : "Update Product"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductManagement;
