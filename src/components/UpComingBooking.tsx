import React, { useEffect, useState } from "react";
import { Box, Typography, List, Skeleton } from "@mui/material";
import BookingEventListItem from "./BookingEventListItem"; // Adjust the import path as necessary
import { parse } from "date-fns";
import { axiosWithToken } from "../utils/axios";
import BookingEventDialog from "./BookingEventDialog";

const UpComingBooking: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(
    null
  );
  const [isStatusModified, setIsStatusModified] = useState(false);

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

  const handleEventClick = (event: any) => {
    setSelectedEvent(event as ReservationEvent);
    setIsDialogOpen(true);
    setIsStatusModified(false);
  };

  const handleStatusChange = (e: any) => {
    if (selectedEvent) {
      setSelectedEvent({
        ...selectedEvent,
        data: {
          ...selectedEvent.data,
          status: e,
        },
      });
    }

    setIsStatusModified(selectedEvent?.data.status !== e);
  };

  const handleSubmit = () => {
    updateReservationEvent(selectedEvent as ReservationEvent);
  };

  const updateReservationEvent = async (selectedEvent: ReservationEvent) => {
    const url = `/reservation/`;
    const response = await axiosWithToken.put(url, selectedEvent.data);

    if (!response.data) {
      throw new Error("Failed to update reservation event");
    }

    // Update the corresponding event in the events array
    updateEventData(response);
  };

  const updateEventData = (response: { data: Reservation }) => {
    const updatedEvents = (events as ReservationEvent[]).map((event) => {
      if (event.data.id.toString() === response.data.id.toString()) {
        return { ...event, data: response.data };
      }
      return event;
    });

    setEvents(updatedEvents);
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
    <>
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
      <BookingEventDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedEvent={selectedEvent}
        handleStatusChange={handleStatusChange}
        handleSubmit={handleSubmit}
        isStatusModified={isStatusModified}
      />
    </>
  );
};

export default UpComingBooking;
