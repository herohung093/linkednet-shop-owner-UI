/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { axiosWithToken } from "../utils/axios";
import { parse } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import { useMediaQuery } from "react-responsive";
import { Typography, Box, List, Paper, CardContent } from "@mui/material";
import Badge from "@mui/material/Badge";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DayCalendarSkeleton } from "@mui/x-date-pickers/DayCalendarSkeleton";
import moment from "moment";
import BookingEventListItem from "../components/BookingEventListItem";
import BookingEventDialog from "../components/BookingEventDialog";

interface FetchReservationsParams {
  startDate: string; //dd/MM/yyyy
  endDate: string; //dd/MM/yyyy
}

const ManageReservationsPage: React.FC = () => {
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ProcessedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(
    null
  );
  const [isStatusModified, setIsStatusModified] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(
    moment()
  );
  const [isLoading, setIsLoading] = React.useState(false);

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
        {
          params,
        }
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

  const selectedStoreId = useSelector(
    (state: RootState) => state.selectedStore.storeUuid
  );

  useEffect(() => {
    let startDate = moment().startOf("month").format("DD/MM/YYYY").toString();
    let endDate = moment().endOf("month").format("DD/MM/YYYY").toString();
    const fetchData = async () => {
      try {
        const data = await fetchReservations({
          startDate: startDate,
          endDate: endDate,
        });
        const processedEvents = await convertToProcessedEvents(data);
        setEvents(processedEvents);
        // load event for initial date
        dateCalendarHandleDateChange(moment(), processedEvents);
      } catch (error) {
        console.error("Failed to fetch reservations", error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId]);


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
    setFilteredEvents(
      updatedEvents.filter((event) =>
        moment(event.start).isSame(selectedDate, "day")
      )
    );
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

  const handleMonthChange = (date: moment.Moment) => {
    const startDate = date.startOf("month").format("DD/MM/YYYY").toString();
    const endDate = date.endOf("month").format("DD/MM/YYYY").toString();

    const requestParams: FetchReservationsParams = {
      startDate: startDate,
      endDate: endDate,
    };
    fetchReservations(requestParams);
  };

  function EventsDay(
    props: PickersDayProps<moment.Moment> & { highlightedDays?: number[] }
  ) {
    const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

    const eventsOfTheDay = events.filter((event) =>
      moment(event.start).isSame(day, "day")
    );
    const isSelected = !props.outsideCurrentMonth;

    return (
      <Badge
        key={props.day.toString()}
        overlap="circular"
        color="success"
        badgeContent={isSelected ? eventsOfTheDay.length : undefined}
      >
        <PickersDay
          {...other}
          outsideCurrentMonth={outsideCurrentMonth}
          day={day}
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

  return (
    <div>
      <div className="mx-2 ">
        {isMobile ? (
          <Box sx={{ width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                paddingLeft: "1rem",
              }}
            >
              <Typography variant="h6" sx={{ textAlign: "center" }}>
                Manage Bookings
              </Typography>
            </Box>
            <Paper
              elevation={3}
              sx={{
                borderRadius: "10px",
                marginLeft: "10px",
                marginRight: "10px",
              }}
            >
              <LocalizationProvider
                dateAdapter={AdapterMoment}
                adapterLocale={moment.locale.toString()}
              >
                <DateCalendar
                  value={selectedDate}
                  loading={isLoading}
                  onMonthChange={handleMonthChange}
                  // @ts-ignore
                  onChange={(newValue) =>
                    dateCalendarHandleDateChange(newValue)
                  }
                  renderLoading={() => <DayCalendarSkeleton />}
                  slots={{
                    day: EventsDay,
                  }}
                  sx={{ maxWidth: "290px" }}
                />
              </LocalizationProvider>
            </Paper>
            <Box sx={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
              {filteredEvents.length > 0 ? (
                <List>
                  {filteredEvents.map((event) => (
                    <React.Fragment key={event.event_id}>
                      <BookingEventListItem
                        event={event}
                        handleEventClick={handleEventClick}
                        getStatusBackgroundColorForAvata={
                          getStatusBackgroundColorForAvata
                        }
                      />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography
                  variant="h6"
                  align="center"
                  sx={{ marginTop: "20px" }}
                >
                  No bookings for the day
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <div>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                paddingLeft: "1rem",
              }}
            >
              <Typography
                variant="h5"
                sx={{ textAlign: "center", margin: "1rem 0" }}
              >
                Manage Bookings
              </Typography>
            </Box>
            <Box
              pt={1}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                gap: "1rem",
              }}
            >
              {/* Select Date */}
              <Box
                order={1}
                flexGrow={1}
                sx={{ paddingLeft: "1rem", maxWidth: { lg: "30%" } }}
              >
                <Paper elevation={3} sx={{ borderRadius: "20px" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Select Date
                    </Typography>
                    <LocalizationProvider
                      dateAdapter={AdapterMoment}
                      adapterLocale={moment.locale.toString()}
                    >
                      <DateCalendar
                        value={selectedDate}
                        loading={isLoading}
                        onMonthChange={handleMonthChange}
                        // @ts-ignore
                        onChange={(newValue) =>
                          dateCalendarHandleDateChange(newValue)
                        }
                        renderLoading={() => <DayCalendarSkeleton />}
                        slots={{
                          day: EventsDay,
                        }}
                      />
                    </LocalizationProvider>
                  </CardContent>
                </Paper>
              </Box>

              <Box order={2} flexGrow={5} sx={{ maxWidth: { lg: "30%" } }}>
                <Paper
                  elevation={3}
                  sx={{
                    height: "80vh",
                    maxHeight: "calc(100vh - 350px)",
                    overflowY: "auto",
                    borderRadius: "20px",
                  }}
                >
                  {filteredEvents.length > 0 ? (
                    <List>
                      {filteredEvents.map((event) => (
                        <React.Fragment key={event.event_id}>
                          <BookingEventListItem
                            event={event}
                            handleEventClick={handleEventClick}
                            getStatusBackgroundColorForAvata={
                              getStatusBackgroundColorForAvata
                            }
                          />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography
                      variant="h5"
                      align="center"
                      sx={{ marginTop: "5rem" }}
                    >
                      No bookings for the day
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Box>
          </div>
        )}
        <BookingEventDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedEvent={selectedEvent}
        handleStatusChange={handleStatusChange}
        handleSubmit={handleSubmit}
        isStatusModified={isStatusModified}
      />
      </div>
    </div>
  );
};

export default ManageReservationsPage;
