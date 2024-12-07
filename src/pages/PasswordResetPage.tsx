import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosWithToken } from "../utils/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import withAuth from "../components/HOC/withAuth";

const PasswordResetPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      await axiosWithToken.put("/user/change-password", {
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      });
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Failed to reset password. Please try again.");
    }
  };

  const isFormValid =
    newPassword.trim() !== "" && confirmPassword.trim() !== "";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-3">
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
        <div className="relative w-full mb-4">
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
            }}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter new password"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
          >
            <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
          </button>
        </div>
        <div className="relative w-full mb-4">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
            }}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Confirm new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
          >
            <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
          </button>
        </div>
        {errorMessage && (
          <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
        )}
        <button
          onClick={handlePasswordReset}
          disabled={!isFormValid}
          className={`w-full flex justify-center items-center h-[40px] ${
            !isFormValid ? "bg-gray-400" : "bg-slate-900 hover:bg-slate-700"
          } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
        >
          Submit
        </button>
      </div>

      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-3">
            <h2 className="text-2xl font-bold mb-4 text-center">Success</h2>
            <p className="text-center mb-4">
              Your password has been changed successfully.
            </p>
            <button
              onClick={() => {
                navigate("/login", { replace: true });
                localStorage.removeItem("authToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("storeUuid");
              }}
              className="w-full flex justify-center items-center h-[40px] bg-slate-900 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(PasswordResetPage);
