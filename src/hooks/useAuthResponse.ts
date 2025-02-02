import { useNavigate } from "react-router";
import { axiosWithToken } from "../utils/axios";
import { useDispatch } from "react-redux";
import { setUserDetails } from "../redux toolkit/userDetailsSlice";
import moment from "moment";

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

    // Check trialEndDate against the current date
    const trialEnd = moment(userDetailsResponse.data.trialEndDate, "dd/mm/yyyy hh:mm:ss");
    if (!userDetailsResponse.data.stripeCustomerId && trialEnd.isSameOrBefore(moment())) {
      navigate("/update-payment-details");
    } else {
      navigate("/dashboard");
    }
  };

  return authenticateAndRedirect;
};

export default useAuthResonse;
