import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePayment from "../components/StripePayment";
import { axiosWithToken } from "../utils/axios";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { CreditCard as CreditCardIcon } from "@mui/icons-material";
import ActionResultDialog from "../components/dialogs/ActionResultDialog";
import moment from "moment";
import { TransitionProps } from "@mui/material/transitions";
import Slide from "@mui/material/Slide";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_API_KEY);

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UpdatePaymentPage: React.FC = () => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [resultDialogType, setResultDialogType] = useState<
    "success" | "failure"
  >("success");
  const [resultDialogMessage, setResultDialogMessage] = useState("");
  const [openTrialEndDialog, setOpenTrialEndDialog] = useState(false);

  const navigate = useNavigate();
  const userDetails = useSelector(
    (state: RootState) => state.userDetails.userDetails
  );

  const isCardExpired = (expMonth: number, expYear: number): boolean => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
    const currentYear = today.getFullYear();

    // Convert 2-digit year to 4-digit year if necessary
    const fullYear = expYear < 100 ? 2000 + expYear : expYear;

    return (
      fullYear < currentYear ||
      (fullYear === currentYear && expMonth < currentMonth)
    );
  };

  useEffect(() => {
    const fetchPaymentMethod = async () => {
      if (!userDetails?.stripeCustomerId) {
        const trialEndDate = moment(userDetails?.trialEndDate, "DD/MM/YYYY HH:mm");
        if (trialEndDate.isBefore(moment())) {
          setOpenTrialEndDialog(true);
        } else {
          setShowPaymentForm(true);
        }
        setLoading(false);
        return;
      }

      try {
        const response = await axiosWithToken.get(
          `/payment/payment-methods/${userDetails.stripeCustomerId}`
        );
        setPaymentMethod(response.data);
        setShowPaymentForm(false);
      } catch (error) {
        console.error("Error fetching payment method:", error);
        setShowPaymentForm(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethod();
  }, [userDetails?.stripeCustomerId, userDetails?.trialEndDate]);

  const handlePaymentSuccess = async (paymentMethod: any) => {
    try {
      if (userDetails?.stripeCustomerId) {
        // Update existing payment method
        const response = await axiosWithToken.put(
          "/payment/update-payment-method",
          null,
          {
            params: {
              stripeCustomerId: userDetails.stripeCustomerId,
              paymentMethodId: paymentMethod.id,
            },
          }
        );
        if (response.status === 200) {
          setPaymentMethod(paymentMethod);
          setResultDialogType("success");
          setResultDialogMessage("Payment method updated successfully");
        }
      } else {
        // Create new customer with payment method
        const response = await axiosWithToken.put(
          "/user/update-stripe-customer-id",
          null,
          {
            params: {
              stripePaymentMethodId: paymentMethod.id,
            },
          }
        );
        if (response.status === 200) {
          setPaymentMethod(paymentMethod);
          setResultDialogType("success");
          setResultDialogMessage("Payment method added successfully");
        }
      }
    } catch (error) {
      setResultDialogType("failure");
      setResultDialogMessage(
        "Failed to update payment method. Please try again."
      );
    } finally {
      setOpenResultDialog(true);
      setShowPaymentForm(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Payment Details
        </Typography>

        {paymentMethod && !showPaymentForm ? (
          <Box sx={{ mt: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
                p: 3,
                border: "1px solid",
                borderColor: isCardExpired(
                  paymentMethod.card.expMonth,
                  paymentMethod.card.expYear
                )
                  ? "error.main"
                  : "divider",
                borderRadius: 2,
                backgroundColor: isCardExpired(
                  paymentMethod.card.expMonth,
                  paymentMethod.card.expYear
                )
                  ? "error.lighter"
                  : "transparent",
              }}
            >
              <CreditCardIcon
                fontSize="large"
                color={
                  isCardExpired(
                    paymentMethod.card.expMonth,
                    paymentMethod.card.expYear
                  )
                    ? "error"
                    : "action"
                }
              />
              <Box>
                <Typography variant="h6">
                  •••• •••• •••• {paymentMethod.card.last4}
                </Typography>
                <Typography
                  color={
                    isCardExpired(
                      paymentMethod.card.expMonth,
                      paymentMethod.card.expYear
                    )
                      ? "error"
                      : "text.secondary"
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  Expires {paymentMethod.card.expMonth}/
                  {paymentMethod.card.expYear}
                  {isCardExpired(
                    paymentMethod.card.expMonth,
                    paymentMethod.card.expYear
                  ) && (
                    <Chip
                      label="Expired"
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              onClick={() => setShowPaymentForm(true)}
              color={
                isCardExpired(
                  paymentMethod.card.expMonth,
                  paymentMethod.card.expYear
                )
                  ? "error"
                  : "primary"
              }
              startIcon={<CreditCardIcon />}
              sx={{ mt: 2 }}
            >
              {isCardExpired(
                paymentMethod.card.expMonth,
                paymentMethod.card.expYear
              )
                ? "Update Expired Card"
                : "Update Payment Method"}
            </Button>
          </Box>
        ) : (
          <Elements stripe={stripePromise}>
            <StripePayment onPaymentSuccess={handlePaymentSuccess} />
          </Elements>
        )}
      </Paper>

      <ActionResultDialog
        open={openResultDialog}
        onClose={() => {
          setOpenResultDialog(false);
          if (resultDialogType === "success") {
            navigate("/dashboard");
          }
        }}
        message={resultDialogMessage}
        type={resultDialogType}
      />

      <Dialog
        open={openTrialEndDialog}
        TransitionComponent={Transition}
        onClose={() => setOpenTrialEndDialog(false)}
      >
        <DialogTitle>Trial Period Ended</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Your trial period has ended. To continue receiving bookings, please update your payment details.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setOpenTrialEndDialog(false)}
            sx={{ mt: 2 }}
          >
            Update Payment Details
          </Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default UpdatePaymentPage;
