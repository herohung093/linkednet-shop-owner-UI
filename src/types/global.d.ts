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
