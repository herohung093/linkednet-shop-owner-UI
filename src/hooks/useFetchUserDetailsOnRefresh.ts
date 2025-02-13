import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUserDetails } from "../redux toolkit/userDetailsSlice";
import { axiosWithToken } from "../utils/axios";

const useFetchUserDetailsOnRefresh = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const response = await axiosWithToken.get("/user/info");
          if (response.status === 200) {
            dispatch(setUserDetails(response.data));
          }
        }
      } catch (error) {
        console.error("Failed to fetch user details on refresh:", error);
      }
    };

    fetchUserDetails();
  }, [dispatch]);
};

export default useFetchUserDetailsOnRefresh;
