// Vite development server for frontend-only deployment
// All API requests go directly to the external API at https://api.baltek.net/api/

import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";

const app = express();

// Setup Vite development server
(async () => {
  try {
    const httpServer = createServer(app);
    
    if (process.env.NODE_ENV === "development") {
      console.log("[server] Starting Vite development server...");
      
      // Create Vite server in middleware mode
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          fs: {
            strict: false,
          }
        },
        appType: "spa",
        configFile: path.resolve(process.cwd(), "vite.config.ts"),
        root: path.resolve(process.cwd(), "client"),
        base: "/",
      });
      
      console.log("[server] Vite server created");
      
      // Use vite's connect instance as middleware
      app.use(vite.ssrFixStacktrace);
      app.use(vite.middlewares);
      
      console.log("[server] Vite middleware configured");
    } else {
      // In production, serve static files
      app.use(express.static("dist/public"));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve("dist/public/index.html"));
      });
    }
    
    const port = parseInt(process.env.PORT || '5000', 10);
    
    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`[server] Frontend serving on port ${port}`);
      console.log(`[server] Local: http://localhost:${port}/`);
      console.log(`[server] Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[server] API: External (https://api.baltek.net/api)`);
    });
    
    httpServer.on('error', (err) => {
      console.error('[server] Server error:', err);
    });
    
  } catch (error) {
    console.error('[server] Failed to start server:', error);
    process.exit(1);
  }
})();