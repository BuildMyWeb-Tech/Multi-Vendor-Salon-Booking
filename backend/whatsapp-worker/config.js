import 'dotenv/config';

function require_env(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const config = {
  mongodb: {
    uri: require_env('MONGODB_URI'),
  },
  worker: {
    // Shared worker ID prefix — each salon gets "<WORKER_ID>-<shopId>"
    id: process.env['WORKER_ID'] || `worker-${process.pid}`,
  },
  session: {
    encryptionKey: require_env('WHATSAPP_SESSION_ENCRYPTION_KEY'),
  },
  heartbeat: {
    intervalMs: parseInt(process.env['HEARTBEAT_INTERVAL_MS'] || '30000', 10),
  },
  outbox: {
    pollIntervalMs: parseInt(process.env['OUTBOX_POLL_INTERVAL_MS'] || '2000', 10),
    broadcastSendIntervalMs: parseInt(process.env['BROADCAST_SEND_INTERVAL_MS'] || '800', 10),
  },
  supervisor: {
    // How often to poll DB for newly enabled/disabled salons (ms)
    discoveryIntervalMs: parseInt(process.env['SALON_DISCOVERY_INTERVAL_MS'] || '60000', 10),
  },
};
