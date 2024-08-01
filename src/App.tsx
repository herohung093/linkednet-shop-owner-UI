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
import SessionExpired from "./pages/SessionExpiredPage.tsx";
import EmailConfirmationPage from "./pages/EmailConfirmationPage.tsx";
import ResetPasswordVerificationPage from "./pages/ResetPasswordVerificationPage.tsx";
import PasswordResetPage from "./pages/PasswordResetPage.tsx";
import ManageReservationsPage from "./pages/ManageReservationsPage.tsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route>
        <Route path="/" element={<LoginPage></LoginPage>}></Route>
        <Route path="/signup" element={<SignUpPage></SignUpPage>}></Route>
        <Route path="/email-confirmation" element={<EmailConfirmationPage></EmailConfirmationPage>}></Route>
        <Route path="/reset-password-verification" element={<ResetPasswordVerificationPage></ResetPasswordVerificationPage>}></Route>
        <Route path="/manage-reservations" element={<ManageReservationsPage />} />
        <Route path="/password-reset" element={<PasswordResetPage></PasswordResetPage>}></Route>
          <Route
          path="session-expired"
          element={<SessionExpired></SessionExpired>}
        ></Route>
      </Route>
      <Route path="/" element={<Main />}>
        <Route
          path="dashboard"
          element={<DashboardPage></DashboardPage>}
        ></Route>
        <Route path="staffs" element={<StaffsPage></StaffsPage>}></Route>
        <Route
          path="services"
          element={<ServiceTypePage></ServiceTypePage>}
        ></Route>
      
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
