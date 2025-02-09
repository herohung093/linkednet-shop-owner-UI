import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import CustomerSelection from "../components/PromotionCustomerSelection";
import PromotionForm from "../components/PromotionForm";
import PromotionPaymentForm from "../components/PromotionPaymentForm";
// import { Customer, PromotionCampaign } from '../types/global';

type Step = "customers" | "details" | "payment";

export default function CreatePromotionPage() {
  const [currentStep, setCurrentStep] = useState<Step>("customers");
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [promotion, setPromotion] = useState<Partial<PromotionCampaign>>({});

  const handleCustomerSelect = (customers: Customer[]) => {
    setSelectedCustomers(customers);
  };

  const handlePromotionChange = (
    updatedPromotion: Partial<PromotionCampaign>
  ) => {
    setPromotion(updatedPromotion);
  };

  const handlePromotionSubmit = () => {
    const fullPromotion: PromotionCampaign = {
      ...(promotion as PromotionCampaign),
      customers: selectedCustomers,
    };
    setPromotion(fullPromotion);
    setCurrentStep("payment");
  };

  const goBack = () => {
    if (currentStep === "details") setCurrentStep("customers");
    if (currentStep === "payment") setCurrentStep("details");
  };

  const renderStep = () => {
    switch (currentStep) {
      case "customers":
        return (
          <CustomerSelection
            selectedCustomers={selectedCustomers}
            onCustomerSelect={handleCustomerSelect}
          />
        );
      case "details":
        return (
          <PromotionForm
            promotion={promotion}
            onPromotionChange={handlePromotionChange}
            onSubmit={handlePromotionSubmit}
          />
        );
      case "payment":
        if (!promotion || !selectedCustomers.length) return null;
        return (
          <PromotionPaymentForm promotion={promotion as PromotionCampaign} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          {currentStep !== "customers" && (
            <button
              onClick={goBack}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
          )}

          <div className="flex items-center space-x-4 mb-8">
            <Step
              number={1}
              title="Select Customers"
              active={currentStep === "customers"}
              completed={currentStep === "details" || currentStep === "payment"}
            />
            <Divider />
            <Step
              number={2}
              title="Promotion Details"
              active={currentStep === "details"}
              completed={currentStep === "payment"}
            />
            <Divider />
            <Step
              number={3}
              title="Payment"
              active={currentStep === "payment"}
              completed={false}
            />
          </div>
        </div>

        <div className="flex justify-center">{renderStep()}</div>

        {currentStep === "customers" && selectedCustomers.length >= 2 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setCurrentStep("details")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Continue with {selectedCustomers.length} selected customers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  active: boolean;
  completed: boolean;
}

function Step({ number, title, active, completed }: StepProps) {
  return (
    <div className="flex items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm
          ${
            active
              ? "bg-blue-600 text-white"
              : completed
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
      >
        {number}
      </div>
      <span
        className={`ml-2 font-medium ${
          active ? "text-blue-600" : "text-gray-600"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="flex-1 h-px bg-gray-300 mx-4" />;
}
