import React, { useEffect, useState } from "react";
import { Box, Typography, List, Skeleton, Paper, Chip } from "@mui/material";
import BookingEventListItem from "./BookingEventListItem";
import { parse } from "date-fns";
import { axiosWithToken } from "../utils/axios";
import BookingEventDialog from "./BookingEventDialog";
import { getEndTimeForFirstGuest } from "../utils/ReservationUtils";
import { Calendar, Clock } from "lucide-react";

const UpComingBooking: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(null);
  const [isStatusModified, setIsStatusModified] = useState(false);

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

  useEffect(() => {
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
      title: reservation.customer.firstName,
      start: parseStringToDate(reservation.bookingTime),
      end: parseStringToDate(getEndTimeForFirstGuest(reservation)),
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

  const renderLoadingSkeletons = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(3)].map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
        </Box>
      ))}
    </Box>
  );

  const renderError = () => (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        height: "300px",
        textAlign: "center"
      }}
    >
      <Typography variant="h6" color="error" gutterBottom>
        {error}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please try refreshing the page
      </Typography>
    </Box>
  );

  const renderNoBookings = () => (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        height: "300px",
        gap: 2
      }}
    >
      <Calendar size={40} className="text-gray-400" />
      <Typography variant="h6" color="text.secondary">
        No upcoming bookings
      </Typography>
      <Typography variant="body2" color="text.secondary">
        New bookings will appear here
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ height: { xs: "500px", sm: "600px", md: "700px" } }}>
      <Paper 
        elevation={3} 
        sx={{ 
          height: "100%",
          borderRadius: "16px",
          background: "linear-gradient(to right bottom, #ffffff, #f8f9fa)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Box 
          sx={{ 
            p: 3,
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <Clock size={24} className="text-indigo-600" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#1a237e",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Upcoming Bookings
          </Typography>
          {events.length > 0 && (
            <Chip 
              label={events.length}
              size="small"
              sx={{ 
                ml: "auto",
                bgcolor: "indigo.100",
                color: "indigo.800",
                fontWeight: "medium"
              }}
            />
          )}
        </Box>

        <Box 
          sx={{ 
            flex: 1,
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "4px",
              "&:hover": {
                background: "#555",
              },
            },
          }}
        >
          {loading ? (
            renderLoadingSkeletons()
          ) : error ? (
            renderError()
          ) : events.length === 0 ? (
            renderNoBookings()
          ) : (
            <List sx={{ p: 0 }}>
              {events.map((event) => (
                <React.Fragment key={event.event_id}>
                  <BookingEventListItem
                    event={event}
                    handleEventClick={handleEventClick}
                    getStatusBackgroundColorForAvata={getStatusBackgroundColorForAvata}
                    displayDate={true}
                  />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      <BookingEventDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedEvent={selectedEvent}
        handleStatusChange={handleStatusChange}
        handleSubmit={handleSubmit}
        isStatusModified={isStatusModified}
        onReservationUpdated={fetchReservations}
      />
    </Box>
  );
};

export default UpComingBooking;