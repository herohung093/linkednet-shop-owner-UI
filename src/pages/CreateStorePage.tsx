import React from "react";
import StoreInfo from "../components/StoreInfo";
import withAuth from "../components/HOC/withAuth";
import ResponsiveBox from "../components/ResponsiveBox";

const CreateStorePage: React.FC = () => {
  return (
    <ResponsiveBox
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
    >
      <StoreInfo submitType="create"></StoreInfo>
    </ResponsiveBox>
  );
};

export default withAuth(CreateStorePage);
