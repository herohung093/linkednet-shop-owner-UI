import React from "react";
import { Box, useMediaQuery } from "@mui/material";

interface ResponsiveBoxProps {
  children: React.ReactNode;
}

const ResponsiveBox: React.FC<ResponsiveBoxProps> = ({ children }) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Box
      sx={{
        p: 2,
        transform: isMobile ? "scale(0.7)" : "none",
        transformOrigin: "top left",
        width: isMobile ? "140%" : "100%",
      }}
    >
      {children}
    </Box>
  );
};

export default ResponsiveBox;
