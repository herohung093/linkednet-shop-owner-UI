import React from "react";
import { useNavigate } from "react-router-dom";

interface ErrorDialogProps {
  errorMessage: string | null;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({ errorMessage }) => {
  const navigate = useNavigate();

  if (!errorMessage) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative p-4 w-full max-w-md h-full md:h-auto">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="flex justify-between items-center p-5 rounded-t border-b dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Payment Error
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              {errorMessage}
            </p>
          </div>
          <div className="flex items-center p-6 space-x-2 rounded-b border-t dark:border-gray-600">
            <button
              onClick={() => navigate(-1)}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDialog;
