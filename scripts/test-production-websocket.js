#!/usr/bin/env node

// Test production WebSocket server on bklit.ws
const WebSocket = require("ws");

const WS_URL = "ws://bklit.ws:8080";
const PROJECT_ID = "cmkhistrb0001dazq8m89aqes"; // Your test project
const SESSION_ID = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

console.log("🧪 Testing production WebSocket server...");
console.log("📍 URL:", WS_URL);
console.log("🔑 Session:", SESSION_ID);
console.log("");

const ws = new WebSocket(
  `${WS_URL}?projectId=${PROJECT_ID}&sessionId=${SESSION_ID}`
);

ws.on("open", () => {
  console.log("✅ WebSocket connected to bklit.ws!");
  console.log("");

  // Send test pageview
  const testPageview = {
    type: "pageview",
    data: {
      url: "https://test.example.com/production-test",
      timestamp: new Date().toISOString(),
      userAgent: "Test Script / Node.js",
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      language: "en-US",
      timezone: "America/New_York",
      referrer: null,
      referrerHostname: null,
      referrerType: "direct",
      isNewVisitor: true,
      landingPage: "https://test.example.com/production-test",
    },
    apiKey: process.env.BKLIT_API_KEY || "your-api-key-here", // Set BKLIT_API_KEY env var
  };

  console.log("📤 Sending test pageview...");
  ws.send(JSON.stringify(testPageview));
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());
  console.log("📨 Received:", message.type, message);

  if (message.type === "ack") {
    console.log("");
    console.log("🎉 SUCCESS! Production WebSocket is working!");
    console.log("");
    console.log("Next steps:");
    console.log(
      '  1. Check Hetzner logs: ssh root@46.224.125.208 "pm2 logs bklit-websocket --lines 20"'
    );
    console.log("  2. Open your dashboard /live page");
    console.log("  3. You should see a marker appear!");
    console.log("");
    console.log("Closing connection in 2 seconds...");

    setTimeout(() => {
      ws.close();
    }, 2000);
  }
});

ws.on("error", (error) => {
  console.error("❌ WebSocket error:", error.message);
  process.exit(1);
});

ws.on("close", () => {
  console.log("🔌 WebSocket disconnected");
  console.log("");
  console.log("Test complete! ✨");
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error("❌ Test timeout - no response from server");
  ws.close();
  process.exit(1);
}, 10_000);
