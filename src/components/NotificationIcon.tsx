import React, { useCallback, useEffect, useRef, useState } from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import CircularProgress from '@mui/material/CircularProgress'
import { axiosWithToken, BASE_URL } from '../utils/axios';
import moment from 'moment';
import { CheckCircle } from '@mui/icons-material';
import { getToken } from '../helper/getToken';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import isTokenExpired from '../helper/CheckTokenExpired';
import { refreshToken } from '../helper/RefreshToken';
import { useNavigate } from "react-router";

const NotificationIcon: React.FC = () => {
	const [notificationCount, setNotificationCount] = useState(0);
	const [showNotifications, setShowNotifications] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const notificationIconRef = useRef<HTMLDivElement>(null);
	const originalTitle = useRef(document.title);
	const [notificationPage, setNotificationPage] = useState(1);
	const [loadingNotifications, setLoadingNotifications] = useState(false);
	const stompClient = useRef<Client | null>(null);
	// Interval to toggle the title when a new notification is received
	const titleInterval = useRef<NodeJS.Timeout | null>(null);
	const navigate = useNavigate();

	const checkTokenExpiredAndRefresh = async () => {
		if (localStorage.getItem("authToken")) {
			const token = getToken();

			if (isTokenExpired(token)) {
				await refreshToken(navigate);
			}
		} else {
			navigate("/session-expired");
		}
	};

	const loadMoreNotifications = useCallback(async () => {
		setLoadingNotifications(true);
		try {
			// Fetch additional notifications (replace with your actual fetch logic)
			const newNotifications = await fetchRecentNotifications(notificationPage);
			if (newNotifications.length === 0) {
				return;
			}
			setNotifications((prevNotifications) => [...prevNotifications, ...newNotifications]);
			setNotificationPage((prevPage) => prevPage + 1);
		} catch (error) {
			console.error('Failed to load more notifications:', error);
		} finally {
			setLoadingNotifications(false);
		}
	}, [notificationPage, setNotifications]);

	const fetchNotificationCount = async () => {
		checkTokenExpiredAndRefresh();

		try {
			const response = await axiosWithToken.get('/notifications/count-unseen');
			setNotificationCount(response.data);
		} catch (error) {
			console.error('Error fetching notification count:', error);
		}
	};
	useEffect(() => {
		fetchNotificationCount();
	}, []);

	const fetchRecentNotifications = async (pageNumber: number) => {
		checkTokenExpiredAndRefresh();
		const response = await axiosWithToken.get(`/notifications?page=${pageNumber}&size=5&sort=id,DESC`);
		if (response.status !== 200) {
			throw new Error('Network response was not ok');
		}
		return response.data.content;
	};

	useEffect(() => {
		const fetchNotifications = async () => {
			try {
				const latestNotifications = await fetchRecentNotifications(0);
				setNotifications(latestNotifications);
			} catch (error) {
				console.error('Failed to fetch recent notifications:', error);
			}
		};

		fetchNotifications();
	}, []);

	const toggleNotifications = () => {
		setShowNotifications(prevState => {
			if (prevState) {
				markNotificationsAsSeen();
			}
			return !prevState;
		});

		// clear the new notification interval when the dropdown is opened
		if (titleInterval.current) {
			clearInterval(titleInterval.current);
			document.title = originalTitle.current;
			titleInterval.current = null;
		}
	};

	async function markNotificationsAsSeen() {
		const unseenNotifications = notifications.filter(notification => !notification.seen);

		if (unseenNotifications.length > 0) {
			const unseenNotificationIds = unseenNotifications.map(notification => notification.id);

			try {
				const response = await fetch(`${BASE_URL}notifications/seen`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${getToken()}`,
					},
					body: JSON.stringify(unseenNotificationIds),
				});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				// Filter out the seen notifications
				const updatedNotifications = notifications.map(notification =>
					unseenNotificationIds.includes(notification.id)
						? { ...notification, seen: true }
						: notification
				);

				// Update the state
				setNotifications(updatedNotifications);
				// Fetch the updated notification count
				fetchNotificationCount();

			} catch (error) {
				console.error('Failed to mark notifications as seen:', error);
			}
		}
	}

	const handleClickOutside = (event: MouseEvent) => {
		if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && notificationIconRef.current && !notificationIconRef.current.contains(event.target as Node)) {
			markNotificationsAsSeen();
			setShowNotifications(false);
			// Reset the notification page to 0 when the dropdown is closed
			setNotificationPage(1);
		}
	};

	useEffect(() => {
		if (showNotifications) {
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showNotifications]);

	useEffect(() => {
		const token = getToken();

		const socket = new SockJS(`${BASE_URL}ws?token=${token}`);
		stompClient.current = new Client({
			webSocketFactory: () => socket,
			connectHeaders: {
				Authorization: `Bearer ${token}`,
			},
			onConnect: () => {
				console.log('Connected to Notifications WebSocket');
				stompClient.current?.subscribe('/user/topic/notifications', (message) => {
					const notification = JSON.parse(message.body);
					setNotifications((prevNotifications) => [notification, ...prevNotifications]);
					setNotificationCount((prevCount) => prevCount + 1);

					// Start the interval to toggle the title when a new notification is received
					if (!titleInterval.current) {
						let toggle = false;
						titleInterval.current = setInterval(() => {
							document.title = toggle ? ` New Notification!` : originalTitle.current;
							toggle = !toggle;
						}, 1000);
					}
				});
			},
			onStompError: (frame) => {
				console.error('Broker reported error: ' + frame.headers['message']);
				console.error('Additional details: ' + frame.body);
			},
		});

		stompClient.current.activate();

		return () => {
			stompClient.current?.deactivate();
			if (titleInterval.current) {
				clearInterval(titleInterval.current);
				document.title = originalTitle.current;
			}
		};
	}, []);

	const formatTimeElapsed = (timestamp: string) => {
		const now = moment();
		const notificationTime = moment(timestamp);
		const diffInMinutes = now.diff(notificationTime, 'minutes');
		const diffInHours = now.diff(notificationTime, 'hours');
		const diffInDays = now.diff(notificationTime, 'days');
		const diffInWeeks = now.diff(notificationTime, 'weeks');
		const diffInMonths = now.diff(notificationTime, 'months');

		if (diffInMinutes < 60) {
			return `${diffInMinutes} m`;
		} else if (diffInHours < 24) {
			return `${diffInHours} h`;
		} else if (diffInDays < 7) {
			return `${diffInDays} d`;
		} else if (diffInWeeks < 4) {
			return `${diffInWeeks} w`;
		} else {
			return `${diffInMonths} mo`;
		}
	};

	return (
		<div className="notification-container">
			<Badge badgeContent={notificationCount} color="primary" onClick={toggleNotifications} ref={notificationIconRef}>
				<NotificationsIcon />
			</Badge>
			{showNotifications && (
				<div className="notifications-dropdown rounded-md" ref={dropdownRef}>
					{notifications.length > 0 ? (
						<>
							{notifications.map((notification, index) => (
								<div key={index} className="notification-item" style={{ display: 'flex', alignItems: 'center' }}>
									<div style={{ flex: 1 }}>
										{notification.type === 'BOOKING_CREATED' && (
											<div style={{ fontSize: '15px', fontWeight: 'bold'}}>
												New booking
											</div>
										)}
										{notification.type === 'BOOKING_CANCELLATION' && (
											<div style={{ fontSize: '15px', fontWeight: 'bold'}}>
												Booking cancel
											</div>
										)}
										{notification.type === 'BOOKING_CONFIRMATION' && (
											<div style={{ fontSize: '15px', fontWeight: 'bold'}}>
												Booking confimed
											</div>
										)}
										<div style={{ fontSize: '14px', color: '#333', padding: '5px 0' }}>
											{notification.message}
										</div>
									</div>
									<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '10px' }}>
										{notification.seen && (<CheckCircle style={{ color: '#1976d2' }} />)}
										<div style={{ color: '#1976d2', fontSize: '15px', marginTop: '5px' }}>
											{formatTimeElapsed(notification.timestamp)}
										</div>
									</div>
								</div>
							))}
							<button
								onClick={loadMoreNotifications}
								disabled={loadingNotifications}
								style={{
									width: '100%',
									textAlign: 'center',
									backgroundColor: '#1976d2',
									color: 'white',
									padding: '10px',
									border: 'none',
									cursor: 'pointer',
								}}
							>
								{loadingNotifications ? <CircularProgress size={24} style={{ color: 'white' }} /> : 'Load more'}
							</button>
						</>
					) : (
						<div className="notification-item">No new notifications</div>
					)}
				</div>
			)}
		</div>
	);
};

export default NotificationIcon;