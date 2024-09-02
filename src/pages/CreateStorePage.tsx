import React from "react";
import StoreInfo from "../components/StoreInfo";
import { useNavigate } from "react-router";
import withAuth from "../components/HOC/withAuth";

const CreateStorePage: React.FC = () => {
  const navigate = useNavigate();
  const handleUpdate = () => {
    navigate("/store-settings");
  };
  return (
    <>
      <StoreInfo handleUpdate={handleUpdate} submitType = "create"></StoreInfo>
    </>
  );
};

export default withAuth(CreateStorePage);
