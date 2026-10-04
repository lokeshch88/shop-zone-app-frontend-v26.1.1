export async function fetchLatLong(address) {
  const queries = [
    `${address.city}, ${address.district}, ${address.state}, ${address.country}, ${address.pincode}`,
    `${address.city}, ${address.state}, ${address.country}`,
    `${address.city}, ${address.country}`,
    `${address.pincode}, ${address.country}`,
  ];

  for (const query of queries) {
    try {
      console.log("Trying query:", query);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            "User-Agent": "MyApp/1.0 (youremail@example.com)", // Required
          },
        }
      );
      const data = await response.json();
      console.log(data);
      if (data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    } catch (err) {
      console.error("Geo fetch failed for:", query, err);
    }
  }

  return null;
}
