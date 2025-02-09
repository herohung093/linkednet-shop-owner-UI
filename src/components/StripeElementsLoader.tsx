import React from "react";
import { useElements } from "@stripe/react-stripe-js";
import CheckoutForm, { CheckoutFormProps } from "./CheckoutForm";

interface Props {
  checkoutFormProps: CheckoutFormProps;
}

export default function StripeElementsLoader({ checkoutFormProps }: Props) {
  const elements = useElements();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Set loading to false once elements are available
    if (elements) {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [elements]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 text-sm">Loading payment form...</p>
      </div>
    );
  }

  return <CheckoutForm {...checkoutFormProps} />;
}
