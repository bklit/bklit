# Bklit WebSocket Server

> **⚠️ DEPRECATED:** This standalone WebSocket server will be merged into the dashboard API
> to align with the Visitors.now architecture where WebSockets run in the same process as the API.
>
> **Status:** Currently operational for production real-time updates.
>
> **Future:** WebSocket functionality will be integrated into the Next.js API routes.

## Current Purpose

Provides real-time event broadcasting to connected dashboard clients via Socket.IO.

## Running

```bash
pnpm dev    # Development
pnpm build  # Production build
```

## Endpoints

- **WebSocket**: Main Socket.IO connection
- **POST /ingest**: Receives events via HTTP (from Vercel)
- **GET /health**: Health check

## Production Deployment

Currently deployed to Hetzner at `ws.bklit.ai` as a systemd service.

See `bklit-websocket.service` configuration on the server.

## Migration Plan

This server will be deprecated once WebSocket functionality is merged into the dashboard API,
following the Visitors.now pattern of having WebSockets in the same process.

