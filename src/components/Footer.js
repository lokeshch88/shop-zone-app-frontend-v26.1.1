import React from "react";
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        py: 1,
        px: 2,
        zIndex: 1200,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: "0.75rem", fontWeight: 400 }}
      >
        © {new Date().getFullYear()} ShopZone.com • All rights reserved •
        v26.1.1
      </Typography>
    </Box>
  );
};

export default Footer;
