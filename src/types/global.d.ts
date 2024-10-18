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
  automaticApproved: boolean;
}

declare interface ServiceItem {
  id: number;
  serviceName: string;
  serviceDescription: string;
  servicePrice: number;
  estimatedTime: number;
  active: boolean;
}

declare interface Reservation {
  id: number;
  customer: Customer;
  note: string;
  bookingTime: string;
  endTime: string;
  createdTime: string;
  status: string;
  serviceItems: ServiceItem[];
  totalEstimatedTime: number;
  totalPrice: number;
  staff: Staff;
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

declare module 'sockjs-client/dist/sockjs' {
  import SockJS from '@types/sockjs-client';

  export = SockJS;
  export as namespace SockJS;
}
