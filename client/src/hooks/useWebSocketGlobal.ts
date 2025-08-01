import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Message } from "@shared/schema";

interface WebSocketMessage {
  type: string;
  data?: any;
  room?: number;
  content?: string;
  token?: string;
}

let globalSocket: WebSocket | null = null;
let globalConnected = false;
let globalMessages: Message[] = [];
let globalCurrentRoom: number | null = null;
let globalListeners: Set<() => void> = new Set();

// Global WebSocket manager
const WebSocketManager = {
  connect: (token: string) => {
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      let wsUrl: string;
      
      if (window.location.hostname === 'localhost') {
        wsUrl = `${protocol}//localhost:5000/ws`;
      } else {
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }
      
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected globally");
        globalConnected = true;
        globalSocket = ws;
        
        // Authenticate with the server
        ws.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
        
        // Notify all listeners
        globalListeners.forEach(listener => listener());
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "authenticated") {
            console.log("WebSocket authenticated globally:", message.user?.first_name);
          } else if (message.type === "message_received") {
            // Only add message to current room
            if (message.data.room === globalCurrentRoom) {
              // Avoid duplicates by checking message ID
              if (!globalMessages.some(m => m.id === message.data.id)) {
                globalMessages = [...globalMessages, message.data];
              }
            }
          } else if (message.type === "error") {
            console.error("WebSocket error:", message.message || message.data);
          } else if (message.type === "auth_error") {
            console.error("Authentication error:", message.message);
            globalConnected = false;
          }
          
          // Notify all listeners
          globalListeners.forEach(listener => listener());
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error, event.data);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected globally");
        globalConnected = false;
        globalSocket = null;
        
        // Notify all listeners
        globalListeners.forEach(listener => listener());
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  },

  disconnect: () => {
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      globalSocket.close();
    }
    globalSocket = null;
    globalConnected = false;
    globalMessages = [];
    globalCurrentRoom = null;
    
    // Notify all listeners
    globalListeners.forEach(listener => listener());
  },

  sendMessage: (roomId: number, text: string, attachment?: { url: string; name: string; type: string; size: number }) => {
    if (!globalSocket || globalSocket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return false;
    }

    try {
      const token = localStorage.getItem('access_token');
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

      const messageWithToken = { ...message, token };
      globalSocket.send(JSON.stringify(messageWithToken));
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  },

  joinRoom: (roomId: number) => {
    // Prevent joining the same room multiple times
    if (globalCurrentRoom === roomId) {
      return;
    }
    
    globalCurrentRoom = roomId;
    globalMessages = []; // Clear messages when switching rooms
    
    // Send room join message to server if connected
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      const token = localStorage.getItem('access_token');
      globalSocket.send(JSON.stringify({
        type: 'join_room',
        room: roomId,
        token: token
      }));
    }
    
    // Notify all listeners
    globalListeners.forEach(listener => listener());
  }
};

// Hook for components to use the global WebSocket
export function useWebSocketGlobal() {
  const [, forceUpdate] = useState({});
  const { isAuthenticated } = useAuth();
  const listenerRef = useRef<() => void>();

  // Force re-render when global state changes
  const rerender = () => forceUpdate({});

  useEffect(() => {
    // Add listener
    listenerRef.current = rerender;
    globalListeners.add(rerender);

    // Connect if authenticated
    if (isAuthenticated && !globalConnected && !globalSocket) {
      const token = localStorage.getItem('access_token');
      if (token) {
        WebSocketManager.connect(token);
      }
    } else if (!isAuthenticated && globalSocket) {
      WebSocketManager.disconnect();
    }

    // Cleanup
    return () => {
      if (listenerRef.current) {
        globalListeners.delete(listenerRef.current);
      }
    };
  }, [isAuthenticated]);

  return {
    connected: globalConnected,
    messages: globalMessages,
    currentRoom: globalCurrentRoom,
    sendMessage: WebSocketManager.sendMessage,
    joinRoom: WebSocketManager.joinRoom,
    connect: (token: string) => WebSocketManager.connect(token),
    disconnect: WebSocketManager.disconnect,
  };
}