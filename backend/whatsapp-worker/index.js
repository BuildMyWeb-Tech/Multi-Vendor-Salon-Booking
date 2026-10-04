/**
 * WhatsApp Worker — standalone entry point.
 * Used only when running the worker as a separate process (not embedded).
 * When embedding in server.js, import supervisor.js instead.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { createServer } from 'node:http';

import { config } from './config.js';
import { logger } from './logger.js';
import { startSupervisor, stopSupervisor, getActiveSalons } from './supervisor.js';

const PORT = parseInt(process.env['PORT'] ?? '10001', 10);
createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', workerId: config.worker.id, activeSalons: getActiveSalons() }));
}).listen(PORT, () => {
  logger.info('health_server_listening', { port: PORT });
});

async function main() {
  await mongoose.connect(config.mongodb.uri);
  logger.info('mongodb_connected');

  await startSupervisor();

  async function shutdown(signal) {
    logger.info('supervisor_stopping', { signal });
    await stopSupervisor();
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
  process.stderr.write(JSON.stringify({ ts: new Date().toISOString(), level: 'error', message: String(err) }) + '\n');
  process.exit(1);
});
