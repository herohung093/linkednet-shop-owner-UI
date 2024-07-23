import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../utils/axios";

const ResetPasswordVerificationPage: React.FC = () => {
	const [verificationCode, setVerificationCode] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const navigate = useNavigate();

	const handleVerificationSubmit = async () => {
		try {
			const response = await axiosInstance.get("/auth/user/verify-reset-password-token", {
				params: { token: verificationCode },
			});
			sessionStorage.setItem("authToken", response.data.token);
			sessionStorage.setItem("refreshToken", response.data.refreshToken);
			navigate("/password-reset", { replace: true });
		} catch (error) {
			console.error("Error:", error);
			setErrorMessage("Invalid verification code. Please try again.");
		}
	};

	const isVerificationCodeValid = verificationCode.trim() !== "";

	return (
		<div className="flex flex-col items-center justify-center min-h-screen">
			<div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-3">
				<h2 className="text-2xl font-bold mb-6 text-center">Reset Password Verification</h2>
				<p className="mb-6 text-center">
					A verification code has been sent to your email. Please enter the code below to verify your identity.
				</p>
				<input
					type="text"
					value={verificationCode}
					onChange={(e) => setVerificationCode(e.target.value)}
					className="w-full mb-4 p-2 border border-gray-300 rounded"
					placeholder="Enter verification code"
				/>
				{errorMessage && (
					<p className="text-red-500 text-sm mb-4">{errorMessage}</p>
				)}
				<button
					onClick={handleVerificationSubmit}
					disabled={!isVerificationCodeValid}
					className={`w-full flex justify-center items-center h-[40px] ${!isVerificationCodeValid ? "bg-gray-400" : "bg-slate-900 hover:bg-slate-700"
						} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
				>
					Verify
				</button>
			</div>
		</div>
	);
};

export default ResetPasswordVerificationPage;