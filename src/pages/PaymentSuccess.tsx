import React from "react";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle size={64} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-4">
          Your promotion campaign has been successfully created and will be sent
          according to the schedule.
        </p>
        <p className="text-gray-600 mb-8">
          You can manage your promotions directly{" "}
          <Link to="/manage-promotions" className="text-blue-600 underline">
            here
          </Link>
          .
        </p>
        <Link
          to="/manage-promotions"
          className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Go to Manage Promotions
        </Link>
      </div>
    </div>
  );
}
