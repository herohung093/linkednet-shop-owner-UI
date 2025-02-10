import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../utils/axios";
import { CircularProgress } from "@mui/material";
import { MailCheck } from "lucide-react";

const ResetPasswordVerificationPage: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerificationSubmit = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/auth/user/verify-reset-password-token", {
        params: { token: verificationCode },
      });
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      navigate("/password-reset", { replace: true });
    } catch (error) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 px-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <MailCheck size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            Check Your Email
          </h2>
          <p className="mt-2 text-center text-gray-600">
            We've sent a verification code to your email.
            Please enter it below to continue.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="verificationCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Verification Code
            </label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value);
                setError("");
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
              placeholder="Enter verification code"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <button
            onClick={handleVerificationSubmit}
            disabled={loading || !verificationCode.trim()}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <CircularProgress size={24} style={{ color: 'white' }} />
            ) : (
              'Verify Code'
            )}
          </button>

          <div className="text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordVerificationPage;