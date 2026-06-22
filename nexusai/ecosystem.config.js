module.exports = {
  apps: [
    {
      name: "nexusai-frontend",
      cwd: "./frontend",
      script: "node",
      args: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "nexusai-backend",
      cwd: "./backend",
      script: ".venv/Scripts/python.exe",
      args: "-m uvicorn app.main:app --host 127.0.0.1 --port 8000",
      env: {
        NODE_ENV: "production",
        USE_MONGO_MOCK: "false",
        MONGODB_URI: "mongodb://127.0.0.1:27017"
      }
    },
    {
      name: "nexusai-agents-api",
      cwd: "../apps/nexus-agents",
      script: ".venv/Scripts/python.exe",
      args: "api.py --host 127.0.0.1 --port 12000",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "nexusai-agents-ui",
      cwd: "../apps/nexus-agents/nexus-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "dev -H 0.0.0.0 -p 12001",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_HOST: "127.0.0.1",
        NEXT_PUBLIC_API_PORT: "12000",
        HOSTNAME: "127.0.0.1"
      }
    }
  ]
};
