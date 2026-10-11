import React, { useEffect, useRef, useState } from "react";
import {
  Container,
  Grid,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Box,
  Divider,
  Rating,
  Card,
  CardContent,
  CardMedia,
  Modal,
  IconButton,
  TextField,
  Drawer,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/AxiosInstance";

const NON_VARIANT_ATTRIBUTE_KEYS = new Set([
  "id",
  "variantid",
  "productid",
  "merchantid",
  "sku",
  "price",
  "mrp",
  "compareprice",
  "stock",
  "quantity",
  "quantityinstock",
  "image",
  "imageurl",
  "variantimageurl",
  "imagebase64",
  "images",
  "imageurls",
  "imageindex",
  "selectionkey",
  "selectionlabel",
  "displayorder",
  "primaryimage",
  "isprimary",
  "createdat",
  "updatedat",
]);

const getVariantAttributes = (variant) =>
  Object.entries(variant || {}).filter(([key, value]) => {
    const normalizedKey = key.replace(/[_\s-]/g, "").toLowerCase();
    return (
      !NON_VARIANT_ATTRIBUTE_KEYS.has(normalizedKey) &&
      (typeof value === "string" || typeof value === "number") &&
      String(value).trim() !== ""
    );
  });

const formatVariantAttribute = (key) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

const ProductPage = () => {
  const { id, slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [storeName, setStoreName] = useState(slug);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState({});
  const [recommended, setRecommended] = useState([]);
  // reviews pagination
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
  const [reviewsTotalElements, setReviewsTotalElements] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [productDetailsDrawerOpen, setProductDetailsDrawerOpen] =
    useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageTouchStartX = useRef(null);
  // Review image modal state
  const [reviewImageModalOpen, setReviewImageModalOpen] = useState(false);
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewImageIndex, setReviewImageIndex] = useState(0);
  // review form state
  const [ratingInput, setRatingInput] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewFiles, setReviewFiles] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  // review drawer state
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  // merchant review allowance flag
  const [reviewsAllowed, setReviewsAllowed] = useState(false);

  const reviewFlagEnabled = (value) => {
    if (value === null || value === undefined || value === "") return false;
    return (
      value === true ||
      value === "true" ||
      value === "TRUE" ||
      value === "Y" ||
      value === "y" ||
      value === 1
    );
  };

  useEffect(() => {
    if (!slug) return;

    const loadMerchantReviewFlag = async () => {
      try {
        const response = await axios.get(`/api/merchants/by-slug/`);
        const merchant = response.data?.result || response.data || {};
        setStoreName(
          merchant.businessName || merchant.storeName || merchant.name || slug,
        );
        const isReviewsAllowed =
          reviewFlagEnabled(merchant?.reviewsAllowed) ||
          reviewFlagEnabled(merchant?.allowReviews) ||
          reviewFlagEnabled(merchant?.reviewEnabled) ||
          reviewFlagEnabled(merchant?.merchantReviewAllowed);

        setReviewsAllowed(isReviewsAllowed);

        if (isReviewsAllowed) {
          fetchReviews(0, 6, true);
        } else {
          setReviewsList([]);
          setReviewsTotalElements(0);
          setReviewsTotalPages(0);
          setReviewsPage(0);
        }
      } catch (error) {
        try {
          const fallbackResponse = await axios.get(`/api/merchants/by-slug`);
          const merchant =
            fallbackResponse.data?.result || fallbackResponse.data || {};
          setStoreName(
            merchant.businessName ||
              merchant.storeName ||
              merchant.name ||
              slug,
          );
          const isReviewsAllowed =
            reviewFlagEnabled(merchant?.reviewsAllowed) ||
            reviewFlagEnabled(merchant?.allowReviews) ||
            reviewFlagEnabled(merchant?.reviewEnabled) ||
            reviewFlagEnabled(merchant?.merchantReviewAllowed);

          setReviewsAllowed(isReviewsAllowed);

          if (isReviewsAllowed) {
            fetchReviews(0, 6, true);
          } else {
            setReviewsList([]);
            setReviewsTotalElements(0);
            setReviewsTotalPages(0);
            setReviewsPage(0);
          }
        } catch {
          console.error("Failed to fetch merchant review flag");
          setStoreName(slug);
          setReviewsAllowed(false);
        }
      }
    };

    loadMerchantReviewFlag();
  }, [slug]);

  useEffect(() => {
    if (!id) return;

    axios
      .get(`/products/${id}/with-rating`)
      .then((response) => {
        // Expected product response includes variants: [{ color, size, price, stock, imageUrl }].
        const prod = response.data;
        setProduct(prod);
        setCurrentImageIndex(0);
        const variants = Array.isArray(prod.variants) ? prod.variants : [];
        setSelectedVariantOptions(
          variants.length === 1
            ? Object.fromEntries(getVariantAttributes(variants[0]))
            : {},
        );

        axios
          .get(`/products/category/${prod.categoryId}`)
          .then((res) => {
            const filtered = res.data.filter((p) => p.id !== prod.id);
            setRecommended(filtered.slice(0, 6));
          })
          .catch((err) => console.error(err));
      })
      .catch((error) => {
        console.error("Failed to fetch product with rating", error);
        setSnackbar({
          open: true,
          message: "Failed to load product.",
          severity: "error",
        });
      });
  }, [id]);

  // fetch paginated reviews
  const fetchReviews = (page = 0, size = 6, force = false) => {
    if (!id) return;
    if (!force && !reviewsAllowed) return;

    axios
      .get(`/api/reviews/products/${id}?page=${page}&size=${size}`)
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data.reviews) ? data.reviews : [];
        if (page === 0) setReviewsList(list);
        else setReviewsList((prev) => [...prev, ...list]);

        setReviewsPage(data.currentPage ?? page);
        setReviewsTotalPages(data.totalPages ?? 0);
        setReviewsTotalElements(
          data.totalElements ?? (data.reviews ? data.reviews.length : 0),
        );
      })
      .catch((err) => console.error("Failed to fetch reviews", err));
  };

  const verifyPurchaseForReview = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return { allowed: false, reason: "not_authenticated" };

    try {
      const res = await axios.get(`/orders/my`);
      const orders = Array.isArray(res.data) ? res.data : [];

      const hasDelivered = orders.some((order) => {
        const status = (order.status || "").toString().toUpperCase();
        const delivered =
          status.includes("DELIVERED") ||
          status.includes("DELIVER") ||
          status.includes("COMPLETED");
        if (!delivered) return false;

        return (
          Array.isArray(order.items) &&
          order.items.some((it) => Number(it.productId) === Number(id))
        );
      });

      return {
        allowed: hasDelivered,
        reason: hasDelivered ? "ok" : "no_delivered_order",
      };
    } catch (err) {
      console.error("Failed to verify purchase", err);
      return { allowed: false, reason: "error" };
    }
  };

  const handleFilesChange = (files) => {
    const arr = Array.from(files || []);
    setReviewFiles(arr);
  };

  const submitReview = async () => {
    if (submittingReview) return;
    if (!ratingInput || !reviewContent.trim()) {
      setSnackbar({
        open: true,
        message: "Please provide rating and review text.",
        severity: "warning",
      });
      return;
    }

    const verify = await verifyPurchaseForReview();
    if (!verify.allowed) {
      if (verify.reason === "not_authenticated") {
        setSnackbar({
          open: true,
          message: "Please login to submit a review.",
          severity: "warning",
        });
      } else if (verify.reason === "no_delivered_order") {
        setSnackbar({
          open: true,
          message: "You can only review products you purchased and received.",
          severity: "error",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Unable to verify purchase. Try again later.",
          severity: "error",
        });
      }
      return;
    }

    try {
      setSubmittingReview(true);

      const form = new FormData();
      form.append("productId", id);
      form.append("rating", String(ratingInput));
      form.append("content", reviewContent || "");

      reviewFiles.forEach((file) => {
        form.append("photos", file);
      });

      await axios.post(`/api/reviews/products/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSnackbar({
        open: true,
        message: "Review submitted.",
        severity: "success",
      });
      // refresh reviews and product rating
      fetchReviews(0);
      axios
        .get(`/products/${id}/with-rating`)
        .then((r) => setProduct(r.data))
        .catch(() => {});

      // reset form
      setRatingInput(0);
      setReviewContent("");
      setReviewFiles([]);
    } catch (err) {
      console.error("Failed to submit review", err);
      setSnackbar({
        open: true,
        message: "Failed to submit review.",
        severity: "error",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    try {
      const variants = Array.isArray(product.variants) ? product.variants : [];
      if (variants.length > 0 && !selectedVariant) {
        const missingOptions = variantAttributeKeys
          .filter(
            (key) =>
              selectedVariantOptions[key] === undefined ||
              selectedVariantOptions[key] === null ||
              selectedVariantOptions[key] === "",
          )
          .map(formatVariantAttribute);
        setSnackbar({
          open: true,
          message: missingOptions.length
            ? `Please select ${missingOptions.join(", ")}.`
            : "Please select a valid variant combination.",
          severity: "warning",
        });
        return;
      }
      if (
        (selectedVariant &&
          selectedVariant.stock != null &&
          Number(selectedVariant.stock) <= 0) ||
        (!selectedVariant &&
          product.quantityInStock != null &&
          Number(product.quantityInStock) <= 0)
      ) {
        setSnackbar({
          open: true,
          message: "This product variant is out of stock.",
          severity: "warning",
        });
        return;
      }

      const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
      const variantKey = selectedVariant
        ? JSON.stringify(
            Object.fromEntries(
              variantAttributeKeys.map((key) => [key, selectedVariant[key]]),
            ),
          )
        : "";
      const existingIndex = existingCart.findIndex((item) => {
        if (
          item.id !== product.id ||
          (item.storeSlug && item.storeSlug !== slug)
        )
          return false;
        const existingVariantKey =
          item.variant?.selectionKey ||
          (item.variant
            ? JSON.stringify(
                Object.fromEntries(
                  variantAttributeKeys
                    .filter(
                      (key) =>
                        item.variant[key] !== undefined &&
                        item.variant[key] !== null,
                    )
                    .map((key) => [key, item.variant[key]]),
                ),
              )
            : "");
        return existingVariantKey === variantKey;
      });
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
        setSnackbar({
          open: true,
          message: "The selected quantity is no longer available.",
          severity: "warning",
        });
        return;
      }

      const cartVariantImage =
        variantImages[0]?.imageUrl ||
        getVariantImage(selectedVariant) ||
        getDisplayImage(product);
      const updatedCart =
        existingIndex > -1
          ? existingCart.map((item, i) =>
              i === existingIndex
                ? {
                    ...item,
                    storeSlug: slug,
                    storeName:
                      storeName ||
                      product.businessName ||
                      product.storeName ||
                      slug,
                    merchantId:
                      product.merchantId ||
                      product.merchant?.id ||
                      item.merchantId,
                    image: cartVariantImage,
                    variant: item.variant
                      ? {
                          ...item.variant,
                          images: variantImages,
                          imageUrl:
                            variantImages[0]?.imageUrl ||
                            getVariantImage(selectedVariant),
                        }
                      : item.variant,
                    quantity: item.quantity + 1,
                  }
                : item,
            )
          : [
              ...existingCart,
              {
                id: product.id,
                storeSlug: slug,
                storeName:
                  storeName ||
                  product.businessName ||
                  product.storeName ||
                  slug,
                merchantId: product.merchantId || product.merchant?.id || null,
                name: product.name,
                image: cartVariantImage,
                description: product.description,
                price: selectedVariant?.price ?? product.price,
                comparePrice: product.comparePrice,
                ...(selectedVariant
                  ? {
                      variant: {
                        ...selectedVariant,
                        images: variantImages,
                        imageUrl:
                          variantImages[0]?.imageUrl ||
                          getVariantImage(selectedVariant),
                        selectionKey: variantKey,
                        selectionLabel: variantAttributeKeys
                          .map(
                            (key) =>
                              `${formatVariantAttribute(key)}: ${selectedVariant[key]}`,
                          )
                          .join(" · "),
                      },
                    }
                  : {}),
                quantity: 1,
              },
            ];

      localStorage.setItem("cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
      setSnackbar({
        open: true,
        message: "Added to cart!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to add to cart.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    const apiBase = (axios.defaults.baseURL || window.location.origin).replace(
      /\/+$/,
      "",
    );
    return `${apiBase}/${url.replace(/^\/+/, "")}`;
  };

  const getProductImages = (item) => {
    const rawImages = Array.isArray(item?.images) ? [...item.images] : [];

    if (
      !rawImages.length &&
      (item?.imageUrl || item?.image || item?.imageBase64)
    ) {
      rawImages.push({
        imageUrl: item.imageUrl || item.image || "",
        imageBase64: item.imageBase64 || null,
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
            index === (item?.primaryImageIndex ?? 0),
        };
      })
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  };

  const getPrimaryImageIndex = (images = []) => {
    const primaryIndex = images.findIndex(
      (image) => image?.primaryImage === true || image?.isPrimary === true,
    );
    return primaryIndex >= 0 ? primaryIndex : 0;
  };

  const getDisplayImage = (item, selectedIndex) => {
    const images = getProductImages(item);
    const index =
      selectedIndex !== undefined && selectedIndex !== null
        ? selectedIndex
        : getPrimaryImageIndex(images);
    const primaryImage = images[index] || images[0];

    if (primaryImage?.imageBase64) {
      return `data:image/jpeg;base64,${primaryImage.imageBase64}`;
    }
    if (primaryImage?.imageUrl) return primaryImage.imageUrl;
    if (primaryImage?.preview) return primaryImage.preview;
    if (item?.imageBase64) {
      return `data:image/jpeg;base64,${item.imageBase64}`;
    }
    if (item?.imageUrl) return normalizeImageUrl(item.imageUrl);

    return "https://via.placeholder.com/500";
  };

  const getVariantImage = (variant) => {
    return getVariantImages(variant)[0]?.imageUrl || "";
  };

  const getVariantImages = (variant) => {
    if (!variant) return [];
    const listFields = ["images", "imageUrls", "variantImages"];
    const rawImages = listFields.flatMap((field) =>
      Array.isArray(variant[field]) ? variant[field] : [],
    );
    const directImage =
      variant.image && typeof variant.image === "object"
        ? variant.image
        : {
            imageUrl:
              variant.imageUrl ||
              variant.variantImageUrl ||
              (typeof variant.image === "string" ? variant.image : ""),
            imageBase64: variant.imageBase64,
          };
    if (
      (variant.image && typeof variant.image === "object") ||
      directImage.imageUrl ||
      directImage.imageBase64
    ) {
      rawImages.unshift(directImage);
    }
    return rawImages
      .map((image, index) => {
        const rawUrl =
          typeof image === "string"
            ? image
            : image?.imageUrl ||
              image?.variantImageUrl ||
              image?.url ||
              image?.image ||
              image?.preview ||
              (image?.imageBase64
                ? `data:image/jpeg;base64,${image.imageBase64}`
                : "");
        return {
          ...(typeof image === "object" && image ? image : {}),
          imageUrl: rawUrl ? normalizeImageUrl(rawUrl) : "",
          displayOrder: image?.displayOrder ?? index,
          primaryImage:
            image?.primaryImage === true || image?.isPrimary === true,
        };
      })
      .filter((image) => Boolean(image.imageUrl))
      .sort((a, b) => {
        if (a.primaryImage !== b.primaryImage) {
          return a.primaryImage ? -1 : 1;
        }
        return a.displayOrder - b.displayOrder;
      })
      .filter(
        (image, index, images) =>
          images.findIndex(
            (candidate) => candidate.imageUrl === image.imageUrl,
          ) === index,
      );
  };

  const productImages = getProductImages(product);
  const productVariants = Array.isArray(product?.variants)
    ? product.variants
    : [];
  const variantAttributeKeys = [
    ...new Set(
      productVariants.flatMap((variant) =>
        getVariantAttributes(variant).map(([key]) => key),
      ),
    ),
  ].sort((a, b) => {
    const preferredOrder = ["color", "size", "material", "pattern", "gender"];
    const aOrder = preferredOrder.indexOf(a.toLowerCase());
    const bOrder = preferredOrder.indexOf(b.toLowerCase());
    if (aOrder >= 0 || bOrder >= 0) {
      return (
        (aOrder < 0 ? preferredOrder.length : aOrder) -
        (bOrder < 0 ? preferredOrder.length : bOrder)
      );
    }
    return a.localeCompare(b);
  });
  const matchingVariants = productVariants.filter((variant) =>
    Object.entries(selectedVariantOptions).every(
      ([key, value]) => String(variant[key]) === String(value),
    ),
  );
  const selectedVariant =
    variantAttributeKeys.length > 0 &&
    variantAttributeKeys.every(
      (key) =>
        selectedVariantOptions[key] !== undefined &&
        selectedVariantOptions[key] !== null &&
        selectedVariantOptions[key] !== "",
    )
      ? matchingVariants[0]
      : null;
  const selectedImageOptions = Object.entries(selectedVariantOptions).filter(
    ([key]) =>
      ["color", "material"].includes(key.replace(/[_\s-]/g, "").toLowerCase()),
  );
  const imageMatchingVariants = productVariants.filter((variant) =>
    selectedImageOptions.every(
      ([key, value]) =>
        String(variant[key]).toLowerCase() === String(value).toLowerCase(),
    ),
  );
  const previewVariant = selectedImageOptions.length
    ? imageMatchingVariants.find(
        (variant) => getVariantImages(variant).length > 0,
      ) || null
    : null;
  const variantImages = getVariantImages(previewVariant);
  const galleryImages = variantImages.length ? variantImages : productImages;
  const activeGalleryImage =
    galleryImages[currentImageIndex] || galleryImages[0] || null;
  const selectedVariantImage = activeGalleryImage?.imageUrl || "";

  const selectVariantOption = (attribute, value) => {
    setCurrentImageIndex(0);
    setSelectedVariantOptions((previous) => {
      const next = { ...previous, [attribute]: value };
      while (
        !productVariants.some((variant) =>
          Object.entries(next).every(
            ([key, selectedValue]) =>
              String(variant[key]) === String(selectedValue),
          ),
        )
      ) {
        const removableKey = Object.keys(next).find((key) => key !== attribute);
        if (!removableKey) break;
        delete next[removableKey];
      }
      return next;
    });
  };

  const handleImageModalOpen = (index) => {
    setCurrentImageIndex(index);
    setImageModalOpen(true);
  };

  const handlePrevImage = () => {
    if (galleryImages.length < 2) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1,
    );
  };

  const handleNextImage = () => {
    if (galleryImages.length < 2) return;
    setCurrentImageIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1,
    );
  };

  const handleImageTouchEnd = (event) => {
    if (imageTouchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - imageTouchStartX.current;
    imageTouchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) handleNextImage();
    else handlePrevImage();
  };

  if (!product) {
    return (
      <Container sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const comparePrice =
    product.comparePrice && product.comparePrice > 0
      ? product.comparePrice
      : product.price + 100;

  // Get current user ID from local storage or auth context
  const getCurrentUserId = () => {
    try {
      const userId = localStorage.getItem("userId");
      return userId ? userId : null;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();
  const userAlreadyReviewed =
    currentUserId &&
    reviewsList.some((r) => Number(r.userId) === Number(currentUserId));

  // Reviews data (use paginated list; fallback to product field)
  const reviewCount =
    reviewsTotalElements > 0
      ? reviewsTotalElements
      : (product?.totalReviews ?? product?.reviews?.length ?? 0);

  // Calculate average rating from reviews list, fallback to product rating
  const calculateAverageRating = () => {
    if (reviewsList.length > 0) {
      const sum = reviewsList.reduce(
        (acc, review) => acc + (review.rating || 0),
        0,
      );
      return Number((sum / reviewsList.length).toFixed(1));
    }
    // Fallback to product rating if no reviews loaded yet
    return product && (product.averageRating ?? product.rating)
      ? Number((product.averageRating ?? product.rating).toFixed(1))
      : 0;
  };

  const averageRating = calculateAverageRating();

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 1, md: 2 },
        px: { xs: 1, sm: 2 },
        "& .MuiTypography-h4": {
          fontSize: "clamp(1.2rem, 2.5vw, 1.7rem)",
          lineHeight: 1.25,
        },
        "& .MuiTypography-h6": {
          fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
        },
        "& .MuiTypography-subtitle1": {
          fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
        },
        "& .MuiTypography-subtitle2": {
          fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)",
        },
        "& .MuiTypography-body1": {
          fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)",
        },
        "& .MuiTypography-body2": {
          fontSize: "clamp(0.78rem, 1.15vw, 0.9rem)",
        },
        "& .MuiTypography-caption": {
          fontSize: "clamp(0.7rem, 1vw, 0.75rem)",
        },
        "& .MuiButton-root": {
          fontSize: "clamp(0.74rem, 1vw, 0.84rem)",
          minHeight: { xs: 34, sm: 36 },
          borderRadius: 1.75,
          fontWeight: 600,
          px: { xs: 1.25, sm: 1.5 },
          textTransform: "none",
        },
      }}
    >
      {/* Product Section */}
      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 3 }}
        alignItems="flex-start"
      >
        {/* Image */}
        <Grid item xs={12} md={6}>
          <Box
            onClick={() => setImageModalOpen(true)}
            sx={{
              position: "relative",
              width: "100%",
              minWidth: 0,
              width: { xs: "min(100%, 440px)", md: "min(100%, 560px)" },
              maxWidth: "100%",
              aspectRatio: "1 / 1",
              height: "auto",
              flex: "0 0 auto",
              alignSelf: "flex-start",
              boxSizing: "border-box",
              mx: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fafafa",
              borderRadius: 3,
              border: "1px solid #eee",
              cursor: "pointer",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              touchAction: "pan-y",
            }}
            onTouchStart={(event) => {
              imageTouchStartX.current = event.touches[0].clientX;
            }}
            onTouchEnd={handleImageTouchEnd}
          >
            {galleryImages.length > 1 && (
              <>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePrevImage();
                  }}
                  sx={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    backgroundColor: "rgba(255,255,255,0.8)",
                  }}
                  size="small"
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();
                    handleNextImage();
                  }}
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    backgroundColor: "rgba(255,255,255,0.8)",
                  }}
                  size="small"
                >
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}

            <img
              src={selectedVariantImage || getDisplayImage(product)}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: "12px",
              }}
            />
          </Box>

          {galleryImages.length > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-start", sm: "center" },
                gap: 1,
                mt: 1,
                flexWrap: "nowrap",
                overflowX: "auto",
                py: 0.25,
              }}
            >
              {galleryImages.map((image, index) => (
                <Box
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  sx={{
                    width: { xs: 48, sm: 58 },
                    height: { xs: 48, sm: 58 },
                    borderRadius: 1,
                    overflow: "hidden",
                    cursor: "pointer",
                    border:
                      currentImageIndex === index
                        ? "2px solid #1976d2"
                        : "2px solid transparent",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={image.imageUrl}
                    alt={`Product ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Box sx={{ width: "100%" }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                fontSize: { xs: "1.1rem", sm: "1.3rem", md: "1.8rem" },
                lineHeight: 1.3,
                mb: 1,
                wordBreak: "break-word",
              }}
            >
              {product.name}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                lineHeight: 1.6,
                fontSize: "clamp(0.82rem, 1.2vw, 0.95rem)",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 3,
                overflow: "hidden",
              }}
            >
              {product.description || "Explore product options and details."}
            </Typography>

            {productVariants.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                {variantAttributeKeys.map((attribute) => {
                  const availableOptions = [
                    ...new Set(
                      productVariants
                        .filter((variant) =>
                          Object.entries(selectedVariantOptions).every(
                            ([key, value]) =>
                              key === attribute ||
                              String(variant[key]) === String(value),
                          ),
                        )
                        .map((variant) => variant[attribute])
                        .filter(
                          (value) =>
                            value !== null &&
                            value !== undefined &&
                            String(value).trim() !== "",
                        )
                        .map(String),
                    ),
                  ];
                  return (
                    <Box key={attribute} sx={{ mb: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ mb: 0.5 }}
                      >
                        Select {formatVariantAttribute(attribute).toLowerCase()}
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.75}>
                        {availableOptions.map((value) => (
                          <Button
                            key={value}
                            size="small"
                            variant={
                              String(selectedVariantOptions[attribute]) ===
                              value
                                ? "contained"
                                : "outlined"
                            }
                            onClick={() =>
                              selectVariantOption(attribute, value)
                            }
                          >
                            {value}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
                {selectedVariant && (
                  <Typography
                    variant="caption"
                    color={
                      selectedVariant.stock != null &&
                      Number(selectedVariant.stock) <= 0
                        ? "error"
                        : "text.secondary"
                    }
                    sx={{ display: "block", mt: 0.75 }}
                  >
                    {selectedVariant.stock != null
                      ? Number(selectedVariant.stock) <= 0
                        ? "Out of stock"
                        : `${selectedVariant.stock} in stock`
                      : ""}
                  </Typography>
                )}
              </Box>
            )}

            <Box
              display="flex"
              alignItems="center"
              gap={1.5}
              mb={1.5}
              flexWrap="wrap"
            >
              <Typography
                variant="body2"
                sx={{
                  textDecoration: "line-through",
                  color: "text.secondary",
                  fontSize: { xs: "0.82rem", md: "1rem" },
                }}
              >
                ₹{comparePrice}
              </Typography>
              <Typography
                variant="h6"
                color="primary"
                fontWeight={700}
                sx={{
                  fontSize: { xs: "1.15rem", md: "1.5rem" },
                  lineHeight: 1.2,
                }}
              >
                ₹{selectedVariant?.price ?? product.price}
              </Typography>
            </Box>

            <Box display="flex" gap={1.5} flexWrap="wrap">
              <Button
                variant="contained"
                size="small"
                onClick={handleAddToCart}
                disabled={
                  (productVariants.length > 0 && !selectedVariant) ||
                  (selectedVariant?.stock != null &&
                    Number(selectedVariant.stock) <= 0) ||
                  (productVariants.length === 0 &&
                    product.quantityInStock != null &&
                    Number(product.quantityInStock) <= 0)
                }
                sx={{
                  px: { xs: 1.75, sm: 2.25 },
                  py: 0.6,
                  minHeight: { xs: 40, sm: 42 },
                  fontSize: "clamp(0.82rem, 1vw, 0.92rem)",
                  fontWeight: 700,
                  flex: { xs: 1, sm: "unset" },
                }}
              >
                Add to Cart
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/cart")}
                sx={{
                  px: { xs: 1.5, sm: 2 },
                  py: 0.6,
                  minHeight: { xs: 40, sm: 42 },
                  fontSize: "clamp(0.82rem, 1vw, 0.92rem)",
                  fontWeight: 650,
                  flex: { xs: 1, sm: "unset" },
                }}
              >
                Go to Cart
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* ==================== PRODUCT DETAILS SECTION ==================== */}
      <Box
        sx={{
          mt: { xs: 1.5, sm: 2 },
          p: { xs: 1.25, sm: 1.75 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2.5,
          bgcolor: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={750}>
            Product details
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Brand, SKU, description and more
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setProductDetailsDrawerOpen(true)}
          sx={{ flexShrink: 0, px: { xs: 1.25, sm: 2 } }}
        >
          View details
        </Button>
      </Box>

      <Drawer
        anchor="right"
        open={productDetailsDrawerOpen}
        onClose={() => setProductDetailsDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 440 },
            maxWidth: "100vw",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={750}>
              Product details
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {product.name}
            </Typography>
          </Box>
          <IconButton
            aria-label="Close product details"
            onClick={() => setProductDetailsDrawerOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={750} sx={{ mb: 0.5 }}>
              Description
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {product.description || "No description available."}
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {[
              ["Brand", product.brand],
              ["SKU", product.sku],
              ["Category", product.categoryName || product.category?.name],
              [
                "Availability",
                selectedVariant?.stock != null
                  ? Number(selectedVariant.stock) > 0
                    ? `${selectedVariant.stock} in stock`
                    : "Out of stock"
                  : product.quantityInStock != null
                    ? Number(product.quantityInStock) > 0
                      ? `${product.quantityInStock} in stock`
                      : "Out of stock"
                    : null,
              ],
              [
                "Selected options",
                selectedVariant
                  ? variantAttributeKeys
                      .map(
                        (key) =>
                          `${formatVariantAttribute(key)}: ${selectedVariant[key]}`,
                      )
                      .join(" · ")
                  : null,
              ],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={650}
                    textAlign="right"
                    sx={{ overflowWrap: "anywhere" }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
          </Box>
        </Box>
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={() => setProductDetailsDrawerOpen(false)}
          >
            Done
          </Button>
        </Box>
      </Drawer>

      <Divider sx={{ my: { xs: 1, md: 2 } }} />

      {/* Ratings & Reviews - Only show if merchant allows reviews */}
      {reviewsAllowed && (
        <Card
          onClick={() => setReviewDrawerOpen(true)}
          sx={{
            mb: 2,
            p: { xs: 1.5, sm: 2.5 },
            backgroundColor: "#f8f9fa",
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            cursor: "pointer",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "#e3f2fd",
              boxShadow: 2,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 1,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 700, mb: 1.5 }}
              >
                Ratings &amp; Reviews
              </Typography>
              <Box
                display="flex"
                alignItems="center"
                gap={1.5}
                flexWrap="wrap"
                sx={{ rowGap: 1 }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Rating
                    value={Number(averageRating.toFixed(1))}
                    precision={0.1}
                    readOnly
                    size="large"
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {Number(averageRating.toFixed(1))}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  ({reviewCount} {reviewCount === 1 ? "user" : "users"} rated)
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body2"
              color="primary"
              sx={{
                fontWeight: 600,
                whiteSpace: "nowrap",
                mt: { xs: 0, sm: 0.5 },
              }}
            >
              {reviewCount > 0
                ? "Click to see reviews →"
                : !userAlreadyReviewed
                  ? "Click to add review →"
                  : "Click to view reviews →"}
            </Typography>
          </Box>
        </Card>
      )}

      {/* Drawer - Reviews Content */}
      {reviewsAllowed && (
        <Drawer
          anchor="right"
          open={reviewDrawerOpen}
          onClose={() => setReviewDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: 500 },
              maxWidth: "90vw",
            },
          }}
        >
          <Box
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drawer Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Ratings &amp; Reviews
              </Typography>
              <IconButton onClick={() => setReviewDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Drawer Content - Scrollable */}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {/* Review form - only show if user hasn't reviewed yet */}
              {!userAlreadyReviewed && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Write a review
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Rating
                      name="rating"
                      value={ratingInput}
                      onChange={(e, v) => setRatingInput(v)}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Only verified buyers can post reviews
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Write your review"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    sx={{ mb: 1 }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Button variant="outlined" component="label" size="small">
                      Upload photos
                      <input
                        hidden
                        accept="image/*"
                        multiple
                        type="file"
                        onChange={(e) => handleFilesChange(e.target.files)}
                      />
                    </Button>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      {reviewFiles.map((f, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 56,
                            height: 56,
                            overflow: "hidden",
                            borderRadius: 1,
                            border: "1px solid #eee",
                          }}
                        >
                          <img
                            src={URL.createObjectURL(f)}
                            alt={f.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={submitReview}
                      disabled={submittingReview}
                    >
                      {submittingReview ? "Submitting..." : "Submit review"}
                    </Button>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              {/* Reviews list */}
              {reviewCount === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No reviews yet.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {reviewsList.map((rev, idx) => {
                    const reviewer =
                      rev.username || rev.userName || rev.userId || "Anonymous";
                    const revImages = Array.isArray(rev.photos)
                      ? rev.photos
                      : Array.isArray(rev.images)
                        ? rev.images
                        : rev.photo
                          ? [rev.photo]
                          : [];

                    return (
                      <Card
                        key={rev.id || idx}
                        variant="outlined"
                        sx={{ p: 1 }}
                      >
                        <CardContent sx={{ p: 1 }}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {String(reviewer)}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Rating
                                  value={Number(rev.rating) || 0}
                                  precision={0.1}
                                  readOnly
                                  size="small"
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {rev.createdAt
                                    ? new Date(
                                        rev.createdAt,
                                      ).toLocaleDateString()
                                    : ""}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {rev.content || rev.comment || rev.text || ""}
                          </Typography>

                          {/* Review images thumbnails */}
                          {revImages.length > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                mt: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              {revImages.map((img, i) => {
                                const url =
                                  typeof img === "string"
                                    ? normalizeImageUrl(img)
                                    : normalizeImageUrl(
                                        img.photoUrl ||
                                          img.imageUrl ||
                                          img.preview ||
                                          (img.photoBase64 || img.imageBase64
                                            ? `data:image/jpeg;base64,${img.photoBase64 || img.imageBase64}`
                                            : ""),
                                      );
                                return (
                                  <Box
                                    key={i}
                                    onClick={() => {
                                      setReviewImages(
                                        revImages.map((im) =>
                                          typeof im === "string"
                                            ? normalizeImageUrl(im)
                                            : normalizeImageUrl(
                                                im.photoUrl ||
                                                  im.imageUrl ||
                                                  im.preview ||
                                                  (im.photoBase64 ||
                                                  im.imageBase64
                                                    ? `data:image/jpeg;base64,${im.photoBase64 || im.imageBase64}`
                                                    : ""),
                                              ),
                                        ),
                                      );
                                      setReviewImageIndex(i);
                                      setReviewImageModalOpen(true);
                                    }}
                                    sx={{
                                      width: 72,
                                      height: 72,
                                      borderRadius: 1,
                                      overflow: "hidden",
                                      cursor: "pointer",
                                      border: "1px solid #eee",
                                    }}
                                  >
                                    <img
                                      src={url}
                                      alt={`rev-${idx}-${i}`}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  </Box>
                                );
                              })}
                            </Box>
                          )}

                          {/* Merchant replies (first one shown) */}
                          {Array.isArray(rev.replies) &&
                          rev.replies.length > 0 ? (
                            <Box
                              sx={{
                                mt: 1,
                                backgroundColor: "grey.50",
                                p: 1,
                                borderRadius: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Merchant reply
                              </Typography>
                              <Typography variant="body2">
                                {rev.replies[0].replyText}
                              </Typography>
                            </Box>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Load more reviews if available */}
                  {reviewsPage < reviewsTotalPages - 1 && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                    >
                      <Button
                        size="small"
                        onClick={() => fetchReviews(reviewsPage + 1)}
                      >
                        Load more reviews
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Drawer>
      )}

      <Divider sx={{ my: { xs: 1, md: 2 } }} />

      {/* Recommended Products */}
      <Typography variant="subtitle1" gutterBottom>
        Recommended
      </Typography>
      <Grid container spacing={2}>
        {recommended.length > 0 ? (
          recommended.map((item) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
              <Card
                sx={{ cursor: "pointer", height: "100%" }}
                onClick={() => navigate(`/product/${item.id}`)}
              >
                <CardMedia
                  component="img"
                  image={getDisplayImage(item)}
                  alt={item.name}
                  sx={{
                    height: 180,
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                />
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight={600}>
                    ₹{item.price}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            No recommendations found.
          </Typography>
        )}
      </Grid>

      {/* Image Modal */}
      <Modal open={imageModalOpen} onClose={() => setImageModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: { xs: 0.75, sm: 1.5 },
            width: { xs: "96vw", sm: "auto" },
            maxWidth: "96vw",
            maxHeight: "94vh",
            borderRadius: 2,
            overflow: "auto",
          }}
        >
          <IconButton
            onClick={() => setImageModalOpen(false)}
            sx={{ position: "absolute", top: 6, right: 6, zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>

          {/* Image Slider */}
          <Box
            sx={{
              position: "relative",
              width: { xs: "100%", sm: "min(82vw, 900px)" },
              height: { xs: "min(68vh, 520px)", sm: "min(76vh, 760px)" },
              display: "grid",
              placeItems: "center",
              touchAction: "pan-y",
            }}
            onTouchStart={(event) => {
              imageTouchStartX.current = event.touches[0].clientX;
            }}
            onTouchEnd={handleImageTouchEnd}
          >
            <IconButton
              onClick={handlePrevImage}
              disabled={galleryImages.length <= 1}
              sx={{
                position: "absolute",
                top: "50%",
                left: 16,
                transform: "translateY(-50%)",
                zIndex: 2,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
            >
              <ChevronLeftIcon />
            </IconButton>

            <img
              src={activeGalleryImage?.imageUrl || getDisplayImage(product)}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: "8px 36px",
              }}
            />

            <IconButton
              onClick={handleNextImage}
              disabled={galleryImages.length <= 1}
              sx={{
                position: "absolute",
                top: "50%",
                right: 16,
                transform: "translateY(-50%)",
                zIndex: 2,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-start", sm: "center" },
                gap: 1,
                mt: 1,
                flexWrap: "nowrap",
                overflowX: "auto",
                maxWidth: "100%",
                pb: 0.5,
              }}
            >
              {galleryImages.map((image, index) => (
                <Box
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  sx={{
                    width: { xs: 48, sm: 60 },
                    height: { xs: 48, sm: 60 },
                    flex: "0 0 auto",
                    cursor: "pointer",
                    borderRadius: 1,
                    overflow: "hidden",
                    border:
                      currentImageIndex === index
                        ? "2px solid #1976d2"
                        : "2px solid transparent",
                    transition: "border 0.3s",
                  }}
                >
                  <img
                    src={image.imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Modal>

      {/* Review Image Modal */}
      <Modal
        open={reviewImageModalOpen}
        onClose={() => setReviewImageModalOpen(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 1,
            maxWidth: "92vw",
            maxHeight: "85vh",
            borderRadius: 2,
          }}
        >
          <IconButton
            onClick={() => setReviewImageModalOpen(false)}
            sx={{ position: "absolute", top: 6, right: 6, zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ textAlign: "center" }}>
            <IconButton
              onClick={() =>
                setReviewImageIndex(
                  (i) => (i - 1 + reviewImages.length) % reviewImages.length,
                )
              }
              disabled={reviewImages.length <= 1}
              sx={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
            >
              <ChevronLeftIcon />
            </IconButton>

            <img
              src={reviewImages[reviewImageIndex]}
              alt={`review-image-${reviewImageIndex}`}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />

            <IconButton
              onClick={() =>
                setReviewImageIndex((i) => (i + 1) % reviewImages.length)
              }
              disabled={reviewImages.length <= 1}
              sx={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductPage;
