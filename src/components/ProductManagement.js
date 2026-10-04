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
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { ArrowBack, Add, Search } from "@mui/icons-material";
// import axios from "axios";
import { useNavigate } from "react-router-dom";

import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Avatar from "@mui/material/Avatar";
// import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useParams } from "react-router-dom";
import axios from "../utils/AxiosInstance";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedProduct, setSelectedProduct] = useState({
    name: "",
    price: "",
    description: "",
    quantityInStock: "",
    brand: "",
    categoryId: "",
    comparePrice: "",
    sku: "",
    mrp: "",
    isActive: "",
    variants: [],
    variantColors: [],
    variantSizes: [],
    imageBase64: null, // from backend
    imageFile: null, // new upload
    images: [],
    primaryImageIndex: 0,
  });
  const [isProductDialogOpen, setProductDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view");

  const [images, setImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [maxProductImages, setmaxProductImages] = useState(1);
  // const maxProductImages = 5;

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    if (url.startsWith("/")) {
      return `http://localhost:8080${url}`;
    }
    return url;
  };

  const getPrimaryIndex = (images = []) => {
    const index = images.findIndex(
      (image) => image?.primaryImage === true || image?.isPrimary === true,
    );
    return index >= 0 ? index : 0;
  };

  const fetchProducts = () => {
    axios
      .get("/products/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProducts(res.data.result))
      .catch((err) => console.error("Product fetch error:", err));
  };

  const fetchCategories = () => {
    axios
      .get("/category/get-all", {
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
        .delete(`/products/${id}`, {
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
    if (
      !selectedProduct.name ||
      !selectedProduct.price ||
      !selectedProduct.isActive ||
      !selectedProduct.mrp ||
      !selectedProduct.sku ||
      !selectedProduct.quantityInStock ||
      !selectedProduct.brand ||
      !selectedProduct.description ||
      !selectedProduct.comparePrice ||
      selectedProduct.price <= 0 ||
      selectedProduct.mrp <= 0 ||
      selectedProduct.comparePrice <= 0 ||
      selectedProduct.quantityInStock < 0
    ) {
      alert("Please fill valid data in required fields");
      return;
    }

    const primaryIndex = getPrimaryIndex(selectedProduct.images || []);
    const productPayload = {
      ...selectedProduct,
      imageBase64: undefined,
      imageFile: undefined,
      imageUrl: undefined,
      primaryImageIndex: selectedProduct.primaryImageIndex ?? primaryIndex,
      images: (selectedProduct.images || []).map((image, index) => {
        const isPrimary =
          index === (selectedProduct.primaryImageIndex ?? primaryIndex);

        return {
          id: image?.id ?? null,
          imageUrl: image?.imageUrl ? normalizeImageUrl(image.imageUrl) : null,
          imageBase64: image?.imageBase64 || null,
          fileName: image?.fileName || image?.name || null,
          displayOrder: index,
          isPrimary,
          primaryImage: isPrimary,
        };
      }),
    };

    const formData = new FormData();
    formData.append(
      "product",
      new Blob([JSON.stringify(productPayload)], {
        type: "application/json",
      }),
    );

    const uploadedImages = (selectedProduct.images || []).filter(
      (image) => image?.file,
    );

    uploadedImages.forEach((image) => {
      formData.append("images", image.file);
    });

    if (uploadedImages.length === 1) {
      formData.append("image", uploadedImages[0].file);
    }

    const apiCall =
      dialogMode === "add"
        ? axios.post("/products/create", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          })
        : axios.put(
            `/products/${selectedProduct.id}`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            },
          );

    apiCall
      .then(() => {
        alert(
          dialogMode === "add"
            ? "Product added successfully"
            : "Product updated successfully",
        );
        setProductDialogOpen(false);
        fetchProducts();
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Failed to save product");
        console.error(err);
      });
  };

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchProduct.toLowerCase()),
  );

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };

  const [variantOptions, setVariantOptions] = useState({
    colors: [],
    sizes: [],
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetch("/products/productvariant")
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

  const normalizeProductImages = (product = []) => {
    if (!product) return [];

    const collectedImages = [];
    const pushImage = (image) => {
      if (!image) return;

      if (typeof image === "string") {
        collectedImages.push({
          imageUrl: normalizeImageUrl(image),
          preview: normalizeImageUrl(image),
          imageBase64: null,
          file: null,
        });
        return;
      }

      const preview =
        image.preview ||
        normalizeImageUrl(image.imageUrl || "") ||
        (image.imageBase64
          ? `data:image/jpeg;base64,${image.imageBase64}`
          : "");

      collectedImages.push({
        ...image,
        preview,
        imageUrl: image.imageUrl ? normalizeImageUrl(image.imageUrl) : "",
      });
    };

    const rawImages = Array.isArray(product.images)
      ? [...product.images]
      : Array.isArray(product.imageUrls)
        ? product.imageUrls.map((url) => ({ imageUrl: url }))
        : [];

    if (product.imageUrl || product.imageBase64) {
      rawImages.unshift({
        imageUrl: product.imageUrl || "",
        imageBase64: product.imageBase64 || null,
      });
    }

    rawImages.forEach(pushImage);

    return collectedImages
      .map((image, index) => ({
        ...image,
        primaryImage:
          image.primaryImage === true ||
          image.isPrimary === true ||
          image.displayOrder === 0 ||
          index === (product.primaryImageIndex ?? 0),
        displayOrder: image.displayOrder ?? index,
      }))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  };

  const getProductImageSrc = (product = selectedProduct) => {
    if (!product) return null;

    const images = normalizeProductImages(product);
    const primaryImage =
      images[product.primaryImageIndex ?? 0] || images[0] || null;

    if (primaryImage?.preview) return primaryImage.preview;
    if (primaryImage?.imageUrl) return primaryImage.imageUrl;
    if (primaryImage?.imageBase64) {
      return `data:image/jpeg;base64,${primaryImage.imageBase64}`;
    }
    if (product?.imageFile) {
      return URL.createObjectURL(product.imageFile);
    }
    if (product?.imageBase64) {
      return `data:image/jpeg;base64,${product.imageBase64}`;
    }
    if (product?.imageUrl) {
      return product.imageUrl;
    }

    return null;
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      imageUrl: "",
      imageBase64: null,
    }));

    setSelectedProduct((prev) => {
      const currentImages = prev.images || [];
      const merged = [...currentImages, ...newImages].slice(
        0,
        maxProductImages,
      );

      return {
        ...prev,
        images: merged,
        primaryImageIndex:
          prev.primaryImageIndex ?? Math.max(0, merged.length - 1),
      };
    });

    event.target.value = "";
  };

  const handlePrimaryImage = (index) => {
    setSelectedProduct((prev) => ({
      ...prev,
      primaryImageIndex: index,
    }));
  };

  const handleRemoveImage = (index) => {
    setSelectedProduct((prev) => {
      const updatedImages = (prev.images || []).filter((_, i) => i !== index);
      const nextPrimaryIndex =
        updatedImages.length === 0
          ? 0
          : Math.min(index, updatedImages.length - 1);

      return {
        ...prev,
        images: updatedImages,
        primaryImageIndex: nextPrimaryIndex,
      };
    });
  };

  const { slug } = useParams();

  return (
    <Container
    // maxWidth="xl" sx={{ mt: 0, mb: 4 }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <IconButton
          onClick={() => navigate(`/store/${slug}/admin-dashboard`)}
          sx={{ mr: 2 }}
        >
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
            size="small" // minimize height
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
                isActive: "",
                variants: [],
                variantColors: [],
                variantSizes: [],
                imageBase64: null,
                imageFile: null,
                images: [],
                primaryImageIndex: 0,
              });
              setProductDialogOpen(true);
            }}
            size="small" // minimize height
          >
            Add Product
          </Button>
        </Box>
      </Paper>

      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table size="small">
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
                <strong>Created Date</strong>
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
                      label={product.isActive == "Y" ? "Active" : "Inactive"}
                      color={product.isActive == "Y" ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(product.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={() => {
                        setDialogMode("view");
                        setSelectedProduct({
                          ...product,
                          images: normalizeProductImages(product),
                          primaryImageIndex:
                            product.primaryImageIndex ??
                            getPrimaryIndex(normalizeProductImages(product)),
                        });
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
                        setSelectedProduct({
                          ...product,
                          isActive:
                            product.isActive === true ||
                            product.isActive === "Y"
                              ? "Y"
                              : "N",
                          images: normalizeProductImages(product),
                          primaryImageIndex:
                            product.primaryImageIndex ??
                            getPrimaryIndex(normalizeProductImages(product)),
                        });
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
              gridTemplateColumns: "1fr 1fr 1fr",
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
              label="Compare At Price *"
              type="number"
              fullWidth
              variant="outlined"
              value={selectedProduct?.comparePrice || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedProduct({
                  ...selectedProduct,
                  comparePrice: e.target.value,
                })
              }
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Original price before discount (e.g., shown struck-through)">
                      <HelpOutlineIcon fontSize="small" />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="MRP *"
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
              label="Quantity in Stock *"
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
              label="Brand *"
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
              label="SKU *"
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
              <InputLabel id="status-label">Status *</InputLabel>

              <Select
                labelId="status-label"
                id="status-select"
                label="Status"
                value={selectedProduct.isActive}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    isActive: e.target.value,
                  })
                }
                disabled={dialogMode === "view"}
              >
                <MenuItem value="Y">Active</MenuItem>
                <MenuItem value="N">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField
            label="Description *"
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

          {/* <Button
            variant="outlined"
            component="label"
            fullWidth
            size="small"
            sx={{ mt: 2 }}
            disabled={dialogMode === "view"}
          >
            Upload Product Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSelectedProduct({ ...selectedProduct, imageFile: file });
                }
              }}
            />
          </Button> */}
          {/* \sinlge imgae */}
          {/* <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            {getProductImageSrc() ? (
              <>
                <Avatar
                  variant="rounded"
                  src={getProductImageSrc()}
                  sx={{ width: 56, height: 56 }}
                />

                <IconButton
                  color="error"
                  disabled={dialogMode === "view"}
                  onClick={() =>
                    setSelectedProduct({
                      ...selectedProduct,
                      imageBase64: null,
                      imageFile: null,
                    })
                  }
                >
                  <DeleteIcon />
                </IconButton>
              </>
            ) : (
              <Button
                variant="outlined"
                component="label"
                size="small"
                disabled={dialogMode === "view"}
              >
                Add Product Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedProduct({
                        ...selectedProduct,
                        imageFile: file,
                      });
                    }
                  }}
                />
              </Button>
            )}
          </Stack> */}

          {/* ============================================================
    PRODUCT IMAGES
============================================================ */}

          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Product Images
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {selectedProduct.images?.length || 0}
                {" / "}
                {maxProductImages}
              </Typography>
            </Box>

            {/* Upload */}

            {dialogMode !== "view" &&
              (selectedProduct.images?.length || 0) < maxProductImages && (
                <Button variant="outlined" component="label" size="small">
                  Add Product Images
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
              )}

            {/* IMAGE PREVIEWS */}

            {selectedProduct.images?.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  mt: 2,
                }}
              >
                {selectedProduct.images.map((image, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: "relative",
                      width: 150,
                      border:
                        selectedProduct.primaryImageIndex === index
                          ? "2px solid"
                          : "1px solid #ddd",
                      borderRadius: 2,
                      p: 1,
                    }}
                  >
                    {/* IMAGE */}

                    <Box
                      component="img"
                      src={
                        image.preview ||
                        image.imageUrl ||
                        (image.imageBase64
                          ? `data:image/jpeg;base64,${image.imageBase64}`
                          : "")
                      }
                      alt={`Product ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: 120,
                        objectFit: "contain",
                        borderRadius: 1,
                        backgroundColor: "#fafafa",
                      }}
                    />

                    {/* PRIMARY */}

                    <Button
                      fullWidth
                      size="small"
                      variant={
                        selectedProduct.primaryImageIndex === index
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() => handlePrimaryImage(index)}
                      disabled={dialogMode === "view"}
                      sx={{
                        mt: 1,
                        textTransform: "none",
                      }}
                    >
                      {selectedProduct.primaryImageIndex === index
                        ? "Primary Image"
                        : "Make Primary"}
                    </Button>

                    {/* DELETE */}

                    <IconButton
                      size="small"
                      color="error"
                      disabled={dialogMode === "view"}
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        position: "absolute",
                        top: 5,
                        right: 5,
                        backgroundColor: "white",
                        "&:hover": {
                          backgroundColor: "#fff",
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>

                    {/* IMAGE NUMBER */}

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        textAlign: "center",
                        mt: 0.5,
                      }}
                    >
                      Image {index + 1}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {selectedProduct.images?.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No images added yet.
              </Typography>
            )}
          </Box>

          {selectedProduct.imageFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {selectedProduct.imageFile.name}
            </Typography>
          )}

          {/* --- Variants Accordion --- */}
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
