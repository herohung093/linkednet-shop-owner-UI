import "./App.css";
import Main from "./layout/Main.tsx";
import StoreSettingPage from "./pages/StoreSettingPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useRouteError,
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
import CreateStorePage from "./pages/CreateStorePage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import EditBookingPage from "./pages/EditBookingPage.tsx";
import ManageCustomersPage from "./pages/ManageCustomersPage.tsx";
import CustomerBookingsHistory from "./components/CustomerBookingsHistory.tsx";
import UpdatePaymentPage from "./pages/UpdatePaymentPage.tsx";
import CreatePromotionPage from "./pages/CreatePromotionPage.tsx";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import PaymentCancel from "./pages/PaymentCancel.tsx";
import ManagePromotionsPage from "./pages/ManagePromotionsPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "store-settings",
        element: <StoreSettingPage />,
      },
      {
        path: "services",
        element: <ServiceTypePage />,
      },
      {
        path: "create-store",
        element: <CreateStorePage />,
      },
      {
        path: "manage-bookings",
        element: <ManageReservationsPage />
      },
      {
        path: "manage-customers",
        element: <ManageCustomersPage />
      },
      {
        path: "customer-bookings-history/:customerId",
        element: <CustomerBookingsHistory />,
      },
      {
        path: "staff",
        element: <StaffsPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignUpPage />,
      },
      {
        path: "session-expired",
        element: <SessionExpired />,
      },
      {
        path: "email-confirmation",
        element: <EmailConfirmationPage />,
      },
      {
        path: "reset-password-verification",
        element: <ResetPasswordVerificationPage />,
      },
      {
        path: "password-reset",
        element: <PasswordResetPage />,
      },
      {
        path: "edit-booking",
        element: <EditBookingPage />,
      },
      {
        path: "update-payment-details",
        element: <UpdatePaymentPage />,
      },
      {
        path: "create-promotion",
        element: <CreatePromotionPage />,
      },

      {
        path: "manage-promotions",
        element: <ManagePromotionsPage />,
      },
      {
        path: "/payment/success",
        element: <PaymentSuccess />
      },
      {
        path: "/payment/cancel",
        element: <PaymentCancel />
      },
      {
        path: "404",
        element: <NotFoundPage />, // Add the NotFoundPage route
      },
      {
        path: '*',
        element: <Navigate to="/404" replace />,
      },
    ],
  },
]);

function App() {
  
  return (
    <GoogleOAuthProvider clientId={googleOAuthConfig.clientId}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}

function RouteErrorBoundary() {
  const error = useRouteError();
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
    {/* <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" /> */}
    <h1 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h1>
    <p className="text-gray-600 mb-4">
      We're sorry, but something unexpected happened. Please try refreshing the page.
    </p>
  </div>
</div>;
}

export default App;
