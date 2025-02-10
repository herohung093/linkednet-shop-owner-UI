import React, { useState } from "react";
import { axiosInstance } from "../utils/axios";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router";
import { CircularProgress } from "@mui/material";

const ForgotPasswordDialog: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleNextClick = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axiosInstance.get("/auth/user/resetPassword", {
        params: { email }
      });
      navigate("/reset-password-verification", { replace: true });
    } catch (error) {
      setError("Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="text-blue-600 hover:text-blue-800 transition-colors">
          Reset your password?
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[12px] bg-white p-6 shadow-xl focus:outline-none">
          <div className="mb-6">
            <Dialog.Title className="text-2xl font-bold text-gray-800 mb-2">
              Reset Password
            </Dialog.Title>
            <Dialog.Description className="text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </Dialog.Description>
          </div>

          <div className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                  ${error ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your email"
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleNextClick}
                disabled={loading || !email.trim()}
                className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[100px]"
              >
                {loading ? (
                  <CircularProgress size={20} style={{ color: 'white' }} />
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ForgotPasswordDialog;