import { useState } from "react";
import { axiosInstance } from "../utils/axios";
import { useNavigate } from "react-router";
import { Spinner } from "@radix-ui/themes";

const SignUpPage: React.FC = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      firstName,
      lastName,
      email,
      password,
    };
    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/register", payload);

      if (response.status === 200) {
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        navigate("/email-confirmation", { replace: true });
      } else {
        throw new Error("Failed to submit booking.");
      }
      setLoading(false);
    } catch (error: any) {
      setError(true);
      setErrorMessage(error.response.data.message);
      setLoading(false);
    }
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
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="firstName"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="lastName"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className={`mb-4 text-red-700 ${!error && "hidden"} `}>
              {errorMessage}
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="w-full flex justify-center items-center h-[40px] bg-slate-900 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {loading ? <Spinner size={"3"} /> : "Sign Up"}
              </button>
            </div>
          </form>
        </div>
        <div className="flex flex-col items-center justify-between mt-4 ">
          <div className="mt-4">Or</div>
          <button
            onClick={() => navigate("/")}
            className="mt-4 w-full flex justify-center items-center h-[40px] bg-slate-900 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Log In Now
          </button>
        </div>
        <div className="cursor-pointer absolute bottom-8">
          Language - Support - Privacy Policy
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
