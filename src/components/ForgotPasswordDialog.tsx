import React, { useState } from "react";
import { axiosInstance } from "../utils/axios";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router";

const ForgotPasswordDialog: React.FC = () => {
	const [email, setEmail] = useState("");
	const navigate = useNavigate();

	const handleNextClick = async () => {
		try {
			await axiosInstance.get("/auth/user/resetPassword", {
				params: { email }
			});
			navigate("/reset-password-verification", { replace: true });
		} catch (error) {
			console.error("Error:", error);
		}
	};

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<button className="">Reset your password?</button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-black opacity-50 data-[state=open]:animate-overlayShow fixed inset-0" />
				<Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] lg:left-[25%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
					<Dialog.Title className="text-mauve12 m-0 text-[17px] mb-10 flex justify-center font-medium my-4">
						Reset your password
					</Dialog.Title>
					<Dialog.Description className="text-mauve11 mt-[10px] mb-3 ml-9 text-[15px] leading-normal">
					</Dialog.Description>
					<fieldset className="mb-[15px] flex items-center gap-5">
						<label
							className="text-violet11 w-[90px] text-center text-[15px]"
							htmlFor="email"
						>
							Email
						</label>
						<input
							className="text-violet11 shadow-violet7 focus:shadow-violet8 inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</fieldset>
					<div className="mt-[25px] flex justify-end">
						<Dialog.Close asChild>
							<button
								onClick={handleNextClick}
								className="bg-slate-900 text-white hover:bg-slate-700 h-[35px] flex items-center justify-center rounded-md px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
							>
								Next
							</button>
						</Dialog.Close>
					</div>
					<Dialog.Close asChild>
						<button
							className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
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