import React, { useEffect, useMemo, useState, useCallback } from "react";
import { axiosWithToken } from "../utils/axios";
import { parse } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
// Direct imports for better tree-shaking
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Paper from "@mui/material/Paper";
import Container from "@mui/material/Container";
import Fade from "@mui/material/Fade";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import useMediaQuery from "@mui/material/useMediaQuery";
import useTheme from "@mui/material/styles/useTheme";
import Fab from "@mui/material/Fab";
import Badge from "@mui/material/Badge";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DayCalendarSkeleton } from "@mui/x-date-pickers/DayCalendarSkeleton";
import AddIcon from "@mui/icons-material/Add";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewListIcon from "@mui/icons-material/ViewList";
import moment from "moment";
import BookingEventListItem from "../components/BookingEventListItem";
import BookingEventDialog from "../components/BookingEventDialog";
import withAuth from "../components/HOC/withAuth";
import CreateReservationDialog from "../components/CreateReservationDialog";
import ReservationTimeline from "../components/ReservationTimeline";
import { getEndTimeForFirstGuest, getFirstGuestServiceStaff } from "../utils/ReservationUtils";
import CalendarToday from "@mui/icons-material/CalendarToday";
import Event from "@mui/icons-material/Event";
import { useNotificationWebSocket } from "../hooks/useNotificationWebSocket";

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
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [viewMode, setViewMode] = useState<"timeline" | "list">(
    isDesktop ? "timeline" : "list"
  );
  const [selectedSlotTime, setSelectedSlotTime] = useState<Date | null>(null);

  const selectedStoreId = useSelector(
    (state: RootState) => state.selectedStore.storeUuid
  );

  const parseStringToDate = (dateString: string): Date => {
    return parse(dateString, "dd/MM/yyyy HH:mm", new Date());
  };

  // Helper function to check if booking is in the displayed time range
  const isBookingInDisplayedTimeRange = useCallback((bookingTime: string): boolean => {
    if (!selectedDate) return false;
    
    const bookingMoment = moment(bookingTime, "DD/MM/YYYY HH:mm");
    
    if (viewMode === "timeline") {
      // For timeline view, check if booking is within the week being displayed
      const weekStart = selectedDate.clone().startOf("week");
      const weekEnd = selectedDate.clone().endOf("week");
      return bookingMoment.isSameOrAfter(weekStart, "day") && bookingMoment.isSameOrBefore(weekEnd, "day");
    } else {
      // For list view, check if booking is on the selected date
      return bookingMoment.isSame(selectedDate, "day");
    }
  }, [selectedDate, viewMode]);

  // Handle booking notifications from WebSocket
  const handleBookingNotification = useCallback(async (notification: Notification) => {
    // Only handle booking-related notifications
    if (!notification.type.includes('BOOKING')) {
      return;
    }

    try {
      // Parse metadata to get reservation ID
      const metadata = notification.metadata ? JSON.parse(notification.metadata) : null;
      
      if (!metadata || !metadata.reservationId) {
        console.warn("Notification does not contain reservation metadata");
        return;
      }

      // Fetch the updated/new reservation
      const response = await axiosWithToken.get<Reservation>(
        `/reservation/${metadata.reservationId}`
      );
      const updatedReservation = response.data;

      // Check if booking is in the displayed time range
      if (!isBookingInDisplayedTimeRange(updatedReservation.bookingTime)) {
        return; // Booking is outside the current view, skip update
      }

      // Convert to ProcessedEvent format
      const updatedEvent: ReservationEvent = {
        event_id: updatedReservation.id,
        title: updatedReservation.customer.firstName,
        start: parseStringToDate(updatedReservation.bookingTime),
        end: parseStringToDate(getEndTimeForFirstGuest(updatedReservation)),
        data: updatedReservation,
      };

      // Update events list
      setEvents(prevEvents => {
        const existingIndex = prevEvents.findIndex(e => e.event_id === updatedEvent.event_id);
        if (existingIndex >= 0) {
          // Update existing event
          const newEvents = [...prevEvents];
          newEvents[existingIndex] = updatedEvent;
          return newEvents;
        } else {
          // Add new event
          return [...prevEvents, updatedEvent];
        }
      });

      // If in list view and the updated event is on the selected date, update filtered events
      if (viewMode === "list" && selectedDate) {
        const eventDate = moment(updatedEvent.start);
        if (eventDate.isSame(selectedDate, "day")) {
          setFilteredEvents(prevFiltered => {
            const existingIndex = prevFiltered.findIndex(e => e.event_id === updatedEvent.event_id);
            let newFiltered;
            if (existingIndex >= 0) {
              newFiltered = [...prevFiltered];
              newFiltered[existingIndex] = updatedEvent;
            } else {
              newFiltered = [...prevFiltered, updatedEvent];
            }
            // Sort by booking time
            return newFiltered.sort((a, b) => moment(a.start).diff(moment(b.start)));
          });
        }
      }
    } catch (error) {
      console.error('Failed to handle booking notification:', error);
    }
  }, [isBookingInDisplayedTimeRange, parseStringToDate, viewMode, selectedDate]);

  // Use the WebSocket hook for real-time booking updates
  useNotificationWebSocket({
    onNotification: handleBookingNotification,
  });

  const handleEventClick = (event: any) => {
    setSelectedEvent(event as ReservationEvent);
    setIsDialogOpen(true);
    setIsStatusModified(false);
  };

  const fetchReservations = async (
    params: FetchReservationsParams
  ): Promise<ReservationEvent[]> => {
    setIsLoading(true);
    try {
      const response = await axiosWithToken.get<Reservation[]>(
        "/reservation/byTimeFrame",
        { params }
      );
      const processedEvents = await convertToProcessedEvents(response.data);
      setEvents(processedEvents);
      return processedEvents;
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

  useEffect(() => {
    const startDate = moment().startOf("month").format("DD/MM/YYYY");
    const endDate = moment().endOf("month").format("DD/MM/YYYY");

    const fetchData = async () => {
      try {
        const [reservationData, closedDateData] = await Promise.all([
          fetchReservations({ startDate, endDate }),
          fetchStoreClosedDates({ startDate, endDate }),
        ]);
          // fetchReservations already processes and sets events, so reservationData is already processed
          setStoreClosedDates(closedDateData);
          // Use selectedDate (current selected date) instead of moment() to avoid resetting the date
          dateCalendarHandleDateChange(selectedDate || moment(), reservationData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };

    fetchData();
  }, [selectedStoreId]);

  // Force list view on mobile/tablet since timeline is desktop-only
  useEffect(() => {
    if (!isDesktop && viewMode === "timeline") {
      setViewMode("list");
    }
  }, [isDesktop, viewMode]);

  // Filter events when switching to list view
  useEffect(() => {
    if (viewMode === "list" && selectedDate && events.length > 0) {
      const filtered = events
        .filter((event) => moment(event.start).isSame(selectedDate, "day"))
        .sort((a, b) => moment(a.start).diff(moment(b.start)));
      setFilteredEvents(filtered);
    }
  }, [viewMode, selectedDate, events]);

  const convertToProcessedEvents = (
    reservations: Reservation[]
  ): ReservationEvent[] => {
    return reservations.map((reservation) => ({
      event_id: reservation.id,
      title: getFirstGuestServiceStaff(reservation),
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
    setSelectedSlotTime(null);
  };

  const handleReservationCreated = async () => {
    if (selectedDate) {
      try {
        const startDate = selectedDate.clone().startOf("month").format("DD/MM/YYYY");
        const endDate = selectedDate.clone().endOf("month").format("DD/MM/YYYY");
        // fetchReservations already processes events and calls setEvents internally
        const processedEvents = await fetchReservations({ startDate, endDate });
        await fetchStoreClosedDates({ startDate, endDate });
        // Only filter by day if in list view; timeline view uses timelineEvents memoized value
        if (viewMode === "list") {
          dateCalendarHandleDateChange(selectedDate, processedEvents);
        }
        // Close dialog and reset slot time after successful data update
        setIsCreateDialogOpen(false);
        setSelectedSlotTime(null);
      } catch (error) {
        console.error("Error creating reservation:", error);
      }
    }
  };

  // Add this handler for reservation updates
  const handleReservationUpdated = async () => {
    if (selectedDate) {
      const startDate = selectedDate.clone().startOf("month").format("DD/MM/YYYY");
      const endDate = selectedDate.clone().endOf("month").format("DD/MM/YYYY");
      // fetchReservations already processes events and calls setEvents internally
      const processedEvents = await fetchReservations({ startDate, endDate });
      await fetchStoreClosedDates({ startDate, endDate });
      // Only filter by day if in list view; timeline view uses timelineEvents memoized value
      if (viewMode === "list") {
        dateCalendarHandleDateChange(selectedDate, processedEvents);
      }
    }
  };

  const timelineEvents = useMemo(() => {
    const referenceDate = selectedDate ?? moment();
    const weekStart = referenceDate.clone().startOf("week");
    const weekEnd = referenceDate.clone().endOf("week");

    return events.filter((event) => {
      const start = moment(event.start);
      return start.isSameOrAfter(weekStart, "day") && start.isSameOrBefore(weekEnd, "day");
    });
  }, [events, selectedDate]);

  const handleTimelineNavigate = async (date: Date, view: string) => {
    const newDate = moment(date);
    setSelectedDate(newDate);

    let startDate: string;
    let endDate: string;

    if (view === "week") {
      startDate = newDate.clone().startOf("week").format("DD/MM/YYYY");
      endDate = newDate.clone().endOf("week").format("DD/MM/YYYY");
    } else if (view === "day") {
      startDate = newDate.clone().startOf("day").format("DD/MM/YYYY");
      endDate = newDate.clone().endOf("day").format("DD/MM/YYYY");
    } else {
      // Default to week
      startDate = newDate.clone().startOf("week").format("DD/MM/YYYY");
      endDate = newDate.clone().endOf("week").format("DD/MM/YYYY");
    }

    try {
      await fetchReservations({ startDate, endDate });
      await fetchStoreClosedDates({ startDate, endDate });
    } catch (error) {
      console.error("Failed to fetch data on navigation", error);
    }
  };

  const handleTimelineSlotSelect = (slotInfo: { start: Date; end: Date; action: string }) => {
    const slotDate = moment(slotInfo.start);
    setSelectedDate(slotDate);
    setSelectedSlotTime(slotInfo.start);
    setIsCreateDialogOpen(true);
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

      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: viewMode === "timeline" ? "column" : { xs: "column", md: "row" },
        }}
      >
        {/* Calendar Section (hidden when in timeline view) */}
        {viewMode === "list" && (
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
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
                p: 1,
                bgcolor: "grey.50",
                borderRadius: 1,
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  bgcolor: "rgba(255, 0, 0, 0.1)",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: 0.5,
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
                sx={{
                  width: "100%",
                  "& .MuiPickersDay-root.Mui-selected": {
                    backgroundColor: "primary.dark", // Darker shade of primary color
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                    "&:focus": {
                      backgroundColor: "secondary.light",
                    },
                  },
                  "& .MuiPickersDay-root.Mui-selected.Mui-focusVisible": {
                    backgroundColor: "secondary.light",
                  },
                }}
              />
            </LocalizationProvider>
          </Paper>
        )}

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
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Event color="primary" />
              <Typography variant="h6" fontWeight="medium">
                {viewMode === "timeline"
                  ? `Week of ${(selectedDate ?? moment()).startOf("week").format("MMM D, YYYY")}`
                  : selectedDate
                  ? `Bookings for ${selectedDate.format("dddd, MMMM D, YYYY")}`
                  : "Select a date to view bookings"}
              </Typography>
            </Box>
            
            {/* View Toggle - Hidden on mobile */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_event, newValue) => {
                if (newValue) {
                  setViewMode(newValue);
                }
              }}
              sx={{ display: { xs: "none", md: "flex" } }}
              size="small"
            >
              <ToggleButton value="timeline" aria-label="timeline view">
                <Tooltip title="Timeline View">
                  <ViewWeekIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="list" aria-label="list view">
                <Tooltip title="List View">
                  <ViewListIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Timeline View */}
          {viewMode === "timeline" && (
            <Box sx={{ flex: 1, overflow: "auto" }}>
              <ReservationTimeline
                events={timelineEvents}
                onSelectEvent={handleEventClick}
                selectedDate={selectedDate}
                isLoading={isLoading}
                onNavigate={handleTimelineNavigate}
                onSelectSlot={handleTimelineSlotSelect}
              />
            </Box>
          )}

          {/* List View */}
          {viewMode === "list" && (
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
          )}
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
        selectedSlotTime={selectedSlotTime}
        onReservationCreated={handleReservationCreated}
      />
    </Container>
  );
};

export default withAuth(ManageReservationsPage);