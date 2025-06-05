module.exports = {
  apps: [
    {
      name: 'compact-event-control',
      script: 'npm',
      args: 'run dev',
      watch: ['src'],
      env: {
        NODE_ENV: 'development',
      },
      max_memory_restart: '1G',
      autorestart: true,
    },
  ],
} 