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
  Box,
  IconButton,
  Chip,
} from "@mui/material";
import { ArrowBack, Add, Search } from "@mui/icons-material";
import axios from "../utils/AxiosInstance";
import { useNavigate } from "react-router-dom";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [searchCategory, setSearchCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view"); // "add", "update", "view"

  const token = localStorage.getItem("authToken");

  const navigate = useNavigate();
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    axios
      .get("/category/get-all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Category fetch error:", err));
  };

  const handleDeleteCategory = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category? This action cannot be undone.",
    );
    if (confirmed) {
      axios
        .delete(`/category/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          alert("Category deleted successfully");
          fetchCategories();
        })
        .catch((err) => {
          alert("Failed to delete category. It might be in use by products.");
          console.error(err);
        });
    }
  };

  const handleCategorySubmit = () => {
    if (!selectedCategory.name || !selectedCategory.description) {
      alert("Please fill all required fields");
      return;
    }

    if (dialogMode === "add") {
      axios
        .post("/category/create", selectedCategory, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          alert("Category added successfully");
          setCategoryDialogOpen(false);
          fetchCategories();
        })
        .catch((err) => {
          alert("Failed to add category");
          console.error(err);
        });
    } else if (dialogMode === "update") {
      axios
        .put(`/category/${selectedCategory.id}`, selectedCategory, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          alert("Category updated successfully");
          setCategoryDialogOpen(false);
          fetchCategories();
        })
        .catch((err) => {
          alert("Failed to update category");
          console.error(err);
        });
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name?.toLowerCase().includes(searchCategory.toLowerCase()) ||
      category.description
        ?.toLowerCase()
        .includes(searchCategory.toLowerCase()),
  );

  return (
    <Container>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <IconButton onClick={() => navigate("/admin-dashboard")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Category Management
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
            label="Search Categories"
            variant="outlined"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            size="small"
            sx={{ flexGrow: 1, minWidth: 250 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setDialogMode("add");
              setSelectedCategory({
                name: "",
                description: "",
                isActive: true,
              });
              setCategoryDialogOpen(true);
            }}
            size="small"
          >
            Add Category
          </Button>
        </Box>
      </Paper>

      {/* Categories Table */}
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
              {/* <TableCell>
                <strong>Description</strong>
              </TableCell> */}
              {/* <TableCell>
                <strong>Status</strong>
              </TableCell> */}
              <TableCell>
                <strong>Created Date</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <TableRow key={category.id} hover>
                  <TableCell>{category.id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  {/* <TableCell>
                    {category.description?.length > 50
                      ? `${category.description.substring(0, 50)}...`
                      : category.description}
                  </TableCell> */}
                  {/* <TableCell>
                    <Chip
                      label={category.isActive ? "Active" : "Inactive"}
                      color={category.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell> */}
                  <TableCell>
                    {category.createdAt
                      ? new Date(category.createdAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={() => {
                        setDialogMode("view");
                        setSelectedCategory(category);
                        setCategoryDialogOpen(true);
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
                        setSelectedCategory(category);
                        setCategoryDialogOpen(true);
                      }}
                      sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteCategory(category.id)}
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
                    No categories found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Category Dialog */}
      <Dialog
        open={isCategoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogMode === "add"
            ? "Add New Category"
            : dialogMode === "update"
              ? "Update Category"
              : "Category Details"}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Category Name *"
            fullWidth
            variant="outlined"
            value={selectedCategory?.name || ""}
            disabled={dialogMode === "view"}
            onChange={(e) =>
              setSelectedCategory({ ...selectedCategory, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Description *"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={selectedCategory?.description || ""}
            disabled={dialogMode === "view"}
            onChange={(e) =>
              setSelectedCategory({
                ...selectedCategory,
                description: e.target.value,
              })
            }
          />
          {dialogMode === "view" && (
            <>
              <TextField
                margin="dense"
                label="Category ID"
                fullWidth
                variant="outlined"
                value={selectedCategory?.id || ""}
                disabled
              />
              <TextField
                margin="dense"
                label="Created At"
                fullWidth
                variant="outlined"
                value={
                  selectedCategory?.createdAt
                    ? new Date(selectedCategory.createdAt).toLocaleString()
                    : "N/A"
                }
                disabled
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          {(dialogMode === "add" || dialogMode === "update") && (
            <Button onClick={handleCategorySubmit} variant="contained">
              {dialogMode === "add" ? "Add Category" : "Update Category"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CategoryManagement;
