// Vercel serverless function entry point
// This file exports the Express app for Vercel's serverless functions
import { initializeApp } from '../server/app';
import type { Request, Response } from 'express';

let appPromise: ReturnType<typeof initializeApp> | null = null;

export default async function handler(req: Request, res: Response) {
  try {
    // Initialize app once and reuse across requests
    if (!appPromise) {
      console.log('[Vercel] Initializing app...');
      appPromise = initializeApp();
    }

    const { app } = await appPromise;

    // Let Express handle the request
    return app(req, res);
  } catch (error) {
    // Log the full error for debugging
    console.error('[Vercel] Fatal error in serverless function:', error);

    // Send detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    // Return error response
    return res.status(500).json({
      error: 'Serverless function initialization failed',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : 'Check Vercel logs for details'
    });
  }
}
