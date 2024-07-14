import "./App.css";
import Main from "./layout/Main.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
import StaffsPage from "./pages/StaffsPage.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import googleOAuthConfig from "./config/googleOAuthConfig";
import SignUpPage from "./pages/SignupPage.tsx";
import ServiceTypePage from "./pages/ServiceTypePage.tsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route>
        <Route path="/" element={<LoginPage></LoginPage>}></Route>
        <Route path="/signup" element={<SignUpPage></SignUpPage>}></Route>
      </Route>
      <Route path="/" element={<Main />}>
        <Route
          path="dashboard"
          element={<DashboardPage></DashboardPage>}
        ></Route>
        <Route path="staffs" element={<StaffsPage></StaffsPage>}></Route>
        <Route path="service-type" element={<ServiceTypePage></ServiceTypePage>}></Route>
      </Route>
    </Route>
  )
);

function App() {
  return (
    <GoogleOAuthProvider clientId={googleOAuthConfig.clientId}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}

export default App;
