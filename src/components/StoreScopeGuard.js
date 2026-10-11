import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../utils/AxiosInstance";

const getMerchant = (data) => {
  const payload = data?.result ?? data?.data ?? data;
  return Array.isArray(payload) ? payload[0] : payload;
};

const StoreScopeGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const storeMatch = location.pathname.match(/^\/store\/([^/]+)/);
  const slug = storeMatch ? decodeURIComponent(storeMatch[1]) : "";
  const token = localStorage.getItem("authToken");
  const accountMerchantId = localStorage.getItem("merchantId");
  const accountStoreSlug = localStorage.getItem("merchantSlug");
  const [access, setAccess] = useState({ status: "checking", message: "" });

  useEffect(() => {
    let active = true;

    if (!slug || !token) {
      setAccess({ status: "allowed", message: "" });
      return () => {
        active = false;
      };
    }

    setAccess({ status: "checking", message: "" });

    const verifyStoreAccess = async () => {
      try {
        const response = await axios.get("/api/merchants/by-slug/");
        const merchant = getMerchant(response.data);
        const currentMerchantId =
          merchant?.id ?? merchant?.merchantId ?? merchant?.merchant?.id;
        const currentStoreSlug =
          merchant?.storeSlug ?? merchant?.slug ?? merchant?.merchantSlug;

        if (!accountMerchantId && !accountStoreSlug) {
          throw new Error(
            "Your account's store association is missing. Sign out and sign in from your store URL to continue.",
          );
        }

        const merchantIdMismatch =
          accountMerchantId &&
          currentMerchantId &&
          String(accountMerchantId) !== String(currentMerchantId);
        const storeSlugMismatch =
          accountStoreSlug &&
          currentStoreSlug &&
          accountStoreSlug.toLowerCase() !== currentStoreSlug.toLowerCase();

        if (!active) return;

        if (merchantIdMismatch || storeSlugMismatch) {
          setAccess({
            status: "blocked",
            message: `Your signed-in account belongs to ${localStorage.getItem("merchantName") || accountStoreSlug || "another store"}, but this URL belongs to ${merchant?.businessName || merchant?.storeName || slug}.`,
          });
          return;
        }

        if (!currentMerchantId && !currentStoreSlug) {
          throw new Error("The store identity could not be verified.");
        }

        setAccess({ status: "allowed", message: "" });
      } catch (error) {
        if (!active) return;
        setAccess({
          status: "blocked",
          message:
            error?.response?.data?.message ||
            "We could not verify that this store matches your account. Store pages, profile, and orders are temporarily blocked.",
        });
      }
    };

    verifyStoreAccess();
    return () => {
      active = false;
    };
  }, [accountMerchantId, accountStoreSlug, location.pathname, slug, token]);

  const signOutAndContinue = () => {
    [
      "authToken",
      "user",
      "userId",
      "userRole",
      "merchantId",
      "merchantSlug",
      "merchantName",
      "username",
      "firstName",
      "lastName",
      "email",
      "userAddresses",
      "selectedAddress",
    ].forEach((key) => localStorage.removeItem(key));
    setAccess({ status: "allowed", message: "" });
    navigate(`/store/${slug}/home`, { replace: true });
  };

  if (access.status === "checking") {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography color="text.secondary" align="center">
          Verifying store access...
        </Typography>
      </Container>
    );
  }

  if (access.status === "blocked") {
    return (
      <Container maxWidth="sm" sx={{ py: 5 }}>
        <Alert severity="warning">
          <Typography fontWeight={700} gutterBottom>
            This store does not match your account
          </Typography>
          {access.message}
        </Alert>
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {accountStoreSlug && (
            <Button
              variant="contained"
              onClick={() =>
                navigate(
                  `/store/${encodeURIComponent(accountStoreSlug)}/home`,
                  {
                    replace: true,
                  },
                )
              }
            >
              Go to /store/{accountStoreSlug}
            </Button>
          )}
          <Button variant="outlined" onClick={signOutAndContinue}>
            Sign out and browse /store/{slug}
          </Button>
        </Stack>
      </Container>
    );
  }

  return <Box>{children}</Box>;
};

export default StoreScopeGuard;
