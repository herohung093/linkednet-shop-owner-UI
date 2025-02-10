import { useState } from "react";
import { axiosInstance } from "../utils/axios";
import { useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  OutlinedInput,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUpPage: React.FC = () => {
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
  } = useForm<RegisterForm>();
  const password = watch("password");

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const onSubmit = async (formData: RegisterForm) => {
    setLoading(true);

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    };

    try {
      const response = await axiosInstance.post("/auth/register", payload);

      if (response.status === 200) {
        control._reset();
        navigate("/email-confirmation", { replace: true });
      } else {
        throw new Error("Failed to submit booking.");
      }
      setLoading(false);
    } catch (error: any) {
      setError(true);
      if (error?.response?.data?.message) {
        setErrorMessage(
          "An account with this email may already exist. Please try login or use a different email."
        );
      } else {
        setErrorMessage("Failed to sign up. Please try again later.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="text-4xl text-white font-bold mb-8">Join Us Now</div>
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md mx-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Sign Up</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Controller
              name="firstName"
              control={control}
              rules={{
                required: "First name is required",
                maxLength: {
                  value: 50,
                  message: "First name cannot exceed 50 characters",
                },
              }}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.firstName}
                >
                  <InputLabel htmlFor="firstName" required>
                    First Name
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="firstName"
                    required
                    label="First Name"
                    inputProps={{ maxLength: 50 }}
                  />
                  {errors.firstName && (
                    <Typography color="error">
                      {errors.firstName.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>

          <div>
            <Controller
              name="lastName"
              control={control}
              rules={{
                required: "Last name is required",
                maxLength: {
                  value: 20,
                  message: "Last name cannot exceed 50 characters",
                },
              }}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.lastName}
                >
                  <InputLabel htmlFor="lastName" required>
                    Last Name
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="lastName"
                    required
                    label="Last Name"
                    inputProps={{ maxLength: 50 }}
                  />
                  {errors.lastName && (
                    <Typography color="error">
                      {errors.lastName.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>

          <div>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Please enter a valid email",
                },
              }}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.email}
                >
                  <InputLabel htmlFor="email" required>
                    Email
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="email"
                    required
                    label="Email"
                    type="email"
                  />
                  {errors.email && (
                    <Typography color="error">
                      {errors.email.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>

          <div>
            <Controller
              name="password"
              control={control}
              rules={{
                required: "Please enter a password",
                minLength: {
                  value: 10,
                  message: "Password must be at least 10 characters",
                },
              }}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.password}
                >
                  <InputLabel htmlFor="password" required>
                    Password
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="password"
                    required
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {errors.password && (
                    <Typography color="error">
                      {errors.password.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>

          <div>
            <Controller
              name="confirmPassword"
              control={control}
              rules={{
                required: "Please confirm your password",
                minLength: {
                  value: 10,
                  message: "Password must be at least 10 characters",
                },
                validate: (value) =>
                  value === password || "Passwords do not match",
              }}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.confirmPassword}
                >
                  <InputLabel htmlFor="confirmPassword" required>
                    Confirm Password
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="confirmPassword"
                    required
                    label="Confirm Password"
                    type={showPassword ? "text" : "password"}
                  />
                  {errors.confirmPassword && (
                    <Typography color="error">
                      {errors.confirmPassword.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>

          {error && (
            <Typography color="error" className="text-center">
              {errorMessage}
            </Typography>
          )}

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
            Register
          </LoadingButton>
        </form>
      </div>

      <div className="flex flex-col items-center mt-6 space-y-4">
        <div className="text-white">Or</div>
        <button
          onClick={() => navigate("/login")}
          className="w-64 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          Log In Now
        </button>
      </div>
    </div>
  );
};

export default SignUpPage;