import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma client instance with connection pooling
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection pooling for better performance
    log: ['error', 'warn'],
  });
} else {
  // In development, use a global variable to prevent multiple instances
  if (!global.prisma) {
    // Build the connection URL properly, appending pool parameters without breaking existing query params
    const baseUrl = process.env.DATABASE_URL;
    const separator = baseUrl.includes('?') ? '&' : '?';
    const connectionUrl = baseUrl + separator + 'connection_limit=5&pool_timeout=20';

    global.prisma = new PrismaClient({
      log: ['error', 'warn'],
      // Add connection pool configuration
      datasources: {
        db: {
          url: connectionUrl,
        },
      },
    });
  }
  prisma = global.prisma;
}

// Add connection health check
prisma.$connect()
  .then(() => {
  })
  .catch((error) => {
  });

export { prisma };