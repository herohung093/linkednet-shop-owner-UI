// src/components/StripePayment.tsx
import React, { useState } from 'react';
import { CardElement, useStripe, useElements, AddressElement } from '@stripe/react-stripe-js';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { PaymentMethod } from '@stripe/stripe-js';

interface StripePaymentProps {
  onPaymentSuccess: (paymentMethod: PaymentMethod) => void;
}

const StripePayment: React.FC<StripePaymentProps> = ({ onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setError(null);

    const cardElement = elements.getElement(CardElement);
    const addressElement = elements.getElement(AddressElement);

    // Fetch address details from AddressElement
    if (!addressElement) {
      alert('Address element not found.');
      setLoading(false);
      return;
    }
    const { complete, value: billingDetails } = await addressElement.getValue();

    if (!complete) {
      return;
    }

    setLoading(true);

    if (cardElement) {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: billingDetails.name,
          address: {
            line1: billingDetails.address.line1,
            line2: billingDetails.address.line2,
            city: billingDetails.address.city,
            state: billingDetails.address.state,
            postal_code: billingDetails.address.postal_code,
            country: billingDetails.address.country,
          },
        },
      });

      if (error) {
        setError(error.message || 'An unknown error occurred');
      } else {
        onPaymentSuccess(paymentMethod);
      }
    }

    setLoading(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
    hidePostalCode: true,
    disableLink: true,
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Card Details
      </Typography>
      <CardElement options={cardElementOptions} />
      <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Billing Details
      </Typography>
        <AddressElement options={{
            mode: 'billing',
            allowedCountries: ['AU'],
          }} />
      </Box>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Button type="button" variant="contained" color="secondary" sx={{ mt: 2, fontSize: '0.75rem', padding: '4px 8px', minWidth: 'auto' }} disabled={loading} onClick={handleSubmit}>
        {loading ? <CircularProgress size={24} /> : 'Save Payment Details'}
      </Button>
    </Box>
  );
};

export default StripePayment;