import React from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard } from "lucide-react";

export interface CheckoutFormProps {
  paymentProcessing: boolean;
  setPaymentProcessing: (processing: boolean) => void;
  paymentError: string | null;
  setPaymentError: (error: string | null) => void;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  amount: number;
}

export default function CheckoutForm({
  paymentProcessing,
  setPaymentProcessing,
  paymentError,
  setPaymentError,
  onSuccess,
  onCancel,
  amount,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setPaymentProcessing(true);
    setPaymentError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/payment/success",
      },
      redirect: "if_required",
    });

    if (error) {
      setPaymentError(error.message || "An error occurred during payment");
      setPaymentProcessing(false);
      if (error.type === "card_error" || error.type === "validation_error") {
        setPaymentError(error.message || "An error occurred with your card");
      } else {
        setPaymentError("An unexpected error occurred. Any charges will be refunded. Please try again later.");
      }
    } else {
      // Payment successful - the redirect will happen automatically if required
      onSuccess(paymentIntent?.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement className="bg-white p-4 rounded-lg border border-gray-200" />

      {paymentError && (
        <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={paymentProcessing || !stripe}
        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {paymentProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <>
            <CreditCard size={20} />
            <span>Pay ${amount.toFixed(2)}</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full mt-2 py-2 px-4 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
      >
        Cancel Payment
      </button>

      <p className="text-sm text-gray-500 text-center">
        Powered by Stripe. Your payment information is secure.
      </p>
    </form>
  );
}
