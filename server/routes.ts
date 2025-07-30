import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";


export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store WebSocket connections by user ID
  const connections = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'authenticate') {
          // Store connection with user ID
          connections.set(message.userId, ws);
          ws.send(JSON.stringify({ type: 'authenticated', userId: message.userId }));
        } else if (message.type === 'chat_message') {
          // Broadcast message to room participants
          const roomConnections = Array.from(connections.entries()).map(([, conn]) => conn).filter(conn => 
            conn.readyState === WebSocket.OPEN
          );
          
          roomConnections.forEach(conn => {
            if (conn !== ws) {
              conn.send(JSON.stringify(message));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove connection from map
      for (const [userId, connection] of connections.entries()) {
        if (connection === ws) {
          connections.delete(userId);
          break;
        }
      }
    });
  });

  // API proxy endpoints to backend
  const API_BASE_URL = process.env.API_BASE_URL || 'http://116.203.92.15';

  // Proxy authentication requests
  app.post('/api/token/', async (req, res) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        return res.status(response.status).json({ 
          message: response.status === 401 ? 'Invalid credentials' : 'Authentication failed' 
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/token/refresh', async (req, res) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/token/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        return res.status(response.status).json({ message: 'Token refresh failed' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Generic API proxy middleware
  app.use('/api/*', async (req, res) => {
    try {
      const apiPath = req.originalUrl;
      const url = `${API_BASE_URL}${apiPath}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Forward authorization header if present
      const authHeader = req.headers.authorization;
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch(url, {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      });

      // Forward response status and headers
      res.status(response.status);
      
      // Forward important headers
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.set('Content-Type', contentType);
      }

      if (response.ok || response.status < 500) {
        const data = await response.json();
        res.json(data);
      } else {
        res.json({ message: 'Backend service unavailable' });
      }
    } catch (error) {
      console.error('API proxy error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return httpServer;
}
