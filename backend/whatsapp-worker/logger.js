export const logger = {
  info: (event, data = {}) => log('info', event, data),
  warn: (event, data = {}) => log('warn', event, data),
  error: (event, data = {}) => log('error', event, data),
  debug: (event, data = {}) => {
    if (process.env['LOG_LEVEL'] === 'debug') log('debug', event, data);
  },
};

function log(level, event, data) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...data });
  if (level === 'error' || level === 'warn') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}
