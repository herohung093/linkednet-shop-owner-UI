import { z } from "zod";

// Constants for validation
// Zod schema for promotion validation
interface PromotionConstraints {
  CAMPAIGN_NAME: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
    PATTERN: RegExp;
  };
  PROMOTION_CODE: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
    PATTERN: RegExp;
  };
  PROMOTION_MESSAGE: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
  };
  MIN_DAYS_AHEAD: number;
}

export const PROMOTION_CONSTRAINTS: PromotionConstraints = {
  CAMPAIGN_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9\s\-_]+$/,
  },
  PROMOTION_CODE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[A-Z0-9\-_]+$/,
  },
  PROMOTION_MESSAGE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 144,
  },
  MIN_DAYS_AHEAD: 0,
} as const;

export const promotionSchema = z.object({
  campaignName: z
    .string()
    .min(
      PROMOTION_CONSTRAINTS.CAMPAIGN_NAME.MIN_LENGTH,
      "Campaign name must be at least 3 characters"
    )
    .max(
      PROMOTION_CONSTRAINTS.CAMPAIGN_NAME.MAX_LENGTH,
      "Campaign name cannot exceed 100 characters"
    )
    .regex(
      PROMOTION_CONSTRAINTS.CAMPAIGN_NAME.PATTERN,
      "Campaign name can only contain letters, numbers, spaces, hyphens, and underscores"
    )
    .trim(),

  promotionCode: z
    .string()
    .min(
      PROMOTION_CONSTRAINTS.PROMOTION_CODE.MIN_LENGTH,
      "Promotion code must be at least 3 characters"
    )
    .max(
      PROMOTION_CONSTRAINTS.PROMOTION_CODE.MAX_LENGTH,
      "Promotion code cannot exceed 20 characters"
    )
    .regex(
      PROMOTION_CONSTRAINTS.PROMOTION_CODE.PATTERN,
      "Promotion code can only contain uppercase letters, numbers, hyphens, and underscores"
    )
    .trim()
    .transform((val) => val.toUpperCase()),

  promotionMessage: z
    .string()
    .min(
      PROMOTION_CONSTRAINTS.PROMOTION_MESSAGE.MIN_LENGTH,
      "Message must be at least 10 characters"
    )
    .max(
      PROMOTION_CONSTRAINTS.PROMOTION_MESSAGE.MAX_LENGTH,
      "Message cannot exceed 160 characters"
    )
    .trim(),

  messageSendTime: z.date().refine((date) => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + PROMOTION_CONSTRAINTS.MIN_DAYS_AHEAD);
    return date >= minDate;
  }, `Send time must be at least ${PROMOTION_CONSTRAINTS.MIN_DAYS_AHEAD} days in the future`),
});
