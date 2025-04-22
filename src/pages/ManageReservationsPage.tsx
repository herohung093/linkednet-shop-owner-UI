import React, { useEffect, useState } from "react";
import { axiosWithToken } from "../utils/axios";
import { parse } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import {
  Typography,
  Box,
  List,
  Paper,
  Container,
  Fade,
  Divider,
  Tooltip,
} from "@mui/material";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DayCalendarSkeleton } from "@mui/x-date-pickers/DayCalendarSkeleton";
import { Fab, Badge } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import moment from "moment";
import BookingEventListItem from "../components/BookingEventListItem";
import BookingEventDialog from "../components/BookingEventDialog";
import withAuth from "../components/HOC/withAuth";
import CreateReservationDialog from "../components/CreateReservationDialog";
import { getEndTimeForFirstGuest } from "../utils/ReservationUtils";
import { CalendarToday, Event } from "@mui/icons-material";

interface FetchReservationsParams {
  startDate: string; //dd/MM/yyyy
  endDate: string; //dd/MM/yyyy
}

const ManageReservationsPage: React.FC = () => {
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ProcessedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(null);
  const [isStatusModified, setIsStatusModified] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(moment());
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [storeClosedDates, setStoreClosedDates] = useState<StoreClosedDate[]>([]);

  const handleEventClick = (event: any) => {
    setSelectedEvent(event as ReservationEvent);
    setIsDialogOpen(true);
    setIsStatusModified(false);
  };

  const parseStringToDate = (dateString: string): Date => {
    return parse(dateString, "dd/MM/yyyy HH:mm", new Date());
  };

  const fetchReservations = async (
    params: FetchReservationsParams
  ): Promise<Reservation[]> => {
    setIsLoading(true);
    try {
      const response = await axiosWithToken.get<Reservation[]>(
        "/reservation/byTimeFrame",
        { params }
      );
      const processedEvents = await convertToProcessedEvents(response.data);
      setEvents(processedEvents);
      return response.data;
    } catch (error) {
      console.error("Error fetching reservations:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStoreClosedDates = async (params: FetchReservationsParams) => {
    const response = await axiosWithToken.get<StoreClosedDate[]>(
      "/storeConfig/closedDate/byTimeFrame",
      { params }
    );
    setStoreClosedDates(response.data);
    return response.data;
  };

  const selectedStoreId = useSelector(
    (state: RootState) => state.selectedStore.storeUuid
  );

  useEffect(() => {
    const startDate = moment().startOf("month").format("DD/MM/YYYY");
    const endDate = moment().endOf("month").format("DD/MM/YYYY");

    const fetchData = async () => {
      try {
        const [reservationData, closedDateData] = await Promise.all([
          fetchReservations({ startDate, endDate }),
          fetchStoreClosedDates({ startDate, endDate }),
        ]);
        const processedEvents = await convertToProcessedEvents(reservationData);
        setEvents(processedEvents);
        setStoreClosedDates(closedDateData);
        dateCalendarHandleDateChange(moment(), processedEvents);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };

    fetchData();
  }, [selectedStoreId]);

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

  const updateEventData = (response: { data: Reservation }) => {
    const updatedEvents = (events as ReservationEvent[]).map((event) => {
      if (event.data.id.toString() === response.data.id.toString()) {
        return { ...event, data: response.data };
      }
      return event;
    });

    setEvents(updatedEvents);
    
    // Sort filtered events by booking time
    const updatedFilteredEvents = updatedEvents
      .filter((event) => moment(event.start).isSame(selectedDate, "day"))
      .sort((a, b) => {
        const timeA = moment(a.data.bookingTime, "DD/MM/YYYY HH:mm");
        const timeB = moment(b.data.bookingTime, "DD/MM/YYYY HH:mm");
        return timeA.diff(timeB);
      });

    setFilteredEvents(updatedFilteredEvents);
  };

  const updateReservationEvent = async (selectedEvent: ReservationEvent) => {
    const url = `/reservation/`;
    const response = await axiosWithToken.put(url, selectedEvent.data);

    if (!response.data) {
      throw new Error("Failed to update reservation event");
    }
    updateEventData(response);
  };

  const handleMonthChange = (date: moment.Moment) => {
    const startDate = date.startOf("month").format("DD/MM/YYYY");
    const endDate = date.endOf("month").format("DD/MM/YYYY");
    fetchReservations({ startDate, endDate });
    fetchStoreClosedDates({ startDate, endDate });
  };

  function isDateClosed(day: moment.Moment, closedDates: StoreClosedDate[]): boolean {
    return closedDates.some((closedDate) =>
      day.isBetween(
        moment(closedDate.closedStartDate, "DD/MM/YYYY"),
        moment(closedDate.closedEndDate, "DD/MM/YYYY"),
        "day",
        "[]"
      )
    );
  }

  function EventsDay(
    props: PickersDayProps<moment.Moment> & { highlightedDays?: number[] }
  ) {
    const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
    const isClosed = isDateClosed(day, storeClosedDates);
    const eventsOfTheDay = events.filter((event) =>
      moment(event.start).isSame(day, "day")
    );
    const isSelected = !props.outsideCurrentMonth;
    
      return (
        <Badge
          key={props.day.toString()}
          overlap="circular"
          color="primary"
          badgeContent={isSelected ? eventsOfTheDay.length : undefined}
        >
          <PickersDay
            {...other}
            outsideCurrentMonth={outsideCurrentMonth}
            day={day}
            style={isClosed ? { backgroundColor: "rgba(255, 0, 0, 0.1)" } : {}}
          />
        </Badge>
      );
    
  }

  const dateCalendarHandleDateChange = (
    date: moment.Moment | null,
    initialEvents?: ReservationEvent[]
  ) => {
    setSelectedDate(date);
    if (date) {
      let filtered;
      if (initialEvents && initialEvents.length > 0) {
        filtered = initialEvents
          .filter((event) => moment(event.start).isSame(date, "day"))
          .sort((a, b) => moment(a.start).diff(moment(b.start)));
      } else {
        filtered = events
          .filter((event) => moment(event.start).isSame(date, "day"))
          .sort((a, b) => moment(a.start).diff(moment(b.start)));
      }
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
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

  const handleCreateBooking = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
  };

  const handleReservationCreated = async () => {
    if (selectedDate) {
      const startDate = selectedDate.startOf("month").format("DD/MM/YYYY");
      const endDate = selectedDate.endOf("month").format("DD/MM/YYYY");
      const data = await fetchReservations({ startDate, endDate });
      fetchStoreClosedDates({ startDate, endDate });
      const processedEvents = await convertToProcessedEvents(data);
      setEvents(processedEvents);
      dateCalendarHandleDateChange(selectedDate, processedEvents);
    }
  };

  // Add this handler for reservation updates
  const handleReservationUpdated = async () => {
    if (selectedDate) {
      const startDate = moment().startOf("month").format("DD/MM/YYYY");
      const endDate = moment().endOf("month").format("DD/MM/YYYY");
      const data = await fetchReservations({ startDate, endDate });
      fetchStoreClosedDates({ startDate, endDate });
      const processedEvents = await convertToProcessedEvents(data);
      setEvents(processedEvents);
      dateCalendarHandleDateChange(selectedDate, processedEvents);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Manage Bookings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          View and manage your salon's appointments
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
        {/* Calendar Section */}
        <Paper
          elevation={2}
          sx={{
            flex: { md: "0 0 350px" },
            p: 2,
            borderRadius: 2,
            height: "fit-content",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
            <CalendarToday color="primary" />
            <Typography variant="h6" fontWeight="medium">
              Select Date
            </Typography>
          </Box>

          {/* Calendar Legend */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 2,
              p: 1,
              bgcolor: 'grey.50',
              borderRadius: 1
            }}
          >
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                bgcolor: 'rgba(255, 0, 0, 0.1)', 
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 0.5
              }} 
            />
            <Typography variant="body2" color="text.secondary">
              Store Closed
            </Typography>
          </Box>

          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DateCalendar
              value={selectedDate}
              loading={isLoading}
              onMonthChange={handleMonthChange}
              onChange={(newValue) => dateCalendarHandleDateChange(newValue)}
              renderLoading={() => <DayCalendarSkeleton />}
              slots={{ day: EventsDay }}
              sx={{ width: "100%" }}
            />
          </LocalizationProvider>
        </Paper>

        {/* Bookings List Section */}
        <Paper
          elevation={2}
          sx={{
            flex: 1,
            p: 2,
            borderRadius: 2,
            height: { md: "calc(100vh - 200px)" },
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
            <Event color="primary" />
            <Typography variant="h6" fontWeight="medium">
              {selectedDate
                ? `Bookings for ${selectedDate.format("dddd, MMMM D, YYYY")}`
                : "Select a date to view bookings"}
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ flex: 1, overflow: "auto" }}>
            {isLoading ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">Loading bookings...</Typography>
              </Box>
            ) : filteredEvents.length > 0 ? (
              <Fade in>
                <List>
                  {filteredEvents.map((event) => (
                    <BookingEventListItem
                      key={event.event_id}
                      event={event}
                      handleEventClick={handleEventClick}
                      getStatusBackgroundColorForAvata={getStatusBackgroundColorForAvata}
                    />
                  ))}
                </List>
              </Fade>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No bookings for this date
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <BookingEventDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedEvent={selectedEvent}
        handleStatusChange={handleStatusChange}
        handleSubmit={handleSubmit}
        isStatusModified={isStatusModified}
        onReservationUpdated={handleReservationUpdated}
      />

      <Tooltip title="Create New Booking">
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleCreateBooking}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      <CreateReservationDialog
        isCreateDialogOpen={isCreateDialogOpen}
        handleCreateDialogClose={handleCreateDialogClose}
        selectedDate={selectedDate}
        onReservationCreated={handleReservationCreated}
      />
    </Container>
  );
};

export default withAuth(ManageReservationsPage);