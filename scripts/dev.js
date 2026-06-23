const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');

const isWindows = os.platform() === 'win32';
const rootDir = path.resolve(__dirname, '..');

// ──────────────────────────────────────────────────────────────
// 1. Kill any process occupying a specific port
// ──────────────────────────────────────────────────────────────
function killPort(port) {
  try {
    if (isWindows) {
      const output = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = output.split(/\r?\n/);
      const pids = new Set();
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const localAddress = parts[1];
          if (localAddress && (localAddress.endsWith(`:${port}`) || localAddress.endsWith(`]:${port}`))) {
            const pid = parts[parts.length - 1];
            if (pid && /^\d+$/.test(pid) && pid !== '0') {
              pids.add(pid);
            }
          }
        }
      });
      pids.forEach(pid => {
        try {
          execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore' });
        } catch (e) { /* already gone */ }
      });
    } else {
      try {
        execSync(`lsof -t -i:${port} | xargs kill -9`, { stdio: 'ignore' });
      } catch (e) { /* ignored */ }
    }
  } catch (err) {
    // Port is free or netstat found nothing — that's fine
  }
}

// ──────────────────────────────────────────────────────────────
// 2. Clean all ports used by our services
// ──────────────────────────────────────────────────────────────
const ALL_PORTS = [8000, 3001, 8501, 12000, 12001, 8002, 3002, 8085, 8081];
ALL_PORTS.forEach(port => killPort(port));

// Give the OS a moment to release the ports after killing
const { execSync: syncExec } = require('child_process');
try { syncExec(isWindows ? 'timeout /t 1 /nobreak >nul' : 'sleep 1', { stdio: 'ignore' }); } catch (e) { /* ignore */ }

// ──────────────────────────────────────────────────────────────
// 3. Locate the Python interpreter from the backend venv
// ──────────────────────────────────────────────────────────────
const backendDir = path.join(rootDir, 'nexusai', 'backend');
const pythonExe = isWindows
  ? path.join(backendDir, '.venv', 'Scripts', 'python.exe')
  : path.join(backendDir, '.venv', 'bin', 'python');

const hasVenv = fs.existsSync(pythonExe);
const pythonCmd = hasVenv ? pythonExe : 'python';

// ──────────────────────────────────────────────────────────────
// 4. Log filtering — suppress noisy startup messages
// ──────────────────────────────────────────────────────────────
const IGNORED_STARTUP_PATTERNS = [
  'mongodb.client_init',
  'Started server process',
  'Waiting for application startup',
  'mongodb.connected',
  'mongodb.indexes_ready',
  'nexusai.startup',
  'Application startup complete',
  'Uvicorn running on',
  'sentry.not_installed',
  'langsmith.disabled',
  'GET /health',
  'GET /api/auth/me',
  'tool.uv.dev-dependencies',
  'DeprecationWarning',
  'NODE_NO_WARNINGS',
];

function shouldIgnoreLine(line) {
  return IGNORED_STARTUP_PATTERNS.some(pattern => line.includes(pattern));
}

function logStream(stream, prefix) {
  if (!stream) return;
  // Write all background service logs to a hidden file instead of polluting the terminal
  const logFile = path.join(rootDir, 'background_services.log');
  const fs = require('fs');
  stream.on('data', (data) => {
    fs.appendFileSync(logFile, `[${prefix || 'Backend'}] ${data}`);
  });
}

// ──────────────────────────────────────────────────────────────
// 5. Spawn the core NexusAI backend (port 8000)
//    Always uses USE_MONGO_MOCK=true so it works without Docker
// ──────────────────────────────────────────────────────────────
const backendProcess = spawn(
  pythonCmd,
  ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
  {
    cwd: backendDir,
    env: { ...process.env, USE_MONGO_MOCK: 'true', PYTHONUNBUFFERED: '1' },
    shell: false,
    windowsHide: true
  }
);

backendProcess.on('error', (err) => {
  const logFile = path.join(rootDir, 'background_services.log');
  fs.appendFileSync(logFile, `[Backend] SPAWN ERROR: ${err.message}\n`);
});

logStream(backendProcess.stdout);
logStream(backendProcess.stderr);

// ──────────────────────────────────────────────────────────────
// 6. Track all spawned child processes for cleanup
// ──────────────────────────────────────────────────────────────
const spawnedProcesses = [];

function safeSpawn(name, cmd, args, options) {
  const cwd = options.cwd;
  if (!fs.existsSync(cwd)) {
    return null; // Skip if directory doesn't exist
  }

  if (isWindows) {
    if (cmd === 'uv') cmd = 'uv.exe';
    if (cmd === 'streamlit') cmd = 'streamlit.exe';
    
    // Convert npm run dev to node node_modules/next/dist/bin/next dev
    if (cmd === 'npm' || cmd === 'npm.cmd') {
      cmd = 'node';
      if (args[0] === 'run' && args[1] === 'dev') {
        const nextBin = require('path').join('node_modules', 'next', 'dist', 'bin', 'next');
        const newArgs = [nextBin, 'dev'];
        // Copy over any extra args like -p 12001
        for (let i = 2; i < args.length; i++) {
          if (args[i] !== '--') newArgs.push(args[i]);
        }
        args = newArgs;
      }
    }
  }

  let child;
  try {
    child = spawn(cmd, args, {
      ...options,
      shell: false,
      windowsHide: true
    });
  } catch (err) {
    console.error(`[safeSpawn] FATAL ERROR for ${name}:`, err.message);
    console.error(`[safeSpawn] cmd: ${cmd}, args: ${JSON.stringify(args)}, cwd: ${options.cwd}`);
    throw err;
  }

  child.on('error', (err) => {
    // Silently handle missing commands (e.g. streamlit not installed)
  });

  logStream(child.stdout, name);
  logStream(child.stderr, name);

  spawnedProcesses.push(child);
  return child;
}

// ──────────────────────────────────────────────────────────────
// 7. Spawn all integrated sub-project services
//    IMPORTANT: We launch each service DIRECTLY here (not via
//    start.py) to avoid the recursive npm-run-dev loop that
//    caused cascading process kills.
// ──────────────────────────────────────────────────────────────
function spawnOtherServices() {
  // ─── Multi-Agent Hub (Streamlit on port 8501) ───
  safeSpawn('MultiAgentHub', 'streamlit', [
    'run', 'app.py', '--server.port', '8501', '--server.headless=true'
  ], {
    cwd: path.join(rootDir, 'apps', 'multi-agent-hub'),
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  // ─── Nexus Agents API (Dev mode on port 12000) ───
  // Uses api_dev.py which is a lightweight mock API that
  // does NOT require PostgreSQL or Redis (Docker services).
  safeSpawn('NexusAgentsAPI', 'uv', [
    'run', 'python', 'api_dev.py', '--host', '0.0.0.0', '--port', '12000'
  ], {
    cwd: path.join(rootDir, 'apps', 'nexus-agents'),
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  // ─── Nexus Agents Frontend (port 12001) ───
  // Runs from the nexus-frontend/ subdirectory which has its
  // OWN package.json — this prevents npm from walking up to
  // the root package.json and re-triggering dev.js recursively.
  const nexusFrontendDir = path.join(rootDir, 'apps', 'nexus-agents', 'nexus-frontend');
  if (fs.existsSync(nexusFrontendDir) && fs.existsSync(path.join(nexusFrontendDir, 'package.json'))) {
    safeSpawn('NexusAgentsUI', 'npm', [
      'run', 'dev', '--', '-p', '12001'
    ], {
      cwd: nexusFrontendDir,
      env: { ...process.env, NODE_NO_WARNINGS: '1' }
    });
  }

  // ─── Sentiment Analysis Backend (port 8002) ───
  safeSpawn('SentimentAPI', pythonCmd, ['main.py'], {
    cwd: path.join(rootDir, 'apps', 'nexus-ai', 'backend'),
    env: { ...process.env, PORT: '8002', PYTHONUNBUFFERED: '1' }
  });

  // ─── Sentiment Analysis Frontend (port 3002) ───
  const sentimentFrontendDir = path.join(rootDir, 'apps', 'nexus-ai', 'frontend');
  if (fs.existsSync(sentimentFrontendDir) && fs.existsSync(path.join(sentimentFrontendDir, 'package.json'))) {
    safeSpawn('SentimentUI', 'npm', [
      'run', 'dev', '--', '-p', '3002'
    ], {
      cwd: sentimentFrontendDir,
      env: { ...process.env, NODE_NO_WARNINGS: '1' }
    });
  }

  // ─── Nexus GCP Frontend (Flask on port 8085) ───
  safeSpawn('GCPFrontend', pythonCmd, ['main.py'], {
    cwd: path.join(rootDir, 'apps', 'nexus-gcp', 'frontend'),
    env: { ...process.env, PORT: '8085', PYTHONUNBUFFERED: '1' }
  });

  // ─── Nexus GCP Orchestrator (Flask on port 8081) ───
  safeSpawn('GCPOrchestrator', pythonCmd, ['main.py'], {
    cwd: path.join(rootDir, 'apps', 'nexus-gcp', 'orchestrator'),
    env: { ...process.env, PORT: '8081', PYTHONUNBUFFERED: '1' }
  });
}

// Start all sub-project services immediately
spawnOtherServices();

// ──────────────────────────────────────────────────────────────
// 8. Graceful cleanup — kill ALL child processes on exit
// ──────────────────────────────────────────────────────────────
let frontendProcess = null;
let isCleaningUp = false;

function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\nShutting down all services...');

  const allProcesses = [...spawnedProcesses, backendProcess, frontendProcess].filter(Boolean);
  allProcesses.forEach(proc => {
    try {
      if (proc && !proc.killed) {
        if (isWindows) {
          try {
            execSync(`taskkill /pid ${proc.pid} /f /t`, { stdio: 'ignore' });
          } catch (e) { /* already gone */ }
        } else {
          proc.kill('SIGTERM');
        }
      }
    } catch (err) { /* ignore */ }
  });
}

process.on('SIGINT', () => { cleanup(); process.exit(); });
process.on('SIGTERM', () => { cleanup(); process.exit(); });

let backendHealthy = false;

backendProcess.on('close', (code) => {
  if (!isCleaningUp) {
    // If the backend was healthy (health check passed) and then exits,
    // attempt an automatic restart instead of killing everything.
    if (backendHealthy) {
      console.log(`Backend exited (code ${code}). Restarting...`);
      const restartedBackend = spawn(
        pythonCmd,
        ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
        {
          cwd: backendDir,
          env: { ...process.env, USE_MONGO_MOCK: 'true', PYTHONUNBUFFERED: '1' },
          shell: false,
          windowsHide: true
        }
      );
      logStream(restartedBackend.stdout);
      logStream(restartedBackend.stderr);
      restartedBackend.on('close', (c) => {
        if (!isCleaningUp) {
          console.log(`Backend restart also exited (code ${c}). Giving up.`);
          cleanup();
          setTimeout(() => process.exit(c || 0), 200);
        }
      });
    } else {
      console.log(`Backend process exited with code ${code}`);
      cleanup();
      setTimeout(() => process.exit(code || 0), 200);
    }
  }
});

// ──────────────────────────────────────────────────────────────
// 9. Poll backend health, then start the main frontend
// ──────────────────────────────────────────────────────────────
function startFrontendServer() {
  const frontendDir = path.join(rootDir, 'nexusai', 'frontend');

    frontendProcess = spawn(
      isWindows ? 'node' : 'npm',
      isWindows ? [require('path').join('node_modules', 'next', 'dist', 'bin', 'next'), 'dev'] : ['run', 'dev'],
      {
        cwd: frontendDir,
        env: { ...process.env, NEXT_PUBLIC_API_URL: 'http://127.0.0.1:8000', NODE_NO_WARNINGS: '1' },
        shell: false,
        windowsHide: true,
        stdio: 'inherit' // Only allow the frontend output to show in the terminal!
      }
    );

  // Do not logStream the frontend process since stdio is inherited

  frontendProcess.on('close', (code) => {
    if (!isCleaningUp) {
      console.log(`Frontend process exited with code ${code}`);
      cleanup();
      setTimeout(() => process.exit(code || 0), 200);
    }
  });
}

function pollBackendHealth(retries = 120) {
  // If the backend exited prematurely, report and bail
  if (backendProcess.exitCode !== null) {
    console.error(`Backend process exited prematurely with code ${backendProcess.exitCode}.`);
    cleanup();
    setTimeout(() => process.exit(backendProcess.exitCode || 1), 200);
    return;
  }

  if (retries === 0) {
    console.error('Backend health check failed to respond in time. Exiting...');
    cleanup();
    setTimeout(() => process.exit(1), 200);
    return;
  }

  http.get('http://127.0.0.1:8000/health', (res) => {
    if (res.statusCode === 200) {
      backendHealthy = true;
      startFrontendServer();
    } else {
      setTimeout(() => pollBackendHealth(retries - 1), 500);
    }
  }).on('error', (err) => {
    if (backendProcess.exitCode !== null) {
      console.error(`Backend process exited prematurely with code ${backendProcess.exitCode}.`);
      cleanup();
      setTimeout(() => process.exit(backendProcess.exitCode || 1), 200);
      return;
    }
    setTimeout(() => pollBackendHealth(retries - 1), 500);
  });
}

// Start polling backend health
pollBackendHealth();
