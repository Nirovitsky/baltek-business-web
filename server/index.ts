// Frontend-only development server using Vite
// All API requests go directly to the external API at https://api.baltek.net/api/

import { createServer } from "vite";

async function startServer() {
  try {
    console.log("[server] Starting Vite development server...");
    
    // Create Vite server directly (not in middleware mode)
    const server = await createServer({
      configFile: "./vite.config.ts",
      root: "./client",
      server: {
        port: parseInt(process.env.PORT || '5000', 10),
        host: "0.0.0.0",
        strictPort: true,
      },
      optimizeDeps: {
        force: true
      }
    });

    console.log("[server] Vite server created");
    
    await server.listen();
    
    console.log(`[server] Frontend serving on port ${server.config.server.port}`);
    console.log(`[server] Local: http://localhost:${server.config.server.port}/`);
    console.log(`[server] Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[server] API: External (https://api.baltek.net/api)`);
    
    // Handle process termination
    process.on('SIGTERM', async () => {
      console.log('[server] Shutting down...');
      await server.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('[server] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();