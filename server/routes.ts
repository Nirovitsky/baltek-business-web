import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Store WebSocket connections by user ID with user data
  const connections = new Map<string, WebSocket & { userData?: any }>();

  wss.on("connection", (ws, req) => {
    console.log("WebSocket connection established");
    let authenticatedUserId: string | null = null;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "authenticate") {
          // Verify the token with the backend API
          const token = message.token;
          if (token) {
            // Verify token by making a request to the backend
            try {
              const response = await fetch(`${API_BASE_URL}/api/users/me/`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const userData = await response.json();
                authenticatedUserId = userData.id?.toString() || 'unknown';
                (ws as any).userData = userData;
                connections.set(authenticatedUserId!, ws as WebSocket & { userData?: any });
                ws.send(
                  JSON.stringify({ type: "authenticated", userId: authenticatedUserId, user: userData }),
                );
                console.log(`User ${userData.first_name} ${userData.last_name} authenticated via WebSocket`);
              } else {
                ws.send(JSON.stringify({ type: "auth_error", message: "Invalid token" }));
                ws.close();
              }
            } catch (error) {
              console.error('Token verification error:', error);
              ws.send(JSON.stringify({ type: "auth_error", message: "Authentication failed" }));
              ws.close();
            }
          }
        } else if (message.type === "join_room") {
          if (!authenticatedUserId) {
            ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
            return;
          }
          
          // Store user's current room for message routing
          const userConnection = connections.get(authenticatedUserId);
          if (userConnection) {
            (userConnection as any).currentRoom = message.room;
            console.log(`User ${authenticatedUserId} joined room ${message.room}`);
          }
          
        } else if (message.type === "send_message") {
          if (!authenticatedUserId) {
            ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
            return;
          }

          // Since the backend API doesn't support POST to chat/messages, 
          // we'll store messages in memory and broadcast them to WebSocket clients
          try {
            // Create a temporary message object for broadcasting
            const userConnection = connections.get(authenticatedUserId);
            const userData = (userConnection as any)?.userData || { first_name: "Unknown", last_name: "User" };
            
            const tempMessage = {
              id: Date.now(), // Temporary ID
              room: message.data.room,
              text: message.data.text || '',
              owner: {
                id: parseInt(authenticatedUserId),
                first_name: userData.first_name || "Unknown",
                last_name: userData.last_name || "User"
              },
              date_created: new Date().toISOString(),
              ...(message.data.attachment_url && {
                attachment_url: message.data.attachment_url,
                attachment_name: message.data.attachment_name,
                attachment_type: message.data.attachment_type,
                attachment_size: message.data.attachment_size,
              })
            };

            // Broadcast message to all connected clients in the same room
            const messageToSend = {
              type: "message_received",
              data: tempMessage
            };

            // Send to all connections in the same room
            Array.from(connections.entries()).forEach(([userId, conn]) => {
              if (conn.readyState === WebSocket.OPEN && 
                  ((conn as any).currentRoom === tempMessage.room || !((conn as any).currentRoom))) {
                conn.send(JSON.stringify(messageToSend));
              }
            });

            console.log(`Message sent in room ${tempMessage.room} by user ${authenticatedUserId}`);
          } catch (error) {
            console.error('Message broadcast error:', error);
            ws.send(JSON.stringify({ type: "error", message: "Failed to send message" }));
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      // Remove connection from map
      if (authenticatedUserId) {
        connections.delete(authenticatedUserId);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // API proxy endpoints to backend
  const API_BASE_URL = process.env.API_BASE_URL || "https://api.baltek.net";

  // Proxy authentication requests
  app.post("/api/token/", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        return res.status(response.status).json({
          message:
            response.status === 401
              ? "Invalid credentials"
              : "Authentication failed",
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/token/refresh", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/token/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        return res
          .status(response.status)
          .json({ message: "Token refresh failed" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // File upload endpoint (simulated for now)
  app.post("/api/chat/upload", async (req, res) => {
    try {
      // For now, we'll simulate the response since we don't have actual file storage
      const mockFile = {
        url: `https://example.com/files/${Date.now()}-sample-file.jpg`,
        name: req.body.name || "uploaded-file.jpg",
        type: req.body.type || "image/jpeg",
        size: req.body.size || 1024000,
      };
      
      res.json(mockFile);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // File upload proxy with raw body handling
  app.use("/api/files/", express.raw({ type: "*/*", limit: "50mb" }), async (req, res) => {
    try {
      const url = `${API_BASE_URL}/api/files/`;

      // For file uploads, preserve the original request headers and body
      const headers: HeadersInit = {};

      // Forward authorization header if present
      const authHeader = req.headers.authorization;
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }

      // Forward content-type header for multipart uploads
      const contentType = req.headers["content-type"];
      if (contentType) {
        headers["Content-Type"] = contentType;
      }

      console.log(`File upload proxy: ${req.method} ${url}`);
      console.log('Content-Type:', contentType);
      console.log('Authorization:', authHeader ? 'Present' : 'Missing');

      const response = await fetch(url, {
        method: req.method,
        headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      });

      console.log('Backend response status:', response.status);

      // Forward response status and headers
      res.status(response.status);

      // Forward important headers
      const responseContentType = response.headers.get("content-type");
      if (responseContentType) {
        res.set("Content-Type", responseContentType);
      }

      if (response.ok || response.status < 500) {
        const text = await response.text();
        if (text.trim()) {
          try {
            const data = JSON.parse(text);
            res.json(data);
          } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Response text:', text);
            res.json({ message: "Invalid response format" });
          }
        } else {
          res.status(response.status).json({ success: true });
        }
      } else {
        res.json({ message: "Backend service unavailable" });
      }
    } catch (error) {
      console.error("File upload proxy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generic API proxy middleware
  app.use("/api/*", async (req, res) => {
    try {
      const apiPath = req.originalUrl;
      const url = `${API_BASE_URL}${apiPath}`;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Forward authorization header if present
      const authHeader = req.headers.authorization;
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }

      const response = await fetch(url, {
        method: req.method,
        headers,
        body:
          req.method !== "GET" && req.method !== "HEAD"
            ? JSON.stringify(req.body)
            : undefined,
      });

      // Forward response status and headers
      res.status(response.status);

      // Forward important headers
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.set("Content-Type", contentType);
      }

      if (response.ok || response.status < 500) {
        // Check if response has content before parsing JSON
        const text = await response.text();
        if (text.trim()) {
          try {
            const data = JSON.parse(text);
            res.json(data);
          } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Response text:', text);
            res.json({ message: "Invalid response format" });
          }
        } else {
          // Empty response (common for DELETE operations)
          res.status(response.status).json({ success: true });
        }
      } else {
        res.json({ message: "Backend service unavailable" });
      }
    } catch (error) {
      console.error("API proxy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
