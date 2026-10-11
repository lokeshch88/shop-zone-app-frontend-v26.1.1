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
  Drawer,
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
  Alert,
  FormControlLabel,
  Switch,
  useMediaQuery,
  Snackbar,
} from "@mui/material";
import { ArrowBack, Add, Search, Close } from "@mui/icons-material";
// import axios from "axios";
import { useNavigate } from "react-router-dom";

import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Avatar from "@mui/material/Avatar";
// import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useParams } from "react-router-dom";
import axios from "../utils/AxiosInstance";

const VARIANT_ATTRIBUTE_FIELDS = {
  color: "color",
  colors: "color",
  size: "size",
  sizes: "size",
  material: "material",
  materials: "material",
  pattern: "pattern",
  patterns: "pattern",
  gender: "gender",
  genders: "gender",
};

const getVariantAllowedFields = (allowedVariants = []) => [
  ...new Set(
    allowedVariants
      .map(
        (attribute) =>
          VARIANT_ATTRIBUTE_FIELDS[String(attribute).toLowerCase()],
      )
      .filter(Boolean),
  ),
];

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
    isActive: "Y",
    variants: [],
    variantColors: [],
    variantSizes: [],
    variantMaterials: [],
    imageBase64: null, // from backend
    imageFile: null, // new upload
    images: [],
    primaryImageIndex: 0,
  });
  const [isProductDialogOpen, setProductDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view");

  const [images, setImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [maxProductImages] = useState(5);

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const [variantOptions, setVariantOptions] = useState({
    colors: [],
    sizes: [],
    materials: [],
    imageUploadAllowedVariant: [],
  });
  const [formMessage, setFormMessage] = useState("");
  const [formMessageSeverity, setFormMessageSeverity] = useState("warning");
  const [savingProduct, setSavingProduct] = useState(false);
  const [variantOptionsLoaded, setVariantOptionsLoaded] = useState(false);
  const [variantOptionsError, setVariantOptionsError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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

  const getVariantImageGroupKey = (variant) => {
    const allowedFields = getVariantAllowedFields(
      variantOptions.imageUploadAllowedVariant,
    ).filter((field) => field === "color" || field === "material");
    const values = allowedFields
      .filter((field) => variant[field] !== undefined && variant[field] !== "")
      .map((field) => [field, variant[field]]);
    return values.length ? JSON.stringify(values) : "";
  };

  const updateVariantImageGroup = (variantIndex, updateImages) => {
    setSelectedProduct((previous) => {
      const target = previous.variants?.[variantIndex];
      const groupKey = target && getVariantImageGroupKey(target);
      if (!target) return previous;
      const isInGroup = (variant, index) =>
        groupKey
          ? getVariantImageGroupKey(variant) === groupKey
          : index === variantIndex;
      const group = previous.variants.filter(isInGroup);
      const targetVariant = group[0] || target;
      const updatedGroup = updateImages(
        targetVariant.images || [],
        targetVariant.primaryImageIndex ?? 0,
      );
      return {
        ...previous,
        variants: previous.variants.map((variant, index) => {
          if (!isInGroup(variant, index)) return variant;
          const isPrimaryGroupVariant =
            index === previous.variants.findIndex(isInGroup);
          return {
            ...variant,
            images: isPrimaryGroupVariant ? updatedGroup.images : [],
            primaryImageIndex: isPrimaryGroupVariant
              ? updatedGroup.primaryImageIndex
              : 0,
          };
        }),
      };
    });
  };

  const addVariantImages = (variantIndex, files) => {
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) return;
    updateVariantImageGroup(
      variantIndex,
      (existingImages, primaryImageIndex) => {
        const images = [
          ...existingImages,
          ...selectedFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            imageUrl: "",
            imageBase64: null,
          })),
        ];
        return {
          images,
          primaryImageIndex: existingImages.length ? primaryImageIndex : 0,
        };
      },
    );
  };

  const removeVariantImage = (variantIndex, imageIndex) => {
    updateVariantImageGroup(variantIndex, (existingImages, primaryIndex) => {
      const images = existingImages.filter((_, index) => index !== imageIndex);
      const nextPrimaryIndex =
        images.length === 0
          ? 0
          : primaryIndex === imageIndex
            ? 0
            : primaryIndex > imageIndex
              ? primaryIndex - 1
              : primaryIndex;
      return { images, primaryImageIndex: nextPrimaryIndex };
    });
  };

  const setPrimaryVariantImage = (variantIndex, imageIndex) => {
    updateVariantImageGroup(variantIndex, (images) => ({
      images,
      primaryImageIndex: imageIndex,
    }));
  };

  const handleProductSubmit = () => {
    setFormMessage("");
    setFormMessageSeverity("warning");
    const missingFields = [];
    [
      ["name", "Product name"],
      ["sku", "SKU"],
      ["brand", "Brand"],
      ["description", "Description"],
      // ["categoryId", "Category"],
    ].forEach(([field, label]) => {
      if (!String(selectedProduct[field] ?? "").trim())
        missingFields.push(label);
    });
    [
      ["price", "Price", true],
      ["mrp", "MRP", true],
      ["comparePrice", "Compare at price", true],
      ["quantityInStock", "Quantity in stock", false],
    ].forEach(([field, label, positive]) => {
      const value = Number(selectedProduct[field]);
      if (
        selectedProduct[field] === "" ||
        !Number.isFinite(value) ||
        (positive ? value <= 0 : value < 0)
      ) {
        missingFields.push(label);
      }
    });
    if (!["Y", "N", true, false].includes(selectedProduct.isActive)) {
      missingFields.push("Product status");
    }
    if (missingFields.length) {
      setFormMessageSeverity("warning");
      setFormMessage(
        `Complete these fields with valid values: ${[
          ...new Set(missingFields),
        ].join(", ")}.`,
      );
      return;
    }

    const variants = selectedProduct.variants || [];
    if (variants.length && !variantOptionsLoaded) {
      setFormMessage(
        "Loading merchant variant options. Please try saving again shortly.",
      );
      return;
    }
    const variantKeys = variants.map((variant) =>
      JSON.stringify(
        ["color", "size", "material"].map((key) => variant[key] ?? null),
      ),
    );
    const invalidVariant = variants.some(
      (variant) =>
        (!variant.color && !variant.size && !variant.material) ||
        (!variantOptionsError &&
          variant.color &&
          !variantOptions.colors.includes(variant.color)) ||
        (!variantOptionsError &&
          variant.size &&
          !variantOptions.sizes.includes(variant.size)) ||
        (variant.material &&
          !variantOptionsError &&
          !variantOptions.materials.includes(variant.material)) ||
        !Number.isFinite(Number(variant.price)) ||
        Number(variant.price) <= 0 ||
        !Number.isFinite(Number(variant.stock)) ||
        Number(variant.stock) < 0 ||
        typeof variant.isActive !== "boolean",
    );
    if (invalidVariant || new Set(variantKeys).size !== variantKeys.length) {
      setFormMessage(
        "Review variants: use merchant-approved options, remove duplicate combinations, set prices above zero and non-negative stock, and select a status for every variant.",
      );
      return;
    }
    if (
      variants.some(
        (variant) =>
          variant.images?.some((image) => image.file) &&
          !getVariantImageGroupKey(variant),
      )
    ) {
      setFormMessage(
        "Variant images are not allowed for the selected attributes by merchant settings. Remove the images or check variant configuration.",
      );
      return;
    }

    const primaryIndex = getPrimaryIndex(selectedProduct.images || []);
    const variantImageFiles = new Map();
    const productPayload = {
      ...selectedProduct,
      variantColors: undefined,
      variantSizes: undefined,
      variantMaterials: undefined,
      imageBase64: undefined,
      imageFile: undefined,
      imageUrl: undefined,
      imageUrls: undefined,
      price: Number(selectedProduct.price),
      mrp: Number(selectedProduct.mrp),
      comparePrice: Number(selectedProduct.comparePrice),
      quantityInStock: Number(selectedProduct.quantityInStock),
      variants: variants.map((variant, variantIndex) => {
        const groupKey = getVariantImageGroupKey(variant);
        const primaryGroupIndex = groupKey
          ? variants.findIndex(
              (candidate) => getVariantImageGroupKey(candidate) === groupKey,
            )
          : -1;
        const variantImages =
          primaryGroupIndex === variantIndex && groupKey
            ? Array.isArray(variant.images)
              ? variant.images
              : []
            : [];
        const files = variantImages.filter((image) => image.file);
        if (files.length) variantImageFiles.set(variantIndex, files);
        const primaryImageIndex =
          variant.primaryImageIndex >= 0 &&
          variant.primaryImageIndex < variantImages.length
            ? variant.primaryImageIndex
            : variantImages.length
              ? 0
              : null;
        let imageIndexInMultipart = 0;
        return {
          ...variant,
          price: Number(variant.price),
          stock: Number(variant.stock),
          isActive: variant.isActive === true,
          primaryImageIndex,
          images: variantImages.map((image, imageIndex) => {
            const multipartIndex = image.file ? imageIndexInMultipart++ : null;
            const isPrimary = imageIndex === primaryImageIndex;
            return {
              id: image.id ?? null,
              imageUrl: image.imageUrl
                ? normalizeImageUrl(image.imageUrl)
                : null,
              imageBase64: image.imageBase64 || null,
              fileName: image.file?.name || image.fileName || null,
              displayOrder: imageIndex,
              imageIndex: multipartIndex,
              primaryImage: isPrimary,
              isPrimary,
            };
          }),
          imageFile: undefined,
          imageFiles: undefined,
          imagePreview: undefined,
          imagePreviews: undefined,
          imageUrl: undefined,
          imageBase64: undefined,
          imageUrls: undefined,
        };
      }),
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

    variantImageFiles.forEach((files, variantIndex) => {
      files.forEach((image) => {
        formData.append(`variantImages[${variantIndex}]`, image.file);
      });
    });

    const apiCall =
      dialogMode === "add"
        ? axios.post("/products/create", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          })
        : axios.put(`/products/${selectedProduct.id}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

    setSavingProduct(true);
    apiCall
      .then(() => {
        setSnackbar({
          open: true,
          message:
            dialogMode === "add"
              ? "Product added successfully."
              : "Product updated successfully.",
          severity: "success",
        });
        setFormMessage("");
        setProductDialogOpen(false);
        fetchProducts();
      })
      .catch((err) => {
        setFormMessageSeverity("error");
        setFormMessage(
          err.response?.data?.error ||
            "Failed to save the product. Check the fields and try again.",
        );
        console.error(err);
      })
      .finally(() => {
        setSavingProduct(false);
      });
  };

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchProduct.toLowerCase()),
  );

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    axios
      .get("/products/productvariant")
      .then((response) => {
        // Expected response: { colors: [], sizes: [], materials: [], imageUploadAllowedVariant: [] }
        const data = response.data?.result || response.data || {};
        const colors = Array.isArray(data.colors) ? data.colors : [];
        const sizes = Array.isArray(data.sizes) ? data.sizes : [];
        const materials = Array.isArray(data.materials) ? data.materials : [];
        setVariantOptions({
          colors,
          sizes,
          materials,
          imageUploadAllowedVariant: Array.isArray(
            data.imageUploadAllowedVariant,
          )
            ? data.imageUploadAllowedVariant
            : [],
        });
        if (!colors.length && !sizes.length && !materials.length) {
          setVariantOptionsError(
            "The merchant variant endpoint returned no color, size, or material options.",
          );
        }
        setVariantOptionsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to fetch variant options", err);
        setVariantOptionsError(
          "Merchant variant options could not be loaded. Refresh this page before generating variants.",
        );
        setVariantOptionsLoaded(true);
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

  const normalizeProductVariants = (product = {}) => {
    const normalizedVariants = (Array.isArray(product.variants)
      ? product.variants
      : []
    ).map((variant) => {
      const rawImages = Array.isArray(variant.images)
        ? variant.images
        : Array.isArray(variant.imageUrls)
          ? variant.imageUrls.map((imageUrl) => ({ imageUrl }))
          : [
              ...(variant.imageUrl ? [{ imageUrl: variant.imageUrl }] : []),
              ...(variant.imageBase64
                ? [{ imageBase64: variant.imageBase64 }]
                : []),
            ];
      const variantImages = rawImages
        .map((image) => {
          const normalizedImage =
            typeof image === "string" ? { imageUrl: image } : image || {};
          return {
            ...normalizedImage,
            imageUrl: normalizedImage.imageUrl
              ? normalizeImageUrl(normalizedImage.imageUrl)
              : "",
            preview:
              normalizedImage.preview ||
              normalizeImageUrl(normalizedImage.imageUrl || "") ||
              (normalizedImage.imageBase64
                ? `data:image/jpeg;base64,${normalizedImage.imageBase64}`
                : ""),
            file: null,
          };
        })
        .filter(
          (image) => image.imageUrl || image.imageBase64 || image.preview,
        );
      const primaryImageIndex = variantImages.findIndex(
        (image) => image.primaryImage === true || image.isPrimary === true,
      );
      return {
        ...variant,
        isActive:
          variant.isActive === false ||
          variant.isActive === "N" ||
          variant.isActive === 0
            ? false
            : true,
        images: variantImages,
        primaryImageIndex:
          primaryImageIndex >= 0
            ? primaryImageIndex
            : Number.isInteger(variant.primaryImageIndex) &&
                variant.primaryImageIndex >= 0 &&
                variant.primaryImageIndex < variantImages.length
              ? variant.primaryImageIndex
              : 0,
      };
    });
    const groupedImages = new Map();
    normalizedVariants.forEach((variant) => {
      const groupKey = getVariantImageGroupKey(variant);
      if (!groupKey || !variant.images.length) return;
      const groupImages = groupedImages.get(groupKey) || [];
      variant.images.forEach((image) => {
        const imageKey =
          image.id ??
          image.imageUrl ??
          image.imageBase64 ??
          image.fileName ??
          image.preview;
        if (
          !groupImages.some(
            (existingImage) =>
              (existingImage.id ??
                existingImage.imageUrl ??
                existingImage.imageBase64 ??
                existingImage.fileName ??
                existingImage.preview) === imageKey,
          )
        ) {
          groupImages.push(image);
        }
      });
      groupedImages.set(groupKey, groupImages);
    });
    const assignedGroups = new Set();
    return normalizedVariants.map((variant) => {
      const groupKey = getVariantImageGroupKey(variant);
      if (!groupKey) return { ...variant, images: [], primaryImageIndex: 0 };
      if (assignedGroups.has(groupKey)) {
        return { ...variant, images: [], primaryImageIndex: 0 };
      }
      assignedGroups.add(groupKey);
      const images = groupedImages.get(groupKey) || [];
      const primaryImageIndex = images.findIndex(
        (image) => image.primaryImage === true || image.isPrimary === true,
      );
      return {
        ...variant,
        images,
        primaryImageIndex: primaryImageIndex >= 0 ? primaryImageIndex : 0,
      };
    });
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
      maxWidth={false}
      sx={{
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2, lg: 3 },
        maxWidth: "1600px !important",
        minHeight: "calc(100vh - 80px)",
        bgcolor: "#f5f7fb",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1.5,
        }}
      >
        <IconButton
          onClick={() => navigate(`/store/${slug}/admin-dashboard`)}
          size="small"
          sx={{
            bgcolor: "#fff",
            border: "1px solid #e2e8f0",
            "&:hover": { bgcolor: "#f8fafc" },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontSize: { xs: "1.1rem", sm: "1.35rem" },
              fontWeight: 800,
              lineHeight: 1.2,
              color: "#172033",
            }}
          >
            Product management
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Manage catalog details, inventory, images, and variants
          </Typography>
        </Box>
      </Box>

      {/* Controls */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1, sm: 1.25 },
          mb: 1.25,
          border: "1px solid #e5eaf2",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
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
            size="small"
            sx={{
              flexGrow: 1,
              minWidth: { xs: "100%", sm: 250 },
              "& .MuiInputBase-root": { fontSize: "0.85rem" },
            }}
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
                isActive: "Y",
                variants: [],
                variantColors: [],
                variantSizes: [],
                variantMaterials: [],
                imageBase64: null,
                imageFile: null,
                images: [],
                primaryImageIndex: 0,
              });
              setProductDialogOpen(true);
            }}
            size="small"
            sx={{
              minHeight: { xs: 38, sm: 40 },
              px: 1.5,
              fontSize: "0.82rem",
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            Add product
          </Button>
        </Box>
      </Paper>

      {/* Products Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #e5eaf2",
          borderRadius: 2,
          overflowX: "auto",
          "& .MuiTableCell-root": {
            px: { xs: 1, sm: 1.5 },
            py: { xs: 0.75, sm: 1 },
            fontSize: { xs: "0.72rem", sm: "0.8rem" },
            whiteSpace: "nowrap",
          },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Product</strong>
              </TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                <strong>Category / Brand</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Price</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Stock</strong>
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
                <TableRow
                  key={product.id}
                  hover
                  sx={{ "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell sx={{ maxWidth: { xs: 160, sm: 260 } }}>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: { xs: "0.76rem", sm: "0.84rem" },
                        fontWeight: 700,
                        maxWidth: { xs: 150, sm: 260 },
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      #{product.id} · {product.sku || "No SKU"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    <Typography sx={{ fontSize: "0.78rem" }}>
                      {getCategoryName(product.categoryId)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {product.brand || "No brand"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">₹{product.price}</TableCell>
                  <TableCell align="right">
                    {product.quantityInStock || 0}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        product.isActive === true || product.isActive === "Y"
                          ? "Active"
                          : "Inactive"
                      }
                      color={
                        product.isActive === true || product.isActive === "Y"
                          ? "success"
                          : "default"
                      }
                      size="small"
                      sx={{ height: 22, fontSize: "0.68rem" }}
                    />
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
                          variants: normalizeProductVariants(product),
                          images: normalizeProductImages(product),
                          primaryImageIndex:
                            product.primaryImageIndex ??
                            getPrimaryIndex(normalizeProductImages(product)),
                        });
                        setProductDialogOpen(true);
                      }}
                      sx={{
                        mr: 0.5,
                        minWidth: 0,
                        px: 0.75,
                        fontSize: "0.72rem",
                      }}
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
                          variantColors: [
                            ...new Set(
                              (product.variants || [])
                                .map((variant) => variant.color)
                                .filter(Boolean),
                            ),
                          ],
                          variantSizes: [
                            ...new Set(
                              (product.variants || [])
                                .map((variant) => variant.size)
                                .filter(Boolean),
                            ),
                          ],
                          variantMaterials: [
                            ...new Set(
                              (product.variants || [])
                                .map((variant) => variant.material)
                                .filter(Boolean),
                            ),
                          ],
                          variants: normalizeProductVariants(product),
                          images: normalizeProductImages(product),
                          primaryImageIndex:
                            product.primaryImageIndex ??
                            getPrimaryIndex(normalizeProductImages(product)),
                        });
                        setProductDialogOpen(true);
                      }}
                      sx={{
                        mr: 0.5,
                        minWidth: 0,
                        px: 0.75,
                        fontSize: "0.72rem",
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      sx={{ minWidth: 0, px: 0.75, fontSize: "0.72rem" }}
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" color="text.secondary">
                    No products found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Product editor drawer */}
      <Drawer
        open={isProductDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 620, md: 800, lg: 900 },
              maxWidth: "100vw",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              bgcolor: "#f7f9fc",
            },
          },
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 3,
            px: { xs: 1.5, sm: 2.5 },
            py: { xs: 1.25, sm: 1.75 },
            bgcolor: "#fff",
            borderBottom: "1px solid #e4e9f1",
            boxShadow: "0 2px 8px rgba(15,23,42,.04)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: "1rem", sm: "1.15rem" },
                  fontWeight: 800,
                  color: "#172033",
                }}
              >
                {dialogMode === "add"
                  ? "Add product"
                  : dialogMode === "update"
                    ? "Edit product"
                    : "Product details"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedProduct?.name || "Complete the details and save"}
              </Typography>
            </Box>
            <IconButton
              size="small"
              aria-label="Close product editor"
              onClick={() => setProductDialogOpen(false)}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        {formMessage && (
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              px: { xs: 1.25, sm: 2 },
              pt: 1,
              bgcolor: "#f7f9fc",
            }}
          >
            <Alert
              severity={formMessageSeverity}
              onClose={() => setFormMessage("")}
              sx={{
                py: 0.35,
                alignItems: "center",
                "& .MuiAlert-message": { fontSize: "0.8rem", py: 0.35 },
              }}
            >
              {formMessage}
            </Alert>
          </Box>
        )}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            px: { xs: 1.25, sm: 2.5 },
            py: { xs: 1.25, sm: 2 },
            "& .MuiTextField-root .MuiInputBase-root": {
              fontSize: { xs: "0.82rem", sm: "0.86rem" },
            },
            "& .MuiFormControl-root .MuiInputBase-root": {
              fontSize: { xs: "0.82rem", sm: "0.86rem" },
            },
          }}
        >
          {dialogMode !== "view" && (
            <Alert severity="info" sx={{ mb: 1.5 }}>
              Add the product details first, then choose merchant-approved
              variant options. Required fields are marked with an asterisk;
              price and MRP must be above zero and stock may be zero or higher.
            </Alert>
          )}
          {/* --- Main Product Fields --- */}
          <Box
            sx={{
              p: { xs: 1.25, sm: 1.75 },
              border: "1px solid #e3e8f0",
              borderRadius: 2,
              bgcolor: "#fff",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ mb: 1.25, fontWeight: 750, color: "#26354d" }}
            >
              Product information
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: { xs: 1.25, sm: 1.75 },
              }}
            >
              <TextField
                label="Product Name *"
                fullWidth
                variant="outlined"
                value={selectedProduct?.name || ""}
                disabled={dialogMode === "view"}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    name: e.target.value,
                  })
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
                  setSelectedProduct({
                    ...selectedProduct,
                    mrp: e.target.value,
                  })
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
                  setSelectedProduct({
                    ...selectedProduct,
                    sku: e.target.value,
                  })
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
              sx={{ mt: { xs: 1.5, sm: 2.5 } }}
              size="small"
            />
          </Box>

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

          <Box
            sx={{
              mt: 1.75,
              p: { xs: 1.25, sm: 1.75 },
              border: "1px solid #e3e8f0",
              borderRadius: 2,
              bgcolor: "#fff",
            }}
          >
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
          <Box
            sx={{
              mt: 1.75,
              p: { xs: 1.25, sm: 1.75 },
              border: "1px solid #e3e8f0",
              borderRadius: 2,
              bgcolor: "#fff",
            }}
          >
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
                {variantOptionsError ? (
                  <Alert severity="error" sx={{ mb: 1.5 }}>
                    {variantOptionsError}
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    Select the available options to create combinations. Images
                    can only be uploaded for{" "}
                    {getVariantAllowedFields(
                      variantOptions.imageUploadAllowedVariant,
                    )
                      .map((field) => field[0].toUpperCase() + field.slice(1))
                      .join(" and ") || "no variant attributes"}{" "}
                    according to merchant settings. Images are shared across
                    matching sizes when size is not image-enabled.
                  </Alert>
                )}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      lg: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <FormControl fullWidth size="small">
                    <InputLabel id="variant-colors-label">Colors</InputLabel>
                    <Select
                      labelId="variant-colors-label"
                      label="Colors"
                      multiple
                      value={selectedProduct.variantColors || []}
                      disabled={dialogMode === "view"}
                      onChange={(event) =>
                        setSelectedProduct((previous) => ({
                          ...previous,
                          variantColors: event.target.value,
                        }))
                      }
                      renderValue={(selected) => selected.join(", ")}
                    >
                      {variantOptions.colors.map((color) => (
                        <MenuItem key={color} value={color}>
                          <Checkbox
                            checked={(
                              selectedProduct.variantColors || []
                            ).includes(color)}
                          />
                          <ListItemText primary={color} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel id="variant-sizes-label">Sizes</InputLabel>
                    <Select
                      labelId="variant-sizes-label"
                      label="Sizes"
                      multiple
                      value={selectedProduct.variantSizes || []}
                      disabled={dialogMode === "view"}
                      onChange={(event) =>
                        setSelectedProduct((previous) => ({
                          ...previous,
                          variantSizes: event.target.value,
                        }))
                      }
                      renderValue={(selected) => selected.join(", ")}
                    >
                      {variantOptions.sizes.map((size) => (
                        <MenuItem key={size} value={size}>
                          <Checkbox
                            checked={(
                              selectedProduct.variantSizes || []
                            ).includes(size)}
                          />
                          <ListItemText primary={size} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel id="variant-materials-label">
                      Materials
                    </InputLabel>
                    <Select
                      labelId="variant-materials-label"
                      label="Materials"
                      multiple
                      value={selectedProduct.variantMaterials || []}
                      disabled={dialogMode === "view"}
                      onChange={(event) =>
                        setSelectedProduct((previous) => ({
                          ...previous,
                          variantMaterials: event.target.value,
                        }))
                      }
                      renderValue={(selected) => selected.join(", ")}
                    >
                      {variantOptions.materials.map((material) => (
                        <MenuItem key={material} value={material}>
                          <Checkbox
                            checked={(
                              selectedProduct.variantMaterials || []
                            ).includes(material)}
                          />
                          <ListItemText primary={material} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={
                      dialogMode === "view" ||
                      Boolean(variantOptionsError) ||
                      !variantOptionsLoaded ||
                      (!selectedProduct.variantColors?.length &&
                        !selectedProduct.variantSizes?.length &&
                        !selectedProduct.variantMaterials?.length)
                    }
                    onClick={() => {
                      const previousVariants = selectedProduct.variants || [];
                      const colors = selectedProduct.variantColors?.length
                        ? selectedProduct.variantColors
                        : [null];
                      const sizes = selectedProduct.variantSizes?.length
                        ? selectedProduct.variantSizes
                        : [null];
                      const materials = selectedProduct.variantMaterials?.length
                        ? selectedProduct.variantMaterials
                        : [null];
                      const variants = colors.flatMap((color) =>
                        materials.flatMap((material) =>
                          sizes
                            .map((size) => {
                              if (!color && !material && !size) return null;
                              const existing = previousVariants.find(
                                (variant) =>
                                  (variant.color || null) === color &&
                                  (variant.material || null) === material &&
                                  (variant.size || null) === size,
                              );
                              return (
                                existing || {
                                  ...(color ? { color } : {}),
                                  ...(material ? { material } : {}),
                                  ...(size ? { size } : {}),
                                  price: Number(selectedProduct.price) || "",
                                  stock:
                                    Number(selectedProduct.quantityInStock) ||
                                    0,
                                  isActive: true,
                                  images: [],
                                  primaryImageIndex: 0,
                                }
                              );
                            })
                            .filter(Boolean),
                        ),
                      );
                      setSelectedProduct((previous) => ({
                        ...previous,
                        variants,
                      }));
                      setFormMessage("");
                    }}
                  >
                    Generate Variants
                  </Button>
                  {(selectedProduct.variants || []).length > 0 &&
                    dialogMode !== "view" && (
                      <Button
                        color="error"
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          setSelectedProduct((previous) => ({
                            ...previous,
                            variants: [],
                          }))
                        }
                      >
                        Remove all variants
                      </Button>
                    )}
                </Box>
                <Box sx={{ display: "grid", gap: 1 }}>
                  {(selectedProduct.variants || []).map((variant, index) => (
                    <Box
                      key={`${variant.color || ""}-${variant.material || ""}-${variant.size || ""}`}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "minmax(0, 1fr) auto",
                          sm: "repeat(2, minmax(0, 1fr)) auto",
                        },
                        alignItems: "center",
                        gap: 1,
                        border: "1px solid #ddd",
                        borderRadius: 2,
                        p: { xs: 1, sm: 1.5 },
                      }}
                    >
                      <Typography
                        sx={{
                          gridColumn: "1 / -1",
                          fontWeight: 700,
                          fontSize: { xs: "0.85rem", sm: "0.95rem" },
                          overflowWrap: "anywhere",
                        }}
                      >
                        {[variant.color, variant.material, variant.size]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                      <TextField
                        label="Price"
                        type="number"
                        size="small"
                        fullWidth
                        value={variant.price ?? ""}
                        disabled={dialogMode === "view"}
                        inputProps={{ min: 0.01, step: "0.01" }}
                        onChange={(event) =>
                          setSelectedProduct((previous) => ({
                            ...previous,
                            variants: previous.variants.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, price: event.target.value }
                                  : item,
                            ),
                          }))
                        }
                      />
                      <TextField
                        label="Stock"
                        type="number"
                        size="small"
                        fullWidth
                        value={variant.stock ?? ""}
                        disabled={dialogMode === "view"}
                        inputProps={{ min: 0, step: 1 }}
                        onChange={(event) =>
                          setSelectedProduct((previous) => ({
                            ...previous,
                            variants: previous.variants.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, stock: event.target.value }
                                  : item,
                            ),
                          }))
                        }
                      />
                      <FormControlLabel
                        sx={{
                          m: 0,
                          gridColumn: { xs: "1 / -1", sm: "1 / 2" },
                        }}
                        control={
                          <Switch
                            size="small"
                            checked={variant.isActive !== false}
                            disabled={dialogMode === "view"}
                            onChange={(event) =>
                              setSelectedProduct((previous) => ({
                                ...previous,
                                variants: previous.variants.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          isActive: event.target.checked,
                                        }
                                      : item,
                                ),
                              }))
                            }
                          />
                        }
                        label={
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.8rem" }}
                          >
                            {variant.isActive === false ? "Inactive" : "Active"}
                          </Typography>
                        }
                      />
                      <Box
                        sx={{
                          gridColumn: "1 / -1",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                          minWidth: 0,
                        }}
                      >
                        {(variant.images || []).map((image, imageIndex) => {
                          const imageSrc =
                            image.preview ||
                            (image.imageUrl
                              ? normalizeImageUrl(image.imageUrl)
                              : "") ||
                            (image.imageBase64
                              ? `data:image/jpeg;base64,${image.imageBase64}`
                              : "");
                          if (!imageSrc) return null;
                          const isPrimary =
                            imageIndex === variant.primaryImageIndex;
                          return (
                            <Box
                              key={`${index}-${image.id || imageIndex}`}
                              sx={{
                                position: "relative",
                                p: 0.4,
                                border: isPrimary
                                  ? "2px solid"
                                  : "1px solid #d8dee8",
                                borderColor: isPrimary
                                  ? "primary.main"
                                  : "#d8dee8",
                                borderRadius: 1.5,
                                bgcolor: "#fff",
                              }}
                            >
                              <Avatar
                                variant="rounded"
                                src={imageSrc}
                                alt={`${variant.color || ""} ${variant.material || ""} variant image ${imageIndex + 1}`}
                                sx={{
                                  width: { xs: 56, sm: 64 },
                                  height: { xs: 56, sm: 64 },
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  maxWidth: 64,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  fontSize: "0.62rem",
                                  textAlign: "center",
                                }}
                              >
                                {isPrimary ? "Primary" : "Image"}
                              </Typography>
                              {dialogMode !== "view" && (
                                <>
                                  <IconButton
                                    size="small"
                                    aria-label="Set this as primary variant image"
                                    onClick={() =>
                                      setPrimaryVariantImage(index, imageIndex)
                                    }
                                    sx={{
                                      position: "absolute",
                                      top: 1,
                                      left: 1,
                                      width: 20,
                                      height: 20,
                                      bgcolor: "rgba(255,255,255,.92)",
                                      fontSize: 12,
                                    }}
                                  >
                                    {isPrimary ? "★" : "☆"}
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    aria-label="Remove variant image"
                                    onClick={() =>
                                      removeVariantImage(index, imageIndex)
                                    }
                                    sx={{
                                      position: "absolute",
                                      top: 1,
                                      right: 1,
                                      width: 20,
                                      height: 20,
                                      bgcolor: "rgba(255,255,255,.92)",
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          );
                        })}
                        {dialogMode !== "view" &&
                          Boolean(getVariantImageGroupKey(variant)) &&
                          selectedProduct.variants.findIndex(
                            (candidate) =>
                              getVariantImageGroupKey(candidate) ===
                              getVariantImageGroupKey(variant),
                          ) === index && (
                            <Button
                              component="label"
                              variant="outlined"
                              size="small"
                              sx={{
                                minHeight: 40,
                                fontSize: { xs: "0.72rem", sm: "0.8rem" },
                              }}
                            >
                              Add / edit images
                              <input
                                hidden
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(event) => {
                                  addVariantImages(index, event.target.files);
                                  event.target.value = "";
                                }}
                              />
                            </Button>
                          )}
                        {dialogMode !== "view" &&
                          (variant.images || []).length > 0 &&
                          !getVariantImageGroupKey(variant) && (
                            <Alert severity="warning" sx={{ py: 0 }}>
                              Image upload is disabled for this variant by
                              merchant settings.
                            </Alert>
                          )}
                        {dialogMode !== "view" && (
                          <IconButton
                            aria-label={`Remove ${variant.color || ""} ${variant.material || ""} ${variant.size || ""} variant`}
                            color="error"
                            size="small"
                            onClick={() =>
                              setSelectedProduct((previous) => ({
                                ...previous,
                                variants: previous.variants.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              }))
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  ))}
                  {!selectedProduct.variants?.length && (
                    <Typography variant="body2" color="text.secondary">
                      No variants added yet.
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>

        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            zIndex: 3,
            display: "flex",
            justifyContent: "flex-end",
            gap: 0.75,
            p: { xs: 1, sm: 1.5 },
            bgcolor: "#fff",
            borderTop: "1px solid #e4e9f1",
            boxShadow: "0 -2px 8px rgba(15,23,42,.04)",
          }}
        >
          <Button
            onClick={() => setProductDialogOpen(false)}
            color="inherit"
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          {(dialogMode === "add" || dialogMode === "update") && (
            <Button
              onClick={handleProductSubmit}
              variant="contained"
              disabled={savingProduct}
              size={isMobile ? "small" : "medium"}
            >
              {savingProduct
                ? "Saving..."
                : dialogMode === "add"
                  ? "Add Product"
                  : "Update Product"}
            </Button>
          )}
        </Box>
      </Drawer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() =>
          setSnackbar((previous) => ({ ...previous, open: false }))
        }
        anchorOrigin={{
          vertical: isMobile ? "bottom" : "top",
          horizontal: "center",
        }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar((previous) => ({ ...previous, open: false }))
          }
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductManagement;
