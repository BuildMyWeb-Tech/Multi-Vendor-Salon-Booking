/**
 * WhatsApp Worker — multi-salon supervisor.
 *
 * On startup:
 *  1. Connect to MongoDB
 *  2. Discover all salons with broadcastEnabled=true
 *  3. Start one ConnectionManager + Heartbeat + OutboxConsumer per salon
 *  4. Poll every discoveryIntervalMs for newly enabled / disabled salons
 *  5. Graceful shutdown on SIGTERM / SIGINT
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { createServer } from 'node:http';

import { config } from './config.js';
import { logger } from './logger.js';
import { WhatsAppRepository } from './repository.js';
import { DbSessionStore } from './session-store.js';
import { BaileysProvider } from './baileys-provider.js';
import { ConnectionManager } from './connection-manager.js';
import { OutboxConsumer } from './outbox-consumer.js';
import { Heartbeat } from './heartbeat.js';

// ── Per-salon worker state ────────────────────────────────────────────────────

/** @type {Map<string, { connectionManager, heartbeat, outboxConsumer }>} */
const activeSalons = new Map();

let repo;
let isShuttingDown = false;

function workerIdFor(shopId) {
  return `${config.worker.id}-${shopId}`;
}

async function startSalonWorker(shopId) {
  if (activeSalons.has(shopId)) return; // already running

  logger.info('salon_worker_starting', { shopId });

  const workerId = workerIdFor(shopId);
  const sessionStore = new DbSessionStore(repo, config.session.encryptionKey);
  const provider = new BaileysProvider();

  const connectionManager = new ConnectionManager({
    provider,
    sessionStore,
    repo,
    shopId,
    workerId,
  });

  const heartbeat = new Heartbeat(
    repo,
    connectionManager,
    shopId,
    workerId,
    config.heartbeat.intervalMs,
  );

  const outboxConsumer = new OutboxConsumer(
    provider,
    repo,
    shopId,
    workerId,
    config.outbox.pollIntervalMs,
  );

  heartbeat.start();
  outboxConsumer.start();
  await connectionManager.start();

  activeSalons.set(shopId, { connectionManager, heartbeat, outboxConsumer });
  logger.info('salon_worker_started', { shopId, workerId });
}

async function stopSalonWorker(shopId) {
  const salon = activeSalons.get(shopId);
  if (!salon) return;

  logger.info('salon_worker_stopping', { shopId });
  try {
    salon.outboxConsumer.stop();
    salon.heartbeat.stop();
    await salon.connectionManager.stop();
  } catch (err) {
    logger.warn('salon_worker_stop_error', { shopId, message: String(err) });
  }
  activeSalons.delete(shopId);
  logger.info('salon_worker_stopped', { shopId });
}

// ── Discovery loop ────────────────────────────────────────────────────────────

async function syncSalons() {
  if (isShuttingDown) return;
  try {
    const enabledShops = new Set(await repo.getEnabledShops());

    // Start workers for newly enabled salons
    for (const shopId of enabledShops) {
      if (!activeSalons.has(shopId)) {
        await startSalonWorker(shopId).catch((err) => {
          logger.error('error', { op: 'startSalonWorker', shopId, message: String(err) });
        });
      }
    }

    // Stop workers for salons that are no longer enabled
    for (const shopId of activeSalons.keys()) {
      if (!enabledShops.has(shopId)) {
        await stopSalonWorker(shopId).catch((err) => {
          logger.error('error', { op: 'stopSalonWorker', shopId, message: String(err) });
        });
      }
    }
  } catch (err) {
    logger.error('error', { op: 'syncSalons', message: String(err) });
  }
}

// ── Health check HTTP server ──────────────────────────────────────────────────

const PORT = parseInt(process.env['PORT'] ?? '10001', 10);
createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    workerId: config.worker.id,
    activeSalons: [...activeSalons.keys()],
  }));
}).listen(PORT, () => {
  logger.info('health_server_listening', { port: PORT });
});

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  logger.info('supervisor_started', {
    workerId: config.worker.id,
    node: process.version,
  });

  await mongoose.connect(config.mongodb.uri);
  logger.info('mongodb_connected');

  repo = new WhatsAppRepository();

  // Initial discovery
  await syncSalons();

  // Periodic re-discovery
  const discoveryTimer = setInterval(syncSalons, config.supervisor.discoveryIntervalMs);

  async function shutdown(signal) {
    isShuttingDown = true;
    clearInterval(discoveryTimer);
    logger.info('supervisor_stopping', { signal, activeSalons: [...activeSalons.keys()] });

    const stops = [...activeSalons.keys()].map((shopId) => stopSalonWorker(shopId));
    await Promise.allSettled(stops);

    await mongoose.disconnect();
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('error', { op: 'uncaughtException', message: String(err) });
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.warn('error', { op: 'unhandledRejection', message: String(reason) });
  });
}

main().catch((err) => {
  process.stderr.write(JSON.stringify({
    ts: new Date().toISOString(),
    level: 'error',
    event: 'error',
    message: String(err),
  }) + '\n');
  process.exit(1);
});
