/**
 * Script to clear stale live sessions from Redis for a specific project.
 * 
 * Usage:
 *   REDIS_URL=your_upstash_url npx tsx scripts/clear-redis-sessions.ts <projectId>
 * 
 * Example:
 *   REDIS_URL=rediss://... npx tsx scripts/clear-redis-sessions.ts cmic3a5ap0003zxfjshgs688w
 */

import Redis from "ioredis";

const SESSIONS_ZSET_PREFIX = "live:sessions:";

async function clearProjectSessions(projectId: string) {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.error("❌ REDIS_URL environment variable is required");
    console.log("\nUsage:");
    console.log("  REDIS_URL=your_upstash_url npx tsx scripts/clear-redis-sessions.ts <projectId>");
    process.exit(1);
  }

  if (!projectId) {
    console.error("❌ Project ID is required as first argument");
    console.log("\nUsage:");
    console.log("  REDIS_URL=your_upstash_url npx tsx scripts/clear-redis-sessions.ts <projectId>");
    process.exit(1);
  }

  console.log(`🔗 Connecting to Redis...`);
  const client = new Redis(redisUrl);

  try {
    const sessionsKey = `${SESSIONS_ZSET_PREFIX}${projectId}`;
    
    // Get current count
    const countBefore = await client.zcard(sessionsKey);
    console.log(`📊 Current session count for ${projectId}: ${countBefore}`);

    if (countBefore === 0) {
      console.log("✅ No sessions to clear!");
      return;
    }

    // List all sessions (for audit)
    const sessions = await client.zrange(sessionsKey, 0, -1, "WITHSCORES");
    console.log(`\n📋 Sessions to be cleared:`);
    for (let i = 0; i < sessions.length; i += 2) {
      const sessionId = sessions[i];
      const timestamp = parseInt(sessions[i + 1], 10);
      const date = new Date(timestamp);
      console.log(`   - ${sessionId} (last seen: ${date.toISOString()})`);
    }

    // Delete the sorted set
    console.log(`\n🗑️  Deleting ${sessionsKey}...`);
    await client.del(sessionsKey);

    // Verify deletion
    const countAfter = await client.zcard(sessionsKey);
    console.log(`✅ Sessions cleared! Count after: ${countAfter}`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.quit();
    console.log("\n🔌 Disconnected from Redis");
  }
}

const projectId = process.argv[2];
clearProjectSessions(projectId);

