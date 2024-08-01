import React, { useCallback, useEffect, useState } from "react";
import MenubarDemo from "../components/Menubar";
import { axiosWithToken } from "../utils/axios";
import moment from 'moment-timezone';
import 'moment-timezone'
import {
	Calendar,
	Views,
	momentLocalizer,
} from 'react-big-calendar'
import { parse } from 'date-fns';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import CalendarEvent from "../components/CalendarEvent";
import * as Label from '@radix-ui/react-label';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from "@radix-ui/react-icons";
import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import isTokenExpired from "../helper/CheckTokenExpired";
import { refreshToken } from "../helper/RefreshToken";
import { getToken } from "../helper/getToken";
import { useNavigate } from "react-router";

interface FetchReservationsParams {
	startDate: string; //dd/MM/yyyy
	endDate: string; //dd/MM/yyyy
}

const australianTimezones = [
	'Australia/Sydney',
	'Australia/Melbourne',
	'Australia/Brisbane',
	'Australia/Perth',
	'Australia/Adelaide',
	'Australia/Hobart',
	'Australia/Darwin',
];

const today = new Date()

const mLocalizer = momentLocalizer(moment)
moment.updateLocale('en', {
	week: {
		dow: 1, // Monday is the first day of the week
	},
});
moment.tz.setDefault(moment.tz.guess());

const ManageReservationsPage: React.FC = () => {

	const [currentDate, setCurrentDate] = useState(new Date());
	const [events, setEvents] = useState<ProcessedEvent[]>([]);
	const [selectedTimezone, setSelectedTimezone] = useState(moment.tz.guess());
	const [selectedEvent, setSelectedEvent] = useState<ReservationEvent | null>(null);
	const [isStatusModified, setIsStatusModified] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const navigate = useNavigate();


	const handleEventClick = (event: any) => {
		setSelectedEvent(event as ReservationEvent);
		setIsDialogOpen(true);
		setIsStatusModified(false);
	};

	const parseStringToDate = (dateString: string): Date => {
		return parse(dateString, "dd/MM/yyyy HH:mm", new Date());
	};

	const fetchReservations = async (params: FetchReservationsParams): Promise<Reservation[]> => {
		try {
			const response = await axiosWithToken.get<Reservation[]>("/reservation/byTimeFrame", {
				params,
			});
			const processedEvents = await convertToProcessedEvents(response.data);
			setEvents(processedEvents);

			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	};

	const handleRangeChange = (range: any, view: any) => {
		if (view === undefined) {
			view = Views.WEEK;
		}
		let startDate;
		let endDate;
		if (view === Views.WEEK) {
			// Calculate the start of the week (Monday) and end of the week (Sunday)
			startDate = moment(range[1]).startOf(Views.WEEK).toDate(); // Monday
			endDate = moment(range[1]).endOf(Views.WEEK).toDate(); // Sunday
		} else if (view === Views.DAY) {
			startDate = moment(range[0]);
			endDate = moment(range[range.length - 1]);
		} else {
			startDate = moment(range.start);
			endDate = moment(range.end);
		}

		if (range.length > 0) {
			setCurrentDate(range[0]);
		}

		const requestParams: FetchReservationsParams = {
			startDate: moment(startDate).format('DD/MM/YYYY'),
			endDate: moment(endDate).format('DD/MM/YYYY'),
		};
		fetchReservations(requestParams);
	}

	useEffect(() => {
		checkTokenExpiredAndRefresh();
		const fetchData = async () => {
			try {
				const data = await fetchReservations({
					startDate: moment().startOf(Views.WEEK).format('DD/MM/YYYY'),
					endDate: moment().endOf(Views.WEEK).format('DD/MM/YYYY'),
				});
				const processedEvents = await convertToProcessedEvents(data);
				setEvents(processedEvents);
			} catch (error) {
				console.error("Failed to fetch reservations", error);
			}
		};

		fetchData();
	}, []);

	const checkTokenExpiredAndRefresh = async () => {
		if (sessionStorage.getItem("authToken")) {
      const token = getToken();

      if (isTokenExpired(token)) {
        await refreshToken(navigate);
      }
    } else {
      navigate("/session-expired");
    }
	}

	const convertToProcessedEvents = (reservations: Reservation[]): ReservationEvent[] => {
		return reservations.map(reservation => ({
			event_id: reservation.id,
			title: reservation.staff.nickname,
			start: parseStringToDate(reservation.bookingTime), // Convert string to Date
			end: parseStringToDate(reservation.endTime), // Convert string to Date
			data: reservation,
		}));
	};

	const onNavigate = useCallback((date: Date) => setCurrentDate(date), [setCurrentDate]);
	const handleTimezoneChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedTimezone(event.target.value);
		moment.tz.setDefault(event.target.value);
	};

	const handleStatusChange = (e: any) => {
		if (selectedEvent) {
			setSelectedEvent({
				...selectedEvent,
				data: {
					...selectedEvent.data,
					status: e
				}
			});
		}

		setIsStatusModified(selectedEvent?.data.status !== e);
	};

	const handleSubmit = () => {

		updateReservationEvent(selectedEvent as ReservationEvent);
	};

	const components = {
		// @ts-ignore
		event: ({ event }) => {
			const data = event?.data;
			return <CalendarEvent reservation={data} />;
		},
	};

	const updateEventData = (response: { data: { id: string;[key: string]: any } }) => {
		const updatedEvents = (events as ReservationEvent[]).map(event => {
			if (event.data.id.toString() === response.data.id.toString()) {
				return { ...event, data: response.data };
			}
			return event;
		});

		setEvents(updatedEvents);
	};

	const updateReservationEvent = async (selectedEvent: ReservationEvent) => {
		checkTokenExpiredAndRefresh();
		const url = `/reservation/`;
		const response = await axiosWithToken.put(url, selectedEvent.data);

		if (!response.data) {
			throw new Error('Failed to update reservation event');
		}

		// Update the corresponding event in the events array
		updateEventData(response);

	};

	return (
		<div className="min-h-screen flex flex-col">
			<MenubarDemo />
			<div className="mx-4 calendar-container">
				<div className="flex flex-col sm:flex-row justify-between items-center mb-2">
					<div className="status-container flex flex-wrap justify-between mb-2 sm:mb-0">
						<div className="p-1 status-item confirmed text-xs sm:text-base">Confirmed</div>
						<div className="p-1 status-item pending text-xs sm:text-base">Pending</div>
						<div className="p-1 status-item cancelled text-xs sm:text-base">Cancelled</div>
					</div>
					<div className="flex items-center">
						<Label.Root className="mr-2" htmlFor="timezone">Timezone:</Label.Root>
						<select id="timezone"
							value={selectedTimezone}
							onChange={handleTimezoneChange}
							className="border border-gray-300 rounded p-2"
						>
							{australianTimezones.map(tz => (
								<option key={tz} value={tz}>
									{tz}
								</option>
							))}
						</select>
					</div>
				</div>
				<Calendar
					defaultDate={new Date()}
					events={events}
					defaultView={Views.WEEK}
					showMultiDayTimes
					step={30}
					views={[Views.WEEK, Views.MONTH, Views.DAY]}
					localizer={mLocalizer}
					onRangeChange={handleRangeChange}
					onNavigate={onNavigate}
					date={currentDate}
					components={components}
					// onSelectEvent={handleEventClick}
					min={
						new Date(
							today.getFullYear() - 10,
							today.getMonth(),
							today.getDate(),
							5
						)
					}// Start time at 8 AM
					max={
						new Date(
							today.getFullYear() + 10,
							today.getMonth(),
							today.getDate(),
							21
						)
					}// End time at 10 PM
					formats={{
						timeGutterFormat: 'HH:mm',
						eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
							`${mLocalizer.format(start, 'HH:mm', culture)} - ${mLocalizer.format(end, 'HH:mm', culture)}`,
						agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
							`${mLocalizer.format(start, 'HH:mm', culture)} - ${mLocalizer.format(end, 'HH:mm', culture)}`,
					}}
					onSelectEvent={handleEventClick}
				/>
				<Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<Dialog.Overlay className="overlay-dialog data-[state=open]:animate-overlayShow" />
					<Dialog.Content className="data-[state=open]:animate-contentShow content-dialog z-10" aria-describedby={undefined}>
						<Dialog.Title className="text-slate-700 m-0 text-[17px] font-medium mb-5">
							Booking Details
						</Dialog.Title>
						<div className="bg-white p-4 rounded shadow-lg">
							{selectedEvent && (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
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
											{selectedEvent.data.bookingTime.split(' ')[1]} - {selectedEvent.data.endTime.split(' ')[1]} ({selectedEvent.data.totalEstimatedTime} mins)
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
										<Select.Root value={selectedEvent.data.status} onValueChange={handleStatusChange}>
											<Select.Trigger className="SelectTrigger">
												<Select.Value placeholder="Select a status…" />
												<Select.Icon className="SelectIcon">
													<ChevronDownIcon />
												</Select.Icon>
											</Select.Trigger>
											<Select.Content className="SelectContent" position="popper">
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
											{selectedEvent.data.customer.firstName} {selectedEvent.data.customer.lastName}
										</label>
									</fieldset>
									<div className="flex flex-wrap items-center gap-3 mb-[15px]">
										{selectedEvent.data.customer.email && <fieldset className="flex items-center gap-3 w-full sm:w-auto">
											<label className="w-[100px] text-left text-[15px]">
												Email
											</label>
											<label className="Input non-editable-label">
												{selectedEvent.data.customer.email}
											</label>
										</fieldset>}
										{selectedEvent.data.customer.phone && <fieldset className="flex items-center gap-3 w-full sm:w-auto">
											<label className="w-[100px] text-left text-[15px] sm:text-right">
												Phone
											</label>
											<label className="Input non-editable-label">
												{selectedEvent.data.customer.phone}
											</label>
										</fieldset>}
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
									<button
										className="hover:bg-blue-500 focus:shadow-blue-700 inline-flex h-[35px] w-[135px] sm:w-[100px] items-center justify-center rounded-md px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none bg-blue-700 text-white"
									>
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