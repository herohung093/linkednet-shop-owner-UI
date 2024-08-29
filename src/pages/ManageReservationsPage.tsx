/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import MenubarDemo from "../components/Menubar";
import { axiosWithToken } from "../utils/axios";
import { parse } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as Select from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import Chip from '@mui/material/Chip';
import isTokenExpired from "../helper/CheckTokenExpired";
import { refreshToken } from "../helper/RefreshToken";
import { getToken } from "../helper/getToken";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import { useMediaQuery } from 'react-responsive'
import { Typography, Box, List, ListItem, ListItemText, Avatar, ListItemAvatar, ListItemButton, Paper, CardContent } from '@mui/material';
import Badge from '@mui/material/Badge';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import moment from "moment";

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
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' })
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(moment());
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
    checkTokenExpiredAndRefresh();
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
    checkTokenExpiredAndRefresh();
    let startDate = moment().startOf('month').format("DD/MM/YYYY").toString();
    let endDate = moment().endOf('month').format("DD/MM/YYYY").toString();
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

  const checkTokenExpiredAndRefresh = async () => {
    if (sessionStorage.getItem("authToken")) {
      const token = getToken();

      if (isTokenExpired(token)) {
        await refreshToken(navigate);
      }
    } else {
      navigate("/session-expired");
    }
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

  const updateEventData = (response: {
    data: Reservation;
  }) => {
    const updatedEvents = (events as ReservationEvent[]).map((event) => {
      if (event.data.id.toString() === response.data.id.toString()) {
        return { ...event, data: response.data };
      }
      return event;
    });

    setEvents(updatedEvents);
    setFilteredEvents(updatedEvents.filter(event => moment(event.start).isSame(selectedDate, 'day')));
  };

  const updateReservationEvent = async (selectedEvent: ReservationEvent) => {
    checkTokenExpiredAndRefresh();
    const url = `/reservation/`;
    const response = await axiosWithToken.put(url, selectedEvent.data);

    if (!response.data) {
      throw new Error("Failed to update reservation event");
    }

    // Update the corresponding event in the events array
    updateEventData(response);
  };

  const handleMonthChange = (date: moment.Moment) => {

    const startDate = date.startOf('month').format("DD/MM/YYYY").toString();
    const endDate = date.endOf('month').format("DD/MM/YYYY").toString();

    const requestParams: FetchReservationsParams = {
      startDate: startDate,
      endDate: endDate,
    };
    fetchReservations(requestParams);
  };

  function EventsDay(props: PickersDayProps<moment.Moment> & { highlightedDays?: number[] }) {
    const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

    const eventsOfTheDay = events.filter(event => moment(event.start).isSame(day, 'day'));
    const isSelected =
      !props.outsideCurrentMonth;

    return (
      <Badge
        key={props.day.toString()}
        overlap="circular"
        color="success"
        badgeContent={isSelected ? eventsOfTheDay.length : undefined}
      >
        <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
      </Badge>
    );
  }

  const dateCalendarHandleDateChange = (date: moment.Moment | null, initialEvents?: ReservationEvent[]) => {
    setSelectedDate(date);
    if (date) {
      let filtered
      if (initialEvents && initialEvents.length > 0) {
        filtered = initialEvents
          .filter(event => moment(event.start).isSame(date, 'day'))
          .sort((a, b) => moment(a.start).diff(moment(b.start)));
      } else {
        filtered = events
          .filter(event => moment(event.start).isSame(date, 'day'))
          .sort((a, b) => moment(a.start).diff(moment(b.start)));
      }

      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
  };

  const getStatusBackgroundColorForAvata = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'springgreen';
      case 'PENDING':
        return 'darkorange';
      case 'CANCELLED':
        return 'crimson';
      default:
        return 'default';
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      <MenubarDemo />
      <div className="mx-4 ">
        {isMobile ? (
          <Box sx={{ width: '100%' }}>
            <Paper elevation={3} sx={{ padding: '10px', borderRadius: '10px', marginBottom: '10px', marginLeft: '10px', marginRight: '10px' }}>
              <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale={moment.locale.toString()}>
                <DateCalendar
                  value={selectedDate}
                  loading={isLoading}
                  onMonthChange={handleMonthChange}
                  // @ts-ignore
                  onChange={(newValue) => dateCalendarHandleDateChange(newValue)}
                  renderLoading={() => <DayCalendarSkeleton />}
                  slots={{
                    day: EventsDay,
                  }}
                />
              </LocalizationProvider>
            </Paper>
            {/* <Divider sx={{ height: '3px', backgroundColor: 'gray' }} /> */}
            {filteredEvents.length > 0 && (
              <Box sx={{ maxHeight: 'calc(100vh - 500px)', overflowY: 'auto' }}>
                <List>
                  {filteredEvents.map((event) => (
                    <React.Fragment key={event.event_id}>
                      <ListItemButton
                        sx={{
                          width: '100%',
                          textAlign: 'left',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.08)',
                          },
                        }}
                        onClick={() => handleEventClick(event)}
                      >
                        <ListItem sx={{ padding: '0px' }}>
                          <Paper elevation={3} sx={{ padding: '10px', borderRadius: '10px', width: '100%' }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: getStatusBackgroundColorForAvata(event.data.status), width: 20, height: 20 }} />
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <Typography variant="body1">{event.title}</Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {event.data.bookingTime.split(' ')[1] + ' - ' + event.data.endTime.split(' ')[1] + ' ($' + event.data.totalPrice + ')'}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <Typography variant="body1">Cust: {event.data.customer.firstName}</Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {event.data.customer.phone}
                                  </Typography>
                                </Box>
                              }
                            />
                          </Paper>
                        </ListItem>
                      </ListItemButton>
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        ) : (
          <div>
            <Box sx={{ display: 'flex', flexDirection: 'row', paddingLeft: '1rem' }}>
              <Typography variant="h4" sx={{ textAlign: 'center', margin: '1rem 0' }}>
                Manage Bookings
              </Typography>
            </Box>
            <Box pt={1} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: '1rem' }}>
              {/* Select Date */}
              <Box order={1} flexGrow={1} sx={{ paddingLeft: '1rem', maxWidth: { lg: '30%' } }}>
                <Paper elevation={3} sx={{ borderRadius: '20px' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Select Date
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale={moment.locale.toString()}>
                      <DateCalendar
                        value={selectedDate}
                        loading={isLoading}
                        onMonthChange={handleMonthChange}
                        // @ts-ignore
                        onChange={(newValue) => dateCalendarHandleDateChange(newValue)}
                        renderLoading={() => <DayCalendarSkeleton />}
                        slots={{
                          day: EventsDay,
                        }}
                      />
                    </LocalizationProvider>
                  </CardContent>
                </Paper>
              </Box>

              <Box order={2} flexGrow={5} sx={{ maxWidth: { lg: '30%' } }}>
                <Paper elevation={3} sx={{ height: '80vh', maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', borderRadius: '20px' }}>
                  <List>
                    {filteredEvents.map((event) => (
                      <React.Fragment key={event.event_id}>
                        <ListItemButton
                          sx={{
                            width: '100%',
                            textAlign: 'left',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.08)',
                            },
                          }}
                          onClick={() => handleEventClick(event)}
                        >
                          <ListItem sx={{ padding: '0px' }}>
                            <Paper elevation={3} sx={{ padding: '10px', borderRadius: '10px', width: '100%' }}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: getStatusBackgroundColorForAvata(event.data.status), width: 20, height: 20 }} />
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <Typography variant="body1">{event.title}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      {event.data.bookingTime.split(' ')[1] + ' - ' + event.data.endTime.split(' ')[1] + ' ($' + event.data.totalPrice + ')'}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <Typography variant="body1">Cust: {event.data.customer.firstName}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      {`${event.data.customer.phone.slice(0, 4)} ${event.data.customer.phone.slice(4, 7)} ${event.data.customer.phone.slice(7, 10)}`}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </Paper>
                          </ListItem>
                        </ListItemButton>
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              </Box>
            </Box>
          </div>
        )}
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen} >
          <Dialog.Overlay className="overlay-dialog data-[state=open]:animate-overlayShow" />
          <Dialog.Content
            className="data-[state=open]:animate-contentShow content-dialog z-10"
            aria-describedby={undefined}
            style={{ maxHeight: '80vh', overflowY: 'auto' }}
          >
            <Dialog.Title className="text-slate-700 m-0 text-[17px] font-medium mb-5">
              Booking Details
            </Dialog.Title>
            <div className="bg-white p-4 rounded shadow-lg">
              {selectedEvent && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-[15px]">
                    <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="w-[100px] text-left text-[15px]">
                        Booking ID
                      </label>
                      <label className="Input non-editable-label">
                        {selectedEvent.data.id}
                      </label>
                    </fieldset>
                    <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="w-[100px] text-left text-[15px] sm:text-right">
                        Staff
                      </label>
                      <label className="Input non-editable-label">
                        {selectedEvent.data.staff.nickname}
                      </label>
                    </fieldset>
                  </div>
                  <fieldset className="mb-[15px] flex items-center gap-3">
                    <label className="w-[100px] text-left text-[15px]">
                      Booking Time
                    </label>
                    <label className="Input non-editable-label">
                      {selectedEvent.data.bookingTime.split(" ")[1]} -{" "}
                      {selectedEvent.data.endTime.split(" ")[1]} (
                      {selectedEvent.data.totalEstimatedTime} mins)
                    </label>
                  </fieldset>
                  <fieldset className="mb-[15px] flex items-center gap-3">
                    <label className="w-[100px] text-left text-[15px]">
                      Total Price
                    </label>
                    <label className="Input non-editable-label">
                      ${selectedEvent.data.totalPrice}
                    </label>
                  </fieldset>
                  <fieldset className="mb-[15px] flex items-center gap-3">
                    <label className="w-[100px] text-left text-[15px]">
                      Status
                    </label>
                    <Select.Root
                      value={selectedEvent.data.status}
                      onValueChange={handleStatusChange}
                    >
                      <Select.Trigger className="SelectTrigger">
                        <Select.Value placeholder="Select a status…" />
                        <Select.Icon className="SelectIcon">
                          <ChevronDownIcon />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Content
                        className="SelectContent"
                        position="popper"
                      >
                        <Select.Viewport className="SelectViewport">
                          <Select.Item className="SelectItem" value="PENDING">
                            <Select.ItemText>Pending</Select.ItemText>
                            <Select.ItemIndicator className="SelectItemIndicator">
                              <CheckIcon />
                            </Select.ItemIndicator>
                          </Select.Item>
                          <Select.Item className="SelectItem" value="CONFIRMED">
                            <Select.ItemText>Confirmed</Select.ItemText>
                            <Select.ItemIndicator className="SelectItemIndicator">
                              <CheckIcon />
                            </Select.ItemIndicator>
                          </Select.Item>
                          <Select.Item className="SelectItem" value="CANCELLED">
                            <Select.ItemText>Cancelled</Select.ItemText>
                            <Select.ItemIndicator className="SelectItemIndicator">
                              <CheckIcon />
                            </Select.ItemIndicator>
                          </Select.Item>
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Root>
                  </fieldset>

                  <fieldset className="mb-[15px] flex items-center gap-3">
                    <label className="w-[100px] text-left text-[15px]">
                      Customer
                    </label>
                    <label className="Input non-editable-label">
                      {selectedEvent.data.customer.firstName}{" "}
                      {selectedEvent.data.customer.lastName}
                    </label>
                  </fieldset>
                  <div className="flex flex-wrap items-center gap-3 mb-[15px]">
                    {selectedEvent.data.customer.email && (
                      <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                        <label className="w-[100px] text-left text-[15px]">
                          Email
                        </label>
                        <label className="Input non-editable-label">
                          {selectedEvent.data.customer.email}
                        </label>
                      </fieldset>
                    )}
                    {selectedEvent.data.customer.phone && (
                      <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                        <label className="w-[100px] text-left text-[15px] sm:text-right">
                          Phone
                        </label>
                        <label className="Input non-editable-label">
                          {`${selectedEvent.data.customer.phone.slice(0, 4)} ${selectedEvent.data.customer.phone.slice(4, 7)} ${selectedEvent.data.customer.phone.slice(7, 10)}`}
                        </label>
                      </fieldset>
                    )}
                    {selectedEvent.data.customer.blacklisted && (
                      <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                        <label className="w-[100px] text-left text-[15px] sm:text-right">
                          Status
                        </label>
                        <Chip label="Blacklisted" color="error" variant="outlined" />
                      </fieldset>
                    )}
                  </div>
                  <fieldset className="mb-[15px] flex items-center gap-3">
                    <label className="w-[100px] text-left text-[15px]">
                      Note
                    </label>
                    <label className="Input text-left break-words non-editable-label">
                      {selectedEvent.data.note}
                    </label>
                  </fieldset>
                  <fieldset className="mb-[15px] flex items-center gap-3">
                    <label className="w-[100px] text-left text-[15px]">
                      Service Items
                    </label>
                    <div className="bg-gray-100 p-3 rounded-md w-full">
                      <ul className="list-disc pl-5">
                        {selectedEvent.data.serviceItems.map((item, index) => (
                          <li key={index}>
                            {item.serviceName} - ({item.estimatedTime} mins)
                          </li>
                        ))}
                      </ul>
                    </div>
                  </fieldset>
                </div>
              )}
              <div className="mt-[25px] flex justify-end">
                <Dialog.Close asChild>
                  {isStatusModified && (
                    <button
                      onClick={handleSubmit}
                      className="hover:bg-blue-500 focus:shadow-blue-700 inline-flex h-[35px] w-[135px] sm:w-[100px] items-center justify-center rounded-md px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none bg-blue-700 text-white mr-2"
                    >
                      Submit
                    </button>
                  )}
                </Dialog.Close>
                <Dialog.Close asChild>
                  <button className="hover:bg-blue-500 focus:shadow-blue-700 inline-flex h-[35px] w-[135px] sm:w-[100px] items-center justify-center rounded-md px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none bg-blue-700 text-white">
                    Cancel
                  </button>
                </Dialog.Close>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                aria-label="Close"
              >
                <Cross2Icon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </div>
  );
};

export default ManageReservationsPage;
