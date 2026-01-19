import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { getToken } from '../helper/getToken';
import { BASE_URL } from '../utils/axios';

interface UseNotificationWebSocketOptions {
  onNotification: (notification: Notification) => void;
  enabled?: boolean;
}

/**
 * Custom hook to manage WebSocket connection for notifications
 * Uses the "latest ref" pattern to avoid reconnecting when callback changes
 * @param onNotification - Callback function to handle incoming notifications
 * @param enabled - Whether the WebSocket should be active (default: true)
 */
export const useNotificationWebSocket = ({
  onNotification,
  enabled = true,
}: UseNotificationWebSocketOptions) => {
  const stompClient = useRef<Client | null>(null);

  // Store the latest callback in a ref to avoid reconnecting when it changes
  const onNotificationRef = useRef(onNotification);

  // Update ref when callback changes without triggering reconnection
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!enabled) return;

    const token = getToken();
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    const socket = new SockJS(`${BASE_URL}ws?token=${token}`);

    stompClient.current = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log('WebSocket connected');

        stompClient.current?.subscribe('/user/topic/notifications', (message) => {
          try {
            const notification: Notification = JSON.parse(message.body);
            // Use the latest callback from ref instead of closure
            onNotificationRef.current(notification);
          } catch (error) {
            console.error('Failed to parse notification:', error);
          }
        });
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame.headers['message']);
        console.error('Details:', frame.body);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      },
    });

    stompClient.current.activate();

    return () => {
      if (stompClient.current) {
        console.log('Deactivating WebSocket connection');
        stompClient.current.deactivate();
      }
    };
  }, [enabled]); // Removed onNotification from dependencies

  return { stompClient: stompClient.current };
};
