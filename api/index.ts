// Vercel serverless function entry point
import type { Request, Response } from 'express';

let appPromise: any = null;

export default async function handler(req: Request, res: Response) {
  try {
    if (!appPromise) {
      console.log('[Vercel] Initializing app...');
      // Use dynamic import with explicit .ts extension for Vercel
      const serverApp = await import('../server/app');
      appPromise = serverApp.initializeApp();
    }

    const { app } = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('[Vercel] Fatal error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    return res.status(500).json({
      error: 'Serverless function initialization failed',
      message: errorMessage,
      stack: errorStack
    });
  }
}
