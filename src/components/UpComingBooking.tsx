import React, { useEffect, useState } from "react";
import { Box, Typography, List, Skeleton } from "@mui/material";
import BookingEventListItem from "./BookingEventListItem"; // Adjust the import path as necessary
import { parse } from "date-fns";
import { axiosWithToken } from "../utils/axios";

const UpComingBooking: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ProcessedEvent[]>([]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await axiosWithToken.get<Reservation[]>(
          "/dashboard/getFutureBookings"
        );
        const processedEvents = await convertToProcessedEvents(response.data);
        setEvents(processedEvents);
      } catch (err) {
        setError("Failed to fetch reservations");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleEventClick = (event: Reservation) => {
    // Handle event click
    console.log(event.customer);
  };

  const convertToProcessedEvents = (
    reservations: Reservation[]
  ): ReservationEvent[] => {
    return reservations.map((reservation) => ({
      event_id: reservation.id,
      title: reservation.staff.nickname,
      start: parseStringToDate(reservation.bookingTime), // Convert string to Date
      end: parseStringToDate(reservation.endTime), // Convert string to Date
      data: reservation,
    }));
  };

  const parseStringToDate = (dateString: string): Date => {
    return parse(dateString, "dd/MM/yyyy HH:mm", new Date());
  };

  const getStatusBackgroundColorForAvata = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "springgreen";
      case "PENDING":
        return "darkorange";
      case "CANCELLED":
        return "crimson";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
      {loading ? (
        Array.from(new Array(5)).map((_, index) => (
          <Box key={index} sx={{ padding: "10px" }}>
            <Skeleton variant="rectangular" width="100%" height={60} />
          </Box>
        ))
      ) : (
        <List>
          {events.map((reservation) => (
            <React.Fragment key={reservation.event_id}>
              <BookingEventListItem
                event={reservation}
                handleEventClick={handleEventClick}
                getStatusBackgroundColorForAvata={
                  getStatusBackgroundColorForAvata
                }
                displayDate={true}
              />
            </React.Fragment>
          ))}
        </List>
      )}
      {!loading && events.length === 0 && (
        <Typography variant="h6" align="center" sx={{ marginTop: "20px" }}>
          No upcoming bookings
        </Typography>
      )}
      {error && (
        <Typography variant="h6" align="center">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default UpComingBooking;
