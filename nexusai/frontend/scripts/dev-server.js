process.env.NODE_ENV = process.env.NODE_ENV || "development";

const http = require("node:http");
const next = require("next");

function readArg(names, fallback) {
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    const inline = names.find((name) => arg.startsWith(`${name}=`));
    if (inline) return arg.slice(inline.length + 1);

    if (names.includes(arg) && process.argv[i + 1]) {
      return process.argv[i + 1];
    }
  }

  return fallback;
}

const hostname = readArg(["--hostname", "-H"], process.env.HOSTNAME || "127.0.0.1");
const port = Number(readArg(["--port", "-p"], process.env.PORT || "3001"));

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid dev server port: ${port}`);
}

const app = next({ dev: true, dir: process.cwd(), hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const server = http.createServer((request, response) => {
    handle(request, response).catch((error) => {
      console.error("[dev-server] request failed", error);
      if (!response.headersSent) response.statusCode = 500;
      response.end("Internal Server Error");
    });
  });

  server.on("error", (error) => {
    if (error && error.code === "EADDRINUSE") {
      console.error(`[dev-server] ${hostname}:${port} is already in use.`);
      process.exit(1);
    }

    throw error;
  });

  server.listen(port, hostname, () => {
    console.log("  ▲ Next.js dev server ready");
    console.log(`  - Local: http://${hostname}:${port}`);
  });
}

main().catch((error) => {
  console.error("[dev-server] failed to start", error);
  process.exit(1);
});
