import React from "react";
import { Box, SxProps, Theme, useMediaQuery } from "@mui/material";

interface ResponsiveBoxProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

const ResponsiveBox: React.FC<ResponsiveBoxProps> = ({ children, sx }) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Box
      sx={{
        p: 2,
        transform: isMobile ? "scale(0.7)" : "none",
        transformOrigin: "top left",
        width: isMobile ? "140%" : "100%",
        ...sx, // Merge additional styles
      }}
    >
      {children}
    </Box>
  );
};

export default ResponsiveBox;
