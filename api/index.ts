// Vercel serverless function entry point
// This file exports the Express app for Vercel's serverless functions
import { initializeApp } from '../server/app.ts';

let appPromise = null;

export default async function handler(req, res) {
  // Initialize app once and reuse across requests
  if (!appPromise) {
    appPromise = initializeApp();
  }

  const { app } = await appPromise;

  // Let Express handle the request
  return app(req, res);
}
