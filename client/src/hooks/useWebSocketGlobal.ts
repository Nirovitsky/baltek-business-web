import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage, MessageAttachment } from "@/types";

interface WebSocketMessage {
  type: string;
  data?: any;
  room?: number;
  content?: string;
  token?: string;
}

let globalSocket: WebSocket | null = null;
let globalConnected = false;
let globalMessages: ChatMessage[] = [];
let globalCurrentRoom: number | null = null;
let globalListeners: Set<() => void> = new Set();
let messageQueue: Array<{ roomId: number; content: string; attachments?: number[] }> = [];
let reconnectInterval: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 10;
let lastSeenMessageId: number | null = null;
let resyncCallbacks: Set<() => void> = new Set();
let wasDisconnected = false;

// Cleanup function for global state
const cleanup = () => {
  globalSocket = null;
  globalConnected = false;
  globalMessages = [];
  globalCurrentRoom = null;
  globalListeners.clear();
  messageQueue = [];
  lastSeenMessageId = null;
  resyncCallbacks.clear();
  wasDisconnected = false;
  if (reconnectInterval) {
    clearTimeout(reconnectInterval);
    reconnectInterval = null;
  }
  reconnectAttempts = 0;
};

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
        console.log('🔌 [WebSocket] Connected globally');
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
          console.log('📨 [WebSocket] Message received:', message);

          if (message.type === "authenticated") {
            console.log('🔐 [WebSocket] Authenticated globally:', message.user?.first_name);
          } else if (message.type === "message_delivered") {
            console.log('📤 [WebSocket] Message delivered:', message.message);
            // Message sent by this user was delivered - add to current room
            if (message.message.room === globalCurrentRoom) {
              console.log('✅ [WebSocket] Adding delivered message to current room:', globalCurrentRoom);
              
              // First, check if this message replaces an optimistic message
              const deliveredMessage = message.message;
              const optimisticIndex = globalMessages.findIndex(m => 
                m.isOptimistic && 
                m.room === deliveredMessage.room && 
                m.text === deliveredMessage.text &&
                m.owner === deliveredMessage.owner &&
                (m.status === 'sending' || m.status === 'failed')
              );

              if (optimisticIndex !== -1) {
                // Replace optimistic message with delivered message
                console.log('🔄 [WebSocket] Replacing optimistic message with delivered message');
                console.log('🔍 [WebSocket] Optimistic message before replacement:', globalMessages[optimisticIndex]);
                globalMessages[optimisticIndex] = {
                  ...deliveredMessage,
                  status: 'delivered',
                  isOptimistic: false
                };
                lastSeenMessageId = Math.max(lastSeenMessageId || 0, deliveredMessage.id);
                console.log('✅ [WebSocket] Optimistic message replaced:', globalMessages[optimisticIndex]);
                
                // Trigger UI update
                globalListeners.forEach(listener => listener());
              } else {
                // Avoid duplicates by checking message ID
                if (!globalMessages.some(m => m.id === message.message.id)) {
                  globalMessages = [...globalMessages, { 
                    ...message.message, 
                    status: 'delivered' 
                  }];
                  lastSeenMessageId = Math.max(lastSeenMessageId || 0, message.message.id);
                  console.log('📋 [WebSocket] Global messages updated, count:', globalMessages.length);
                } else {
                  console.log('⚠️ [WebSocket] Duplicate message delivered, skipping');
                }
              }
            } else {
              console.log('⚠️ [WebSocket] Message delivered for different room:', message.message.room, 'current:', globalCurrentRoom);
            }
          } else if (message.type === "message_received") {
            console.log('📨 [WebSocket] Message received from another user:', message.message);
            console.log('🔍 [WebSocket] Room check - Message room:', message.message.room, 'Current room:', globalCurrentRoom, 'Match:', message.message.room === globalCurrentRoom);
            
            // Always trigger room list updates for any message received
            console.log('🔄 [WebSocket] Triggering room list update for message in room:', message.message.room);
            
            // Only add to current room's message list if it matches
            if (message.message.room === globalCurrentRoom) {
              console.log('✅ [WebSocket] Adding received message to current room:', globalCurrentRoom);
              
              // Check if this message replaces an optimistic message
              const receivedMessage = message.message;
              
              // Find optimistic message to replace - use more flexible matching
              const optimisticIndex = globalMessages.findIndex(m => 
                m.isOptimistic && 
                m.room === receivedMessage.room && 
                m.text === receivedMessage.text &&
                m.owner === receivedMessage.owner &&
                // Also check timestamps are close (within 30 seconds)
                Math.abs((m.date_created || 0) - (receivedMessage.date_created || 0)) < 30
              );

              if (optimisticIndex !== -1) {
                // Replace optimistic message with real one
                console.log('🔄 [WebSocket] Replacing optimistic message with real message');
                globalMessages[optimisticIndex] = {
                  ...receivedMessage,
                  status: 'delivered',
                  isOptimistic: false
                };
                globalListeners.forEach(listener => listener());
              } else {
                // Check for exact duplicate by ID first
                const duplicateIndex = globalMessages.findIndex(m => 
                  !m.isOptimistic && m.id === receivedMessage.id
                );
                
                if (duplicateIndex === -1) {
                  // No duplicate found, add new message
                  globalMessages = [...globalMessages, { 
                    ...receivedMessage, 
                    status: 'delivered',
                    isOptimistic: false 
                  }];
                  lastSeenMessageId = Math.max(lastSeenMessageId || 0, receivedMessage.id);
                  console.log('📋 [WebSocket] New message added, count:', globalMessages.length);
                  globalListeners.forEach(listener => listener());
                } else {
                  console.log('⚠️ [WebSocket] Duplicate message received, skipping');
                }
              }
            } else {
              console.log('📝 [WebSocket] Message received for different room:', message.message.room, 'current:', globalCurrentRoom, '- will update room list only');
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
        console.log('🔌 [WebSocket] Disconnected globally');
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
    // Proper cleanup of all global state
    cleanup();
    
    // Close existing connection
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      globalSocket.close();
    }
    
    // Notify all listeners about disconnection
    globalListeners.forEach(listener => listener());
  },

  cleanup,

  sendMessage: (roomId: number, text: string, attachments?: number[], optimisticId?: string) => {
    console.log('📤 [WebSocket] Send message request:', { roomId, text, attachments, optimisticId });
    // Apply 1024 character limit
    const trimmedText = text?.trim() || '';
    const limitedText = trimmedText.length > 1024 ? trimmedText.substring(0, 1024) : trimmedText;
    
    if (!globalSocket || globalSocket.readyState !== WebSocket.OPEN) {
      // Queue message for later sending
      console.log('⚠️ [WebSocket] Not connected, queuing message. State:', globalSocket?.readyState);
      messageQueue.push({ roomId, content: limitedText, attachments });
      
      // Mark optimistic message as failed if provided
      if (optimisticId) {
        const messageIndex = globalMessages.findIndex(m => m.id === optimisticId);
        if (messageIndex !== -1) {
          globalMessages[messageIndex] = {
            ...globalMessages[messageIndex],
            status: 'failed',
            error: 'No connection'
          };
          globalListeners.forEach(listener => listener());
        }
      }
      return false;
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
      console.log('✅ [WebSocket] Message sent successfully:', message);
      return true;
    } catch (error) {
      console.error('❌ [WebSocket] Failed to send message:', error);
      // Queue message for retry
      messageQueue.push({ roomId, content: limitedText, attachments });
      
      // Mark optimistic message as failed if provided
      if (optimisticId) {
        const messageIndex = globalMessages.findIndex(m => m.id === optimisticId);
        if (messageIndex !== -1) {
          globalMessages[messageIndex] = {
            ...globalMessages[messageIndex],
            status: 'failed',
            error: 'Send failed'
          };
          globalListeners.forEach(listener => listener());
        }
      }
      return false;
    }
  },

  addOptimisticMessage: (roomId: number, text: string, senderId: number, senderInfo?: any, attachments?: MessageAttachment[]) => {
    const optimisticId = `optimistic_${Date.now()}_${Math.random()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      room: roomId,
      owner: senderId,
      text: text,
      status: 'sending',
      attachments: attachments || [],
      date_created: Date.now() / 1000,
      isOptimistic: true,
      senderInfo: senderInfo
    };

    console.log('📝 [WebSocket] Adding optimistic message:', optimisticMessage);
    console.log('🏠 [WebSocket] Current room:', globalCurrentRoom, 'Message room:', roomId);

    // Only add to current room
    if (roomId === globalCurrentRoom) {
      globalMessages = [...globalMessages, optimisticMessage];
      console.log('✅ [WebSocket] Optimistic message added to UI, total messages:', globalMessages.length);
      globalListeners.forEach(listener => listener());
    } else {
      console.log('⚠️ [WebSocket] Not adding optimistic message - room mismatch');
    }

    return optimisticId;
  },

  removeOptimisticMessage: (optimisticId: string) => {
    globalMessages = globalMessages.filter(m => m.id !== optimisticId);
    globalListeners.forEach(listener => listener());
  },

  updateOptimisticMessage: (optimisticId: string, updates: Partial<ChatMessage>) => {
    const messageIndex = globalMessages.findIndex(m => m.id === optimisticId);
    if (messageIndex !== -1) {
      globalMessages[messageIndex] = { ...globalMessages[messageIndex], ...updates };
      globalListeners.forEach(listener => listener());
    }
  },

  joinRoom: (roomId: number) => {
    console.log('🏠 [WebSocket] Join room request:', roomId, 'current:', globalCurrentRoom);
    // Always update the current room, even if it's the same
    
    globalCurrentRoom = roomId;
    // DON'T clear messages immediately - let them persist until new room loads
    // This prevents messages from disappearing when switching rooms quickly
    // globalMessages = []; // Clear messages when switching rooms
    lastSeenMessageId = null; // Reset last seen message
    console.log('🧹 [WebSocket] Room set to:', roomId, 'keeping messages temporarily');
    
    // Send room join message to server if connected
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      const token = localStorage.getItem('access_token');
      console.log('📤 [WebSocket] Sending join_room message for room:', roomId);
      globalSocket.send(JSON.stringify({
        type: 'join_room',
        room: roomId,
        token: token
      }));
    } else {
      console.log('⚠️ [WebSocket] Cannot join room - not connected. State:', globalSocket?.readyState);
    }
    
    // Trigger resync for room change
    resyncCallbacks.forEach(callback => callback());
    
    // Notify all listeners to trigger re-render
    console.log('🔄 [WebSocket] Notifying', globalListeners.size, 'listeners');
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
    addOptimisticMessage: WebSocketManager.addOptimisticMessage,
    removeOptimisticMessage: WebSocketManager.removeOptimisticMessage,
    updateOptimisticMessage: WebSocketManager.updateOptimisticMessage,
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