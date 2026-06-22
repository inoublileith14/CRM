import 'reflect-metadata';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';

let expressApp: Express | null = null;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!expressApp) {
    const { getExpressInstance } = await import('../dist/create-app.js');
    expressApp = await getExpressInstance();
  }

  expressApp(req, res);
}
