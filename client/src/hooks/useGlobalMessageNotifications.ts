import { useState, useEffect, useRef } from 'react';
import { useWebSocketGlobal } from './useWebSocketGlobal';
import { useLocation } from 'react-router-dom';

interface GlobalMessageNotifications {
  unreadRooms: Set<number>;
  unreadCount: number;
  markRoomAsRead: (roomId: number) => void;
  clearAllUnread: () => void;
}

// Global state for unread messages
let globalUnreadRooms = new Set<number>();
let globalListeners = new Set<() => void>();

export function useGlobalMessageNotifications(): GlobalMessageNotifications {
  const [unreadRooms, setUnreadRooms] = useState<Set<number>>(globalUnreadRooms);
  const { connected } = useWebSocketGlobal();
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(0);
  
  // Initialize audio for notifications
  useEffect(() => {
    // Create a simple notification sound using Web Audio API
    const createNotificationSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        return () => {
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        };
      } catch (error) {
        console.warn('Web Audio API not supported, notifications will be silent');
        return null;
      }
    };
    
    const playSound = createNotificationSound();
    
    // Create custom message event listener
    const handleNewMessage = (event: CustomEvent) => {
      const { message, roomId } = event.detail;
      
      // Only show notification if user is not currently on chat page with that room
      const isOnChatPage = location.pathname === '/chat';
      const urlParams = new URLSearchParams(location.search);
      const currentRoom = urlParams.get('room');
      const isCurrentRoom = currentRoom === roomId.toString();
      
      // Don't notify if user is already viewing this room
      if (isOnChatPage && isCurrentRoom) {
        return;
      }
      
      // Add room to unread set
      globalUnreadRooms.add(roomId);
      
      // Play notification sound (with throttling to avoid spam)
      const now = Date.now();
      if (playSound && now - lastPlayedRef.current > 1000) { // Throttle to once per second
        try {
          playSound();
          lastPlayedRef.current = now;
        } catch (error) {
          console.warn('Failed to play notification sound:', error);
        }
      }
      
      // Notify all listeners
      globalListeners.forEach(listener => listener());
    };
    
    // Listen for custom message events
    window.addEventListener('newChatMessage', handleNewMessage as EventListener);
    
    return () => {
      window.removeEventListener('newChatMessage', handleNewMessage as EventListener);
    };
  }, [location]);
  
  // Set up listener for global state changes
  useEffect(() => {
    const listener = () => {
      setUnreadRooms(new Set(globalUnreadRooms));
    };
    
    globalListeners.add(listener);
    
    return () => {
      globalListeners.delete(listener);
    };
  }, []);
  
  // Clear unread status when user visits chat page
  useEffect(() => {
    if (location.pathname === '/chat') {
      const urlParams = new URLSearchParams(location.search);
      const currentRoom = urlParams.get('room');
      
      if (currentRoom) {
        const roomId = parseInt(currentRoom);
        if (globalUnreadRooms.has(roomId)) {
          globalUnreadRooms.delete(roomId);
          globalListeners.forEach(listener => listener());
        }
      }
    }
  }, [location]);
  
  const markRoomAsRead = (roomId: number) => {
    if (globalUnreadRooms.has(roomId)) {
      globalUnreadRooms.delete(roomId);
      globalListeners.forEach(listener => listener());
    }
  };
  
  const clearAllUnread = () => {
    globalUnreadRooms.clear();
    globalListeners.forEach(listener => listener());
  };
  
  return {
    unreadRooms,
    unreadCount: unreadRooms.size,
    markRoomAsRead,
    clearAllUnread,
  };
}