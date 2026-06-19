module.exports = {
  apps: [
    {
      name: "nexusai-dev-orchestrator",
      script: "scripts/dev.js",
      args: "",
      cwd: "C:/Users/Prince/Downloads/NexusAi",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G"
    }
  ]
};
