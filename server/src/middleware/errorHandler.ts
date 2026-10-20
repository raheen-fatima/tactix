import { NextFunction, Request, Response } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
    res.status(409).json({ error: 'A record with those unique details already exists' });
    return;
  }

  console.error('[API Error]', err instanceof Error ? err.message : 'Unknown error');
  res.status(500).json({ error: 'An unexpected server error occurred' });
}
