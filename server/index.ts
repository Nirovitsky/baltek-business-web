// Simple static file server for frontend-only deployment
// All API requests go directly to the external API at https://api.baltek.net/api/

import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from client directory during development
if (process.env.NODE_ENV === "development") {
  app.use(express.static(path.join(__dirname, '..', 'client')));
  
  // For SPA routing, serve index.html for all routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
  });
} else {
  // In production, serve built files
  app.use(express.static(path.join(__dirname, '..', 'dist', 'public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'public', 'index.html'));
  });
}

const port = parseInt(process.env.PORT || '5000', 10);

app.listen(port, "0.0.0.0", () => {
  console.log(`[server] Frontend serving on port ${port}`);
  console.log(`[server] Local: http://localhost:${port}/`);
  console.log(`[server] Network: http://0.0.0.0:${port}/`);
  console.log(`[server] Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[server] API: External (https://api.baltek.net/api)`);
});