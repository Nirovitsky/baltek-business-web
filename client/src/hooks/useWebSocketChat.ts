import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import type { Message } from "@/types";

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
      // Use external WebSocket server at Baltek API
      const encodedToken = encodeURIComponent(token);
      const wsUrl = `wss://api.baltek.net/ws/chat/?token=${encodedToken}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);

      // Connection established with token in URL - no need to send auth message
      ws.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // No need to send authentication message - token is in URL
      };



      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "authenticated") {
            console.log("WebSocket authenticated:", message.user.first_name);
          } else if (message.type === "message_received") {
            // Only add message to current room
            if (message.data.room === currentRoom) {
              setMessages((prev) => {
                // Avoid duplicates by checking message ID
                if (prev.some(m => m.id === message.data.id)) {
                  return prev;
                }
                return [...prev, message.data];
              });
            }
          } else if (message.type === "error") {
            console.error("WebSocket error:", message.message || message.data);
          } else if (message.type === "auth_error") {
            console.error("Authentication error:", message.message);
            setConnected(false);
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

  const sendMessage = (roomId: number, text: string, attachments?: number[]) => {
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
          ...(attachments && attachments.length > 0 && {
            attachments: attachments,
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
    // Prevent joining the same room multiple times
    if (currentRoom === roomId) {
      return;
    }
    
    setCurrentRoom(roomId);
    setMessages([]); // Clear WebSocket messages when switching rooms
    
    // Send room join message to server if connected
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'join_room',
        room: roomId,
        token: getToken()
      }));
    }
  };

  useEffect(() => {
    if (isAuthenticated && !connected && !socket) {
      connect();
    } else if (!isAuthenticated && socket) {
      disconnect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, connected]);

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
