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
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
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

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  return (
    <div className="relative lg:grid lg:grid-cols-2">
      <div>
        <img
          src="https://media.istockphoto.com/id/618331956/photo/staying-connected.jpg?s=1024x1024&w=is&k=20&c=bim23K-awtDZLZRJacck6To1s0-Dua_tVnpa6pcLRk8="
          alt="shop-owner"
          className="object-cover w-full h-full hidden lg:block"
        />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-2xl text-slate-900 -mt-20 mb-10">Join Us Now</div>
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-3">
          <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
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
                  <div className="mb-4">
                    <TextField
                      {...field}
                      required
                      id="firstName"
                      label="First Name"
                      variant="outlined"
                      fullWidth
                      error={!!errors.firstName}
                      helperText={
                        errors.firstName ? errors.firstName.message : ""
                      }
                      inputProps={{ maxLength: 50 }}
                    />
                  </div>
                )}
              />
            </div>
            <div className="mb-4">
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
                  <div className="mb-4">
                    <TextField
                      {...field}
                      id="lastName"
                      required
                      label="Last Name"
                      variant="outlined"
                      fullWidth
                      error={!!errors.lastName}
                      helperText={
                        errors.lastName ? errors.lastName.message : ""
                      }
                      inputProps={{ maxLength: 50 }}
                    />
                  </div>
                )}
              />
            </div>
            <div className="mb-4">
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email number is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Please enter a valid email",
                  },
                }}
                render={({ field }) => (
                  <div className="mb-4">
                    <TextField
                      {...field}
                      id="email"
                      required
                      label="Email"
                      variant="outlined"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email ? errors.email.message : ""}
                    />
                  </div>
                )}
              />
            </div>
            <div className="mb-6">
              <Controller
                name="password"
                control={control}
                rules={{
                  required: "Please enter a password",
                  minLength: {
                    value: 10,
                    message: "Password must be at least 10 characters",
                  },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{10,}$/,
                    message: "Password must contain both letters and digits",
                  },
                }}
                render={({ field }) => (
                  <FormControl
                    variant="outlined"
                    fullWidth
                    error={!!errors.password}
                  >
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <OutlinedInput
                      {...field}
                      id="password"
                      required
                      label="Password"
                      inputProps={{ minLength: 10 }}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        field.onChange(target.value);
                      }}
                      type={showPassword ? "text" : "password"}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            onMouseUp={handleMouseUpPassword}
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
            <div className="mb-6">
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
                    <InputLabel htmlFor="confirmPassword">
                      Confirm Password
                    </InputLabel>
                    <OutlinedInput
                      {...field}
                      id="confirmPassword"
                      required
                      label="Confirm Password"
                      inputProps={{ minLength: 10 }}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        field.onChange(target.value);
                      }}
                      type={showPassword ? "text" : "password"}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            onMouseUp={handleMouseUpPassword}
                            edge="end"
                          >
                          </IconButton>
                        </InputAdornment>
                      }
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
            <div className={`mb-4 text-red-700 ${!error && "hidden"} `}>
              {errorMessage}
            </div>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%", // Ensure the Box takes the full height of its container
              }}
            >
              <LoadingButton
                type="submit"
                variant="contained" // Use 'contained' to have a solid background color
                className="w-full flex justify-center items-center h-[40px] focus:outline-none focus:shadow-outline"
                loading={loading}
                loadingIndicator={
                  <CircularProgress style={{ color: "white" }} size={24} />
                }
                sx={{
                  backgroundColor: "black",
                  color: "white",
                  textTransform: "none", // Keep the text casing as it is
                  "&:hover": {
                    backgroundColor: "black", // Keep the same background color on hover
                  },
                }}
              >
                Register
              </LoadingButton>
            </Box>
          </form>
        </div>
        <div className="flex flex-col items-center justify-between mt-4 ">
          <div className="mt-4">Or</div>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 mb-4 w-full flex justify-center items-center h-[40px] bg-slate-900 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Log In Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
