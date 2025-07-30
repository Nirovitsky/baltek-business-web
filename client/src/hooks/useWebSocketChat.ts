import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import type { Message } from "@shared/schema";

interface WebSocketMessage {
  type: "send_message" | "message_received" | "room_joined" | "error";
  data: any;
}

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUzODg3NzcxLCJpYXQiOjE3NTM4ODU5NzEsImp0aSI6IjMxYjJhZDYwMTRiZjRkYTliZDM5NGQ5MTE4ZDMwNGY5IiwidXNlcl9pZCI6Mn0.zbd84QHSzmh4e10Tsx8lZLOTqOtt5w51OmwajEFtroA";

export function useWebSocketChat() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<number | null>(null);
  // const { token } = useAuth();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    // if (!token) return;

    try {
      const wsUrl = `ws://116.203.92.15/ws/chat/?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
        reconnectAttemptsRef.current = 0;
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
          console.error("Failed to parse WebSocket message:", error);
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

  const sendMessage = (roomId: number, text: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type: "send_message",
        data: {
          room: roomId,
          text: text.trim(),
        },
      };

      socket.send(JSON.stringify(message));
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
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token]);

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
