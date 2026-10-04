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
} from "@mui/material";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

import { ArrowBack, Add, Search } from "@mui/icons-material";
import axios from "../utils/AxiosInstance"; // Use the Axios instance
import { useNavigate } from "react-router-dom"; // ✅ Add this

import { useParams } from "react-router-dom";
// import axios from "../utils/AxiosInstance";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDialogOpen, setUserDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view");

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate(); // ✅ Use this for routing

  const loggedInUserId = localStorage.getItem("userId");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axios
      .get("/user/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("User fetch error:", err));
  };

  const handleDeleteUser = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?",
    );
    if (confirmed) {
      axios
        .delete(`/user/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          alert("User deleted successfully");
          fetchUsers();
        })
        .catch((err) => {
          alert("Failed to delete user");
          console.error(err);
        });
    }
  };

  const handleUserSubmit = () => {
    if (!selectedUser.username || !selectedUser.email) {
      alert("Please fill all fields");
      return;
    }

    if (!isValidEmail(selectedUser.email)) {
      alert("Enter a valid email address");
      return;
    }

    if (dialogMode === "add") {
      axios
        .post("/user/register", selectedUser, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          alert("User added successfully");
          setUserDialogOpen(false);
          fetchUsers();
        })
        .catch((err) => {
          alert("Failed to add user");
          console.error(err);
        });
    } else if (dialogMode === "update") {
      axios
        .put(`/user/${selectedUser.id}`, selectedUser, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          alert("User updated successfully");
          setUserDialogOpen(false);
          fetchUsers();
        })
        .catch((err) => {
          alert("Failed to update user");
          console.error(err);
        });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchUser.toLowerCase()),
  );

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const { slug } = useParams(); // Get the store slug
  return (
    <Container>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <IconButton
          onClick={() => navigate(`/store/${slug}/admin-dashboard`)}
          sx={{ mr: 2 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          User Management
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
            label="Search Users"
            variant="outlined"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 250 }}
            size="small"
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setDialogMode("add");
              setSelectedUser({
                username: "",
                email: "",
                password: "",
                userId: "",
                userRole: "",
              });
              setUserDialogOpen(true);
            }}
            size="small"
          >
            Add User
          </Button>
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>
                <strong>ID</strong>
              </TableCell>
              <TableCell>
                <strong>Username</strong>
              </TableCell>
              <TableCell>
                <strong>Email</strong>
              </TableCell>
              <TableCell>
                <strong>Role</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.userId}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role || "User"}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={() => {
                        setDialogMode("view");
                        setSelectedUser(user);
                        setUserDialogOpen(true);
                      }}
                      sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                    >
                      View
                    </Button>
                    {Number(loggedInUserId) !== Number(user.userId) && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            setDialogMode("update");
                            setSelectedUser(user);
                            setUserDialogOpen(true);
                          }}
                          sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" color="text.secondary">
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Dialog */}
      <Dialog
        open={isUserDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogMode === "add"
            ? "Add New User"
            : dialogMode === "update"
              ? "Update User"
              : "User Details"}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="First Name"
            fullWidth
            variant="outlined"
            value={selectedUser?.firstName || ""}
            disabled={dialogMode === "view"}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser, firstName: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            variant="outlined"
            value={selectedUser?.lastName || ""}
            disabled={dialogMode === "view"}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser, lastName: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={selectedUser?.username || ""}
            disabled={dialogMode === "view"}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser, username: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={selectedUser?.email || ""}
            disabled={dialogMode === "view"}
            onChange={(e) => {
              const value = e.target.value;

              setSelectedUser({ ...selectedUser, email: value });

              // if (!value) {
              //   setEmailError("Email is required");
              // } else if (!isValidEmail(value)) {
              //   setEmailError("Enter a valid email address");
              // } else {
              //   setEmailError("");
              // }
            }}
          />

          {dialogMode === "add" && (
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={selectedUser?.password || ""}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, password: e.target.value })
              }
            />
          )}
          <>
            {/* <TextField
              margin="dense"
              label="User ID"
              fullWidth
              variant="outlined"
              value={selectedUser?.userId || ""}
              disabled={dialogMode === "view"}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, userId: e.target.value })
              }
            /> */}
            <FormControl
              fullWidth
              margin="dense"
              disabled={dialogMode === "view"}
            >
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedUser?.userRole || ""}
                label="Role"
                onChange={(e) =>
                  setSelectedUser({ ...selectedUser, userRole: e.target.value })
                }
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="Delivery User">Delivery Boy</MenuItem>
                <MenuItem value="USER">User</MenuItem>
              </Select>
            </FormControl>
          </>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          {(dialogMode === "add" || dialogMode === "update") && (
            <Button onClick={handleUserSubmit} variant="contained">
              {dialogMode === "add" ? "Add User" : "Update User"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
