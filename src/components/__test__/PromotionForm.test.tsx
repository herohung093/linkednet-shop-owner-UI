import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PromotionForm from '../PromotionForm';
import { PROMOTION_CONSTRAINTS } from '../../helper/FormValidator';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  CalendarClock: () => <div data-testid="calendar-clock-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  Tag: () => <div data-testid="tag-icon" />,
}));

describe('PromotionForm', () => {
  const mockOnPromotionChange = vi.fn();
  const mockOnSubmit = vi.fn();
  const defaultProps = {
    promotion: {},
    onPromotionChange: mockOnPromotionChange,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    render(<PromotionForm {...defaultProps} />);

    expect(screen.getByLabelText('Campaign Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Promotion Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Promotion Message')).toBeInTheDocument();
    expect(screen.getByLabelText('Send Time')).toBeInTheDocument();
  });

  describe('Campaign Name Validation', () => {
    it.only('validates minimum length', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Campaign Name');

      await userEvent.type(input, 'ab');
      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        const elements = screen.getAllByText((content, element) => {
          const text = element?.textContent?.toLowerCase() || '';
          return text.includes('campaign name') && text.includes('at least');
        });
        expect(elements.length).toBe(1);
      });
    });

    it('validates maximum length', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Campaign Name');

      const longName = 'a'.repeat(PROMOTION_CONSTRAINTS.CAMPAIGN_NAME.MAX_LENGTH + 1);
      await userEvent.type(input, longName);
      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      expect(await screen.findByText(/campaign name cannot exceed 100 characters/i)).toBeInTheDocument();
    });

    it('validates character pattern', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Campaign Name');

      await userEvent.type(input, 'Invalid@Name#');
      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      expect(await screen.findByText(/campaign name can only contain letters, numbers, spaces, hyphens, and underscores/i)).toBeInTheDocument();
    });
  });

  describe('Promotion Code Validation', () => {
    it('validates minimum length', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Promotion Code');

      await userEvent.type(input, 'AB');
      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      expect(await screen.findByText(/promotion code must be at least 3 characters/i)).toBeInTheDocument();
    });

    it('validates maximum length', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Promotion Code');

      const longCode = 'A'.repeat(PROMOTION_CONSTRAINTS.PROMOTION_CODE.MAX_LENGTH + 1);
      await userEvent.type(input, longCode);
      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      expect(await screen.findByText(/promotion code cannot exceed 20 characters/i)).toBeInTheDocument();
    });

    it('validates character pattern and auto-uppercase', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Promotion Code');

      await userEvent.type(input, 'code@123');
      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      expect(await screen.findByText(/promotion code can only contain uppercase letters, numbers, hyphens, and underscores/i)).toBeInTheDocument();
    });
  });

  describe('Promotion Message Validation', () => {
    it('validates minimum length', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Promotion Message');

      await userEvent.type(input, 'Short msg');
      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      expect(await screen.findByText(/message must be at least 10 characters/i)).toBeInTheDocument();
    });

    it('validates maximum length', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Promotion Message');

      const longMessage = 'a'.repeat(PROMOTION_CONSTRAINTS.PROMOTION_MESSAGE.MAX_LENGTH + 1);
      await userEvent.type(input, longMessage);

      expect(input).toHaveValue(longMessage.slice(0, PROMOTION_CONSTRAINTS.PROMOTION_MESSAGE.MAX_LENGTH));
    });

    it('shows character count', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Promotion Message');

      await userEvent.type(input, 'Test message');
      expect(screen.getByText(`11/${PROMOTION_CONSTRAINTS.PROMOTION_MESSAGE.MAX_LENGTH}`)).toBeInTheDocument();
    });
  });

  describe('Send Time Validation', () => {
    it('validates minimum date', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Send Time');

      // Set date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await userEvent.type(input, tomorrow.toISOString().slice(0, 16));
      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      expect(await screen.findByText(new RegExp(`send time must be at least ${PROMOTION_CONSTRAINTS.MIN_DAYS_AHEAD} days in the future`, 'i'))).toBeInTheDocument();
    });

    it('accepts valid future date', async () => {
      render(<PromotionForm {...defaultProps} />);
      const input = screen.getByLabelText('Send Time');

      // Set date to 6 days in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 6);
      await userEvent.type(input, futureDate.toISOString().slice(0, 16));

      expect(input).toHaveValue(futureDate.toISOString().slice(0, 16));
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with valid data', async () => {
      const validPromotion = {
        campaignName: 'Summer Sale 2024',
        promotionCode: 'SUMMER24',
        promotionMessage: 'Get 20% off on all summer items with code SUMMER24!',
        messageSendTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      render(
        <PromotionForm
          {...defaultProps}
          promotion={validPromotion}
        />
      );

      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('shows all validation errors on submit', async () => {
      render(<PromotionForm {...defaultProps} />);

      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/campaign name must be at least 3 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/promotion code must be at least 3 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/message must be at least 10 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Clearing', () => {
    it('clears validation errors when field is edited', async () => {
      render(<PromotionForm {...defaultProps} />);

      // Trigger validation errors
      fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }));

      const campaignNameInput = screen.getByLabelText('Campaign Name');
      await userEvent.type(campaignNameInput, 'Test Campaign');

      expect(screen.queryByText(/campaign name must be at least 3 characters/i)).not.toBeInTheDocument();
    });
  });
});