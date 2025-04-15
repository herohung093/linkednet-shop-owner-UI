declare interface Staff {
  id: number | null;
  firstName: string;
  lastName: string;
  nickname: string;
  phone: string;
  skillLevel: number | null;
  dateOfBirth: string;
  rate: number | null;
  workingDays: string;
  storeUuid: string;
  tenantUuid: string;
  isActive: boolean;
}

declare interface Store {
  zoneId: string;
  id: number;
  storeUuid: string;
  storeName: string;
  shortStoreName: string;
  storeAddress: string;
  storePhoneNumber: string;
  storeEmail: string;
  frontEndUrl: string;
  enableReservationConfirmation: boolean;
  enableInDayBooking: boolean;
  automaticApproved: boolean;
  maxGuestsForGroupBooking: number;
}

declare interface ServiceItem {
  id: number;
  serviceName: string;
  serviceDescription: string;
  servicePrice: number;
  estimatedTime: number;
  active: boolean;
  displayOrder: number;
}

declare interface Guest {
  id: number | null;
  name: string;
  guestServices: GuestService[] | null;
  totalPrice: number;
  totalEstimatedTime: number;
}

declare interface GuestService {
  serviceItem: ServiceItem;
  staff: Staff | null;
}

declare interface Reservation {
  id: number;
  customer: Customer;
  note: string;
  bookingTime: string;
  endTime: string;
  createdTime: string;
  status: string;
  totalEstimatedTime: number;
  totalPrice: number;
  guests: Guest[];
  walkInBooking: boolean;
  communication: {
    FIRST_BOOKING_REMINDER: string;
    FINAL_BOOKING_REMINDER: string;
    BOOKING_ACK: string;
  };
}

declare interface ProcessedEvent {
  event_id: number;
  title: string;
  start: Date;
  end: Date;
  data: Reservation;
}

declare interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  blacklisted: boolean;
  createdAt: string;
}

declare ReservationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  APPROVED: "APPROVED",
}

declare interface ReservationEvent extends ProcessedEvent {
  data: Reservation;
}

declare interface Notification {
  id: number;
  message: string;
  timestamp: string;
  seen: boolean;
  type: string;
}

declare interface UserDetails {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  stripeCustomerId: string;
  authProvider: string;
  trialEndDate: string;
}

declare interface PromotionCampaign {
  id: number;
  campaignName: string;
  promotionCode: string;
  promotionMessage: string;
  messageSendTime: Date;
  customers: Customer[];
  paymentIntentId: string;
  status: string;
}

declare interface StoreClosedDate {
  id: number;
  reason: string;
  closedStartDate: string;
  closedEndDate: string;
  storeConfig: Store;
}

declare module 'sockjs-client/dist/sockjs' {
  import SockJS from '@types/sockjs-client';

  export = SockJS;
  export as namespace SockJS;
}
