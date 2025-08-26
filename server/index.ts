// Frontend-only development server using Vite
// All API requests go directly to the external API at https://api.baltek.net/api/

import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  try {
    console.log("[server] Starting Vite development server...");
    
    const port = parseInt(process.env.PORT || '5000', 10);
    const host = process.env.HOST || '0.0.0.0';
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    // Create Vite server directly (not in middleware mode)
    const server = await createServer({
      configFile: path.resolve(__dirname, "..", "vite.config.ts"),
      root: path.resolve(__dirname, "..", "client"),
      server: {
        port,
        host,
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
    console.log(`[server] Network: http://${host}:${server.config.server.port}/`);
    console.log(`[server] Mode: ${nodeEnv}`);
    console.log(`[server] API: External (${process.env.VITE_API_BASE_URL || 'https://api.baltek.net/api'})`);
    
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