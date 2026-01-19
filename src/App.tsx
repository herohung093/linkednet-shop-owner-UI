import "./App.css";
import { lazy, Suspense } from "react";
import Main from "./layout/Main.tsx";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useRouteError,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import googleOAuthConfig from "./config/googleOAuthConfig";
import useFetchUserDetailsOnRefresh from "./hooks/useFetchUserDetailsOnRefresh";

// Lazy load all route components for better code splitting
const LoginPage = lazy(() => import("./pages/LoginPage.tsx"));
const SignUpPage = lazy(() => import("./pages/SignupPage.tsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.tsx"));
const StoreSettingPage = lazy(() => import("./pages/StoreSettingPage.tsx"));
const ManageStoreClosedDatePage = lazy(() => import("./pages/ManageStoreClosedDatePage.tsx"));
const ManagePhotosPage = lazy(() => import("./pages/ManagePhotosPage.tsx"));
const ServiceTypePage = lazy(() => import("./pages/ServiceTypePage.tsx"));
const CreateStorePage = lazy(() => import("./pages/CreateStorePage.tsx"));
const ManageReservationsPage = lazy(() => import("./pages/ManageReservationsPage.tsx"));
const ManageCustomersPage = lazy(() => import("./pages/ManageCustomersPage.tsx"));
const CustomerBookingsHistory = lazy(() => import("./components/CustomerBookingsHistory.tsx"));
const StaffsPage = lazy(() => import("./pages/StaffsPage.tsx"));
const SessionExpired = lazy(() => import("./pages/SessionExpiredPage.tsx"));
const EmailConfirmationPage = lazy(() => import("./pages/EmailConfirmationPage.tsx"));
const ResetPasswordVerificationPage = lazy(() => import("./pages/ResetPasswordVerificationPage.tsx"));
const PasswordResetPage = lazy(() => import("./pages/PasswordResetPage.tsx"));
const EditBookingPage = lazy(() => import("./pages/EditBookingPage.tsx"));
const UpdatePaymentPage = lazy(() => import("./pages/UpdatePaymentPage.tsx"));
const CreatePromotionPage = lazy(() => import("./pages/CreatePromotionPage.tsx"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess.tsx"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel.tsx"));
const ManagePromotionsPage = lazy(() => import("./pages/ManagePromotionsPage.tsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.tsx"));

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Loading...
  </div>
);

// Helper to wrap lazy components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "dashboard",
        element: withSuspense(DashboardPage),
      },
      {
        path: "store-settings",
        element: withSuspense(StoreSettingPage),
      },
      {
        path: "manage-store-closed-dates",
        element: withSuspense(ManageStoreClosedDatePage),
      },
      {
        path: "manage-photos",
        element: withSuspense(ManagePhotosPage),
      },
      {
        path: "services",
        element: withSuspense(ServiceTypePage),
      },
      {
        path: "create-store",
        element: withSuspense(CreateStorePage),
      },
      {
        path: "manage-bookings",
        element: withSuspense(ManageReservationsPage),
      },
      {
        path: "manage-customers",
        element: withSuspense(ManageCustomersPage),
      },
      {
        path: "customer-bookings-history/:customerId",
        element: withSuspense(CustomerBookingsHistory),
      },
      {
        path: "staff",
        element: withSuspense(StaffsPage),
      },
      {
        path: "login",
        element: withSuspense(LoginPage),
      },
      {
        path: "/",
        element: <Main />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            index: true,
            element: <Navigate to="/login" replace />,
          },
        ],
      },
      {
        path: "signup",
        element: withSuspense(SignUpPage),
      },
      {
        path: "session-expired",
        element: withSuspense(SessionExpired),
      },
      {
        path: "email-confirmation",
        element: withSuspense(EmailConfirmationPage),
      },
      {
        path: "reset-password-verification",
        element: withSuspense(ResetPasswordVerificationPage),
      },
      {
        path: "password-reset",
        element: withSuspense(PasswordResetPage),
      },
      {
        path: "edit-booking",
        element: withSuspense(EditBookingPage),
      },
      {
        path: "update-payment-details",
        element: withSuspense(UpdatePaymentPage),
      },
      {
        path: "create-promotion",
        element: withSuspense(CreatePromotionPage),
      },

      {
        path: "manage-promotions",
        element: withSuspense(ManagePromotionsPage),
      },
      {
        path: "/payment/success",
        element: withSuspense(PaymentSuccess),
      },
      {
        path: "/payment/cancel",
        element: withSuspense(PaymentCancel),
      },
      {
        path: "404",
        element: withSuspense(NotFoundPage),
      },
      {
        path: "*",
        element: <Navigate to="/404" replace />,
      },
    ],
  },
]);

function App() {
  useFetchUserDetailsOnRefresh();

  return (
    <GoogleOAuthProvider clientId={googleOAuthConfig.clientId}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}

function RouteErrorBoundary() {
  const error = useRouteError();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {/* <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" /> */}
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mb-4">
          We're sorry, but something unexpected happened. Please try refreshing
          the page.
        </p>
      </div>
    </div>
  );
}

export default App;
