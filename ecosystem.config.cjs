module.exports = {
  apps: [{
    name: 'whatsapp-resume-bot',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // MAXIMUM RELIABILITY - Always stay alive
    min_uptime: '5s',           // Consider app stable after 5 seconds
    max_restarts: 999,          // Unlimited restarts (never give up)
    restart_delay: 2000,        // Quick 2-second restart delay
    exp_backoff_restart_delay: 100,  // Exponential backoff starting at 100ms
    kill_timeout: 5000,         // Wait 5 seconds before force kill
    listen_timeout: 10000,      // Wait 10 seconds for app to be ready
    // Cron restart to keep fresh (daily at 3 AM)
    cron_restart: '0 3 * * *',
    // Always restart on these conditions
    ignore_watch: ['node_modules', 'logs', 'data'],
    // Aggressive monitoring
    max_memory_restart: '500M'
  }]
};
