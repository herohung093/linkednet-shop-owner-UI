import React, { useEffect, useState } from "react";
import { DollarSign, Users } from "lucide-react";
import { axiosWithToken } from "../utils/axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router";
import moment from "moment";
import StripeElementsLoader from "./StripeElementsLoader";
import PaymentErrorDialog from "./PaymentErrorDialog";

interface Props {
  promotion: PromotionCampaign;
}

interface PaymentDetails {
  totalCustomers: number;
  pricePerMessage: number;
  totalCost: number;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_API_KEY);

export default function PromotionPaymentForm({ promotion }: Props) {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API call to calculate costs
    const calculateCosts = async () => {
      setLoading(true);
      try {
        const response = await axiosWithToken.get(
          `/promotion-campaigns/costCalculation/${promotion.customers.length}`
        );
        const totalCost = response.data;
        const pricePerMessage = totalCost / promotion.customers.length;
        setPaymentDetails({
          totalCustomers: promotion.customers.length,
          pricePerMessage: pricePerMessage,
          totalCost: totalCost,
        });
      } catch (error) {
        console.error("Error calculating costs:", error);
      } finally {
        setLoading(false);
      }
    };

    calculateCosts();
  }, [promotion.customers.length]);

  useEffect(() => {
    if (!paymentDetails) return;
    const initializeStripe = async () => {
      try {
        // Initialize Stripe Elements
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error("Stripe failed to initialize");
        }

        const response = await axiosWithToken.post(
          `/payment/create-checkout-intent`,
          {
            amount: paymentDetails.totalCost,
            description: promotion.campaignName,
          }
        );

        if (response.status !== 200)
          throw new Error("Failed to create authorized payment");
        const { clientSecret } = response.data;

        setClientSecret(clientSecret);
      } catch (error) {
        setPaymentError((error as Error).message);
      }
    };
    initializeStripe();
  }, [paymentDetails]);

  // Handle cancel button click
  const handleCancel = () => {
    navigate("/payment/cancel");
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const response = await axiosWithToken.post(`/promotion-campaigns`, {
        promotionCode: promotion.promotionCode,
        campaignName: promotion.campaignName,
        promotionMessage: promotion.promotionMessage,
        messageSendTime: moment(promotion.messageSendTime).format(
          "DD/MM/YYYY HH:mm"
        ),
        customers: promotion.customers.map((customer) => {
          return { id: customer.id };
        }),
        paymentIntentId,
      });

      if (response.status !== 201) {
        setPaymentProcessing(false);
        setPaymentError("Failed to create promotion campaign. Any charges will be refunded.");
        return;
      }
      navigate("/payment/success");
    } catch (error) {
      setPaymentProcessing(false);
      setPaymentError("Failed to create promotion campaign. Any charges will be refunded.");
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {/* <PaymentErrorDialog errorMessage={paymentError} /> */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Details
        </h2>
        <p className="text-gray-600">
          Review and complete your promotion campaign payment
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Campaign Summary
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Users size={20} className="text-gray-400" />
                <span className="text-gray-600">Total Recipients</span>
              </div>
              <span className="font-medium">
                {paymentDetails?.totalCustomers}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <DollarSign size={20} className="text-gray-400" />
                <span className="text-gray-600">Price per Message</span>
              </div>
              <span className="font-medium">
                ${paymentDetails?.pricePerMessage.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 text-lg font-semibold">
              <span>Total Cost</span>
              <span>${paymentDetails?.totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {clientSecret && (
          <div className="p-6 bg-gray-50 min-h-[300px]">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#2563eb",
                    colorBackground: "#ffffff",
                    colorText: "#1f2937",
                    colorDanger: "#dc2626",
                    fontFamily: "system-ui, sans-serif",
                    spacingUnit: "4px",
                    borderRadius: "8px",
                  },
                },
              }}
            >
              <StripeElementsLoader
                checkoutFormProps={{
                  paymentProcessing,
                  setPaymentProcessing,
                  paymentError,
                  setPaymentError,
                  onSuccess: (paymentIntentId) => {
                    handlePaymentSuccess(paymentIntentId);
                  },
                  onCancel: handleCancel,
                  amount: paymentDetails?.totalCost || 0,
                }}
              />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}
