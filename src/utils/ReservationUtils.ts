import { parse, format } from "date-fns";


// the end time for the first guest in the reservation
  export const getEndTimeForFirstGuest = (reservation: Reservation) => {
    const startDate = parse(reservation.bookingTime, "dd/MM/yyyy HH:mm", new Date());
    if (reservation.guests.length === 0) {
      return format(startDate, "dd/MM/yyyy HH:mm");
    }
    
    const firstGuest = reservation.guests[0];
    const endDate = new Date(startDate.getTime() + firstGuest?.totalEstimatedTime * 60000);
    return format(endDate, "dd/MM/yyyy HH:mm");
  }

  export const getStaffDetailsForReservation = (reservation: Reservation) => {
    if (reservation.guests.length === 1) {
      const guestServices = reservation.guests[0]?.guestServices;
      if (guestServices && guestServices.length > 0) {
        return guestServices[0].staff;
      }
    } else return anyStaff;
  };

  export const assignStaffForFirstGuest = (reservation: Reservation, staff: Staff) => {
    if (reservation.guests.length > 0 && reservation.guests[0].guestServices) {
      reservation.guests[0].guestServices.forEach((guestService) => {
        guestService.staff = staff;
      });
    }
  };

  export const assignStaffForGuests = (reservation: Reservation, staffList: Staff[]) => {
    if (reservation.guests.length > staffList.length) {
      throw new Error("The number of guests and staff must be the same.");
    }
  
    reservation.guests.forEach((guest, index) => {
      const staff = staffList[index];
      if (guest.guestServices) {
        guest.guestServices.forEach((guestService) => {
          guestService.staff = staff;
        });
      }
    });
  };

  export const getGuestInfoAsString = (guest: Guest): string => {
    const guestName = guest.name || "Guest";
    const services = guest.guestServices
      ?.map((guestService) => guestService.serviceItem.serviceName + " (" + guestService.staff?.nickname + ")")
      .join(", ") || "";
    return `${guestName} [${services}]`;
  }

  export const anyStaff = {
    id: 0,
    firstName: "Anyone",
    lastName: "Professional",
    nickname: "Anyone",
    phone: "",
    skillLevel: 5,
    dateOfBirth: "",
    rate: 0,
    workingDays: "1,2,3,4,5,6,7",
    storeUuid: "store-uuid-123",
    tenantUuid: "",
    isActive: true,
  };

