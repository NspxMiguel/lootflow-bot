module.exports = {
  apps: [
    {
      name: 'lootflow-bot',
      script: 'dist/index.js',
      restart_delay: 5000,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
