// `npm run qa`: builds the site, serves it with `vite preview` on a free port,
// runs scripts/qa-layout.mjs against it, then shuts the server down.
// Exits with the QA script's exit code (non-zero if any assertion failed).
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';

const BASE = '/live_3D-portfolio/';
const VITE = 'node_modules/vite/bin/vite.js';

const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

const waitForServer = async (url, timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`preview server did not start at ${url}`);
};

const build = spawnSync(process.execPath, [VITE, 'build'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

const port = await freePort();
const url = `http://127.0.0.1:${port}${BASE}`;
// Run vite's own entry with node (not npx) so killing this child stops the server itself.
const server = spawn(process.execPath, [VITE, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  stdio: ['ignore', 'ignore', 'inherit'],
});

const stopServer = () =>
  new Promise((resolve) => {
    if (server.exitCode !== null || server.signalCode !== null) return resolve();
    server.once('exit', resolve);
    server.kill('SIGTERM');
    setTimeout(() => server.kill('SIGKILL'), 5000).unref();
  });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await stopServer();
    process.exit(1);
  });
}

let code = 1;
try {
  await waitForServer(url);
  console.log(`QA: serving build at ${url}`);
  code = await new Promise((resolve) => {
    const qa = spawn(process.execPath, ['scripts/qa-layout.mjs'], {
      stdio: 'inherit',
      env: { ...process.env, QA_URL: url },
    });
    qa.on('exit', (c) => resolve(c ?? 1));
  });
} catch (err) {
  console.error(`QA: ${err.message}`);
} finally {
  await stopServer();
  console.log('QA: preview server stopped');
}
process.exit(code);
