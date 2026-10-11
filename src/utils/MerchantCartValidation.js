const getPayload = (response) =>
  response?.data?.result ?? response?.data?.data ?? response?.data;

const getMerchantId = (value) =>
  value?.merchantId ??
  value?.merchant?.id ??
  value?.merchant?.merchantId ??
  value?.id;

const getItemId = (item) => item?.productId ?? item?.id;

const getItemMerchantId = (item) =>
  item?.merchantId ?? item?.merchant?.id ?? item?.merchant?.merchantId;

const getItemStoreSlug = (item) => item?.storeSlug ?? item?.merchantSlug;

const getList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.merchants)) return payload.merchants;
  return [];
};

const createCartValidationError = (message, invalidCartItems = []) => {
  const error = new Error(message);
  error.invalidCartItems = invalidCartItems;
  return error;
};

export const validateCartForStore = async ({
  axios,
  slug,
  items,
  registeredMerchantId,
}) => {
  if (!slug || !Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty or the store URL is invalid.");
  }

  const storeResponse = await axios.get("/store/check");
  if (storeResponse.data !== "ACTIVE") {
    throw new Error("This store is not active. Your checkout cannot continue.");
  }

  const [merchantResponse, catalogResponse] = await Promise.all([
    axios.get("/api/merchants/by-slug/"),
    axios.get("/products/all-active"),
  ]);
  const merchant = getPayload(merchantResponse);
  const merchantId = getMerchantId(merchant);
  const products = getList(getPayload(catalogResponse));

  if (products.length === 0) {
    throw new Error(
      "We could not verify this store's products. Please try again.",
    );
  }

  const productsById = new Map(
    products.map((product) => [String(getItemId(product)), product]),
  );
  const invalidCartItems = [];
  const registeredStoreMismatch =
    registeredMerchantId &&
    merchantId &&
    String(registeredMerchantId) !== String(merchantId);

  for (const item of items) {
    const itemStoreSlug = getItemStoreSlug(item);
    const product = productsById.get(String(getItemId(item)));
    const itemMerchantId = getItemMerchantId(item);
    const productMerchantId = getItemMerchantId(product);
    const reason = registeredStoreMismatch
      ? "Your account is registered with a different store."
      : itemStoreSlug && itemStoreSlug !== slug
        ? "This product belongs to another store."
        : !product
          ? "This product is not available from the current store."
          : merchantId &&
              ((itemMerchantId &&
                String(itemMerchantId) !== String(merchantId)) ||
                (productMerchantId &&
                  String(productMerchantId) !== String(merchantId)))
            ? "This product belongs to another merchant."
            : "";

    if (reason) {
      invalidCartItems.push({
        productId: getItemId(item),
        storeSlug: itemStoreSlug || slug,
        storeName:
          item.storeName ||
          item.merchantName ||
          item.businessName ||
          itemStoreSlug ||
          slug,
        reason,
      });
    }
  }

  if (invalidCartItems.length) {
    throw createCartValidationError(
      "Some products in your cart do not belong to this store. Review the highlighted products.",
      invalidCartItems,
    );
  }

  return { merchantId };
};
