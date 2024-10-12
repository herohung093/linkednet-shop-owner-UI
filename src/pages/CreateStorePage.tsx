import React from "react";
import StoreInfo from "../components/StoreInfo";
import { useNavigate } from "react-router";
import withAuth from "../components/HOC/withAuth";
import { Box } from "@mui/material";

const CreateStorePage: React.FC = () => {
  const navigate = useNavigate();
  const handleUpdate = () => {
    navigate("/store-settings");
  };
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
      }}
    >
      <StoreInfo handleUpdate={handleUpdate} submitType="create"></StoreInfo>
    </Box>
  );
};

export default withAuth(CreateStorePage);
