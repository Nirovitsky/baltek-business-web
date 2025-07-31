import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  reconnectInterval?: number;
}

export function useWebSocket({ onMessage, reconnectInterval = 3000 }: UseWebSocketOptions = {}) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl: string;
    
    if (window.location.hostname === 'localhost') {
      // Local development
      wsUrl = `${protocol}//localhost:5000/ws`;
    } else {
      // Production/Replit environment
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }
    
    console.log('Connecting to WebSocket:', wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      
      // Authenticate with WebSocket
      const token = localStorage.getItem('access_token');
      if (token && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'authenticate',
          token,
        }));
      }
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      
      // Attempt to reconnect
      if (isAuthenticated && reconnectInterval > 0) {
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
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
    isConnected,
    sendMessage,
    connect,
    disconnect,
  };
}
