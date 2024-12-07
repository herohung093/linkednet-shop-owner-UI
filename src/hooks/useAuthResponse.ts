import { useNavigate } from "react-router";
import { axiosWithToken } from "../utils/axios";
import { useDispatch } from "react-redux";
import { setUserDetails } from "../redux toolkit/userDetailsSlice";

const useAuthResonse = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authenticateAndRedirect = async (
    token: string,
    refreshToken: string
  ) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("refreshToken", refreshToken);

    // Fetch user details
    const userDetailsResponse = await axiosWithToken.get("/user/info");
    if (userDetailsResponse.status === 200) {
      const userDetails = userDetailsResponse.data;
      dispatch(setUserDetails(userDetails));
    } else {
      throw new Error("Failed to fetch user details.");
    }

    if (!userDetailsResponse.data.stripeCustomerId) {
      navigate("/update-payment-details");
    } else {
      navigate("/dashboard");
    }

  };

  return authenticateAndRedirect;
};

export default useAuthResonse;
