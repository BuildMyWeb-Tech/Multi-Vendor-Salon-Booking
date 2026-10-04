/**
 * Multi-salon WhatsApp supervisor — importable module.
 * Call startSupervisor() after MongoDB is already connected.
 * Does NOT open its own HTTP server or call mongoose.connect().
 */
import { config } from './config.js';
import { logger } from './logger.js';
import { WhatsAppRepository } from './repository.js';
import { DbSessionStore } from './session-store.js';
import { BaileysProvider } from './baileys-provider.js';
import { ConnectionManager } from './connection-manager.js';
import { OutboxConsumer } from './outbox-consumer.js';
import { Heartbeat } from './heartbeat.js';

/** @type {Map<string, { connectionManager, heartbeat, outboxConsumer }>} */
const activeSalons = new Map();
let repo = null;
let discoveryTimer = null;
let isShuttingDown = false;

function workerIdFor(shopId) {
  return `${config.worker.id}-${shopId}`;
}

async function startSalonWorker(shopId) {
  if (activeSalons.has(shopId)) return;

  logger.info('salon_worker_starting', { shopId });

  const workerId = workerIdFor(shopId);
  const sessionStore = new DbSessionStore(repo, config.session.encryptionKey);
  const provider = new BaileysProvider();

  const connectionManager = new ConnectionManager({ provider, sessionStore, repo, shopId, workerId });
  const heartbeat = new Heartbeat(repo, connectionManager, shopId, workerId, config.heartbeat.intervalMs);
  const outboxConsumer = new OutboxConsumer(provider, repo, shopId, workerId, config.outbox.pollIntervalMs);

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

async function syncSalons() {
  if (isShuttingDown) return;
  try {
    const enabledShops = new Set(await repo.getEnabledShops());

    for (const shopId of enabledShops) {
      if (!activeSalons.has(shopId)) {
        await startSalonWorker(shopId).catch((err) =>
          logger.error('error', { op: 'startSalonWorker', shopId, message: String(err) })
        );
      }
    }

    for (const shopId of activeSalons.keys()) {
      if (!enabledShops.has(shopId)) {
        await stopSalonWorker(shopId).catch((err) =>
          logger.error('error', { op: 'stopSalonWorker', shopId, message: String(err) })
        );
      }
    }
  } catch (err) {
    logger.error('error', { op: 'syncSalons', message: String(err) });
  }
}

export async function startSupervisor() {
  logger.info('supervisor_started', { workerId: config.worker.id, node: process.version });
  repo = new WhatsAppRepository();
  await syncSalons();
  discoveryTimer = setInterval(syncSalons, config.supervisor.discoveryIntervalMs);
  logger.info('supervisor_discovery_running', { intervalMs: config.supervisor.discoveryIntervalMs });
}

export async function stopSupervisor() {
  isShuttingDown = true;
  if (discoveryTimer) clearInterval(discoveryTimer);
  const stops = [...activeSalons.keys()].map((shopId) => stopSalonWorker(shopId));
  await Promise.allSettled(stops);
}

export function getActiveSalons() {
  return [...activeSalons.keys()];
}
