import React from "react";
import { CalendarClock, MessageSquare, Tag } from "lucide-react";
import {
  promotionSchema,
  PROMOTION_CONSTRAINTS,
} from "../helper/FormValidator";
import { z } from "zod";
import moment from "moment";

type ValidationErrors = {
  [K in keyof z.infer<typeof promotionSchema>]?: string;
};

interface Props {
  promotion: Partial<PromotionCampaign>;
  onPromotionChange: (promotion: Partial<PromotionCampaign>) => void;
  onSubmit: () => void;
}

export default function PromotionForm({
  promotion,
  onPromotionChange,
  onSubmit,
}: Props) {
  const [validationErrors, setValidationErrors] =
    React.useState<ValidationErrors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate all fields
      promotionSchema.parse(promotion);
      setValidationErrors({});
      onSubmit();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationErrors = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errors[err.path[0] as keyof ValidationErrors] = err.message;
          }
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (
      name === "promotionMessage" &&
      value.length > PROMOTION_CONSTRAINTS.PROMOTION_MESSAGE.MAX_LENGTH
    ) {
      return;
    }

    // Clear validation error when field is edited
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    onPromotionChange({
      ...promotion,
      [name]: value,
    });
  };

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + PROMOTION_CONSTRAINTS.MIN_DAYS_AHEAD);
    return date;
  };

  const isValidDate = (date: Date) => {
    return date >= getMinDate();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = moment(e.target.value).toDate();
    onPromotionChange({
      ...promotion,
      messageSendTime: selectedDate,
    });
  };

  const isFormValid = () => {
    return (
      promotion.campaignName?.trim() &&
      promotion.promotionCode?.trim() &&
      promotion.promotionMessage?.trim() &&
      promotion.messageSendTime &&
      isValidDate(promotion.messageSendTime)
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-2xl space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Promotion Details
        </h2>
        <p className="text-gray-600">
          Fill in the details of your promotion campaign
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Name
          </label>
          <div className="relative flex-1">
            <MessageSquare
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              aria-label="Campaign Name"
              type="text"
              name="campaignName"
              value={promotion.campaignName || ""}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 h-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${
                  validationErrors.campaignName
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              placeholder="Summer Sale 2024"
              maxLength={PROMOTION_CONSTRAINTS.CAMPAIGN_NAME.MAX_LENGTH}
              pattern={PROMOTION_CONSTRAINTS.CAMPAIGN_NAME.PATTERN.source}
            />
          </div>
          {validationErrors.campaignName && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.campaignName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Promotion Code
          </label>
          <div className="relative flex-1">
            <Tag
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              aria-label="Promotion Code"
              type="text"
              name="promotionCode"
              value={promotion.promotionCode?.toUpperCase() || ""}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 h-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${
                  validationErrors.promotionCode
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              placeholder="SUMMER24"
              maxLength={PROMOTION_CONSTRAINTS.PROMOTION_CODE.MAX_LENGTH}
              pattern={PROMOTION_CONSTRAINTS.PROMOTION_CODE.PATTERN.source}
              style={{ textTransform: "uppercase" }}
            />
          </div>
          {validationErrors.promotionCode && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.promotionCode}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Promotion Message
          </label>
          <div className="relative">
            <textarea
              aria-label="Promotion Message"
              name="promotionMessage"
              value={promotion.promotionMessage || ""}
              onChange={handleChange}
              rows={4}
              maxLength={PROMOTION_CONSTRAINTS.PROMOTION_MESSAGE.MAX_LENGTH}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${
                  validationErrors.promotionMessage
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              placeholder="Get 20% off on all summer items with code SUMMER24!"
            />
            <div className="absolute bottom-2 right-2 text-sm text-gray-500">
              {promotion.promotionMessage?.length || 0}/
              {PROMOTION_CONSTRAINTS.PROMOTION_MESSAGE.MAX_LENGTH}
            </div>
          </div>
          {validationErrors.promotionMessage && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.promotionMessage}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Send Time
          </label>
          <div
            className="relative flex-1 cursor-pointer"
            onClick={(e) => {
              const input = e.currentTarget.querySelector(
                'input[type="datetime-local"]'
              );
              if (input) {
                (input as HTMLInputElement).focus();
                (
                  input as HTMLInputElement & { showPicker?: () => void }
                ).showPicker?.();
              }
            }}
          >
            <CalendarClock
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              aria-label="Send Time"
              type="datetime-local"
              value={
                promotion.messageSendTime
                  ? moment(promotion.messageSendTime).format("YYYY-MM-DDTHH:mm")
                  : ""
              }
              onChange={handleDateChange}
              min={getMinDate().toISOString().slice(0, 16)}
              className={`w-full pl-10 pr-4 h-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer
                ${
                  validationErrors.messageSendTime
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
            />
          </div>
          <div className="mt-1 text-sm">
            <p className="text-gray-500">
              Schedule at least {PROMOTION_CONSTRAINTS.MIN_DAYS_AHEAD} days in
              advance (minimum: {getMinDate().toLocaleDateString()})
            </p>
            {validationErrors.messageSendTime && (
              <p className="mt-1 text-red-600">
                {validationErrors.messageSendTime}
              </p>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid()}
        className={`w-full py-3 px-4 rounded-lg text-white font-medium
          ${
            isFormValid()
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
      >
        Continue to Payment
      </button>
    </form>
  );
}
