import React from "react";
import StoreInfo from "../components/StoreInfo";
import { useNavigate } from "react-router";

const CreateStorePage: React.FC = () => {
  const navigate = useNavigate();
  const handleUpdate = () => {
    navigate("/dashboard");
  };
  return (
    <>
      <StoreInfo handleUpdate={handleUpdate} submitType = "create"></StoreInfo>
    </>
  );
};

export default CreateStorePage;
