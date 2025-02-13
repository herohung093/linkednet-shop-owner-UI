import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge,
  Box,
  CircularProgress,
  ClickAwayListener,
  IconButton,
  Paper,
  Popper,
  Typography,
  Fade,
  Divider,
  Button,
  List,
  ListItem,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  NotificationsNone as EmptyNotificationIcon,
} from '@mui/icons-material';
import { axiosWithToken, BASE_URL } from '../utils/axios';
import moment from 'moment';
import { getToken } from '../helper/getToken';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

const NotificationBadge: React.FC = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationPage, setNotificationPage] = useState(1);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const stompClient = useRef<Client | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const theme = useTheme();

  const originalTitle = useRef(document.title);
  const titleInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchNotificationCount = async () => {
    try {
      const response = await axiosWithToken.get('/notifications/count-unseen');
      setNotificationCount(response.data);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const fetchRecentNotifications = async (pageNumber: number) => {
    const response = await axiosWithToken.get(`/notifications?page=${pageNumber}&size=5&sort=id,DESC`);
    return response.data.content;
  };

  const loadMoreNotifications = useCallback(async () => {
    if (loadingNotifications || !hasMoreNotifications) return;
    
    setLoadingNotifications(true);
    try {
      const newNotifications = await fetchRecentNotifications(notificationPage);
      if (newNotifications.length === 0) {
        setHasMoreNotifications(false);
        return;
      }
      setNotifications(prev => [...prev, ...newNotifications]);
      setNotificationPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [notificationPage, loadingNotifications, hasMoreNotifications]);

  useEffect(() => {
    fetchNotificationCount();
  }, []);

  useEffect(() => {
    const fetchInitialNotifications = async () => {
      try {
        const latestNotifications = await fetchRecentNotifications(0);
        setNotifications(latestNotifications);
      } catch (error) {
        console.error('Failed to fetch recent notifications:', error);
      }
    };

    if (showNotifications) {
      fetchInitialNotifications();
    }
  }, [showNotifications]);

  const handleClose = () => {
    setShowNotifications(false);
    markNotificationsAsSeen();
    setNotificationPage(1);
    setHasMoreNotifications(true);
  };

  async function markNotificationsAsSeen() {
    const unseenNotifications = notifications.filter(notification => !notification.seen);
    if (unseenNotifications.length === 0) return;

    try {
      const unseenNotificationIds = unseenNotifications.map(notification => notification.id);
      await axiosWithToken.put('/notifications/seen', unseenNotificationIds);
      
      setNotifications(prev => 
        prev.map(notification => 
          unseenNotificationIds.includes(notification.id)
            ? { ...notification, seen: true }
            : notification
        )
      );
      
      fetchNotificationCount();
    } catch (error) {
      console.error('Failed to mark notifications as seen:', error);
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
        stompClient.current?.subscribe('/user/topic/notifications', (message) => {
          const notification = JSON.parse(message.body);
          setNotifications(prev => [notification, ...prev]);
          setNotificationCount(prev => prev + 1);

          if (!titleInterval.current && document.hidden) {
            let toggle = false;
            titleInterval.current = setInterval(() => {
              document.title = toggle ? 'New Notification!' : originalTitle.current;
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

  const getNotificationIcon = (type: string, seen: boolean) => {
    switch (type) {
      case 'BOOKING_CREATED':
        return <ScheduleIcon color={seen ? "action" : "primary"} fontSize="small" />;
      case 'BOOKING_CANCELLATION':
        return <ErrorIcon color={seen ? "action" : "error"} fontSize="small" />;
      case 'BOOKING_CONFIRMATION':
        return <CheckCircleIcon color={seen ? "action" : "success"} fontSize="small" />;
      default:
        return <NotificationsIcon color={seen ? "action" : "primary"} fontSize="small" />;
    }
  };

  const formatTimeElapsed = (timestamp: string) => {
    const now = moment();
    const notificationTime = moment(timestamp);
    const diffInMinutes = now.diff(notificationTime, 'minutes');
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = now.diff(notificationTime, 'hours');
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = now.diff(notificationTime, 'days');
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.format('MMM D, YYYY');
  };

  return (
    <>
      <IconButton
        ref={anchorRef}
        size="small"
        onClick={() => setShowNotifications(prev => !prev)}
        sx={{
          position: 'relative',
          p: 1.25,
          backgroundColor: showNotifications ? 'action.selected' : 'transparent',
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <Badge
          badgeContent={notificationCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              right: -3,
              top: 3,
              border: `2px solid ${theme.palette.background.paper}`,
              padding: '0 4px',
            },
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popper
        open={showNotifications}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Fade {...TransitionProps} timeout={350}>
              <Paper
                elevation={3}
                sx={{
                  width: 360,
                  maxWidth: '100vw',
                  maxHeight: '80vh',
                  mt: 1,
                  overflow: 'hidden',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" component="div">
                    Notifications
                  </Typography>
                </Box>

                <List sx={{ maxHeight: '60vh', overflow: 'auto', p: 0 }}>
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <ListItem
                          sx={{
                            px: 2,
                            py: 1.5,
                            backgroundColor: notification.seen ? 'transparent' : 'action.hover',
                            '&:hover': {
                              backgroundColor: 'action.selected',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', width: '100%', gap: 1.5 }}>
                            <Box sx={{ pt: 0.5 }}>
                              {getNotificationIcon(notification.type, notification.seen)}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: notification.seen ? 'normal' : 'bold',
                                  color: notification.seen ? 'text.secondary' : 'text.primary',
                                }}
                              >
                                {notification.message}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                component="div"
                                sx={{ mt: 0.5 }}
                              >
                                {formatTimeElapsed(notification.timestamp)}
                              </Typography>
                            </Box>
                          </Box>
                        </ListItem>
                        {index < notifications.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  ) : (
                    <Box
                      sx={{
                        py: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        color: 'text.secondary',
                      }}
                    >
                      <EmptyNotificationIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                      <Typography>No notifications yet</Typography>
                    </Box>
                  )}
                </List>

                {notifications.length > 0 && hasMoreNotifications && (
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                      fullWidth
                      onClick={loadMoreNotifications}
                      disabled={loadingNotifications}
                      sx={{ textTransform: 'none' }}
                    >
                      {loadingNotifications ? (
                        <CircularProgress size={24} />
                      ) : (
                        'Load more notifications'
                      )}
                    </Button>
                  </Box>
                )}
              </Paper>
            </Fade>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
};

export default React.memo(NotificationBadge);