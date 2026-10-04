import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Box,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Edit, Delete } from "@mui/icons-material";

import { fetchLatLong } from "../utils/AddressUtils";

const ProfilePage = () => {
  const username = localStorage.getItem("username");
  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastName");
  const email = localStorage.getItem("email");

  const [addresses, setAddresses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [editingIndex, setEditingIndex] = useState(-1);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  //address
  const userId = localStorage.getItem("userId"); // Ensure userId is stored in localStorage

  const [formData, setFormData] = useState({
    addressLine: "",
    city: "",
    state: "",
    district: "",
    country: "India",
    pincode: "",
    latitude: "",
    longitude: "",
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const token = localStorage.getItem("authToken"); // or whatever key you're storing it under
  useEffect(() => {
    if (userId && token) {
      fetch(`http://localhost:8080/address/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Network response was not ok");
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setAddresses(data);
          } else {
            console.warn("Unexpected address data format:", data);
            setAddresses([]);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch addresses:", err);
          setAddresses([]); // Optional fallback
        });
    }
  }, [userId]);

  const handleOpenDialog = (index = -1) => {
    if (index >= 0) {
      const addr = addresses[index];
      setFormData({
        addressLine: addr.addressLine || "",
        city: addr.city || "",
        state: addr.state || "",
        country: addr.country || "India",
        pincode: addr.pincode || "",
        latitude: addr.latitude || "",
        longitude: addr.longitude || "",
      });
      setEditingAddressId(addr.id);
    } else {
      setFormData({
        addressLine: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        latitude: "",
        longitude: "",
      });
      setEditingAddressId(null);
    }
    setOpenDialog(true);
  };

  const handleSaveAddress = async () => {
    // Call geocoding util before saving
    const coords = await fetchLatLong(formData);

    if (coords) {
      const payload = {
        ...formData,
        userId: parseInt(userId),
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      const method = editingAddressId ? "PUT" : "POST";
      const url = editingAddressId
        ? `http://localhost:8080/address/${editingAddressId}`
        : `http://localhost:8080/address/save`;

      fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to save address");
          return res.json();
        })
        .then(() => {
          // refresh list after save
          return fetch(`http://localhost:8080/address/user/${userId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });
        })
        .then((res) => res.json())
        .then((data) => {
          setAddresses(data);
          setOpenDialog(false);
        })
        .catch((err) => console.error(err));
    } else {
      alert("Could not find latitude and longitude for the entered address.");
    }
  };

  const handleDelete = (index) => {
    const token = localStorage.getItem("authToken");
    const idToDelete = addresses[index].id;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this address?",
    );
    if (!confirmDelete) return;
    fetch(`http://localhost:8080/address/${idToDelete}`, {
      method: "DELETE", // 👈 This is required
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete address");
        }
        // Remove the deleted address from state
        const updated = addresses.filter((_, i) => i !== index);
        setAddresses(updated);
      })
      .catch((err) => console.error("Failed to delete address", err));
  };

  // const handleOpenDialog = (index = -1) => {
  //   setEditingIndex(index);
  //   setNewAddress(index >= 0 ? addresses[index].address : "");
  //   setOpenDialog(true);
  // };

  if (!username || !email) {
    return (
      <Container sx={{ mt: 5 }}>
        <Typography variant="h6" color="error">
          Please log in to access your profile.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      {/* User Info Card */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" flexDirection="column" mb={3}>
            <Avatar sx={{ width: 80, height: 80, mb: 2 }}>
              {username.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h5">{username}</Typography>
            {/* <Typography color="text.secondary">{email}</Typography> */}
          </Box>

          <Grid container spacing={2} mb={2}>
            {/* <Grid item xs={6}>
              <Typography variant="subtitle1" fontWeight="bold">
                First Name
              </Typography>
              <Typography>{firstName || "-"}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle1" fontWeight="bold">
                Last Name
              </Typography>
              <Typography>{lastName || "-"}</Typography>
            </Grid> */}
          </Grid>

          <Box textAlign="center">
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              sx={{ mt: 2 }}
            >
              Logout
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Address Section */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Saved Addresses
          </Typography>
          <List>
            {addresses.map((addr, idx) => (
              <ListItem
                key={addr.id || idx}
                alignItems="flex-start"
                secondaryAction={
                  <>
                    <IconButton onClick={() => handleOpenDialog(idx)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(idx)}>
                      <Delete />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={
                    <>
                      <Typography variant="body1" fontWeight="bold">
                        {addr.addressLine}
                      </Typography>
                      <Typography variant="body2">
                        {addr.city}, {addr.district}, {addr.state},{" "}
                        {addr.country} - {addr.pincode}
                      </Typography>
                      {/* <Typography variant="caption">
                        Lat: {addr.latitude}, Long: {addr.longitude}
                      </Typography> */}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
          <Button
            variant="outlined"
            onClick={() => handleOpenDialog()}
            sx={{ mt: 1 }}
          >
            Add New Address
          </Button>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {editingAddressId ? "Edit Address" : "Add New Address"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line"
                value={formData.addressLine}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine: e.target.value })
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="District"
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
              />
            </Grid>
            {/* <Grid item xs={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
              />
            </Grid> */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({ ...formData, pincode: e.target.value })
                }
              />
            </Grid>
            {/* <Grid item xs={6}>
              <TextField
                fullWidth
                label="Latitude"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Longitude"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
              />
            </Grid> */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveAddress} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
