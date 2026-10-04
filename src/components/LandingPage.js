import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
import axios from "../utils/AxiosInstance";

const LandingPage = () => {
  const navigate = useNavigate();

  const { slug } = useParams();
  // =========================================================
  // TEMPORARY FRONTEND DATA
  // Later fetch these plans from Spring Boot
  // =========================================================
  const plans = [
    {
      name: "Starter",
      price: "₹499",
      period: "/month",
      description: "Perfect for small businesses starting online.",
      features: [
        "Up to 100 Products",
        "2 Users",
        "500 Orders / Month",
        "Basic Store",
        "Customer Management",
      ],
    },
    {
      name: "Business",
      price: "₹999",
      period: "/month",
      description: "For growing businesses and online stores.",
      features: [
        "Up to 1,000 Products",
        "10 Users",
        "5,000 Orders / Month",
        "Custom Store",
        "Coupons",
        "Delivery Management",
        "Online Payments",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "₹1,999",
      period: "/month",
      description: "For large businesses with advanced requirements.",
      features: [
        "Unlimited Products",
        "Unlimited Users",
        "Unlimited Orders",
        "Custom Domain",
        "Advanced Reports",
        "Delivery Management",
        "Online Payments",
        "Priority Support",
      ],
    },
  ];

  const [featuredStores, setFeaturedStores] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showAllStores, setShowAllStores] = React.useState(false);
  const [storeLoading, setStoreLoading] = React.useState(false);
  const [storeError, setStoreError] = React.useState("");

  const normalizeMerchant = (merchant, index) => {
    if (!merchant) return null;

    const slugFromStore =
      merchant.storeSlug ||
      merchant.slug ||
      merchant.storeUrl?.split("/").filter(Boolean).pop() ||
      merchant.businessName
        ?.toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      `store-${index + 1}`;

    const businessName =
      merchant.businessName || merchant.name || merchant.shopName || "Store";
    const category =
      merchant.businessCategory ||
      merchant.businessType ||
      merchant.category ||
      "General";

    return {
      id: merchant.id || index,
      slug: slugFromStore,
      businessName,
      category,
      status: merchant.status || merchant.subscriptionStatus || "ACTIVE",
      storeUrl:
        merchant.storeUrl ||
        `${window.location.origin}/store/${slugFromStore}/`,
    };
  };

  const fetchFeaturedStores = React.useCallback(async () => {
    try {
      setStoreLoading(true);
      setStoreError("");

      const response = await axios.get("/store/slug");
      const payload = response?.data;
      const merchants = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.result)
            ? payload.result
            : Array.isArray(payload?.content)
              ? payload.content
              : [];

      const mappedStores = merchants
        .map(normalizeMerchant)
        .filter(Boolean)
        .filter((store) => store.slug && store.businessName);

      setFeaturedStores(mappedStores);
    } catch (error) {
      console.error("Failed to load merchants:", error);
      setFeaturedStores([]);
      setStoreError("We could not load featured stores right now.");
    } finally {
      setStoreLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFeaturedStores();
  }, [fetchFeaturedStores]);

  React.useEffect(() => {
    setShowAllStores(false);
  }, [searchTerm]);

  const filteredStores = featuredStores.filter((store) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return true;

    return (
      store.slug.toLowerCase().includes(query) ||
      store.businessName.toLowerCase().includes(query) ||
      store.category.toLowerCase().includes(query)
    );
  });

  const visibleStores = showAllStores
    ? filteredStores
    : filteredStores.slice(0, 5);
  const hasMoreStores = filteredStores.length > 5;

  const handleStoreSearch = (selectedStore) => {
    const storeToOpen = selectedStore || filteredStores[0] || featuredStores[0];

    if (!storeToOpen) {
      return;
    }

    navigate(`/store/${storeToOpen.slug}/`);
  };

  // =========================================================
  // CHECK LOGIN
  // =========================================================
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");

  // =========================================================
  // NAVIGATION
  // =========================================================
  const handleContinue = () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (role === "ADMIN") {
      navigate("/admin-dashboard");
    } else if (role === "MERCHANT_ADMIN" || role === "MERCHANT") {
      navigate("/admin-dashboard");
    } else if (role === "DELIVERY_BOY") {
      navigate("/delivery-dashboard");
    } else {
      navigate("/home");
    }
  };

  return (
    <Box sx={{ backgroundColor: "#fafafa", minHeight: "100vh" }}>
      {/* =====================================================
          HERO
      ===================================================== */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
          color: "white",
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={5} alignItems="center">
            {/* LEFT */}
            <Grid item xs={12} md={7}>
              <Chip
                label="SHOPZONE"
                sx={{
                  mb: 2,
                  color: "white",
                  borderColor: "rgba(255,255,255,0.4)",
                }}
                variant="outlined"
              />

              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  fontSize: {
                    xs: "2.5rem",
                    md: "4rem",
                  },
                  mb: 2,
                }}
              >
                Your Business.
                <br />
                Your Store.
                <br />
                Your Customers.
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: "rgba(255,255,255,0.75)",
                  maxWidth: 650,
                  lineHeight: 1.7,
                  mb: 4,
                  fontWeight: 400,
                }}
              >
                Shopzone is an all-in-one commerce platform that helps merchants
                create and manage their online stores while giving customers a
                simple and convenient shopping experience.
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                {!token ? (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate("/register-merchants")}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Register as Merchant
                    </Button>

                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => handleStoreSearch()}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        color: "white",
                        borderColor: "rgba(255,255,255,0.5)",
                      }}
                    >
                      Explore Stores
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleContinue}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: "none",
                    }}
                  >
                    Continue to Shopzone
                  </Button>
                )}
              </Box>
            </Grid>

            {/* RIGHT */}
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  borderRadius: 4,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                    Everything in one place
                  </Typography>

                  {[
                    "Online Store",
                    "Product Management",
                    "Order Management",
                    "Customer Management",
                    "Delivery Management",
                    "Coupons & Promotions",
                    "Payments",
                  ].map((item) => (
                    <Box
                      key={item}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "white",
                        }}
                      />

                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.85)",
                        }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* =====================================================
          STORE SEARCH + MERCHANT MARKETING
      ===================================================== */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                boxShadow: "none",
                background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
                  Can’t find store looking for?
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ mb: 3, lineHeight: 1.7 }}
                >
                  Search for a store by slug, business name or category and jump
                  directly to its storefront.
                </Typography>

                <Box
                  component="form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleStoreSearch();
                  }}
                  sx={{
                    display: "flex",
                    gap: 1,
                    mb: 3,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <Box
                    component="input"
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search store slug or business name"
                    sx={{
                      flex: 1,
                      border: "1px solid #d1d5db",
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      outline: "none",
                      backgroundColor: "#fff",
                      fontSize: "0.95rem",
                      color: "#111827",
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      px: 3,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Search Store
                  </Button>
                </Box>

                {storeError && (
                  <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
                    {storeError}
                  </Typography>
                )}

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {storeLoading ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading stores...
                    </Typography>
                  ) : visibleStores.length ? (
                    visibleStores.map((store) => (
                      <Button
                        key={store.slug}
                        variant="outlined"
                        size="small"
                        onClick={() => handleStoreSearch(store)}
                        sx={{
                          borderRadius: 999,
                          textTransform: "none",
                          fontWeight: 500,
                          color: "#1f2937",
                          borderColor: "#d1d5db",
                        }}
                      >
                        {store.businessName} • /{store.slug}
                      </Button>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No matching stores found.
                    </Typography>
                  )}
                </Box>

                {hasMoreStores && (
                  <Button
                    onClick={() => setShowAllStores((prev) => !prev)}
                    variant="text"
                    size="small"
                    sx={{
                      mt: 2,
                      color: "#1f2937",
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                  >
                    {showAllStores ? "Show Less" : "Show More"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                boxShadow: "none",
                background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                color: "white",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                  Launch your merchant brand
                </Typography>

                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    mb: 3,
                    lineHeight: 1.7,
                  }}
                >
                  Build your online store, showcase featured products, run
                  campaigns, and manage orders from one powerful dashboard.
                </Typography>

                <Grid container spacing={2}>
                  {[
                    "Custom storefront",
                    "Campaign promotions",
                    "Fast checkout",
                    "Smart analytics",
                  ].map((feature) => (
                    <Grid item xs={12} sm={6} key={feature}>
                      <Box
                        sx={{
                          borderRadius: 2,
                          backgroundColor: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          p: 2,
                          color: "white",
                          fontWeight: 500,
                          textAlign: "center",
                        }}
                      >
                        {feature}
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Button
                  variant="contained"
                  onClick={() => navigate("/register-merchants")}
                  sx={{
                    mt: 3,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: "#fff",
                    color: "#111827",
                    "&:hover": { backgroundColor: "#e5e7eb" },
                  }}
                >
                  Start Selling Today
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Divider />

      {/* =====================================================
          PLANS
      ===================================================== */}
      <Container maxWidth="lg" sx={{ py: 9 }}>
        <Typography
          variant="h4"
          textAlign="center"
          fontWeight={700}
          sx={{ mb: 1 }}
        >
          Choose your plan
        </Typography>

        <Typography textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Start small and upgrade as your business grows.
        </Typography>

        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.name}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  position: "relative",
                  border: plan.popular
                    ? "2px solid #1976d2"
                    : "1px solid #e5e7eb",
                  boxShadow: "none",
                }}
              >
                {plan.popular && (
                  <Chip
                    label="Most Popular"
                    color="primary"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                    }}
                  />
                )}

                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight={700}>
                    {plan.name}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      minHeight: 50,
                    }}
                  >
                    {plan.description}
                  </Typography>

                  <Box sx={{ my: 3 }}>
                    <Typography variant="h3" fontWeight={800}>
                      {plan.price}
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {plan.period}
                      </Typography>
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  {plan.features.map((feature) => (
                    <Box
                      key={feature}
                      sx={{
                        display: "flex",
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <Typography>✓</Typography>

                      <Typography color="text.secondary">{feature}</Typography>
                    </Box>
                  ))}

                  <Button
                    fullWidth
                    variant={plan.popular ? "contained" : "outlined"}
                    sx={{
                      mt: 3,
                      py: 1.2,
                      borderRadius: 2,
                      textTransform: "none",
                    }}
                    onClick={() => navigate("/admin/merchants")}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* =====================================================
          FOOTER CTA
      ===================================================== */}
      <Box
        sx={{
          backgroundColor: "#111827",
          color: "white",
          py: 8,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            Ready to grow your business?
          </Typography>
          <Typography
            variant="body1"
            textAlign="center"
            sx={{ color: "rgba(255,255,255,0.75)", mb: 4 }}
          >
            Join Shopzone and build a modern storefront for your customers.
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/register-merchants")}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: "#fff",
                color: "#111827",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#e5e7eb" },
              }}
            >
              Start Merchant Registration
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
