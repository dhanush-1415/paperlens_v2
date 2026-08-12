import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Failsafe execution guard: Prisma must NEVER run on the client.
 */
if (typeof window !== 'undefined') {
  throw new Error('Prisma Client cannot be instantiated on the client side.');
}

// Global declaration for hot-reloading preservation in Next.js
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Lazy Initialization via Proxy
 * 
 * We do not immediately instantiate the DB pool and Prisma client when this file is evaluated.
 * Next.js statically analyzes files during build and pre-rendering, which would otherwise
 * cause unwanted database connection attempts.
 * 
 * The Proxy intercepts the very first access (e.g. `prisma.plan.findUnique(...)`) 
 * and initializes the connection pool at that exact moment.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop: keyof PrismaClient) {
    // If the singleton doesn't exist yet, construct it
    if (!globalThis.prismaGlobal) {
      try {
        // Native PostgreSQL connection pool (highly optimized for Node.js environments)
        const connectionString = process.env.DATABASE_URL;
        
        if (!connectionString) {
          console.warn('DATABASE_URL is missing. Prisma cannot connect.');
        }

        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        
        globalThis.prismaGlobal = new PrismaClient({ 
          adapter,
          log: ['error', 'warn'], 
        });
      } catch (e) {
        console.error("Prisma Client Initialization Error:", e);
        // Failsafe: assign an empty object to prevent hard crashing on Next.js startup
        globalThis.prismaGlobal = {} as PrismaClient;
      }
    }
    
    // Return the accessed property/method from the real Prisma instance
    return (globalThis.prismaGlobal as any)[prop];
  }
});
