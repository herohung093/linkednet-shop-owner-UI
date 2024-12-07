import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, PaymentMethod } from "@stripe/stripe-js";
import StripePayment from "../components/StripePayment";
import { axiosWithToken } from "../utils/axios";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import ResponsiveBox from "../components/ResponsiveBox";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import ActionResultDialog from "../components/dialogs/ActionResultDialog";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_API_KEY);

const UpdatePaymentPage: React.FC = () => {
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState<{
    last4: string;
    expMonth: number;
    expYear: number;
  } | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [resultDialogType, setResultDialogType] = useState<
    "success" | "failure"
  >("success");

  const navigate = useNavigate();
  const userDetails = useSelector(
    (state: RootState) => state.userDetails.userDetails
  );

  useEffect(() => {
    if (userDetails?.stripeCustomerId) {
      navigate("/dashboard");
    } else {
      setOpenDialog(true);
    }
  }, [userDetails]);

  const handlePaymentSuccess = async (paymentMethod: PaymentMethod) => {
    setPaymentMethodId(paymentMethod.id);

    if (paymentMethod.card) {
      setCardDetails({
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      });
    }

    // Update payment method on the server
    try {
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
        setResultDialogType("success");
      }
    } catch (error) {
      setPaymentMethodId(null);
      setResultDialogType("failure");
    } finally {
      setOpenResultDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCloseResultDialog = () => {
    if (resultDialogType === "success") {
      navigate("/dashboard");
    } else {
      setOpenResultDialog(false);
    }
  };

  return (
    <ResponsiveBox
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Elements stripe={stripePromise}>
        <div>
          {paymentMethodId && cardDetails ? (
            <div>
              <p>Card ending in **** **** **** {cardDetails.last4}</p>
              <p>
                Expires {cardDetails.expMonth}/{cardDetails.expYear}
              </p>
            </div>
          ) : (
            <StripePayment onPaymentSuccess={handlePaymentSuccess} />
          )}
        </div>
      </Elements>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Missing Payment Details</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your account is missing payment details. Please add your payment
            information to continue.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <ActionResultDialog
        open={openResultDialog}
        onClose={handleCloseResultDialog}
        message={
          resultDialogType == "success"
            ? "Payment details has been added successfully"
            : "Something wrong! Please try again!"
        }
        type={resultDialogType}
      />
    </ResponsiveBox>
  );
};

export default UpdatePaymentPage;
