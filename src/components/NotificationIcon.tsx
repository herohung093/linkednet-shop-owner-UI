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
import { Button, Divider, MenuItem, Typography, IconButton } from '@mui/material';
import Menu from '@mui/material/Menu';

const NotificationIcon: React.FC = () => {
	const [notificationCount, setNotificationCount] = useState(0);
	const [showNotifications, setShowNotifications] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const originalTitle = useRef(document.title);
	const [notificationPage, setNotificationPage] = useState(1);
	const [loadingNotifications, setLoadingNotifications] = useState(false);
	const stompClient = useRef<Client | null>(null);

	const notificationIconRef = useRef(null);

	const handleClose = () => {
		setShowNotifications(false);
		markNotificationsAsSeen();
		// Reset the notification page to 0 when the dropdown is closed
		setNotificationPage(1);
	};

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
				navigate("/session-expired");
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
	};

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				// Clear the interval when the tab becomes visible
				if (titleInterval.current) {
					clearInterval(titleInterval.current);
					titleInterval.current = null;
				}
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

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
		<div>

			<IconButton
				size="small"
				aria-label="account of current user"
				aria-controls="menu-appbar"
				aria-haspopup="true"
				color="inherit"
				onClick={toggleNotifications}
				sx={{
					boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)',
					borderRadius: '50%',
					backgroundColor: 'white',
					border: '1px solid #E5E7EB'
				}}
			>
				<Badge badgeContent={notificationCount} color="primary" >
					<NotificationsIcon sx={{ color: 'black' }} ref={notificationIconRef} />
				</Badge>
			</IconButton>
			<Menu
				anchorEl={notificationIconRef.current}
				open={showNotifications}
				onClose={handleClose}
				PaperProps={{
					style: {
						maxHeight: '400px',
						width: '300px',
					},
				}}
			>
				{notifications.length > 0 ? (
					notifications.flatMap((notification, index) => [
						<MenuItem key={index} style={{ display: 'flex', alignItems: 'center' }}>
							<div style={{ flex: 1 }}>
								{notification.type === 'BOOKING_CREATED' && (
									<Typography variant="subtitle1" fontWeight="bold">
										New booking
									</Typography>
								)}
								{notification.type === 'BOOKING_CANCELLATION' && (
									<Typography variant="subtitle1" fontWeight="bold">
										Booking cancel
									</Typography>
								)}
								{notification.type === 'BOOKING_CONFIRMATION' && (
									<Typography variant="subtitle1" fontWeight="bold">
										Booking confirmed
									</Typography>
								)}
								<Typography variant="body2" color="textSecondary" style={{ padding: '5px 0', whiteSpace: 'pre-line' }}>
									{notification.message}
								</Typography>
							</div>
							<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '10px' }}>
								{notification.seen && <CheckCircle style={{ color: '#1976d2' }} />}
								<Typography variant="body2" color="primary" style={{ marginTop: '5px' }}>
									{formatTimeElapsed(notification.timestamp)}
								</Typography>
							</div>
						</MenuItem>,
						index < notifications.length - 1 && <Divider key={`divider-${index}`} />,
					])
				) : (
					<MenuItem>
						<Typography variant="body2">No new notifications</Typography>
					</MenuItem>
				)}
				<MenuItem>
					<Button
						onClick={loadMoreNotifications}
						disabled={loadingNotifications}
						fullWidth
						variant="contained"
						color="primary"
					>
						{loadingNotifications ? <CircularProgress size={24} style={{ color: 'white' }} /> : 'Load more'}
					</Button>
				</MenuItem>
			</Menu>
		</div>
	);
};

export default NotificationIcon;