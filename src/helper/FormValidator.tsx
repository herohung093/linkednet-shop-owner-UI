import { z } from "zod";
import moment from "moment";

interface PromotionConstraints {
  CAMPAIGN_NAME: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
    PATTERN: RegExp;
  };
  PROMOTION_CODE: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
  };
  PROMOTION_MESSAGE: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
  };
  MIN_DAYS_AHEAD: number;
  DEFAULT_SEND_HOUR: number;
  DEFAULT_SEND_MINUTE: number;
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
  },
  PROMOTION_MESSAGE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 144,
  },
  MIN_DAYS_AHEAD: 1,
  DEFAULT_SEND_HOUR: 10,
  DEFAULT_SEND_MINUTE: 0,
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
    const minDate = moment().add(PROMOTION_CONSTRAINTS.MIN_DAYS_AHEAD, 'days')
      .set({
        hour: PROMOTION_CONSTRAINTS.DEFAULT_SEND_HOUR,
        minute: PROMOTION_CONSTRAINTS.DEFAULT_SEND_MINUTE,
        second: 0,
        millisecond: 0
      });
    return moment(date).isSameOrAfter(minDate, 'day');
  }, `Send date must be at least ${PROMOTION_CONSTRAINTS.MIN_DAYS_AHEAD} days in the future`),
});