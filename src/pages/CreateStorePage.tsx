import React from "react";
import StoreInfo from "../components/StoreInfo";
import withAuth from "../components/HOC/withAuth";
import { Box } from "@mui/material";

const CreateStorePage: React.FC = () => {
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
      <StoreInfo handleUpdate={() => {}} submitType="create"></StoreInfo>
    </Box>
  );
};

export default withAuth(CreateStorePage);
