import { createApp } from './app.ts';
import { ENV } from './config/env.ts';
import { runSeed } from './prisma/seed.ts';

async function bootstrap() {
  try {
    // 1. Run Idempotent Database Seed on Startup
    await runSeed();

    // 2. Instantiate and Start Express Application
    const app = createApp();

    const server = app.listen(ENV.PORT, () => {
      console.log(`\n🏛️  Lagoree Arts Admin Backend (Module 2) Online!`);
      console.log(`📡 URL: http://localhost:${ENV.PORT}`);
      console.log(`🛡️  Health Endpoint: http://localhost:${ENV.PORT}/api/v1/admin/health`);
      console.log(`🔐 Admin Auth API: http://localhost:${ENV.PORT}/api/v1/admin/auth/login\n`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('\nShutting down gracefully...');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

bootstrap();
