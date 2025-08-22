import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Message } from "@/types";

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
let messageQueue: Array<{ roomId: number; content: string; attachments?: number[] }> = [];
let reconnectInterval: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 10;
let lastSeenMessageId: number | null = null;
let resyncCallbacks: Set<() => void> = new Set();
let wasDisconnected = false;

// Global WebSocket manager
const WebSocketManager = {
  connect: (token: string) => {
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // URL encode the token to handle special characters
      const encodedToken = encodeURIComponent(token);
      const wsUrl = `wss://api.baltek.net/ws/chat/?token=${encodedToken}`;
      
      console.log('Connecting to WebSocket with encoded token');
      console.log('Token length:', token.length);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected globally");
        globalConnected = true;
        globalSocket = ws;
        
        // Reset reconnection attempts on successful connection
        reconnectAttempts = 0;
        if (reconnectInterval) {
          clearTimeout(reconnectInterval);
          reconnectInterval = null;
        }
        
        // Send queued messages
        if (messageQueue.length > 0) {
          console.log(`Sending ${messageQueue.length} queued messages`);
          messageQueue.forEach(queuedMessage => {
            WebSocketManager.sendMessage(queuedMessage.roomId, queuedMessage.content, queuedMessage.attachments);
          });
          messageQueue = []; // Clear queue after sending
        }
        
        // Trigger message resync after reconnection (if we were previously disconnected)
        if (wasDisconnected) {
          console.log("Triggering message resync after reconnection - was previously disconnected");
          resyncCallbacks.forEach(callback => callback());
          wasDisconnected = false;
        }
        
        // No need to send authentication message - token is in URL
        
        // Notify all listeners
        globalListeners.forEach(listener => listener());
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "authenticated") {
            console.log("WebSocket authenticated globally:", message.user?.first_name);
          } else if (message.type === "message_delivered") {
            // Message sent by this user was delivered - add to current room
            if (message.message.room === globalCurrentRoom) {
              // Avoid duplicates by checking message ID
              if (!globalMessages.some(m => m.id === message.message.id)) {
                globalMessages = [...globalMessages, message.message];
                lastSeenMessageId = Math.max(lastSeenMessageId || 0, message.message.id);
              }
            }
          } else if (message.type === "receive_message") {
            // Message received from another user - add to current room
            if (message.message.room === globalCurrentRoom) {
              // Avoid duplicates by checking message ID
              if (!globalMessages.some(m => m.id === message.message.id)) {
                globalMessages = [...globalMessages, message.message];
                lastSeenMessageId = Math.max(lastSeenMessageId || 0, message.message.id);
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
        wasDisconnected = true; // Mark that we were disconnected
        
        // Notify all listeners
        globalListeners.forEach(listener => listener());
        
        // Start reconnection attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectInterval = setTimeout(async () => {
            reconnectAttempts++;
            let token = localStorage.getItem('access_token');
            
            // If no token, try to get a fresh one
            if (!token) {
              const refreshToken = localStorage.getItem('refresh_token');
              if (refreshToken) {
                try {
                  // Try to refresh token before reconnecting
                  const response = await fetch('/api/token/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: refreshToken }),
                  });
                  
                  if (response.ok) {
                    const tokens = await response.json();
                    localStorage.setItem('access_token', tokens.access);
                    token = tokens.access;
                  }
                } catch (error) {
                  console.error('Failed to refresh token before WebSocket reconnect:', error);
                }
              }
            }
            
            if (token) {
              WebSocketManager.connect(token);
            }
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        console.error("WebSocket URL:", wsUrl);
        console.error("WebSocket readyState:", ws.readyState);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  },

  disconnect: () => {
    // Clear reconnection attempts when manually disconnecting
    if (reconnectInterval) {
      clearTimeout(reconnectInterval);
      reconnectInterval = null;
    }
    reconnectAttempts = 0;
    
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

  sendMessage: (roomId: number, text: string, attachments?: number[]) => {
    // Apply 1024 character limit
    const trimmedText = text?.trim() || '';
    const limitedText = trimmedText.length > 1024 ? trimmedText.substring(0, 1024) : trimmedText;
    
    if (!globalSocket || globalSocket.readyState !== WebSocket.OPEN) {
      // Queue message for later sending
      console.log("WebSocket not connected, queuing message");
      messageQueue.push({ roomId, content: limitedText, attachments });
      return true; // Return true to indicate message was queued
    }

    try {
      const message = {
        type: "send_message",
        data: {
          room: roomId,
          text: limitedText,
          ...(attachments && attachments.length > 0 && {
            attachments: attachments,
          }),
        },
      };

      globalSocket.send(JSON.stringify(message));
      console.log("Sent message:", message);
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      // Queue message for retry
      messageQueue.push({ roomId, content: limitedText, attachments });
      return true; // Still return true as message was queued
    }
  },

  joinRoom: (roomId: number) => {
    // Prevent joining the same room multiple times
    if (globalCurrentRoom === roomId) {
      return;
    }
    
    globalCurrentRoom = roomId;
    globalMessages = []; // Clear messages when switching rooms
    lastSeenMessageId = null; // Reset last seen message
    
    // Send room join message to server if connected
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      const token = localStorage.getItem('access_token');
      globalSocket.send(JSON.stringify({
        type: 'join_room',
        room: roomId,
        token: token
      }));
    }
    
    // Trigger resync for room change
    resyncCallbacks.forEach(callback => callback());
    
    // Notify all listeners
    globalListeners.forEach(listener => listener());
  },

  addResyncCallback: (callback: () => void) => {
    resyncCallbacks.add(callback);
    return () => resyncCallbacks.delete(callback);
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
    reconnect: () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        reconnectAttempts = 0; // Reset attempts for manual reconnect
        wasDisconnected = true; // Mark that we need to resync
        WebSocketManager.connect(token);
      }
    },
    reconnectAttempts,
    maxReconnectAttempts,
    addResyncCallback: WebSocketManager.addResyncCallback,
  };
}