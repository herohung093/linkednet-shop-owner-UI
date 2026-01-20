import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import ForgotPasswordDialog from "../components/ForgotPasswordDialog";
import { useNavigate } from "react-router-dom";
import CustomGoogleLoginButton from "../components/CustomGoogleLoginButton";
import useAuthResonse from "../hooks/useAuthResponse";
import { useDispatch } from "react-redux";
import { setStoresList } from "../redux toolkit/storesListSlice";
import { axiosInstance } from "../utils/axios";
import isTokenExpired from "../helper/CheckTokenExpired";
import { setSelectedStoreRedux } from "../redux toolkit/selectedStoreSlice";
import LoadingButton from "@mui/lab/LoadingButton";
import { CircularProgress } from "@mui/material";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleAuthResponse = useAuthResonse();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (authToken && !isTokenExpired(authToken)) {
      navigate("/dashboard");
    } else if (refreshToken && !isTokenExpired(refreshToken)) {
      refreshAuthToken(refreshToken);
    }
  }, [navigate]);

  const refreshAuthToken = async (refreshToken: string) => {
    try {
      const response = await axiosInstance.post("/auth/refresh-token", {
        refreshToken,
      });
      if (response.status === 200) {
        handleAuthResponse(response.data.token, response.data.refreshToken);
      } else {
        console.log("Failed to refresh token.");
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      email: email,
      password: password,
    };

    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/authenticate", payload);

      if (response.status === 200) {
        const storeListSorted = response?.data?.storeConfig.sort(
          (a: any, b: any) => a.id - b.id
        );
        if (storeListSorted[0]) {
          dispatch(setSelectedStoreRedux(storeListSorted[0].storeUuid));
          localStorage.setItem("storeUuid", storeListSorted[0].storeUuid);
        }
        handleAuthResponse(response.data.token, response.data.refreshToken);
        setEmail("");
        setPassword("");
        dispatch(setStoresList(response?.data?.storeConfig));
        navigate("/dashboard");
      } else {
        throw new Error("Failed to submit booking.");
      }
      setLoading(false);
    } catch (error: any) {
      setError(true);
      setLoading(false);
      if (error?.response?.status === 461) {
        setErrorMessage(
          "User email has not been activated. Please check your email to activate your account."
        );
      } else {
        setErrorMessage("Invalid username or password");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="relative text-center mb-12">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">
          <span className="inline-block transform hover:scale-105 transition-transform duration-200">
            {t("loginPage.page.title")}
          </span>
        </h1>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-white rounded-full opacity-75"></div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-blue-300 rounded-full animate-pulse"></div>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md mx-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              spellCheck="false"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              required
            />
          </div>
          <div
            className={`text-red-600 text-sm ${!error && "hidden"}`}
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </div>
          <LoadingButton
            type="submit"
            variant="contained"
            fullWidth
            loading={loading}
            loadingIndicator={<CircularProgress style={{ color: "white" }} size={24} />}
            sx={{
              py: 2,
              backgroundColor: "black",
              color: "white",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
              },
            }}
          >
            Login
          </LoadingButton>
          <div className="w-full">
            <CustomGoogleLoginButton
              updateLoading={setLoading}
              className="py-2 px-3 border rounded-lg shadow-md hover:shadow-lg transition-shadow"
            />
          </div>
          <div className="mt-4 text-center">
            <ForgotPasswordDialog />
          </div>
        </form>
      </div>
      <div className="flex flex-col items-center mt-6 space-y-4">
        <div className="text-white">Or</div>
        <button
          onClick={() => navigate("/signup")}
          className="w-64 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          Join Us Now
        </button>
      </div>
      <div className="flex justify-between w-full px-6 mt-8 text-white text-sm">
        <div>
          <button
            onClick={() => changeLanguage('en')}
            className="mr-4 hover:text-blue-200"
            aria-label="Switch to English"
          >
            English
          </button>
          <button
            onClick={() => changeLanguage('vi')}
            className="hover:text-blue-200"
            aria-label="Switch to Vietnamese"
          >
            Tiếng Việt
          </button>
        </div>
        <div className="flex space-x-6">
          <a href="https://linkednet.com.au/support" className="hover:text-blue-200">Support</a>
          <a href="https://linkednet.com.au/privacy" className="hover:text-blue-200">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;