import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import type { Message } from "@shared/schema";

interface WebSocketMessage {
  type: "send_message" | "message_received" | "room_joined" | "error";
  data: any;
}

// Remove hardcoded token - will use the actual auth token

export function useWebSocketChat() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  
  // Get token from localStorage
  const getToken = () => localStorage.getItem('access_token');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    const token = getToken();
    if (!token || !isAuthenticated) return;

    try {
      // Use local WebSocket server instead of hardcoded external URL
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      // Send authentication after connection
      ws.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Authenticate with the server
        ws.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
      };



      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === "message_received") {
            setMessages((prev) => [...prev, message.data]);
          } else if (message.type === "error") {
            console.error("WebSocket error:", message.data);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error, event.data);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        setSocket(null);

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
            );
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      setSocket(ws);
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }

    setSocket(null);
    setConnected(false);
  };

  const sendMessage = (roomId: number, text: string, attachment?: { url: string; name: string; type: string; size: number }) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return false;
    }

    try {
      const token = getToken();
      const message: WebSocketMessage = {
        type: "send_message",
        data: {
          room: roomId,
          text: text?.trim() || '',
          ...(attachment && {
            attachment_url: attachment.url,
            attachment_name: attachment.name,
            attachment_type: attachment.type,
            attachment_size: attachment.size,
          }),
        },
      };

      // Add token to message for authentication
      const messageWithToken = { ...message, token };
      socket.send(JSON.stringify(messageWithToken));
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  };

  const joinRoom = (roomId: number) => {
    setCurrentRoom(roomId);
    setMessages([]); // Clear messages when switching rooms
  };

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

  return {
    connected,
    messages,
    currentRoom,
    sendMessage,
    joinRoom,
    connect,
    disconnect,
  };
}
