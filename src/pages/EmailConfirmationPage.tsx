// src/pages/EmailConfirmationPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const EmailConfirmationPage: React.FC = () => {
    const navigate = useNavigate();

    const handleLoginRedirect = () => {
        navigate("/", { replace: true });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-3">
                <h2 className="text-2xl font-bold mb-6 text-center">Email Confirmation</h2>
                <p className="mb-6 text-center">
                    Please check your email to confirm your email address. You cannot log in until your email address is confirmed.
                </p>
                <button
                    onClick={handleLoginRedirect}
                    className="w-full flex justify-center items-center h-[40px] bg-slate-900 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    Go to Login
                </button>
            </div>
        </div>
    );
};

export default EmailConfirmationPage;