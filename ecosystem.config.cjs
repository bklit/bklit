"use strict";
/** PM2 production config for Hetzner (WebSocket + Worker). */
module.exports = {
  apps: [
    {
      name: "bklit-websocket",
      script: "packages/websocket/src/server.ts",
      interpreter: "tsx",
      cwd: __dirname,
      env_file: ".env",
      autorestart: true,
      max_restarts: 100,
      min_uptime: "10s",
      exp_backoff_restart_delay: 100,
      max_memory_restart: "600M",
      kill_timeout: 10_000,
      listen_timeout: 10_000,
    },
    {
      name: "bklit-worker",
      script: "packages/worker/src/index.ts",
      interpreter: "tsx",
      cwd: __dirname,
      env_file: ".env",
      autorestart: true,
      max_restarts: 100,
      min_uptime: "10s",
      exp_backoff_restart_delay: 100,
      max_memory_restart: "600M",
      kill_timeout: 10_000,
    },
  ],
};
