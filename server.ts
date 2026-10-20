import http from 'http';
import path from 'path';
import express from 'express';
import { createExpressApp } from './server/src/app';
import { disconnectDatabase, ensureDatabaseConnected } from './server/src/config/db';
import { env } from './server/src/config/env';
import { setupSocketServer } from './server/src/sockets';

async function bootstrap() {
  // Start DB initialization concurrently so port 3000 binds promptly during pre-warming
  ensureDatabaseConnected().catch((err) => {
    console.error('[DB] Fatal database initialization error:', err);
    process.exit(1);
  });

  const app = createExpressApp();
  const httpServer = http.createServer(app);
  setupSocketServer(httpServer);

  if (env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[Server] Tactix Arena listening on http://0.0.0.0:${env.PORT}`);
  });

  const shutdown = async () => {
    console.log('[Server] Shutting down gracefully...');
    httpServer.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
